/**
 * Reads the source data under data/. Used by the build and the tests; not
 * part of the published package.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Chord, Instrument } from '../src/types';

export const ROOT = path.join(import.meta.dirname, '..');
export const DATA_DIR = path.join(ROOT, 'data');

/** Directory name for a key: '#' is spelled 'sharp' ('C#' → 'Csharp'). */
export const keyDir = (key: string) => key.replace('#', 'sharp');
/** File name (without .json) for a suffix: '#' → 'sharp', '/' → '_'. */
export const suffixSlug = (suffix: string) => suffix.replace(/#/g, 'sharp').replace(/\//g, '_');

/** data/qualities.json, raw, for formatting and schema checks. */
export const QUALITIES_FILE = path.join(DATA_DIR, 'qualities.json');
export const loadQualitiesFile = () => ({
  file: path.relative(ROOT, QUALITIES_FILE),
  text: fs.readFileSync(QUALITIES_FILE, 'utf8'),
});

/** data/changes.json, raw, for formatting and schema checks. */
export const loadChangesFile = () => {
  const file = path.join(DATA_DIR, 'changes.json');
  return { file: path.relative(ROOT, file), text: fs.readFileSync(file, 'utf8') };
};

export interface ChordFile {
  /** Path relative to the repository root. */
  file: string;
  /** Raw file contents. */
  text: string;
  chord: Chord;
}

export interface InstrumentSource {
  dir: string;
  file: string;
  text: string;
  instrument: Instrument;
  chords: ChordFile[];
}

const readJson = (file: string) => {
  const text = fs.readFileSync(file, 'utf8');
  return { text, json: JSON.parse(text) };
};

const stripSchema = <T extends object>(value: T): T => {
  const { $schema: _, ...rest } = value as T & { $schema?: string };
  return rest as T;
};

export const loadInstruments = (): InstrumentSource[] =>
  fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((id) => {
      const dir = path.join(DATA_DIR, id);
      const instrumentFile = path.join(dir, 'instrument.json');
      const { text, json } = readJson(instrumentFile);
      const chordsDir = path.join(dir, 'chords');
      const chords = fs
        .readdirSync(chordsDir, { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((relative) => {
          const file = path.join(chordsDir, relative);
          const { text, json } = readJson(file);
          return { file: path.relative(ROOT, file), text, chord: stripSchema(json) as Chord };
        });
      return {
        dir: path.relative(ROOT, dir),
        file: path.relative(ROOT, instrumentFile),
        text,
        instrument: stripSchema(json) as Instrument,
        chords,
      };
    });
