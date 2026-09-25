/**
 * Stamps voicings as verified by a verifier listed in VERIFIERS.md.
 *
 *   npm run verify -- --by <github-login> <voicing-id> [<voicing-id> …]
 *
 * An id may end in * to stamp every voicing with that prefix
 * (e.g. bouzouki-cfad/C/major/*). Only use it for voicings you have played or
 * checked yourself.
 */
import fs from 'node:fs';
import path from 'node:path';
import { formatJson } from './format-json';
import { loadInstruments, ROOT } from './data-source';

const args = process.argv.slice(2);
const byIndex = args.indexOf('--by');
const by = byIndex >= 0 ? args[byIndex + 1] : undefined;
const patterns = args.filter((_, i) => i !== byIndex && i !== byIndex + 1);
const verifiers = fs.readFileSync(path.join(ROOT, 'VERIFIERS.md'), 'utf8');
if (!by || !new RegExp(`\\\`${by}\\\``).test(verifiers)) {
  console.error('Usage: npm run verify -- --by <login listed in VERIFIERS.md> <voicing-id>…');
  process.exit(1);
}
if (!patterns.length) {
  console.error('Give at least one voicing id.');
  process.exit(1);
}
const date = new Date().toISOString().slice(0, 10);
const matches = (id: string) => patterns.some((p) => (p.endsWith('*') ? id.startsWith(p.slice(0, -1)) : p === id));
let stamped = 0;
for (const source of loadInstruments()) {
  for (const { file, text } of source.chords) {
    const json = JSON.parse(text);
    let changed = false;
    for (const v of json.voicings) {
      if (!matches(v.id)) continue;
      v.verified = { by, date };
      changed = true;
      stamped++;
    }
    if (changed) fs.writeFileSync(path.join(ROOT, file), formatJson(json));
  }
}
console.log(`Stamped ${stamped} voicing(s) as verified by ${by} on ${date}.`);
