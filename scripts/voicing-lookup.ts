/**
 * Pure helpers behind `npm run find-voicing`: parsing a chord name, frets and
 * fingers typed by hand, and deriving the fields a new voicing needs.
 */
import type { Finger } from '../src/types';

const NATURALS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// Spelling the database uses for each pitch class (sharps only on C# and F#).
const DB_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Normalises a note to the database spelling: 'G#' → 'Ab', 'Db' → 'C#'. */
export const normalizeNote = (note: string): string | null => {
  const match = /^([A-Ga-g])(#|b)?$/.exec(note.trim());
  if (!match) return null;
  const shift = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return DB_NOTES[(NATURALS[match[1].toUpperCase()] + shift + 12) % 12];
};

const QUALITY_ALIASES: Record<string, string> = {
  '': 'major',
  M: 'major',
  maj: 'major',
  Maj: 'major',
  major: 'major',
  Major: 'major',
  min: 'minor',
  Min: 'minor',
  minor: 'minor',
  Minor: 'minor',
};

export interface ChordName {
  key: string;
  suffix: string;
}

/**
 * Parses "Ab major", "G#maj", "A /Ab" or "Cm7/G" into a key and a suffix as
 * written in the instrument's suffix list. Returns an error message when the
 * name can't be resolved.
 */
export const parseChordName = (
  input: string,
  suffixes: readonly string[]
): ChordName | { error: string } => {
  const match = /^\s*([A-Ga-g])(#|b)?\s*(.*?)\s*$/.exec(input);
  if (!match) return { error: `Could not read a chord name from "${input}".` };
  const key = normalizeNote(match[1] + (match[2] ?? ''))!;
  const rest = match[3].replace(/\s*\/\s*/g, '/');

  const slash = rest.indexOf('/');
  const name = slash < 0 ? rest : rest.slice(0, slash);
  const bassInput = slash < 0 ? undefined : rest.slice(slash + 1);
  const bass = bassInput === undefined ? undefined : normalizeNote(bassInput);
  if (bassInput !== undefined && bass === null) {
    return { error: `"${bassInput}" is not a valid bass note.` };
  }

  // Exact text first, then the name with a normalised bass, then the alias
  // spelled the way the suffix list does ('major' → '/Ab', 'minor' → 'm/Ab').
  const quality = QUALITY_ALIASES[name];
  const aliased =
    quality === 'major' ? (bass ? `/${bass}` : 'major') : quality === 'minor' ? (bass ? `m/${bass}` : 'minor') : undefined;
  const candidates = [rest, bass ? `${name}/${bass}` : name, aliased];
  const suffix = candidates.find((c): c is string => c !== undefined && suffixes.includes(c));
  if (!suffix) {
    return {
      error: `"${rest || 'major'}" is not a known suffix. Use one listed in the instrument's "suffixes", for example: ${suffixes.slice(0, 8).join(', ')}.`,
    };
  }
  return { key, suffix };
};

const splitList = (input: string) => input.split(/[\s,]+/).filter(Boolean);

/** "4,3,1,1,1,x" → [4, 3, 1, 1, 1, -1]. 'x' and '-1' both mean muted. */
export const parseFrets = (input: string, courses: number): number[] | { error: string } => {
  const parts = splitList(input);
  if (parts.length !== courses) {
    return { error: `Expected ${courses} frets, got ${parts.length}.` };
  }
  const frets: number[] = [];
  for (const part of parts) {
    const value = /^[xX]$/.test(part) ? -1 : Number(part);
    if (!Number.isInteger(value) || value < -1 || value > 24) {
      return { error: `"${part}" is not a fret (use x, 0 to 24).` };
    }
    frets.push(value);
  }
  return frets;
};

/** "3,2,1,1,1,0" → [3, 2, 1, 1, 1, 0]. 'T' is the thumb; 'x' or '-' mean no finger. */
export const parseFingers = (input: string, courses: number): Finger[] | { error: string } => {
  const parts = splitList(input);
  if (parts.length !== courses) {
    return { error: `Expected ${courses} fingers, got ${parts.length}.` };
  }
  const fingers: Finger[] = [];
  for (const part of parts) {
    if (/^[xX-]$/.test(part)) fingers.push(0);
    else if (/^[tT]$/.test(part)) fingers.push('T');
    else if (/^[0-4]$/.test(part)) fingers.push(Number(part) as Finger);
    else return { error: `"${part}" is not a finger (use 0-4 or T).` };
  }
  return fingers;
};

/** Frets where one finger (not the thumb) covers more than one course. */
export const deriveBarres = (frets: number[], fingers: Finger[]): number[] => {
  const counts = new Map<string, { fret: number; n: number }>();
  frets.forEach((fret, i) => {
    if (fret > 0 && fingers[i] !== 0 && fingers[i] !== 'T') {
      const key = `${fingers[i]}:${fret}`;
      counts.set(key, { fret, n: (counts.get(key)?.n ?? 0) + 1 });
    }
  });
  const barres = [...counts.values()].filter(({ n }) => n > 1).map(({ fret }) => fret);
  return [...new Set(barres)].sort((a, b) => a - b);
};

/**
 * The repository's convention, inferred from the existing data: a barre is
 * drawn as a capo when it sits on the lowest pressed fret and no string rings
 * open. A guess, so it is worth a glance after writing.
 */
export const deriveCapo = (frets: number[], barres: number[]): boolean => {
  const pressed = frets.filter((fret) => fret > 0);
  return (
    barres.length > 0 &&
    !frets.includes(0) &&
    barres.includes(Math.min(...pressed))
  );
};

/** Next free voicing number in a chord: one more than the highest used. */
export const nextVoicingNumber = (ids: string[]): number =>
  Math.max(0, ...ids.map((id) => Number(id.split('/').pop()) || 0)) + 1;
