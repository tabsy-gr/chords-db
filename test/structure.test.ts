import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatJson } from '../scripts/format-json';
import { keyDir, loadInstruments, loadQualitiesFile, suffixSlug } from '../scripts/data-source';
import type { FrettedVoicing, KeyboardVoicing } from '../src/types';

const instruments = loadInstruments();

describe.each(instruments)('$instrument.id', ({ dir, instrument, chords }) => {
  it('lives in a directory named after its id', () => {
    expect(path.basename(dir)).toBe(instrument.id);
  });

  it('stores each chord at chords/<key>/<suffix>.json', () => {
    const misplaced = chords
      .filter(({ file, chord }) => {
        const expected = path.join(dir, 'chords', keyDir(chord.key), `${suffixSlug(chord.suffix)}.json`);
        return file !== expected;
      })
      .map(({ file }) => file);
    expect(misplaced).toEqual([]);
  });

  it('prefixes every voicing id with the instrument id', () => {
    const wrong = chords
      .flatMap(({ chord }) => chord.voicings)
      .filter((v) => !v.id.startsWith(`${instrument.id}/`))
      .map((v) => v.id);
    expect(wrong).toEqual([]);
  });

  if (instrument.kind === 'fretted') {
    it('has one fret and one finger per course', () => {
      const courses = instrument.tunings.standard.length;
      const wrong = chords
        .flatMap(({ chord }) => chord.voicings as FrettedVoicing[])
        .filter((v) => v.frets.length !== courses || v.fingers.length !== courses)
        .map((v) => v.id);
      expect(wrong).toEqual([]);
    });
  } else {
    it('has one degree per note', () => {
      const wrong = chords
        .flatMap(({ chord }) => chord.voicings as KeyboardVoicing[])
        .filter((v) => v.degrees && v.degrees.length !== v.notes.length)
        .map((v) => v.id);
      expect(wrong).toEqual([]);
    });
  }
});

describe('all data', () => {
  it('has unique voicing ids', () => {
    const ids = instruments.flatMap(({ chords }) =>
      chords.flatMap(({ chord }) => chord.voicings.map((v) => v.id))
    );
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it('is formatted canonically (npm run format:data)', () => {
    const unformatted = [loadQualitiesFile(), ...instruments.flatMap((source) => [source, ...source.chords])]
      .filter(({ text }) => formatJson(JSON.parse(text)) !== text)
      .map(({ file }) => file);
    expect(unformatted).toEqual([]);
  });
});
