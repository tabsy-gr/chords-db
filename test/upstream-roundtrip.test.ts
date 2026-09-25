/**
 * Proves the schema v2 conversion kept every upstream position: each position
 * in upstream's generated lib/*.json (pinned at df06fa7) must come back out of
 * the voicing whose id records it, with only the documented changes:
 *
 * - fretted: an 'x' in upstream fingers (-1 in its output) is 0 here;
 * - piano: upstream "fingers" are "degrees" here, and upstream's midi dropped
 *   every flat note (it only knew sharp names), which is fixed here.
 */
import { describe, expect, it } from 'vitest';
import guitarV1 from './fixtures/upstream-v0.6.0/guitar.json';
import pianoV1 from './fixtures/upstream-v0.6.0/piano.json';
import ukuleleV1 from './fixtures/upstream-v0.6.0/ukulele.json';
import { suffixSlug, loadInstruments } from '../scripts/data-source';
import { toChordDiagram } from '../src/diagram';
import { keyboardMidi } from '../src/midi';
import type { FrettedVoicing, KeyboardVoicing, Voicing } from '../src/types';

interface V1Position {
  frets: (number | string)[];
  fingers: (number | string)[];
  baseFret?: number;
  barres?: number[];
  capo?: boolean;
  midi: number[];
}
interface V1Instrument {
  main: { strings?: number; fretsOnChord: number | null; keys?: number };
  tunings: Record<string, string[]>;
  keys: string[];
  suffixes: string[];
  chords: Record<string, { key: string; suffix: string; positions: V1Position[] }[]>;
}

const upstream: Record<string, V1Instrument> = {
  guitar: guitarV1 as V1Instrument,
  ukulele: ukuleleV1 as V1Instrument,
  piano: pianoV1 as unknown as V1Instrument,
};

describe.each(loadInstruments())('$instrument.id', ({ instrument, chords }) => {
  const v1 = upstream[instrument.id];
  const voicings = new Map<string, Voicing>(
    chords.flatMap(({ chord }) => chord.voicings.map((v) => [v.id, v] as const))
  );
  const upstreamIds = Object.entries(v1.chords).flatMap(([dir, list]) =>
    list.flatMap((chord) =>
      chord.positions.map((_, i) => `${instrument.id}/${dir}/${suffixSlug(chord.suffix)}/${i + 1}`)
    )
  );

  it('keeps the instrument metadata', () => {
    expect(instrument.keys).toEqual(v1.keys);
    expect(instrument.suffixes).toEqual(v1.suffixes);
    if (instrument.kind === 'fretted') {
      expect(instrument.tunings.standard.map((course) => course[0])).toEqual(v1.tunings.standard);
      expect(instrument.tunings.standard).toHaveLength(v1.main.strings!);
      expect(instrument.maxFretSpan).toBe(v1.main.fretsOnChord);
    } else {
      expect(instrument.keyCount).toBe(v1.main.keys);
    }
  });

  it('has exactly one voicing per upstream position, and nothing else', () => {
    expect(new Set(upstreamIds).size).toBe(upstreamIds.length);
    expect([...voicings.keys()].sort()).toEqual([...upstreamIds].sort());
  });

  it('keeps each chord key and suffix', () => {
    const wrong: string[] = [];
    for (const [dir, list] of Object.entries(v1.chords)) {
      for (const chord of list) {
        const file = chords.find(
          ({ file }) => file.endsWith(`/chords/${dir}/${suffixSlug(chord.suffix)}.json`)
        );
        if (file?.chord.key !== chord.key || file.chord.suffix !== chord.suffix) {
          wrong.push(`${dir} ${chord.suffix}`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  if (instrument.kind === 'fretted') {
    it('reproduces every upstream position exactly, except x fingers', () => {
      const mismatches: string[] = [];
      const xFingers: string[] = [];
      for (const [dir, list] of Object.entries(v1.chords)) {
        for (const chord of list) {
          chord.positions.forEach((position, i) => {
            const id = `${instrument.id}/${dir}/${suffixSlug(chord.suffix)}/${i + 1}`;
            const expected = { ...position };
            if (expected.fingers.includes(-1)) {
              xFingers.push(id);
              expected.fingers = expected.fingers.map((f) => (f === -1 ? 0 : f));
            }
            const actual = toChordDiagram(voicings.get(id) as FrettedVoicing, instrument.tunings.standard);
            try {
              expect(actual).toEqual(expected);
            } catch {
              mismatches.push(`${id}: ${JSON.stringify(actual)} != ${JSON.stringify(position)}`);
            }
          });
        }
      }
      expect(mismatches).toEqual([]);
      expect(xFingers).toEqual(instrument.id === 'guitar' ? ['guitar/F/major/2'] : []);
    });
  } else {
    it('keeps every note and degree, and fixes midi only where upstream dropped flats', () => {
      const mismatches: string[] = [];
      let flatsFixed = 0;
      for (const [dir, list] of Object.entries(v1.chords)) {
        for (const chord of list) {
          chord.positions.forEach((position, i) => {
            const id = `${instrument.id}/${dir}/${suffixSlug(chord.suffix)}/${i + 1}`;
            const voicing = voicings.get(id) as KeyboardVoicing;
            const isFlat = (note: string) => /^[A-G]b/.test(note);
            if (voicing.notes.some(isFlat)) flatsFixed++;
            // Upstream's midi is ours with the flat notes missing.
            const upstreamMidiOk =
              JSON.stringify(keyboardMidi(voicing.notes.filter((n) => !isFlat(n)))) ===
                JSON.stringify(position.midi) &&
              keyboardMidi(voicing.notes).every((m) => m >= 0);
            if (
              JSON.stringify(voicing.notes) !== JSON.stringify(position.frets) ||
              JSON.stringify(voicing.degrees) !== JSON.stringify(position.fingers) ||
              !upstreamMidiOk
            ) {
              mismatches.push(id);
            }
          });
        }
      }
      expect(mismatches).toEqual([]);
      expect(flatsFixed).toBe(84);
    });
  }
});
