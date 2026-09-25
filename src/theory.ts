import qualitiesJson from '../data/qualities.json';
import type { Interval, Quality } from './types';

/** The chord qualities in data/qualities.json. */
export const qualities: Quality[] = (qualitiesJson as { qualities: Quality[] }).qualities;

const SEMITONES: Record<Interval, number> = {
  '1': 0, b2: 1, '2': 2, b3: 3, '3': 4, '4': 5, '#4': 6, b5: 6, '5': 7, '#5': 8, b6: 8,
  '6': 9, bb7: 9, b7: 10, '7': 11, b9: 1, '9': 2, '#9': 3, '11': 5, '#11': 6, b13: 8, '13': 9,
};

/** Pitch class (0-11) of an interval above the root. */
export const intervalPitchClass = (interval: Interval): number => SEMITONES[interval];

const LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Pitch class (0-11) of a note name ('C#', 'Bb'); null if it isn't one. */
export const notePitchClass = (note: string): number | null => {
  const match = /^([A-G])(#|b)?/.exec(note);
  if (!match) return null;
  const shift = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return (LETTERS[match[1]] + shift + 12) % 12;
};

const bySpelling = new Map(qualities.flatMap((q) => q.spellings.map((s) => [s, q] as const)));

export interface ParsedSuffix {
  quality: Quality;
  /** The bass note of a slash chord ('E' in 'm/E'). */
  bass?: string;
}

/**
 * Resolves an instrument's chord suffix to its quality, and its bass note for
 * slash chords: 'm/E' is minor over E, '/E' is major over E. Returns null for
 * a suffix no quality spells.
 */
export const parseSuffix = (suffix: string): ParsedSuffix | null => {
  // A spelling may itself contain '/' (6/9), so try the whole suffix first.
  const whole = bySpelling.get(suffix);
  if (whole) return { quality: whole };
  const slash = suffix.indexOf('/');
  const name = slash < 0 ? suffix : suffix.slice(0, slash) || 'major';
  const bass = slash < 0 ? undefined : suffix.slice(slash + 1);
  const quality = bySpelling.get(name);
  if (!quality || (bass !== undefined && notePitchClass(bass) === null)) return null;
  return bass === undefined ? { quality } : { quality, bass };
};
