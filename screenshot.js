// Persistent Playwright dev session for the flight sim.
// Launches browser + HTTP server, starts the game, then listens for
// "snap" commands via a tiny TCP server on port 9222.
//
// Usage:
//   node screenshot.js          — start the session
//   node snap.js                — take a screenshot from another terminal
//   node snap.js fly            — fly forward for 2s, then screenshot
//   node snap.js look <yaw> <pitch> — move mouse, then screenshot

const { chromium } = require('playwright');
const http = require('http');
const { exec } = require('child_process');

const PORT = 8765;
const CTRL_PORT = 9222;
const SCREENSHOT_PATH = __dirname + '/screenshot.png';

let page;

async function main() {
  // Start http-server in background
  const srv = exec(`npx http-server -p ${PORT} --silent`, { cwd: __dirname });
  srv.unref();
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Collect JS errors
  page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
  await page.click('#start-btn');
  await page.waitForTimeout(2000);

  console.log('Game started. Control server on port ' + CTRL_PORT);
  console.log('Run: node snap.js');

  // Tiny HTTP control server
  http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${CTRL_PORT}`);
      const cmd = url.searchParams.get('cmd') || 'snap';

      if (cmd === 'snap') {
        await page.screenshot({ path: SCREENSHOT_PATH });
        res.writeHead(200);
        res.end(SCREENSHOT_PATH);
      } else if (cmd === 'key') {
        const key = url.searchParams.get('key') || 'p';
        await page.keyboard.press(key);
        await page.waitForTimeout(500);
        await page.screenshot({ path: SCREENSHOT_PATH });
        res.writeHead(200);
        res.end(SCREENSHOT_PATH);
      } else if (cmd === 'fly') {
        const duration = parseInt(url.searchParams.get('duration') || '2000');
        await page.keyboard.down('w');
        await page.keyboard.down('ShiftLeft');
        await page.waitForTimeout(duration);
        await page.keyboard.up('w');
        await page.keyboard.up('ShiftLeft');
        await page.waitForTimeout(500);
        await page.screenshot({ path: SCREENSHOT_PATH });
        res.writeHead(200);
        res.end(SCREENSHOT_PATH);
      } else if (cmd === 'reload') {
        await page.reload({ waitUntil: 'networkidle' });
        await page.click('#start-btn');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: SCREENSHOT_PATH });
        res.writeHead(200);
        res.end(SCREENSHOT_PATH);
      } else if (cmd === 'eval') {
        const code = url.searchParams.get('code') || '';
        const result = await page.evaluate(code);
        await page.waitForTimeout(300);
        await page.screenshot({ path: SCREENSHOT_PATH });
        res.writeHead(200);
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(400);
        res.end('Unknown cmd: ' + cmd);
      }
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end(e.message);
    }
  }).listen(CTRL_PORT);
}

main().catch(e => { console.error(e); process.exit(1); });
