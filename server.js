const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const MAX_PLAYERS = 8;
const STALE_TIMEOUT = 15000;
const players = new Map();

wss.on('connection', (ws) => {
  if (players.size >= MAX_PLAYERS) {
    ws.send(JSON.stringify({ type: 'full' }));
    ws.close();
    return;
  }

  const id = uuidv4();
  players.set(id, { ws, lastSeen: Date.now(), state: null });

  // Send welcome with assigned id
  ws.send(JSON.stringify({ type: 'welcome', id, players: getPlayerStates() }));

  // Broadcast join to others
  broadcast({ type: 'join', id }, id);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'state') {
        const p = players.get(id);
        if (p) {
          p.lastSeen = Date.now();
          p.state = msg.data;
        }
        broadcast({ type: 'state', id, data: msg.data }, id);
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    players.delete(id);
    broadcast({ type: 'leave', id });
  });
});

function getPlayerStates() {
  const list = [];
  for (const [id, p] of players) {
    if (p.state) list.push({ id, data: p.state });
  }
  return list;
}

function broadcast(msg, excludeId) {
  const raw = JSON.stringify(msg);
  for (const [id, p] of players) {
    if (id !== excludeId && p.ws.readyState === 1) {
      p.ws.send(raw);
    }
  }
}

// Stale cleanup
setInterval(() => {
  const now = Date.now();
  for (const [id, p] of players) {
    if (now - p.lastSeen > STALE_TIMEOUT) {
      p.ws.terminate();
      players.delete(id);
      broadcast({ type: 'leave', id });
    }
  }
}, 10000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Logotopia running on http://0.0.0.0:${PORT}`));
