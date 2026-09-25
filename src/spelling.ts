import { noteToMidi } from './midi';
import { intervalPitchClass, notePitchClass } from './theory';
import type { Interval, Quality } from './types';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Semitones above the root, counting 9ths, 11ths and 13ths in the octave above. */
const semitonesAbove = (interval: Interval) =>
  intervalPitchClass(interval) + (/^(b|#)?(9|11|13)$/.test(interval) ? 12 : 0);

export interface SpelledNote {
  /** Note with octave, e.g. 'Bb4'. */
  note: string;
  interval: Interval;
  midi: number;
}

/**
 * Spells a chord from its root and quality, lowest note first, with octaves:
 * the root in `rootOctave` and every other tone stacked above it (9ths, 11ths
 * and 13ths in the octave above). Notes are spelled by letter, so a third is
 * always a third (B♭ D♭ F♭, C♯ E♯ G♯); where that would need a double
 * accidental, the simpler enharmonic is used instead (Cdim7's ♭♭7 is A).
 */
export const spellChord = (key: string, quality: Quality, rootOctave = 4): SpelledNote[] => {
  const rootLetter = LETTERS.indexOf(key[0]);
  const rootMidi = noteToMidi(`${key}${rootOctave}`);
  const rootPc = notePitchClass(key)!;
  const preferFlats = key.includes('b') || key === 'F';
  return quality.intervals.map((interval) => {
    const midi = rootMidi + semitonesAbove(interval);
    const pc = (rootPc + intervalPitchClass(interval)) % 12;
    const degree = Number(interval.replace(/^(bb|b|#)/, ''));
    const letter = (rootLetter + degree - 1) % 7;
    const shift = (((pc - NATURAL[letter]) % 12) + 18) % 12 - 6;
    const name =
      Math.abs(shift) <= 1
        ? LETTERS[letter] + (shift === 1 ? '#' : shift === -1 ? 'b' : '')
        : (preferFlats ? FLATS : SHARPS)[pc];
    // The octave follows the letter: B#4 sounds as C5, Cb5 as B4.
    const accidental = name.endsWith('#') ? 1 : name.endsWith('b') ? -1 : 0;
    const octave = Math.floor((midi - accidental) / 12) - 1;
    return { note: `${name}${octave}`, interval, midi };
  });
};
