import { describe, expect, it } from 'vitest';
import guitar from '../lib/guitar.json';
import ukulele from '../lib/ukulele.json';
import { loadInstruments } from '../scripts/data-source';
import { chordSymbolSource, findChord, parseChordSymbol, qualityInputs } from '../src/notation';
import type { InstrumentData } from '../src/types';

const parse = (symbol: string) => {
  const p = parseChordSymbol(symbol);
  return p && { root: p.root, suffix: p.suffix, bass: p.bass };
};

describe('parseChordSymbol', () => {
  it.each([
    ['C', 'C', 'major', null],
    ['Am', 'A', 'minor', null],
    ['Amin', 'A', 'minor', null],
    ['A-7', 'A', 'm7', null],
    ['F#m7b5', 'F#', 'm7b5', null],
    ['F♯ø', 'F#', 'm7b5', null],
    ['Bbø7', 'Bb', 'm7b5', null],
    ['CΔ7', 'C', 'maj7', null],
    ['CΔ', 'C', 'maj7', null],
    ['CM7', 'C', 'maj7', null],
    ['C°7', 'C', 'dim7', null],
    ['C°', 'C', 'dim', null],
    ['C+', 'C', 'aug', null],
    ['C+7', 'C', 'aug7', null],
    ['CmM7', 'C', 'mmaj7', null],
    ['Cm(maj7)', 'C', 'mmaj7', null],
    ['C6/9', 'C', '69', null],
    ['Csus', 'C', 'sus4', null],
    ['C(b5)', 'C', '(b5)', null],
    ['C7b9b13', 'C', '7b9b13', null],
    ['E♭m', 'Eb', 'minor', null],
  ])('%s -> %s %s', (symbol, root, suffix, bass) => {
    expect(parse(symbol)).toEqual({ root, suffix, bass });
  });

  it('spells slash chords the way the database does', () => {
    expect(parse('C/E')).toEqual({ root: 'C', suffix: '/E', bass: 'E' });
    expect(parse('Am/G')).toEqual({ root: 'A', suffix: 'm/G', bass: 'G' });
    expect(parse('D7/F#')).toEqual({ root: 'D', suffix: '7/F#', bass: 'F#' });
    expect(parse('D/G♭')).toEqual({ root: 'D', suffix: '/Gb', bass: 'Gb' });
  });

  it('reads a b after the root as its flat', () => {
    // Why no canonical suffix starts with b: "Cb5" is C-flat's power chord.
    expect(parse('Cb5')).toEqual({ root: 'Cb', suffix: '5', bass: null });
  });

  it('never takes Δ without a root for a chord (it is also Greek Delta)', () => {
    for (const text of ['Δ', 'Δ7', 'ΔΕΝ', 'Δεν', 'ø', '°', '+']) expect(parseChordSymbol(text)).toBeNull();
  });

  it('returns null for unknown roots and qualities', () => {
    expect(parseChordSymbol('H7')).toBeNull();
    expect(parseChordSymbol('Cxyz')).toBeNull();
    expect(parseChordSymbol('')).toBeNull();
  });
});

describe('findChord', () => {
  const g = guitar as unknown as InstrumentData;
  const u = ukulele as unknown as InstrumentData;

  it('finds a chord whatever its enharmonic spelling (tombatossals/chords-db#24)', () => {
    expect(findChord(g, 'A#m7')).toMatchObject({ key: 'Bb', suffix: 'm7' });
    expect(findChord(g, 'D#')).toMatchObject({ key: 'Eb', suffix: 'major' });
    expect(findChord(g, 'G#7')).toMatchObject({ key: 'Ab', suffix: '7' });
    expect(findChord(u, 'C#')).toMatchObject({ key: 'Db', suffix: 'major' });
    expect(findChord(g, 'Db')).toMatchObject({ key: 'C#', suffix: 'major' });
  });

  it('finds a slash chord whatever the spelling of its bass', () => {
    expect(findChord(g, 'D/Gb')).toMatchObject({ key: 'D', suffix: '/F#' });
    expect(findChord(g, 'C/G')).toMatchObject({ key: 'C', suffix: '/G' });
  });

  it('returns null for a chord the instrument does not have', () => {
    expect(findChord(g, 'C7b9b13')).toBeNull();
    expect(findChord(g, 'Hm')).toBeNull();
  });

  it('finds every chord in the database from its own symbol', () => {
    const missing = loadInstruments().flatMap(({ instrument, chords }) =>
      chords
        .map(({ chord }) => ({ chord, symbol: chord.key + (chord.suffix === 'major' ? '' : chord.suffix) }))
        .filter(({ chord, symbol }) => {
          const p = parseChordSymbol(symbol);
          return !p || p.suffix !== chord.suffix;
        })
        .map(({ symbol }) => `${instrument.id} ${symbol}`)
    );
    expect(missing).toEqual([]);
  });
});

describe('chord symbol matching', () => {
  const re = new RegExp(`^(${chordSymbolSource()})$`);

  it('matches every quality spelling and symbol', () => {
    for (const q of qualityInputs()) expect(re.test(`C${q}`), `C${q}`).toBe(true);
  });

  it('prefers the longest quality', () => {
    expect(qualityInputs().indexOf('maj7')).toBeLessThan(qualityInputs().indexOf('m'));
  });
});
