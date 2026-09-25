import { describe, expect, it } from 'vitest';
import { loadInstruments } from '../scripts/data-source';
import { compareByPlayability } from '../src/playability';
import type {
  FrettedInstrument,
  FrettedVoicing,
  KeyboardInstrument,
  KeyboardVoicing,
} from '../src/types';
import { RULES, validateChord, validateVoicing } from '../src/validate';

const sources = loadInstruments();
const guitar = sources.find((s) => s.instrument.id === 'guitar')!.instrument as FrettedInstrument;
const ukulele = sources.find((s) => s.instrument.id === 'ukulele')!.instrument as FrettedInstrument;
const piano = sources.find((s) => s.instrument.id === 'piano')!.instrument as KeyboardInstrument;

const v = (frets: number[], fingers: FrettedVoicing['fingers'], extra: Partial<FrettedVoicing> = {}): FrettedVoicing => ({
  id: 'test/C/x/1',
  frets,
  fingers,
  sources: [{ type: 'curated' }],
  ...extra,
});
const rules = (instrument: FrettedInstrument | KeyboardInstrument, key: string, suffix: string, voicing: FrettedVoicing | KeyboardVoicing) =>
  validateVoicing(instrument, { key, suffix }, voicing).issues.map((i) => i.rule);

describe('notes', () => {
  it('accepts a correct open C major', () => {
    expect(validateVoicing(guitar, { key: 'C', suffix: 'major' }, v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]))).toEqual({
      ok: true,
      issues: [],
    });
  });

  it('flags a note outside the chord', () => {
    // x32011: F on the top string.
    expect(rules(guitar, 'C', 'major', v([-1, 3, 2, 0, 1, 1], [0, 3, 2, 0, 1, 1], { barres: [1] }))).toEqual([
      'notes/foreign',
    ]);
  });

  it('flags a missing root', () => {
    // xx20x0: E G E, a C major with no C.
    expect(rules(guitar, 'C', 'major', v([-1, -1, 2, 0, -1, 0], [0, 0, 2, 0, 0, 0]))).toEqual(['notes/missing-root']);
  });

  it('accepts a missing root only when the voicing is marked rootless, and then requires it', () => {
    // Ukulele C9 as 0201 (G D E Bb): rootless.
    const c9 = v([0, 2, 0, 1], [0, 2, 0, 1]);
    expect(rules(ukulele, 'C', '9', c9)).toEqual(['notes/missing-root']);
    expect(rules(ukulele, 'C', '9', { ...c9, rootless: true })).toEqual([]);
    // 0003 (G C E C) contains C, so it can't be marked rootless.
    expect(rules(ukulele, 'C', 'major', v([0, 0, 0, 3], [0, 0, 0, 3], { rootless: true }))).toEqual([
      'notes/rootless-has-root',
    ]);
  });

  it('lets add chords omit the 5th, but not 6 chords', () => {
    // Cadd9 as x32x3x: C E D, no G.
    expect(rules(guitar, 'C', 'add9', v([-1, 3, 2, -1, 3, -1], [0, 2, 1, 0, 3, 0]))).toEqual([]);
    // C6 without G (x3221x: C E A C) is missing its 5th.
    expect(rules(guitar, 'C', '6', v([-1, 3, 2, 2, 1, -1], [0, 4, 2, 3, 1, 0]))).toEqual(['notes/missing-tone']);
  });

  it('flags a missing required tone but not a missing omittable one', () => {
    // C7 without the 5th (x3231x) is fine; C7 without the 3rd (x3x31x) is not.
    expect(rules(guitar, 'C', '7', v([-1, 3, 2, 3, 1, -1], [0, 3, 2, 4, 1, 0]))).toEqual([]);
    expect(rules(guitar, 'C', '7', v([-1, 3, -1, 3, 1, -1], [0, 2, 0, 3, 1, 0]))).toContain('notes/missing-tone');
  });

  it('requires one alteration in 7alt', () => {
    // C7 (x32310) spelled as "alt": no altered tone.
    expect(rules(guitar, 'C', 'alt', v([-1, 3, 2, 3, 1, 0], [0, 3, 2, 4, 1, 0]))).toContain('notes/missing-alteration');
  });

  it('checks the bass of a slash chord on guitar, not on re-entrant ukulele', () => {
    // C/E: 032010 has E in the bass; x32010 has C.
    expect(rules(guitar, 'C', '/E', v([0, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]))).toEqual([]);
    expect(rules(guitar, 'C', '/E', v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]))).toContain('notes/wrong-bass');
    expect(rules(ukulele, 'C', '/E', v([0, 0, 0, 3], [0, 0, 0, 3]))).not.toContain('notes/wrong-bass');
  });

  it('warns when a plain chord has a non-root bass, on guitar only', () => {
    // Bm as 224432 has F# in the bass; x24432 has B.
    const bm = (frets: number[]) => validateVoicing(guitar, { key: 'B', suffix: 'minor' }, v(frets, frets.map((f) => (f > 0 ? 1 : 0)) as FrettedVoicing['fingers'])).issues.filter((i) => i.rule.startsWith('notes/'));
    expect(bm([2, 2, 4, 4, 3, 2]).map((i) => [i.rule, i.severity])).toEqual([['notes/inverted-bass', 'warning']]);
    expect(bm([-1, 2, 4, 4, 3, 2])).toEqual([]);
    // Re-entrant ukulele: C major 0003 has G lowest by pitch, no warning.
    expect(rules(ukulele, 'C', 'major', v([0, 0, 0, 3], [0, 0, 0, 3]))).toEqual([]);
  });

  it('flags a silent voicing', () => {
    expect(rules(guitar, 'C', 'major', v([-1, -1, -1, -1, -1, -1], [0, 0, 0, 0, 0, 0]))).toContain('notes/silent');
  });

  it('flags an unknown suffix', () => {
    expect(rules(guitar, 'C', 'nonsense', v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]))).toContain('chord/unknown-suffix');
  });

  it('checks keyboard degrees', () => {
    const keys = (notes: string[], degrees: string[]): KeyboardVoicing => ({ id: 'test/C/x/1', notes, degrees, sources: [{ type: 'curated' }] });
    expect(rules(piano, 'C', 'major', keys(['C', 'E', 'G'], ['1', '3', '5']))).toEqual([]);
    expect(rules(piano, 'C', 'major', keys(['C', 'E', 'G'], ['1', 'b3', '5']))).toEqual(['degrees/mismatch']);
  });
});

describe('fingering', () => {
  const check = (voicing: FrettedVoicing) => rules(guitar, 'F', 'major', voicing);
  const F = [1, 3, 3, 2, 1, 1];

  it('accepts the standard F barre', () => {
    expect(check(v(F, [1, 3, 4, 2, 1, 1], { barres: [1] }))).toEqual([]);
  });

  it('flags a fretted string without a finger, and a finger on an open string', () => {
    expect(check(v(F, [0, 3, 4, 2, 1, 1], { barres: [1] }))).toContain('fingers/unfingered');
    expect(rules(guitar, 'C', 'major', v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 1, 1, 0]))).toContain('fingers/on-unfretted');
  });

  it('flags one finger on two frets', () => {
    expect(check(v(F, [1, 3, 1, 2, 1, 1], { barres: [1] }))).toContain('fingers/two-frets');
  });

  it('flags crossed fingers', () => {
    // Finger 3 on fret 2 and finger 2 on fret 3.
    expect(check(v(F, [1, 2, 4, 3, 1, 1], { barres: [1] }))).toContain('fingers/order');
  });

  it('flags an undeclared barre and a declared barre nobody plays', () => {
    expect(check(v(F, [1, 3, 4, 2, 1, 1]))).toContain('barres/undeclared');
    expect(rules(guitar, 'C', 'major', v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], { barres: [1] }))).toContain('barres/unplayed');
  });

  it('flags a string open or lower under a barre, and warns about a muted one', () => {
    expect(check(v([1, 3, 3, 0, 1, 1], [1, 3, 4, 0, 1, 1], { barres: [1] }))).toContain('barres/blocked');
    expect(check(v([1, 3, 3, -1, 1, 1], [1, 3, 4, 0, 1, 1], { barres: [1] }))).toContain('barres/muted-inside');
  });

  it('allows the thumb on several strings without a barre', () => {
    // F with the thumb on the low E: 1x3211 style, thumb on course 1.
    expect(check(v([1, -1, 3, 2, 1, 1], ['T', 0, 3, 2, 1, 1], { barres: [1] }))).toEqual([]);
  });

  it('flags a stretch wider than the instrument allows', () => {
    // Frets 1 to 5 cover 5 frets; guitar allows 4.
    expect(rules(guitar, 'F', 'major', v([1, 3, 3, 2, 1, 5], [1, 2, 3, 2, 1, 4], { barres: [1] }))).toContain('span/too-wide');
  });

  it('flags capo without a barre', () => {
    expect(rules(guitar, 'C', 'major', v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], { capo: true }))).toContain('capo/without-barre');
  });
});

describe('chords', () => {
  it('flags duplicate voicings, an unlisted suffix and a non-easiest-first order', () => {
    const open = v([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], { id: 'test/C/major/1' });
    const barre = v([-1, 3, 5, 5, 5, 3], [0, 1, 2, 3, 4, 1], { id: 'test/C/major/2', barres: [3] });
    const result = validateChord({ ...guitar, suffixes: [] }, { key: 'C', suffix: 'major', voicings: [barre, open, { ...open, id: 'test/C/major/3' }] });
    expect(result.issues.map((i) => i.rule).sort()).toEqual(
      ['chord/duplicate-voicing', 'chord/not-easiest-first', 'chord/suffix-not-listed'].sort()
    );
  });

  it('documents every rule it can report', () => {
    for (const rule of Object.values(RULES)) expect(rule.description.length).toBeGreaterThan(0);
  });
});

/**
 * Shapes whose first-taught form is not in dispute; the playability weights
 * were tuned against these in @tabsy-gr/shared. Sorting a chord's voicings by
 * playability must put this shape first.
 */
describe('playability puts the first-taught shape first', () => {
  const chart = (frets: number[]) => frets.map((f) => (f < 0 ? 'x' : f.toString(16))).join('');
  const firstShape = (instrumentId: string, key: string, suffix: string) => {
    const source = sources.find((s) => s.instrument.id === instrumentId)!;
    const instrument = source.instrument as FrettedInstrument;
    const chord = source.chords.find(({ chord }) => chord.key === key && chord.suffix === suffix)!.chord;
    const sorted = [...(chord.voicings as FrettedVoicing[])].sort(compareByPlayability(instrument.tunings.standard));
    return chart(sorted[0].frets);
  };

  it.each([
    ['C', 'major', 'x32010'], ['G', 'major', '320003'], ['D', 'major', 'xx0232'],
    ['A', 'major', 'x02220'], ['E', 'major', '022100'], ['A', 'minor', 'x02210'],
    ['E', 'minor', '022000'], ['D', 'minor', 'xx0231'], ['F', 'major', 'xx3211'],
    ['Bb', 'major', 'x13331'], ['G', '7', '320001'], ['C', '7', 'x32310'],
    ['A', '7', 'x02020'], ['E', '7', '020100'], ['D', '7', 'xx0212'],
  ])('guitar %s %s -> %s', (key, suffix, expected) => {
    expect(firstShape('guitar', key, suffix)).toBe(expected);
  });

  it.each([
    ['C', 'major', '0003'], ['F', 'major', '2010'], ['G', 'major', '0232'],
    ['A', 'minor', '2000'], ['D', 'major', '2220'], ['E', 'minor', '0432'],
    ['B', '7', '2322'], ['Bb', 'major', '3211'], ['G', '7', '0212'],
    ['C', '7', '0001'], ['D', '7', '2223'],
  ])('ukulele %s %s -> %s', (key, suffix, expected) => {
    expect(firstShape('ukulele', key, suffix)).toBe(expected);
  });
});
