# Movie Poster & Sports Dashboard Kiosk

A premium, cinematic digital poster web application designed for home theaters. The UI includes dynamic "Now Playing" metadata tracking, an idle cinematic poster slideshow, and a dense, live multi-league ESPN Sports Scoreboard.

---

## 🎬 Core Features

- **"Now Playing" UI**: Features large cinematic metadata, blurred background effects, and a premium visual overlay representing Resolution, Video Codec, and Audio Codec details.
- **"Live Sports" Scoreboard**: A highly dense, 3-column dashboard pulling live API feeds for the NFL, NBA, NCAAF, NCAAB, and NCAA Softball. Features auto-hiding for off-season leagues and a prominent Win/Loss header banner for tracked favorite teams.
- **"Idle Slideshow"**: Gently cycles through remote poster assets directory (mapped to your NAS) using a smooth cinematic 30-second panning animation.
- **Admin Management Panel**: Includes a simple `/admin` remote web UI allowing instantaneous control over screen states from any device on your LAN.
- **Docker Ready**: Packaged cleanly with `Dockerfile` and `docker-compose.yml` for instant, multi-container deployments on robust NAS units (Synology) or a Raspberry Pi 4.

---

## 🚀 Deployment (Docker Compose)

The easiest way to run the application headless is via Docker. The application uses a split-stack architecture (Express + Vite).

1. Before starting, update `docker-compose.yml` to map your local path to the Disney posters:
   ```yaml
   volumes:
     - /your/absolute/path/to/posters:/app/posters
   ```
2. Build and launch the containers:
   ```bash
   docker compose up -d --build
   ```
3. The Kiosk display frame will be available at `http://localhost:80` (or the IP of the host machine).
4. The Admin panel will be available at `http://localhost:80/admin`.

*(Note: Running the frontend natively on a Raspberry Pi Zero is not recommended due to heavy CSS Chromium Kiosk rendering. Ensure the client display uses at least a Raspberry Pi 4 or similar).*

---

## 🤖 Smart Home Integrations

You can easily tie the display into Home Assistant or other platforms to trigger based on external events (e.g., turning on the theater lights triggers the poster). Provide an unauthenticated `POST` request to the backend:

- **Force Sports Dashboard**: `POST http://<HOST_IP>:3000/api/webhook/sports`
- **Return to Idle Posters**: `POST http://<HOST_IP>:3000/api/webhook/idle`
- **Simulate Movie Playback**: `POST http://<HOST_IP>:3000/api/debug/play`
