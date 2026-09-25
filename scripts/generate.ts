import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../src/tools';
import db from '../src/db';
import type { SourceChord, SourceInstrument } from '../src/types';

const libDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lib');

type Instrument = keyof typeof db;
const instruments = Object.keys(db) as Instrument[];

const createDirIfNeeded = () => fs.mkdirSync(libDir, { recursive: true });

const generateJSON = (instrument: Instrument) =>
  fs.writeFileSync(
    path.join(libDir, `${instrument}.json`),
    JSON.stringify(generate(db[instrument]))
  );

const getNumberOfPositions = (suffixes: SourceChord[]) =>
  suffixes.reduce((sum, suffix) => sum + suffix.positions.length, 0);

const getNumberOfChords = (chords: SourceInstrument['chords']) =>
  Object.keys(chords).reduce(
    (sum, key) => sum + getNumberOfPositions(chords[key]),
    0
  );

const generateIndex = () =>
  fs.writeFileSync(
    path.join(libDir, 'instruments.json'),
    JSON.stringify(
      Object.fromEntries(
        instruments.map((instrument) => [
          instrument,
          {
            ...db[instrument].main,
            numberOfChords: getNumberOfChords(db[instrument].chords),
          },
        ])
      )
    )
  );

if (process.argv[2] === 'json') {
  createDirIfNeeded();
  generateIndex();
  instruments.forEach(generateJSON);
} else {
  const all = Object.fromEntries(
    instruments.map((instrument) => [instrument, generate(db[instrument])])
  );
  console.log(JSON.stringify(all, null, 4));
}
