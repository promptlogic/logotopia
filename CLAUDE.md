# CLAUDE.md

## Project Overview

Logotopia is a Swedish-themed multiplayer flight simulator and open-world exploration game built with Three.js. It runs in the browser and supports up to 8 players.

## Project Structure

```
server.js      - Express static server + WebSocket relay + deploy webhook
game.js        - All game logic, rendering, physics, and networking (~5200 lines)
index.html     - HTML shell with HUD elements and styles
package.json   - Dependencies (express, ws, uuid)
```

## Setup and Running

```bash
npm install
npm start
```

The game runs at http://localhost:3000.

## Tech Stack

- **Rendering:** Three.js r128 (loaded from CDN)
- **Server:** Node.js + Express + ws (WebSocket)
- **Process manager:** pm2 (production)

## Architecture

- The server (`server.js`) is a simple WebSocket relay with no authoritative simulation.
- All game logic lives in a single client-side file (`game.js`).
- Zombies, targets, flowers, and scoring are local to each client.
- Multiplayer state is sent as JSON over WebSocket at 20Hz per client with 100ms interpolation.

## Deployment

Runs on a DigitalOcean Ubuntu droplet managed by pm2. Auto-deploys via a GitHub webhook at `/webhook` on push to `main`.
