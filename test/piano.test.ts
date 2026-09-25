/**
 * The piano data is generated from data/qualities.json by
 * scripts/generate-piano.ts; it must never drift from the formulas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatJson } from '../scripts/format-json';
import { generatePiano } from '../scripts/generate-piano';
import { DATA_DIR, loadInstruments } from '../scripts/data-source';
import { spellChord } from '../src/spelling';
import { qualities } from '../src/theory';

const quality = (id: string) => qualities.find((q) => q.id === id)!;

describe('piano data', () => {
  const { instrument, files } = generatePiano();
  const stored = loadInstruments().find((s) => s.instrument.id === 'piano')!;

  it('is exactly what the generator produces (npm run generate:piano)', () => {
    const differ = files.filter(({ file, json }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== formatJson(json));
    expect(differ.map(({ file }) => path.relative(DATA_DIR, file))).toEqual([]);
    expect(stored.chords.length).toBe(files.length);
    expect(stored.instrument.suffixes).toEqual(instrument.suffixes);
  });
});

describe('spellChord', () => {
  it.each([
    ['C', '13', 'C4 E4 G4 Bb4 D5 F5 A5'],
    ['C#', 'major', 'C#4 E#4 G#4'],
    ['Eb', 'minor', 'Eb4 Gb4 Bb4'],
    ['Bb', 'dim', 'Bb4 Db5 Fb5'],
    ['C', 'dim7', 'C4 Eb4 Gb4 A4'],
    ['F#', '7#5', 'F#4 A#4 D5 E5'],
    ['F', 'm7b5', 'F4 Ab4 Cb5 Eb5'],
  ])('%s %s -> %s', (key, id, expected) => {
    expect(spellChord(key, quality(id)).map((n) => n.note).join(' ')).toBe(expected);
  });

  it('gives each note an octave that matches its pitch', () => {
    for (const n of spellChord('F', quality('m7b5'))) {
      expect(n.midi).toBeGreaterThanOrEqual(60);
    }
    expect(spellChord('C#', quality('major'))[1].midi).toBe(65); // E#4 sounds as F4
  });
});
