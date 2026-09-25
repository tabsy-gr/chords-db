/**
 * Generates the piano voicings from data/qualities.json: one root-position
 * voicing per key and quality, spelled by spellChord(). Existing voicing ids
 * are kept; a test checks data/piano matches this output.
 *
 * 7alt is skipped: it has no fixed set of tones (any of b5, #5, b9, #9).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spellChord } from '../src/spelling';
import { parseSuffix, qualities } from '../src/theory';
import type { KeyboardInstrument, KeyboardVoicing } from '../src/types';
import { DATA_DIR, keyDir, loadInstruments, suffixSlug } from './data-source';
import { formatJson } from './format-json';

const SKIP = new Set(['7alt']);
export const PIANO_SOURCE = { type: 'curated', ref: 'data/qualities.json' } as const;

export interface PianoFile {
  file: string;
  json: { $schema: string; key: string; suffix: string; voicings: KeyboardVoicing[] };
}

export const generatePiano = () => {
  const { instrument, chords } = loadInstruments().find((s) => s.instrument.id === 'piano')!;
  // Keep the id of every existing voicing, keyed by key and quality.
  const existing = new Map<string, string>();
  for (const { chord } of chords) {
    const quality = parseSuffix(chord.suffix)?.quality.id;
    if (quality) existing.set(`${chord.key} ${quality}`, chord.voicings[0].id);
  }
  const covered = qualities.filter((q) => !SKIP.has(q.id));
  const files: PianoFile[] = [];
  for (const key of instrument.keys) {
    for (const quality of covered) {
      const suffix = quality.spellings[0];
      const spelled = spellChord(key, quality);
      const id = existing.get(`${key} ${quality.id}`) ?? `piano/${keyDir(key)}/${suffixSlug(suffix)}/1`;
      files.push({
        file: path.join(DATA_DIR, 'piano', 'chords', keyDir(key), `${suffixSlug(suffix)}.json`),
        json: {
          $schema: '../../../../schema/chord.schema.json',
          key,
          suffix,
          voicings: [
            {
              id,
              notes: spelled.map((n) => n.note),
              degrees: spelled.map((n) => n.interval),
              sources: [PIANO_SOURCE],
            },
          ],
        },
      });
    }
  }
  const updated: KeyboardInstrument = {
    ...(instrument as KeyboardInstrument),
    suffixes: covered.map((q) => q.spellings[0]),
  };
  return { instrument: updated, files };
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const { instrument, files } = generatePiano();
  const chordsDir = path.join(DATA_DIR, 'piano', 'chords');
  fs.rmSync(chordsDir, { recursive: true, force: true });
  for (const { file, json } of files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, formatJson(json));
  }
  fs.writeFileSync(
    path.join(DATA_DIR, 'piano', 'instrument.json'),
    formatJson({ $schema: '../../schema/instrument.schema.json', ...instrument })
  );
  console.log(`Wrote ${files.length} piano chords`);
}
