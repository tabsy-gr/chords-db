/**
 * One-off conversion of the upstream tombatossals/chords-db sources (src/db,
 * v0.6.0 at df06fa7) into the schema v2 files under data/. Kept in git history
 * for provenance; removed once the conversion is committed.
 *
 * Deliberate normalizations (each documented in MIGRATING-FROM-CHORDS-DB.md):
 * - hex fret/finger strings become absolute number arrays;
 * - 'x' in a fingers string (no finger) becomes 0;
 * - a single barre number becomes a one-element array;
 * - piano "fingers" (which hold chord degrees) become "degrees";
 * - piano "tunings" (an unused C major scale) is dropped.
 */
import fs from 'node:fs';
import path from 'node:path';
import db from '../src/db';
import { strChord2array } from '../src/tools';
import { formatJson } from './format-json';

const root = path.join(import.meta.dirname, '..');
const UPSTREAM = { type: 'upstream', ref: 'tombatossals/chords-db@df06fa7' };
const NAMES: Record<string, string> = { guitar: 'Guitar', ukulele: 'Ukulele', piano: 'Piano' };

const keyDir = (key: string) => key.replace('#', 'sharp');
export const suffixSlug = (suffix: string) => suffix.replace(/#/g, 'sharp').replace(/\//g, '_');

const write = (file: string, value: unknown) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, formatJson(value));
};

for (const [id, inst] of Object.entries(db)) {
  const dir = path.join(root, 'data', id);
  const isPiano = inst.main.name === 'piano';

  write(path.join(dir, 'instrument.json'), {
    $schema: '../../schema/instrument.schema.json',
    id,
    name: NAMES[id],
    kind: isPiano ? 'keyboard' : 'fretted',
    ...(isPiano
      ? { keyCount: inst.main.keys }
      : {
          tunings: Object.fromEntries(
            Object.entries(inst.tunings).map(([name, pitches]) => [name, pitches.map((p) => [p])])
          ),
          maxFretSpan: inst.main.fretsOnChord,
        }),
    keys: inst.keys,
    suffixes: inst.suffixes,
  });

  const seen = new Set<string>();
  for (const [dirKey, chords] of Object.entries(inst.chords)) {
    for (const chord of chords) {
      if (keyDir(chord.key) !== dirKey) throw new Error(`${id}: ${chord.key} is under ${dirKey}`);
      const slug = suffixSlug(chord.suffix);
      if (!/^[A-Za-z0-9_]+$/.test(slug)) throw new Error(`${id}: bad slug ${slug}`);
      const file = path.join(dir, 'chords', dirKey, `${slug}.json`);
      if (seen.has(file)) throw new Error(`${id}: two chords map to ${file}`);
      seen.add(file);

      const voicings = chord.positions.map((position, index) => {
        const vid = `${id}/${dirKey}/${slug}/${index + 1}`;
        if (isPiano) {
          const p = position as { frets: string[]; fingers?: string[] };
          return {
            id: vid,
            notes: p.frets,
            ...(p.fingers ? { degrees: p.fingers } : {}),
            sources: [UPSTREAM],
          };
        }
        const p = position as { frets: string; fingers: string; barres?: number | number[]; capo?: boolean };
        const barres = p.barres === undefined ? [] : Array.isArray(p.barres) ? p.barres : [p.barres];
        return {
          id: vid,
          frets: strChord2array(p.frets),
          fingers: strChord2array(p.fingers).map((f) => (f === -1 ? 0 : f)),
          ...(barres.length ? { barres } : {}),
          ...(p.capo ? { capo: true } : {}),
          sources: [UPSTREAM],
        };
      });

      write(file, {
        $schema: '../../../../schema/chord.schema.json',
        key: chord.key,
        suffix: chord.suffix,
        voicings,
      });
    }
  }
  console.log(`${id}: ${seen.size} chord files`);
}
