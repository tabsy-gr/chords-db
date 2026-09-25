/**
 * The checks from upstream's Jest suites (src/db/*.test.js at df06fa7),
 * ported to the v2 data unchanged, including their per-instrument
 * differences: upstream held ukulele to a stricter fret span (< maxFretSpan,
 * guitar <= maxFretSpan) and only checked barre fingering and MIDI
 * consistency on ukulele. The voicing validator will replace these with one
 * set of rules for every instrument.
 */
import { describe, expect, it } from 'vitest';
import { loadInstruments } from '../scripts/data-source';
import { frettedMidi, keyboardMidi } from '../src/midi';
import type { FrettedInstrument, FrettedVoicing, KeyboardVoicing } from '../src/types';

const instruments = loadInstruments();
const find = (id: string) => instruments.find((i) => i.instrument.id === id)!;

/** Distinct fingers (1-4) used on more than one string: upstream's barre count. */
const repeatedFingers = (fingers: FrettedVoicing['fingers']) =>
  new Set(
    fingers.filter((f) => typeof f === 'number' && f > 0 && fingers.filter((g) => g === f).length > 1)
  ).size;

const pitchClasses = (midi: number[]) => [...new Set(midi.map((m) => m % 12))].sort((a, b) => a - b);

describe.each(['guitar', 'ukulele'])('%s', (id) => {
  const { instrument, chords } = find(id);
  const { tunings, maxFretSpan } = instrument as FrettedInstrument;
  const all = chords.flatMap(({ chord }) => chord.voicings as FrettedVoicing[]);
  const failing = (check: (v: FrettedVoicing) => boolean) =>
    all.filter((v) => !check(v)).map((v) => v.id);

  it('has frets below 16', () => {
    expect(failing((v) => Math.max(...v.frets) < 16)).toEqual([]);
  });

  it('keeps fretted notes within the maximum fret span', () => {
    const withinSpan = (v: FrettedVoicing) => {
      const fretted = v.frets.filter((f) => f > 0);
      const span = Math.max(...fretted) - Math.min(...fretted);
      return id === 'ukulele' ? span < maxFretSpan : span <= maxFretSpan;
    };
    expect(failing(withinSpan)).toEqual([]);
  });

  it('uses fingers 0 to 4', () => {
    expect(failing((v) => v.fingers.every((f) => typeof f === 'number' && f >= 0 && f <= 4))).toEqual([]);
  });

  it('puts every barre on a fret used by at least two strings', () => {
    expect(
      failing((v) => (v.barres ?? []).every((b) => v.frets.indexOf(b) !== v.frets.lastIndexOf(b)))
    ).toEqual([]);
  });

  if (id === 'ukulele') {
    it('has one barre per finger used on several strings', () => {
      expect(failing((v) => repeatedFingers(v.fingers) === (v.barres ?? []).length)).toEqual([]);
    });

    it('only uses capo on barre voicings', () => {
      expect(failing((v) => !v.capo || !!v.barres)).toEqual([]);
    });

    it('gives every voicing of a chord the same pitch classes', () => {
      const wrong = chords.flatMap(({ chord }) => {
        const [first, ...rest] = chord.voicings as FrettedVoicing[];
        const expected = pitchClasses(frettedMidi(first.frets, tunings.standard));
        return rest
          .filter((v) => pitchClasses(frettedMidi(v.frets, tunings.standard)).join() !== expected.join())
          .map((v) => v.id);
      });
      expect(wrong).toEqual([]);
    });
  }

  it('plays C major as upstream expects', () => {
    const cMajor = chords.find(({ chord }) => chord.key === 'C' && chord.suffix === 'major')!;
    const first = cMajor.chord.voicings[0] as FrettedVoicing;
    expect(frettedMidi(first.frets, tunings.standard)).toEqual(
      id === 'guitar' ? [48, 52, 55, 60, 64] : [67, 60, 64, 72]
    );
  });
});

describe('piano', () => {
  const { chords } = find('piano');

  it('plays Cmaj7 as upstream expects', () => {
    const cmaj7 = chords.find(({ chord }) => chord.key === 'C' && chord.suffix === 'maj7')!;
    expect(keyboardMidi((cmaj7.chord.voicings[0] as KeyboardVoicing).notes)).toEqual([60, 64, 67, 71]);
  });

  it('has at least one note in every voicing', () => {
    const empty = chords
      .flatMap(({ chord }) => chord.voicings as KeyboardVoicing[])
      .filter((v) => !v.notes.length)
      .map((v) => v.id);
    expect(empty).toEqual([]);
  });
});
