import spotify from "spotify-web-api-node";
import { JsonDB } from "node-json-db";
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
  client.getUserPlaylists(USER).then((res) => {
    const playlists = res.body.items.map(playlist => playlist.name)
    while (playlists.includes(playlistName)) {
      playlistName += ` (${++counter})`
    }

    console.log("Creating Playlist", playlistName)

    client.createPlaylist(playlistName, { public: false, description: `Monthly #BACKUP from @fastplayer95/Chill | Created on: ${today.toLocaleDateString("de-DE")}` }).then(res => {
      const TARGET = res.body.id;
      client.getPlaylist(SOURCE).then(source => {
        const tracks = source.body.tracks.items.map(track => track.track.uri)
        client.addTracksToPlaylist(TARGET, tracks)
      })
    })
  })


})





