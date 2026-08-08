import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

const url = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';
console.log('Downloading full English alpha list…');
const raw = await get(url);
console.log('Downloaded bytes:', raw.length);

const block = new Set([
  'fuck',
  'shit',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'whore',
  'slut',
  'piss',
  'cock',
  'dick',
  'pussy',
  'bitch',
  'asshole',
  'bastard',
]);

const unique = [
  ...new Set(
    raw
      .split(/\r?\n/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^[a-z]{3,12}$/.test(w) && !block.has(w))
  ),
].sort();

console.log('Words kept:', unique.length);

const outPath = path.join(__dirname, 'words.js');
const header = `/**
 * Large dictionary for Word Streak Duels.
 * ${unique.length} words, 3–12 letters (filtered alpha list).
 * Size is still well under Instant Games limits.
 */
`;
const body = `window.WSD_WORDS = new Set(${JSON.stringify(unique)});\n`;
fs.writeFileSync(outPath, header + body, 'utf8');
console.log('Wrote', outPath, 'bytes', fs.statSync(outPath).size);

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(outPath, 'utf8'), ctx);
console.log('Verify size:', ctx.window.WSD_WORDS.size);
console.log('crane:', ctx.window.WSD_WORDS.has('crane'));
console.log('easy:', ctx.window.WSD_WORDS.has('easy'));
console.log('elephant:', ctx.window.WSD_WORDS.has('elephant'));
console.log('xylophone:', ctx.window.WSD_WORDS.has('xylophone'));
