import spotify from "spotify-web-api-node";
import 'dotenv/config'
import { getRefreshToken, saveRefreshToken } from "./tokenmanager";

const client = new spotify({
  refreshToken: getRefreshToken(),
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
})

client.refreshAccessToken().then(res => {
  client.setAccessToken(res.body.access_token)
  const refreshToken = res.body.refresh_token;
  if (refreshToken) {
    saveRefreshToken(refreshToken)
  } else {
    console.error("No refresh token available")
  }

  (async () => {
    const user = (await client.getUser(process.env.SPOTIFY_USER || "")).body
    const mySavedTracks = (await client.getMySavedTracks()).body
    const allPlaylists = (await client.getUserPlaylists()).body.items
    const chillPlaylist = allPlaylists.filter(playlist => playlist.name == process.env.SPOTIFY_SOURCE)[0]

    const today = new Date()
    const month = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][today.getMonth()]
    const montlyBackupPlaylist = await getMonthyBackupPlaylist(allPlaylists, `${month} ${today.getFullYear()}`)

    console.log("Logged in as:", user.display_name)
    await syncTracksToPlaylist(mySavedTracks, chillPlaylist, user, today)
    await backupToMonthlyPlaylist(chillPlaylist, montlyBackupPlaylist, user, today)


  })()

});

async function getMonthyBackupPlaylist(allPlaylists: SpotifyApi.PlaylistObjectSimplified[], name: string): Promise<SpotifyApi.PlaylistObjectSimplified> {
  console.log("Looking for Backup Playlist")
  const possiblePlaylists = allPlaylists.filter(playlist => playlist.name === name)
  if (possiblePlaylists.length === 1) {
    console.log("Found it", possiblePlaylists[0].name)
    return possiblePlaylists[0]
  } else {
    console.log("Creating new one")
    return (await client.createPlaylist(name)).body
  }

}

async function syncTracksToPlaylist(mySavedTracks: SpotifyApi.UsersSavedTracksResponse, targetPlaylist: SpotifyApi.PlaylistObjectSimplified, user: SpotifyApi.UserProfileResponse, today: Date) {
  // Sync saved tracks to Chill
  console.log("Syncing my saved tracks with", targetPlaylist.name)
  if (mySavedTracks.items.length != 0) {
    console.log(`Deduplicating Tracks`)

    const targetPlaylistTracks = (await client.getPlaylistTracks(targetPlaylist.id)).body.items

    let tracksToAdd = []
    for (let track of mySavedTracks.items) {
      if (!targetPlaylistTracks.map(t => t.track.uri).includes(track.track.uri)) {
        tracksToAdd.push(track)
      }
    }
    if (tracksToAdd.length > 0) {
      console.log(`Adding ${tracksToAdd.length} Tracks to ${targetPlaylist.name}`)
      await client.addTracksToPlaylist(targetPlaylist.id, tracksToAdd.map(t => t.track.uri))
    }


    // Update Description
    await client.changePlaylistDetails(targetPlaylist.id, { description: `@${user.display_name}/${targetPlaylist.name} | Last synced on: ${today.toLocaleDateString("de-DE")}` })

    // Clear saved tracks
    await client.removeFromMySavedTracks(mySavedTracks.items.map(track => track.track.id))
  } else {
    console.log("No Tracks to sync")
  }

}

async function backupToMonthlyPlaylist(sourcePlaylist: SpotifyApi.PlaylistObjectSimplified, targetPlaylist: SpotifyApi.PlaylistObjectSimplified, user: SpotifyApi.UserProfileResponse, today: Date) {

  console.log(`Backing up tracks from ${sourcePlaylist.name} to ${targetPlaylist.name}`)

  const sourceTracks = (await client.getPlaylistTracks(sourcePlaylist.id)).body.items
  const targetTracks = (await client.getPlaylistTracks(targetPlaylist.id)).body.items

  let tracksToAdd = []

  for (let track of sourceTracks) {
    if (!targetTracks.map(t => t.track.uri).includes(track.track.uri)) {
      tracksToAdd.push(track)
    }
  }



  if (tracksToAdd.length > 0) {
    console.log(`Backing up ${tracksToAdd.length} tracks to ${targetPlaylist.name}`)
    await client.addTracksToPlaylist(targetPlaylist.id, tracksToAdd.map(t => t.track.uri))
  }

  await client.changePlaylistDetails(targetPlaylist.id, { description: `Monthly #BACKUP from @${user.display_name}/${sourcePlaylist.name} | Last synced on: ${today.toLocaleDateString("de-DE")}` })
}

