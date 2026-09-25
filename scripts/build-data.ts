/**
 * Builds lib/ from data/: one lib/<instrument>.json per instrument (the
 * instrument, and its chords grouped by key with MIDI notes added) and
 * lib/instruments.json (an index).
 */
import fs from 'node:fs';
import path from 'node:path';
import { frettedMidi, keyboardMidi } from '../src/midi';
import type { Chord, FrettedVoicing, InstrumentIndex, KeyboardVoicing } from '../src/types';
import { loadInstruments, ROOT } from './data-source';

const LIB_DIR = path.join(ROOT, 'lib');
fs.rmSync(LIB_DIR, { recursive: true, force: true });
fs.mkdirSync(LIB_DIR);

const index: InstrumentIndex = {};

for (const { instrument, chords } of loadInstruments()) {
  const withMidi = (chord: Chord): Chord => ({
    ...chord,
    voicings: chord.voicings.map((voicing) => ({
      ...voicing,
      midi:
        instrument.kind === 'fretted'
          ? frettedMidi((voicing as FrettedVoicing).frets, instrument.tunings.standard)
          : keyboardMidi((voicing as KeyboardVoicing).notes),
    })),
  });

  // Suffixes missing from the instrument's list sort last, alphabetically.
  const rank = (suffix: string) => {
    const i = instrument.suffixes.indexOf(suffix);
    return i < 0 ? instrument.suffixes.length : i;
  };
  const byKey: Record<string, Chord[]> = Object.fromEntries(instrument.keys.map((key) => [key, []]));
  for (const { chord, file } of chords) {
    if (!byKey[chord.key]) throw new Error(`${file}: key ${chord.key} is not in ${instrument.id}'s keys`);
    byKey[chord.key].push(withMidi(chord));
  }
  for (const list of Object.values(byKey)) {
    list.sort((a, b) => rank(a.suffix) - rank(b.suffix) || a.suffix.localeCompare(b.suffix));
  }

  fs.writeFileSync(
    path.join(LIB_DIR, `${instrument.id}.json`),
    JSON.stringify({ instrument, chords: byKey })
  );
  index[instrument.id] = {
    name: instrument.name,
    kind: instrument.kind,
    chordCount: chords.length,
    voicingCount: chords.reduce((sum, { chord }) => sum + chord.voicings.length, 0),
  };
}

fs.writeFileSync(path.join(LIB_DIR, 'instruments.json'), JSON.stringify(index));
console.log(
  Object.entries(index)
    .map(([id, i]) => `${id}: ${i.chordCount} chords, ${i.voicingCount} voicings`)
    .join('\n')
);
