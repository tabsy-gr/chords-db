/**
 * Rewrites every file under data/ in canonical form (see format-json.ts).
 * `--check` lists the files that aren't formatted and exits non-zero instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { formatJson } from './format-json';
import { loadInstruments, ROOT } from './data-source';

const check = process.argv.includes('--check');
const unformatted: string[] = [];

for (const source of loadInstruments()) {
  for (const { file, text } of [source, ...source.chords]) {
    const formatted = formatJson(JSON.parse(text));
    if (formatted === text) continue;
    unformatted.push(file);
    if (!check) fs.writeFileSync(path.join(ROOT, file), formatted);
  }
}

if (check && unformatted.length) {
  console.error(`Not formatted (run npm run format:data):\n${unformatted.join('\n')}`);
  process.exit(1);
}
console.log(check ? 'All data files are formatted.' : `Formatted ${unformatted.length} file(s).`);
