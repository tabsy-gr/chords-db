/**
 * Types for the source database (src/db) and the generated JSON (lib/).
 *
 * These describe the schema inherited from tombatossals/chords-db. It is
 * replaced by schema v2 in a later phase; see MIGRATING-FROM-CHORDS-DB.md.
 */

/** A fret/finger sequence: either a hex string ('x32010') or an array of numbers. */
export type StringSequence = string | number[];

export interface FrettedSourcePosition {
  /** One entry per string; 'x' / -1 is muted, 0 is open. */
  frets: StringSequence;
  fingers?: StringSequence;
  barres?: number | number[];
  capo?: boolean;
}

export interface PianoSourcePosition {
  /** Note names, e.g. ['C', 'E', 'G'] or ['C4', 'E4']. */
  frets: string[];
  /** One finger per note, as digit strings. */
  fingers?: string[];
}

export type SourcePosition = FrettedSourcePosition | PianoSourcePosition;

export interface SourceChord<P extends SourcePosition = SourcePosition> {
  key: string;
  suffix: string;
  positions: P[];
}

export interface InstrumentMain {
  name: string;
  /** Fretted instruments only. */
  strings?: number;
  /** Piano only: number of keys. */
  keys?: number;
  /** Maximum fret span of a voicing; null for piano. */
  fretsOnChord: number | null;
  numberOfChords?: number;
}

export interface SourceInstrument<P extends SourcePosition = SourcePosition> {
  main: InstrumentMain;
  tunings: Record<string, string[]>;
  keys: string[];
  suffixes: string[];
  chords: Record<string, SourceChord<P>[]>;
}

export type FrettedInstrument = SourceInstrument<FrettedSourcePosition>;
export type PianoInstrument = SourceInstrument<PianoSourcePosition>;
