import { frettedMidi } from './midi';
import type { Finger, FrettedVoicing, Pitch } from './types';

/**
 * A fretted voicing in the shape chord-diagram renderers such as react-chords
 * expect: frets and barres relative to `baseFret`.
 */
export interface ChordDiagram {
  frets: number[];
  fingers: Finger[];
  /** The fret drawn at the top of the diagram. */
  baseFret: number;
  barres: number[];
  capo?: true;
  midi: number[];
}

/**
 * Converts a voicing to diagram form. Voicings that fit within the first four
 * frets are drawn from fret 1; higher ones start at their lowest fretted note.
 */
export const toChordDiagram = (voicing: FrettedVoicing, courses: Pitch[][]): ChordDiagram => {
  const { frets } = voicing;
  const baseFret = Math.max(...frets) > 4 ? Math.min(...frets.filter((f) => f > 0)) : 1;
  const shift = (fret: number) => fret - baseFret + 1;
  return {
    frets: frets.map((fret) => (baseFret > 1 && fret > 0 ? shift(fret) : fret)),
    fingers: voicing.fingers,
    baseFret,
    barres: (voicing.barres ?? []).map((barre) => (baseFret > 1 ? shift(barre) : barre)),
    ...(voicing.capo ? { capo: true as const } : {}),
    midi: frettedMidi(frets, courses),
  };
};
