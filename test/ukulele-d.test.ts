/**
 * The ukulele in D tuning is generated from the ukulele in standard tuning by
 * scripts/generate-ukulele-d.ts; it must never drift from it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatJson } from '../scripts/format-json';
import { generateUkuleleD } from '../scripts/generate-ukulele-d';
import { DATA_DIR, loadInstruments } from '../scripts/data-source';
import { frettedMidi } from '../src/midi';

describe('ukulele-d data', () => {
  const { instrument, files } = generateUkuleleD();
  const stored = loadInstruments().find((s) => s.instrument.id === 'ukulele-d')!;

  it('is exactly what the generator produces (npm run generate:ukulele-d)', () => {
    const differ = files.filter(({ file, json }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== formatJson(json));
    expect(differ.map(({ file }) => path.relative(DATA_DIR, file))).toEqual([]);
    expect(stored.chords.length).toBe(files.length);
    expect(stored.instrument).toEqual(instrument);
  });

  it('sounds every shape a whole tone above the standard ukulele', () => {
    const d = instrument.tunings.standard;
    const g = [['G4'], ['C4'], ['E4'], ['A4']];
    const shape = [0, 0, 0, 3];
    expect(frettedMidi(shape, d)).toEqual(frettedMidi(shape, g).map((m) => m + 2));
  });
});
