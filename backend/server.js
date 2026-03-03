const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Added axios for ESPN API

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Global State
let appState = {
  mode: 'idle', // 'idle', 'playing', 'sports'
  forceSports: false, // Override flag for manual management
  media: null,
  sports: null
};

// ESPN API Polling
let espnInterval = null;

const SPORTS_ENDPOINTS = [
  { name: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
  { name: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
  { name: 'NCAAF', url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard' },
  { name: 'NCAAB', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard' },
  { name: 'NCAA Softball', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-softball/scoreboard' }
];

const FAVORITE_TEAMS = [
  { sport: 'NBA', keywords: ['Lakers'] },
  { sport: 'NFL', keywords: ['Raiders', 'Las Vegas Raiders'] },
  { sport: 'NCAAF', keywords: ['Liberty', 'Flames'] },
  { sport: 'NCAAB', keywords: ['UNC', 'Tar Heels', 'North Carolina'] },
  { sport: 'NCAA Softball', keywords: ['Liberty', 'Flames'] }
];

const isFavorite = (teamName, sportName) => {
  if (!teamName) return false;
  const sportFavs = FAVORITE_TEAMS.find(f => f.sport === sportName);
  if (!sportFavs) return false;
  return sportFavs.keywords.some(k => teamName.toLowerCase().includes(k.toLowerCase()));
};

const fetchEspnScores = async () => {
  try {
    const promises = SPORTS_ENDPOINTS.map(endpoint => axios.get(endpoint.url).then(res => ({ name: endpoint.name, data: res.data })).catch(err => {
      console.error(`Failed to fetch ${endpoint.name}:`, err.message);
      return { name: endpoint.name, data: { events: [] } };
    }));

    const results = await Promise.all(promises);
    let allGames = [];

    results.forEach(sport => {
      const events = sport.data.events || [];
      events.forEach(game => {
        const homeCompetitor = game.competitions[0].competitors.find(c => c.homeAway === 'home');
        const awayCompetitor = game.competitions[0].competitors.find(c => c.homeAway === 'away');

        let homeTeam = homeCompetitor.team;
        let awayTeam = awayCompetitor.team;

        // Filter Rule: Ignore out-of-season / old games (older than 3 days)
        // ESPN leaves the final game of the season (e.g. Superbowl) on the default endpoint all off-season.
        const gameDate = new Date(game.date || game.competitions?.[0]?.date || Date.now());
        const now = new Date();
        const daysDifference = (now - gameDate) / (1000 * 60 * 60 * 24);

        // If a game is 'post' (final) and older than 3 days, it's stale
        if (game.status.type.state === 'post' && daysDifference > 3) {
          return; // Skip this game
        }

        // Extract NCAA Rankings if applicable
        const homeRank = homeCompetitor.curatedRank?.current || 99;
        const awayRank = awayCompetitor.curatedRank?.current || 99;
        const isTop25 = (homeRank <= 25 && homeRank > 0) || (awayRank <= 25 && awayRank > 0);

        const hasFavorite = isFavorite(homeTeam.displayName, sport.name) || isFavorite(awayTeam.displayName, sport.name);

        // Filter Rule: For NCAA, MUST be Top 25 OR feature a Favorite Team
        if ((sport.name === 'NCAAF' || sport.name === 'NCAAB' || sport.name === 'NCAA Softball') && (!isTop25 && !hasFavorite)) {
          return; // Skip this game
        }

        allGames.push({
          id: game.id,
          sport: sport.name,
          status: game.status.type.state, // 'pre', 'in', 'post'
          clock: game.status.type.shortDetail, // e.g., "7:30 PM", "Q3 12:00", "Final"
          home: {
            name: homeTeam.shortDisplayName || homeTeam.displayName,
            score: homeCompetitor.score,
            rank: (homeRank <= 25 && homeRank > 0) ? homeRank : null,
            logo: homeTeam.logo,
            record: homeCompetitor.records?.[0]?.summary || '',
            isFavorite: isFavorite(homeTeam.displayName, sport.name)
          },
          away: {
            name: awayTeam.shortDisplayName || awayTeam.displayName,
            score: awayCompetitor.score,
            rank: (awayRank <= 25 && awayRank > 0) ? awayRank : null,
            logo: awayTeam.logo,
            record: awayCompetitor.records?.[0]?.summary || '',
            isFavorite: isFavorite(awayTeam.displayName, sport.name)
          }
        });
      });
    });

    appState.sports = allGames;

  } catch (error) {
    console.error("Failed to fetch from ESPN:", error.message);
  }
};

const startEspnPolling = () => {
  if (espnInterval) clearInterval(espnInterval);
  fetchEspnScores(); // Initial fetch
  espnInterval = setInterval(() => fetchEspnScores(), 30000); // Polling every 30s
};

const stopEspnPolling = () => {
  if (espnInterval) clearInterval(espnInterval);
  appState.sports = null;
};

// Endpoints for Frontend State polling (or switch to websockets later)
app.get('/api/state', (req, res) => {
  res.json(appState);
});

// Admin endpoint to force sports mode
app.post('/api/admin/mode', (req, res) => {
  const { forceSports } = req.body;
  if (typeof forceSports === 'boolean') {
    appState.forceSports = forceSports;
    if (forceSports && !espnInterval) {
      startEspnPolling(); // Ensure polling is running if forced on
    }
  }
  res.status(200).json(appState);
});

// Emby Webhook Endpoint
app.post('/api/webhook/emby', (req, res) => {
  const payload = req.body;

  if (payload.Event === 'playback.start' || payload.Event === 'playback.unpause') {
    appState.mode = 'playing';
    appState.media = {
      title: payload.Item.Name,
      type: payload.Item.Type, // Movie or Episode
      runtime: payload.Item.RunTimeTicks,
      rating: payload.Item.OfficialRating,
      image: payload.Item.PrimaryImageItemId // We will need to fetch actual image URL from Emby
    };
    console.log("Emby playing:", appState.media.title);
  } else if (payload.Event === 'playback.stop' || payload.Event === 'playback.pause') {
    appState.mode = 'idle';
    appState.media = null;
    console.log("Emby stopped/paused.");
  }

  res.status(200).send('OK');
});

// Kodi Polling/Webhook setup will go here...

// --- Home Assistant / External Webhooks ---
app.post('/api/webhook/sports', async (req, res) => {
  appState.mode = 'sports';
  // Attempt to immediately fetch fresh sports data
  appState.sports = await fetchEspnScores();

  // Set interval to keep updating while in sports mode
  if (espnInterval) clearInterval(espnInterval);
  espnInterval = setInterval(async () => {
    if (appState.mode === 'sports') {
      appState.sports = await fetchEspnScores();
    } else {
      clearInterval(espnInterval);
      espnInterval = null;
    }
  }, 60000); // Update every 1 minute

  console.log("Webhook triggered: Sports Mode ON");
  res.status(200).send('OK');
});

app.post('/api/webhook/idle', (req, res) => {
  appState.mode = 'idle';
  appState.media = null;
  appState.sports = null;
  if (espnInterval) clearInterval(espnInterval);
  espnInterval = null;
  console.log("Webhook triggered: Idle Mode ON");
  res.status(200).send('OK');
});

// Serve Disney Posters
const postersPath = process.env.POSTERS_PATH || path.join(__dirname, 'posters');

app.get('/api/posters', (req, res) => {
  if (!fs.existsSync(postersPath)) {
    return res.json([]);
  }

  fs.readdir(postersPath, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read posters directory' });

    // Filter image files
    const images = files.filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
    res.json(images);
  });
});

app.use('/posters', express.static(postersPath));

// Debug Dashboard to trigger states manually
const debugHtml = `
      < html >
      <body>
        <h1>Debug Dashboard</h1>
        <button onclick="fetch('/api/debug/play', {method:'POST'})">Simulate Movie Play</button>
        <button onclick="fetch('/api/debug/stop', {method:'POST'})">Simulate Stop</button>
      </body>
  </html >
  `;

app.get('/debug', (req, res) => {
  res.send(debugHtml);
});

app.post('/api/debug/play', (req, res) => {
  appState.mode = 'playing';
  appState.media = {
    title: "Star Wars",
    rating: "PG-13",
    resolution: "4K",
    videoCodec: "HEVC",
    audioCodec: "TRUEHD",
    thumb: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg"
  };
  console.log("Debug: Playing Movie");
  res.status(200).send('OK');
});

app.post('/api/debug/sports', (req, res) => {
  appState.mode = 'sports';
  appState.sports = [
    {
      id: "1", sport: "NBA", status: "in", clock: "Q3 4:20",
      home: { name: "Lakers", score: "88", rank: null, logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png", record: "42-20", isFavorite: true },
      away: { name: "Celtics", score: "82", rank: null, logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png", record: "45-17", isFavorite: false }
    },
    {
      id: "2", sport: "NCAAF", status: "pre", clock: "3:30 PM EST",
      home: { name: "Liberty", score: "0", rank: null, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2335.png", record: "10-0", isFavorite: true },
      away: { name: "App State", score: "0", rank: null, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2026.png", record: "8-2", isFavorite: false }
    },
    {
      id: "3", sport: "NFL", status: "post", clock: "Final",
      home: { name: "Raiders", score: "24", rank: null, logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png", record: "11-6", isFavorite: true },
      away: { name: "Chiefs", score: "21", rank: null, logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", record: "12-5", isFavorite: false }
    },
    {
      id: "4", sport: "NCAA Softball", status: "in", clock: "Bottom 4th",
      home: { name: "Liberty", score: "5", rank: null, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2335.png", record: "6-12", isFavorite: true },
      away: { name: "Michigan", score: "2", rank: 14, logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png", record: "18-4", isFavorite: false }
    }
  ];
  console.log("Debug: Playing Sports DB");
  res.status(200).send('OK');
});

app.post('/api/debug/stop', (req, res) => {
  appState.mode = 'idle';
  appState.media = null;
  appState.sports = null;
  console.log("Debug: Stopped");
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
