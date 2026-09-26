/**
 * Types for the schema v2 data. The JSON Schemas in schema/ are the source of
 * truth for the files under data/; these types mirror them.
 */

/** A note name without octave, e.g. 'C', 'F#', 'Bb'. */
export type NoteName = string;
/** A note with octave, e.g. 'E2'. */
export type Pitch = string;

/** 1 index … 4 little, 'T' thumb, 0 no finger. */
export type Finger = 0 | 1 | 2 | 3 | 4 | 'T';

export interface Source {
  type: 'upstream' | 'pull-request' | 'curated' | 'derived' | 'reference' | 'reference-dataset';
  ref?: string;
  id?: string;
}

export interface Verified {
  by: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface FrettedVoicing {
  /** Permanent: assigned once, never changed. */
  id: string;
  /** Absolute fret per course, lowest course first. -1 muted, 0 open. */
  frets: number[];
  fingers: Finger[];
  /** Absolute frets barred by one finger. */
  barres?: number[];
  capo?: true;
  /** Deliberately leaves out the root. */
  rootless?: true;
  sources: Source[];
  verified?: Verified;
}

export interface KeyboardVoicing {
  /** Permanent: assigned once, never changed. */
  id: string;
  /** Note names, lowest first. */
  notes: string[];
  /** Chord degree of each note, e.g. '1', 'b3', '#9'. */
  degrees?: string[];
  /** Deliberately leaves out the root. */
  rootless?: true;
  sources: Source[];
  verified?: Verified;
}

export type Voicing = FrettedVoicing | KeyboardVoicing;

export interface Chord<V extends Voicing = Voicing> {
  key: NoteName;
  suffix: string;
  voicings: V[];
}

interface InstrumentBase {
  id: string;
  name: string;
  /** Chord roots covered, in display order. */
  keys: NoteName[];
  /** Chord suffixes covered, in display order. */
  suffixes: string[];
}

export interface FrettedInstrument extends InstrumentBase {
  kind: 'fretted';
  /** Courses from lowest to highest; each lists the pitches of its strings. */
  tunings: Record<string, Pitch[][]>;
  /** False if the instrument comps above a separate bass line (no root-in-bass rule). */
  carriesBass?: boolean;
  maxFretSpan: number;
}

export interface KeyboardInstrument extends InstrumentBase {
  kind: 'keyboard';
  keyCount: number;
}

export type Instrument = FrettedInstrument | KeyboardInstrument;

/** A voicing as published in lib/: the source voicing plus its MIDI notes. */
export type Published<V extends Voicing> = V & {
  /** One MIDI note per sounding string (fretted) or per note (keyboard). */
  midi: number[];
};

/** The contents of lib/<instrument>.json. */
export interface InstrumentData<
  I extends Instrument = Instrument,
  V extends Voicing = I extends FrettedInstrument ? FrettedVoicing : KeyboardVoicing,
> {
  instrument: I;
  /** Chords grouped by key, in the instrument's key and suffix order. */
  chords: Record<NoteName, Chord<Published<V>>[]>;
}

/** The contents of lib/instruments.json. */
export type InstrumentIndex = Record<
  string,
  { name: string; kind: Instrument['kind']; chordCount: number; voicingCount: number }
>;

/** A chord degree, as used in data/qualities.json. */
export type Interval =
  | '1' | 'b2' | '2' | 'b3' | '3' | '4' | '#4' | 'b5' | '5' | '#5' | 'b6'
  | '6' | 'bb7' | 'b7' | '7' | 'b9' | '9' | '#9' | '11' | '#11' | 'b13' | '13';

/** A chord quality from data/qualities.json. */
export interface Quality {
  id: string;
  name: string;
  /** Every tone of the chord, root first. */
  intervals: Interval[];
  /** Tones a voicing may leave out; every other tone is required. */
  omittable?: Interval[];
  /** A voicing must contain at least one of these. */
  atLeastOneOf?: Interval[];
  /** Suffixes instruments use for this quality. */
  spellings: string[];
  source: {
    title: string;
    url: string;
    derivation: 'cited' | 'compositional';
    quote?: string;
    explanation?: string;
  };
}

/** A scale degree, as used in data/scales.json. Extends Interval with #2 and b4. */
export type ScaleInterval =
  | '1' | 'b2' | '2' | '#2' | 'b3' | '3' | '4' | 'b4' | '#4' | 'b5' | '5' | '#5'
  | 'b6' | '6' | 'bb7' | 'b7' | '7';

/** A family of scales: dromos is a Greek dromos; mode is a church mode. */
export type ScaleFamily = 'dromos' | 'major-minor' | 'mode' | 'pentatonic' | 'blues';

/** high: sources agree. low: sources disagree, or the makam has a neutral pitch. */
export type ScaleConfidence = 'high' | 'medium' | 'low';

export type ScaleCaveat = 'microtonal' | 'naming' | 'contested' | 'non-octave';

/** A scale from data/scales.json. */
export interface Scale {
  id: string;
  /** The scale's name in English, e.g. 'Ousak', 'harmonic minor'. */
  name: string;
  family: ScaleFamily;
  /** Every note of the ascending scale, tonic first. */
  intervals: ScaleInterval[];
  /** Notes of the descending form, where it differs from the ascending one. */
  descending?: ScaleInterval[];
  /** The names musicians use, per language: el Greek, tr Turkish, en English. */
  aliases: { el: string[]; tr?: string[]; en?: string[] };
  /** The root the scale is conventionally taught on ('D' for the dromos). */
  defaultTonic: string;
  /** tonal's name for the scale with the same intervals, if there is one. */
  tonalName?: string;
  /** How the scale is built: the lower and the upper tetrachord (or pentachord). */
  tetrachords?: [string, string];
  confidence: ScaleConfidence;
  caveats: ScaleCaveat[];
  /** Ids of scales with exactly the same intervals, in the same order. */
  sameNotesAs?: string[];
  sources: {
    title: string;
    url: string;
    derivation: 'cited' | 'compositional';
    quote?: string;
    explanation?: string;
  }[];
}
