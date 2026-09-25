import notationJson from '../data/notation.json';
import { notePitchClass, parseSuffix, qualities } from './theory';
import type { Chord, Instrument, InstrumentData, Quality, Voicing } from './types';

interface Replacement {
  from: string;
  to: string;
}
const notation = notationJson as { accidentals: Replacement[]; qualitySymbols: Replacement[] };

const replaceAll = (text: string, replacements: Replacement[]) =>
  replacements.reduce((out, { from, to }) => out.split(from).join(to), text);

export interface ParsedChordSymbol {
  /** The root as written, with ASCII accidentals ('A#', 'Bb'). */
  root: string;
  quality: Quality;
  /**
   * The suffix as the database spells it: the quality's canonical spelling
   * ('minor', '7#9'), or for a slash chord the database's slash form ('/E',
   * 'm/G', '7/F#').
   */
  suffix: string;
  /** The bass of a slash chord, with ASCII accidentals; null otherwise. */
  bass: string | null;
}

/** The quality part of a slash suffix: '' for major, 'm' for minor. */
const slashPrefix = (quality: Quality) =>
  quality.id === 'major' ? '' : quality.id === 'minor' ? 'm' : quality.spellings[0];

/**
 * Parses a chord symbol ('CΔ7', 'A#m7', 'F♯ø', 'D/F#', 'C6/9') into its root,
 * quality, database suffix and slash bass. Returns null if it has no root or
 * no known quality.
 *
 * Alternate symbols (ø, Δ, °, +) are only read after a root, so the Greek
 * letter Δ in free text is never taken for a chord. A 'b' right after the root
 * is its flat: 'Cb5' is C-flat's power chord, which is why no canonical suffix
 * starts with 'b'.
 */
export const parseChordSymbol = (symbol: string): ParsedChordSymbol | null => {
  const text = replaceAll(symbol.trim(), notation.accidentals);
  const slash = /\/([A-G][#b]?)$/.exec(text);
  const core = slash ? text.slice(0, slash.index) : text;
  const match = /^([A-G][#b]?)(.*)$/.exec(core);
  if (!match) return null;
  const [, root, rawQuality] = match;
  const spelled = replaceAll(rawQuality, notation.qualitySymbols);
  const parsed = parseSuffix(spelled === '' ? 'major' : spelled);
  if (!parsed || parsed.bass) return null;
  const bass = slash ? slash[1] : null;
  const quality = parsed.quality;
  return {
    root,
    quality,
    suffix: bass ? `${slashPrefix(quality)}/${bass}` : quality.spellings[0],
    bass,
  };
};

/**
 * Finds a chord in an instrument's data by symbol, whatever its enharmonic
 * spelling: 'A#m7' finds Bbm7 when the instrument lists B♭, and 'D/Gb' finds
 * D/F#. Returns null if the instrument has no such chord.
 */
export const findChord = <I extends Instrument, V extends Voicing>(
  data: { instrument: I; chords: Record<string, Chord<V>[]> } | InstrumentData,
  symbol: string
): Chord<V> | null => {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  const rootPc = notePitchClass(parsed.root);
  const key = data.instrument.keys.find((k) => notePitchClass(k) === rootPc);
  if (!key) return null;
  const chords = (data.chords[key] ?? []) as Chord<V>[];
  const exact = chords.find((c) => c.suffix === parsed.suffix);
  if (exact || !parsed.bass) return exact ?? null;
  const bassPc = notePitchClass(parsed.bass);
  return (
    chords.find((c) => {
      const other = parseSuffix(c.suffix);
      return other?.quality.id === parsed.quality.id && other.bass && notePitchClass(other.bass) === bassPc;
    }) ?? null
  );
};

/**
 * Every quality spelling a chord symbol may use, alternate symbols included,
 * longest first so a regex alternation prefers 'maj7' to 'm'. For building
 * chord-symbol matchers (e.g. finding chords in lyrics).
 */
export const qualityInputs = (): string[] =>
  [
    ...new Set([
      ...qualities.flatMap((q) => q.spellings),
      ...notation.qualitySymbols.map((s) => s.from),
    ]),
  ].sort((a, b) => b.length - a.length || a.localeCompare(b));

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * A regular-expression source matching one chord symbol: a root, an optional
 * quality from {@link qualityInputs} and an optional slash bass. Add your own
 * boundaries, e.g. new RegExp(`(?<![\\w#])(${chordSymbolSource()})(?![\\w#])`).
 */
export const chordSymbolSource = (): string => {
  const accidental = '(?:#|b|♯|♭)?';
  return `[A-G]${accidental}(?:${qualityInputs().map(escape).join('|')})?(?:/[A-G]${accidental})?`;
};
