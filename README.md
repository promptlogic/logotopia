# Logotopia

A Swedish-themed multiplayer flight simulator and open-world exploration game built with Three.js. Fly a Swedish Air Force airplane, walk the Scandinavian countryside, pet moose, dance around maypoles, and fight zombies — all in your browser.

## Play

**Live server:** http://159.89.221.95:3000

Supports up to 8 players in the same world.

## Features

### Flying
- Full 6-DOF airplane controls with pitch, roll, yaw, throttle, and boost
- Machine guns for destroying ground targets and zombies
- Eject from the plane and parachute down to walk on the ground

### Walking
- Explore the terrain on foot with jump, swim, and interact
- Collect wildflowers (bluebells and buttercups) scattered across meadows
- Pet roaming moose
- Dance around midsummer maypoles
- Enjoy fika (Swedish coffee break)
- Board your plane at the airport to fly again

### World
- 8km x 8km procedural terrain with lakes, meadows, mountains, and snow peaks
- Swedish-style red cottages, farms, villages, and an airport
- Northern lights (aurora borealis) overhead
- ~100 zombies that attack both the plane and walking pilot
- ~100 villagers in folk costumes walking around villages
- ~12 moose roaming the landscape

### Multiplayer
- Up to 8 players see each other in real-time
- Remote players rendered as airplanes or walking pilots depending on their mode
- Parachutes, walk animations, swim, and dance visible to others
- WebSocket relay server with 100ms interpolation for smooth movement

## Controls

### Flying
| Key | Action |
|---|---|
| W / S | Pitch down / up |
| A / D | Roll left / right |
| Q / E | Yaw left / right |
| Shift / Ctrl | Throttle up / down |
| Space | Boost |
| Mouse | Look around |
| Click | Fire machine guns |
| F | Eject and walk |
| P | Screenshot |

### Walking
| Key | Action |
|---|---|
| W / A / S / D | Move |
| Space | Jump |
| F | Board plane (when near airport) |
| Mouse | Look around |

## Scoring

| Action | Points |
|---|---|
| Destroy target | +200 |
| Kill zombie | +500 |
| Collect flower | +50 |
| Pet moose | +100 |
| Maypole dance | +20/sec |
| Distance traveled | +0.05/m |

## Running Locally

```bash
npm install
npm start
```

Open http://localhost:3000. Open a second tab to test multiplayer.

## Project Structure

```
server.js      - Express static server + WebSocket relay + deploy webhook
game.js        - All game logic, rendering, physics, and networking (~5200 lines)
index.html     - HTML shell with HUD elements and styles
package.json   - Dependencies (express, ws, uuid)
```

## Deployment

The game runs on a DigitalOcean Ubuntu droplet managed by pm2.

### Initial server setup
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
git clone https://github.com/nikolasergeev/logotopia.git
cd logotopia && npm install
sudo npm install -g pm2
pm2 start server.js --name logotopia
pm2 save && pm2 startup
```

### Auto-deploy
A GitHub webhook at `/webhook` triggers `git pull` + `pm2 restart` on every push to `main`. Configure it in GitHub repo settings:
- **URL:** `http://YOUR_IP:3000/webhook`
- **Content type:** `application/json`
- **Events:** Push

### Manual update
```bash
ssh root@YOUR_IP "cd /root/logotopia && git pull && npm install && pm2 restart logotopia"
```

## Architecture

### Multiplayer Protocol
JSON over WebSocket at 20Hz per client. State packets contain:
- **Flying:** position, quaternion, speed, throttle, boost, cheer
- **Walking:** position, yaw, speed, animation state, parachute, swimming, fika

The server is a simple relay — no authoritative simulation. Zombies, targets, flowers, and scoring stay local to each client.

### Interpolation
Remote players are rendered with a 100ms delay, interpolating between buffered snapshots using lerp for position and slerp for quaternion rotation.

## Tech Stack
- **Rendering:** Three.js r128 (CDN)
- **Server:** Node.js + Express + ws
- **Process manager:** pm2
- **Hosting:** DigitalOcean (Ubuntu)
