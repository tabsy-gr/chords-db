import { describe, expect, it } from 'vitest';
import {
  deriveBarres,
  deriveCapo,
  normalizeNote,
  parseChordName,
  parseFingers,
  parseFrets,
} from '../scripts/voicing-lookup';

const suffixes = ['major', 'minor', 'm7', '/Ab', '/G#', 'm/Ab', 'm7/Ab'];

describe('find-voicing helpers', () => {
  it('normalises notes to the database spelling', () => {
    expect(['G#', 'Db', 'A#', 'Cb'].map(normalizeNote)).toEqual(['Ab', 'C#', 'Bb', 'B']);
    expect(normalizeNote('H')).toBeNull();
  });

  it('parses chord names', () => {
    expect(parseChordName('Ab major', suffixes)).toEqual({ key: 'Ab', suffix: 'major' });
    expect(parseChordName('G#maj', suffixes)).toEqual({ key: 'Ab', suffix: 'major' });
    expect(parseChordName('Am', suffixes)).toHaveProperty('error');
    expect(parseChordName('A /Ab', suffixes)).toEqual({ key: 'A', suffix: '/Ab' });
    expect(parseChordName('A/G#', suffixes)).toEqual({ key: 'A', suffix: '/G#' });
    expect(parseChordName('Cm7/G#', suffixes)).toEqual({ key: 'C', suffix: 'm7/Ab' });
    expect(parseChordName('A minor/G#', suffixes)).toEqual({ key: 'A', suffix: 'm/Ab' });
    expect(parseChordName('Ab foo', suffixes)).toHaveProperty('error');
  });

  it('parses frets and fingers', () => {
    expect(parseFrets('4,3,1,1,1,x', 6)).toEqual([4, 3, 1, 1, 1, -1]);
    expect(parseFrets('4 3 1 1 1 X', 6)).toEqual([4, 3, 1, 1, 1, -1]);
    expect(parseFrets('4,3,1', 6)).toHaveProperty('error');
    expect(parseFrets('4,3,1,1,1,25', 6)).toHaveProperty('error');
    expect(parseFingers('T,2,1,1,1,x', 6)).toEqual(['T', 2, 1, 1, 1, 0]);
    expect(parseFingers('5,2,1,1,1,0', 6)).toHaveProperty('error');
  });

  it('derives barres and capo the way the existing data does', () => {
    const frets = [4, 3, 1, 1, 1, -1];
    const barres = deriveBarres(frets, [3, 2, 1, 1, 1, 0]);
    expect(barres).toEqual([1]);
    expect(deriveCapo(frets, barres)).toBe(true);
    expect(deriveBarres([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0])).toEqual([]);
    expect(deriveCapo([-1, 0, 1, 1, 1, 4], [1])).toBe(false);
  });
});
