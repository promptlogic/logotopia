// Quick screenshot trigger — talks to the persistent dev session.
// Usage:
//   node snap.js              — take a screenshot
//   node snap.js fly          — fly forward 2s then screenshot
//   node snap.js fly 5000     — fly forward 5s then screenshot
//   node snap.js key Space    — press a key then screenshot
//   node snap.js reload       — reload game and screenshot
//   node snap.js eval "score" — evaluate JS expression and screenshot

const http = require('http');

const CTRL_PORT = 9222;
const args = process.argv.slice(2);
const cmd = args[0] || 'snap';

let url = `http://localhost:${CTRL_PORT}/?cmd=${cmd}`;

if (cmd === 'fly' && args[1]) {
  url += `&duration=${args[1]}`;
} else if (cmd === 'key' && args[1]) {
  url += `&key=${args[1]}`;
} else if (cmd === 'eval' && args[1]) {
  url += `&code=${encodeURIComponent(args[1])}`;
}

http.get(url, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log(data);
    } else {
      console.error(`Error ${res.statusCode}: ${data}`);
      process.exit(1);
    }
  });
}).on('error', err => {
  console.error('Cannot connect to dev session. Is screenshot.js running?');
  console.error(err.message);
  process.exit(1);
});
