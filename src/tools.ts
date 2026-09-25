import type {
  FrettedSourcePosition,
  PianoSourcePosition,
  SourceInstrument,
  SourcePosition,
  StringSequence,
} from './types';

export const strChord2array = (str: string): number[] =>
  str
    .split('')
    .map((char) => (char.toLowerCase() === 'x' ? -1 : parseInt(char, 16)));

export const processString = (strings: StringSequence): number[] =>
  Array.isArray(strings) ? strings : strChord2array(strings);

const processbaseFret = (frets: number[]): number =>
  Math.max(...frets) > 4 ? Math.min(...frets.filter((f) => f > 0)) : 1;

const processBarres = (
  barres: number | number[] | undefined,
  baseFret: number
): number[] =>
  barres
    ? (Array.isArray(barres) ? barres : [barres]).map((barre) =>
        baseFret > 1 ? barre - baseFret + 1 : barre
      )
    : [];

const processFrets = (frets: number[], baseFret: number): number[] =>
  frets.map((fret) =>
    baseFret > 1 ? (fret > 0 ? fret - baseFret + 1 : fret) : fret
  );

const processFingers = (fingers: StringSequence | undefined): number[] =>
  fingers ? processString(fingers) : [];

// Mutates `position` in place and relies on key insertion order: the generated
// JSON must stay byte-identical to the upstream build (see scripts/generate.ts).
const processPosition = (
  position: SourcePosition,
  tuning: string[],
  isPiano: boolean
): void => {
  if (isPiano) {
    Object.assign(position, {
      midi: notes2midi((position as PianoSourcePosition).frets),
    });
  } else {
    const fretted = position as FrettedSourcePosition;
    const frets = processString(fretted.frets);
    const baseFret = processbaseFret(frets);

    Object.assign(position, {
      baseFret: processbaseFret(frets),
      barres: processBarres(fretted.barres, baseFret),
      fingers: processFingers(fretted.fingers),
      frets: processFrets(frets, baseFret),
      midi: chord2midi(frets, tuning),
    });
  }
};

export const unique = <T>(arr: T[]): T[] =>
  arr.filter((elem, pos, a) => a.indexOf(elem) === pos);

export const numberOfBarres = (str: string): number =>
  unique(str.split(''))
    .map((chr) =>
      str.match(new RegExp(chr, 'gi')) &&
      parseInt(chr, 10) > 0 &&
      str.match(new RegExp(chr, 'gi'))!.length > 1
        ? 1
        : 0
    )
    .reduce<number>((last, actual) => actual + last, 0);

const processPositions = (
  positions: SourcePosition[],
  tuning: string[],
  isPiano: boolean
) => positions.forEach((position) => processPosition(position, tuning, isPiano));

const processChord = (
  suffixes: SourceInstrument['chords'][string],
  tuning: string[],
  isPiano: boolean
) =>
  suffixes.map((suffix) => {
    processPositions(suffix.positions, tuning, isPiano);
    return suffix;
  });

const processChords = (
  chords: SourceInstrument['chords'],
  tuning: string[],
  isPiano: boolean
) =>
  Object.fromEntries(
    Object.keys(chords).map((chord) => [
      chord,
      processChord(chords[chord], tuning, isPiano),
    ])
  );

export const generate = (instrument: SourceInstrument, tuning = 'standard') =>
  Object.assign(instrument, {
    chords: processChords(
      instrument.chords,
      instrument.tunings[tuning],
      instrument.main.name === 'piano'
    ),
  });

const midiNumbers = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

const midiNote = (note: string): number => {
  const lastChar = note.slice(-1);
  const hasOctave = !isNaN(parseInt(lastChar, 10));
  const name = (hasOctave ? note.slice(0, -1) : note).replace('sharp', '#');
  const octave = hasOctave ? parseInt(lastChar, 10) : 4; // defaults to the 4th octave
  const index = midiNumbers.indexOf(name);
  return index < 0 ? -1 : (octave + 1) * 12 + index;
};

const string2midi = (fret: number, string: number, tuning: string[]): number =>
  fret >= 0 ? midiNote(tuning[string]) + fret : -1;

export const chord2midi = (frets: number[], tuning: string[]): number[] =>
  frets
    .map((fret, string) => string2midi(fret, string, tuning))
    .filter((note) => note > 0);

export const notes2midi = (notes: string[]): number[] =>
  notes.map((note) => midiNote(note)).filter((note) => note > 0);

export const getNoteFromMidiNumber = (number: number): string =>
  midiNumbers[number % 12];
