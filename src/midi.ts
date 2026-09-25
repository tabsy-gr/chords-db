import type { Pitch } from './types';

const NOTE_INDEX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * MIDI number of a note ('C4' = 60). A note without an octave ('C#') is placed
 * in `defaultOctave`. Returns -1 for anything that isn't a note.
 */
export const noteToMidi = (note: string, defaultOctave = 4): number => {
  const match = /^([A-G])(#|b)?(-?[0-9])?$/.exec(note);
  if (!match) return -1;
  const [, letter, accidental, octave] = match;
  const semitone = NOTE_INDEX[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  return (Number(octave ?? defaultOctave) + 1) * 12 + semitone;
};

/** Note name of a MIDI number, spelled with sharps ('C#', not 'Db'). */
export const midiToNoteName = (midi: number): string => SHARP_NAMES[((midi % 12) + 12) % 12];

/**
 * MIDI notes of a fretted voicing: one per sounding string, in course order.
 * Muted courses (-1) are skipped.
 */
export const frettedMidi = (frets: number[], courses: Pitch[][]): number[] =>
  frets.flatMap((fret, course) =>
    fret < 0 ? [] : courses[course].map((pitch) => noteToMidi(pitch) + fret)
  );

/** MIDI notes of a keyboard voicing; notes without an octave go in octave 4. */
export const keyboardMidi = (notes: string[]): number[] => notes.map((note) => noteToMidi(note));
