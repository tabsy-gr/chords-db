/**
 * The chord-quality table (data/qualities.json) is the validator's ground
 * truth. Each formula cites a source; this suite checks the table is
 * internally consistent and cross-checks it against tonal, an independent
 * music-theory library. Every disagreement with tonal must be listed below
 * with its reason, so a changed formula can't slip through.
 */
import { describe, expect, it } from 'vitest';
import { Chord, Note } from 'tonal';
import { loadInstruments } from '../scripts/data-source';
import { intervalPitchClass, parseSuffix, qualities } from '../src/theory';

/** Our quality id -> tonal chord symbol; null where tonal has no such chord. */
const TONAL_SYMBOL: Record<string, string | null> = {
  major: '', minor: 'm', dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4', sus2sus4: 'sus24',
  '5': '5', '6': '6', m6: 'm6', '69': '69', m69: 'm69', '7': '7', maj7: 'maj7', m7: 'm7',
  m7b5: 'm7b5', dim7: 'dim7', mmaj7: 'mMaj7', mmaj7b5: null, '7b5': '7b5', '7#5': '7#5',
  maj7b5: 'M7b5', 'maj7#5': 'maj7#5', '7sus4': '7sus4', maj7sus2: null, '9': '9', maj9: 'maj9',
  m9: 'm9', mmaj9: 'mMaj9', m9b5: 'm9b5', '9b5': '9b5', '9#5': '9#5', '7b9': '7b9', '7#9': '7#9',
  '7#5b9': '7#5b9', '7b5b9': '7b5b9', '7b5#9': '7b5#9', '7#5#9': '7#5#9', '7alt': '7alt',
  add9: 'add9', madd9: 'madd9', add11: null, '11': '11', maj11: null, m11: 'm11', mmaj11: null,
  '9#11': '9#11', '13': '13', maj13: 'maj13', '13b9': '13b9', '13b5b9': null,
  '7b9b13': '7b9b13', '7#9b13': '7#9b13',
};

/** Known disagreements with tonal: tonal's pitch classes (in C), and why. */
const DIVERGENCES: Record<string, { tonal: string; reason: string }> = {
  '11': {
    tonal: '0,2,5,7,10',
    reason: 'tonal leaves out the 3rd. The cited source spells C11 with E; our 3rd is omittable, so both voicings pass.',
  },
  '13': {
    tonal: '0,2,4,7,9,10',
    reason: 'tonal leaves out the 11th. By convention 13 implies 11; our 11th is omittable, so both pass.',
  },
  maj13: { tonal: '0,2,4,7,9,11', reason: 'As for 13: our 11th is omittable.' },
  '13b9': { tonal: '0,1,4,7,9,10', reason: 'As for 13: our 11th is omittable.' },
  '7b5b9': {
    tonal: '0,1,4,6,7,10',
    reason: 'tonal reads b5 as an added #11 and keeps the natural 5th; we read it as a lowered 5th, as for 7b5.',
  },
  '7b5#9': { tonal: '0,3,4,6,7,10', reason: 'As for 7b5b9.' },
  '7alt': {
    tonal: '0,3,4,8,10',
    reason: 'tonal fixes one set of alterations (#5, #9). The cited source allows any of b5, #5, b9, #9 (at least one).',
  },
};

const pcs = (list: number[]) => [...new Set(list)].sort((a, b) => a - b).join(',');

describe('qualities', () => {
  it('have unique ids and spellings', () => {
    const ids = qualities.map((q) => q.id);
    const spellings = qualities.flatMap((q) => q.spellings);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(spellings.filter((s, i) => spellings.indexOf(s) !== i)).toEqual([]);
  });

  it('start with the root, and never let it be omitted', () => {
    expect(qualities.filter((q) => q.intervals[0] !== '1').map((q) => q.id)).toEqual([]);
    expect(qualities.filter((q) => q.omittable?.includes('1')).map((q) => q.id)).toEqual([]);
  });

  it('only omit or require tones they contain', () => {
    const wrong = qualities.filter((q) =>
      [...(q.omittable ?? []), ...(q.atLeastOneOf ?? [])].some((iv) => !q.intervals.includes(iv))
    );
    expect(wrong.map((q) => q.id)).toEqual([]);
  });

  it('cover every suffix used in the data', () => {
    const unknown = loadInstruments().flatMap(({ instrument, chords }) =>
      chords.filter(({ chord }) => !parseSuffix(chord.suffix)).map(({ chord }) => `${instrument.id} ${chord.suffix}`)
    );
    expect(unknown).toEqual([]);
  });

  it('map every quality to a tonal symbol or record that tonal has none', () => {
    expect(qualities.filter((q) => !(q.id in TONAL_SYMBOL)).map((q) => q.id)).toEqual([]);
  });

  describe.each(qualities.filter((q) => TONAL_SYMBOL[q.id] !== null))('$id', (quality) => {
    it('agrees with tonal, or the difference is documented', () => {
      const chord = Chord.getChord(TONAL_SYMBOL[quality.id]!, 'C');
      expect(chord.empty, `tonal does not know "${TONAL_SYMBOL[quality.id]}"`).toBe(false);
      const theirs = pcs(chord.notes.map((n) => Note.chroma(n)!));
      const ours = pcs(quality.intervals.map(intervalPitchClass));
      const divergence = DIVERGENCES[quality.id];
      if (divergence) {
        expect(theirs, divergence.reason).toBe(divergence.tonal);
        expect(ours).not.toBe(theirs);
      } else {
        expect(ours).toBe(theirs);
      }
    });
  });
});
