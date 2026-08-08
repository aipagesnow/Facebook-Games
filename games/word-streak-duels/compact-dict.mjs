import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wordsPath = path.join(__dirname, 'words.js');
const code = fs.readFileSync(wordsPath, 'utf8');
const match = code.match(/new Set\((\[.*\])\)/s);
if (!match) {
  console.error('Could not find word array in words.js');
  process.exit(1);
}
const words = JSON.parse(match[1]);
console.log('words', words.length);

// Compact: one JS string with \n separators (smaller than JSON array of quoted strings)
const joined = words.join('\n');
const out =
  `/** Large dictionary: ${words.length} words (3–12 letters). Compact form. */\n` +
  `window.WSD_WORDS = new Set(${JSON.stringify(joined)}.split("\\n").filter(Boolean));\n`;

fs.writeFileSync(wordsPath, out, 'utf8');
console.log('bytes', fs.statSync(wordsPath).size);

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(wordsPath, 'utf8'), ctx);
console.log('verify', ctx.window.WSD_WORDS.size);
console.log('crane', ctx.window.WSD_WORDS.has('crane'));
console.log('easy', ctx.window.WSD_WORDS.has('easy'));
console.log('elephant', ctx.window.WSD_WORDS.has('elephant'));
