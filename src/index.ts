import spotify from "spotify-web-api-node";
import { TokenManager } from "./tokenmanager";
import 'dotenv/config'


const tokenManager = TokenManager.getInstance();
const today = new Date()
const month = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"][today.getMonth()]
const year = today.getFullYear()
let playlistName = `${month} ${year}`
const USER = process.env.SPOTIFY_USER || ""
const SOURCE = process.env.SPOTIFY_SOURCE || ""
const client = new spotify()

client.setCredentials({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
})

client.setAccessToken(tokenManager.getAccessToken())
client.setRefreshToken(tokenManager.getRefreshToken())

client.refreshAccessToken().then(value => {

  tokenManager.setAccessToken(value.body.access_token)
  if (value.body.refresh_token) {
    tokenManager.setRefreshToken(value.body.refresh_token)
  }

  let counter = 0
  client.getUser(USER).then((user) => {
    client.getUserPlaylists(USER).then((userPlaylists) => {

      const playlists = userPlaylists.body.items.map(playlist => playlist.name)
      while (playlists.includes(playlistName)) {
        playlistName += ` (${++counter})`
      }

      console.log("Creating Playlist", playlistName)
      client.getPlaylist(SOURCE).then(source => {
        client.createPlaylist(playlistName, { public: false, description: `Monthly #BACKUP from @${user.body.display_name}/${source.body.name} | Created on: ${today.toLocaleDateString("de-DE")}` }).then(res => {
          const TARGET = res.body.id;
          const tracks = source.body.tracks.items.map(track => track.track.uri)
          client.addTracksToPlaylist(TARGET, tracks)
        })
      })
    })
  })
})





