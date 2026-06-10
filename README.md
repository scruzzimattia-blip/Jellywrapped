# Jellyfin Wrapped

Spotify Wrapped–style year-in-review for [Jellyfin](https://jellyfin.org), powered by [Tracearr](https://tracearr.com) watch history and Jellyfin images.

![CI](https://github.com/scruzzimattia-blip/Jellywrapped/actions/workflows/ci.yml/badge.svg)
![Docker](https://github.com/scruzzimattia-blip/Jellywrapped/actions/workflows/docker.yml/badge.svg)

---

## Features

- **Total watch time** — hours and minutes across movies and series
- **Top 5 movies & shows** — with posters pulled directly from Jellyfin
- **Favorite genre** — based on your most-watched content
- **Hourly heatmap & day-of-week breakdown** — when do you actually watch?
- **Binge sessions, devices, monthly timeline** — deep-dive stats
- **Watch streak** — longest run of consecutive watch days and total days with a play
- **Personality type** — Movie Buff, Night Owl, Binge Watcher, and more
- **Share card** — screenshot your year in a single tap, or share directly via the native share sheet
- **Auto-play story mode** — sit back and let the slides advance on their own (toggle with Space)
- Smooth Framer Motion slide animations, clickable progress dots, mobile-first design

---

## Quick start (Docker)

> **Prerequisites:** Docker + Docker Compose, a running Jellyfin server, and optionally a running [Tracearr](https://tracearr.com) instance for accurate watch history.

**1. Clone the repo**

```bash
git clone https://github.com/scruzzimattia-blip/Jellywrapped.git
cd Jellywrapped
```

**2. Create `.env`**

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — your Jellyfin server URL
VITE_JELLYFIN_URL=https://jellyfin.yourdomain.com

# Optional — enables Tracearr as the stats source (recommended for accuracy)
VITE_TRACEARR_URL=https://tracearr.yourdomain.com
VITE_TRACEARR_API_KEY=your-tracearr-api-key
```

**3. Build and run**

```bash
docker compose up -d --build
```

The app is now available at **http://localhost:3030**.

Users log in with their Jellyfin username and password — no other setup needed.

---

## Deployment via GitHub Actions (recommended)

Every push to `main` automatically:
1. Runs lint + build (CI)
2. Builds the Docker image and pushes it to `ghcr.io/<your-repo>:latest`

Add these three secrets to your GitHub repository (**Settings → Secrets → Actions**):

| Secret | Description |
|---|---|
| `VITE_JELLYFIN_URL` | Your Jellyfin server URL |
| `VITE_TRACEARR_URL` | Your Tracearr URL (optional) |
| `VITE_TRACEARR_API_KEY` | Your Tracearr API key (optional) |

Then on your server, use the pre-built image directly:

```yaml
# docker-compose.yml on your server
services:
  jellyfin-wrapped:
    image: ghcr.io/scruzzimattia-blip/jellywrapped:latest
    restart: unless-stopped
    ports:
      - "3030:80"
```

```bash
docker compose pull && docker compose up -d
```

---

## Data sources

| Mode | Stats from | Posters from |
|---|---|---|
| **Tracearr** (recommended) | Tracearr history API | Jellyfin Images API |
| **Direct Jellyfin** | Jellyfin Items API | Jellyfin Images API |

Tracearr mode is used automatically when `VITE_TRACEARR_URL` and `VITE_TRACEARR_API_KEY` are set. Without them the app falls back to fetching watch history directly from Jellyfin, which may be less accurate.

---

## Development

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
npm run lint      # ESLint
```

Create a local `.env` (see `.env.example`) before running `dev` so the app knows your Jellyfin server.

---

## CORS

This app makes browser-side requests to Jellyfin (and Tracearr if configured). Both servers must allow the origin where the app is hosted.

- **Jellyfin** — Dashboard → Networking → *Allowed CORS Hosts*: add your app domain (e.g. `https://wrapped.yourdomain.com`)
- **Tracearr** — set `CORS_ORIGIN` (or equivalent) in Tracearr's environment to your app domain

When hosted on the same domain as Jellyfin, no CORS changes are needed.

---

## Security

- Jellyfin session tokens are stored in `localStorage` on the user's device.
- No credentials are sent to any third-party server — all requests go directly from the browser to your Jellyfin/Tracearr instances.
- Use HTTPS in production for both Jellyfin and Tracearr.
