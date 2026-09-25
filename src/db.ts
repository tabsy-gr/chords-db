import type { FrettedInstrument, PianoInstrument } from './types';
// The instrument databases are still the upstream ES-module .js files; they
// move to JSON + JSON Schema in schema v2 (see MIGRATING-FROM-CHORDS-DB.md).
import guitar from './db/guitar/index.js';
import ukulele from './db/ukulele/index.js';
import piano from './db/piano/index.js';

const db = {
  guitar: guitar as FrettedInstrument,
  ukulele: ukulele as FrettedInstrument,
  piano: piano as PianoInstrument,
};

export default db;
