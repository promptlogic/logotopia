// Watches Downloads folder for new flight-sim screenshots.
// Prints the path to stdout when a new one appears.
const fs = require('fs');
const path = require('path');

const dir = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads');
const PREFIX = 'flight-sim-';
const seen = new Set();

// Seed with existing files so we only report NEW ones
for (const f of fs.readdirSync(dir)) {
  if (f.startsWith(PREFIX) && f.endsWith('.png')) {
    seen.add(f);
  }
}
console.log(`Watching ${dir} for new flight-sim screenshots... (${seen.size} existing)`);

setInterval(() => {
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(PREFIX) && f.endsWith('.png') && !seen.has(f)) {
      seen.add(f);
      const full = path.join(dir, f);
      console.log(`NEW_SCREENSHOT:${full}`);
    }
  }
}, 500);
