require('dotenv').config();
const express = require('express');
const axios = require('./node_modules/axios/index.d.cts');
const cors = require('cors');
const querystring = require('querystring');

const app = express();
app.use(cors());

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

// We store tokens in memory or in a database. For this simple example, just in variables:
let accessToken = null;
let refreshToken = null;

// 1) Login endpoint - redirects user to Spotify for authorization
app.get('/login', (req, res) => {
  const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state'
  ].join(' ');

  const url = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
    });

  res.redirect(url);
});

// 2) Callback endpoint - Spotify redirects here with ?code=
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) {
    return res.send('No code provided');
  }

  // Exchange code for tokens
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    });

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    // Redirect back to a "success" page or your main site
    res.send('Spotify auth success! You can close this tab now.');
  } catch (err) {
    console.error(err);
    res.send('Error getting tokens: ' + err);
  }
});

// 3) Refresh the access token if needed
async function refreshAccessToken() {
  if (!refreshToken) {
    return; // we don't have a refresh token yet
  }
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      }
    });
    accessToken = response.data.access_token;
    console.log('Refreshed access token:', accessToken);
  } catch (err) {
    console.error('Error refreshing token:', err);
  }
}

// 4) Endpoint to get currently playing track
app.get('/nowplaying', async (req, res) => {
  // If no access token, ask user to do /login
  if (!accessToken) {
    return res.json({ error: 'No access token. Go to /login first.' });
  }

  try {
    // Attempt to fetch currently playing track
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    // If 204 No Content => not playing anything
    if (response.status === 204 || response.data === '') {
      return res.json({ isPlaying: false });
    }

    const data = response.data;
    const track = {
      isPlaying: (data.is_playing || false),
      title: data.item.name,
      artist: data.item.artists.map(a => a.name).join(', '),
      album: data.item.album.name,
      albumArtUrl: data.item.album.images[0]?.url || '',
      progressMs: data.progress_ms,
      durationMs: data.item.duration_ms
    };

    res.json(track);
  } catch (err) {
    // If token expired, try refresh
    if (err.response && err.response.status === 401) {
      await refreshAccessToken();
      return res.json({ error: 'Token expired, refreshed. Please re-try.' });
    }
    console.error(err);
    res.json({ error: err.message });
  }
});

// Start the server
const port = 8888;
app.listen(port, () => {
  console.log('Server listening on http://localhost:' + port);
  console.log('Go to http://localhost:' + port + '/login to begin auth');
});