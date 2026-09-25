/**
 * Generates the ukulele in D tuning (A4 D4 F#4 B4) from the ukulele in
 * standard tuning (G4 C4 E4 A4): D tuning is every string a whole tone higher,
 * so the same shape plays a chord a whole tone higher. The approach is from
 * tombatossals/chords-db#32 (Henry); applying it to the validated ukulele data
 * keeps both instruments in step. A test checks data/ukulele-d matches this.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { FrettedInstrument, FrettedVoicing } from '../src/types';
import { DATA_DIR, keyDir, loadInstruments, suffixSlug } from './data-source';
import { formatJson } from './format-json';

const SEMITONES = 2;

export interface GeneratedFile {
  file: string;
  json: { $schema: string; key: string; suffix: string; voicings: FrettedVoicing[] };
}

export const generateUkuleleD = () => {
  const source = loadInstruments().find((s) => s.instrument.id === 'ukulele')!;
  const ukulele = source.instrument as FrettedInstrument;
  const keys = ukulele.keys;
  // The ukulele's keys are the 12 pitch classes in order, so moving up two
  // semitones maps each key onto another key of the same list.
  const transpose = (key: string) => keys[(keys.indexOf(key) + SEMITONES) % keys.length];
  const transposeDir = (dir: string) =>
    keyDir(transpose(keys.find((k) => keyDir(k) === dir)!));

  const instrument: FrettedInstrument = {
    id: 'ukulele-d',
    name: 'Ukulele (D tuning)',
    kind: 'fretted',
    tunings: { standard: [['A4'], ['D4'], ['F#4'], ['B4']] },
    maxFretSpan: ukulele.maxFretSpan,
    keys,
    suffixes: ukulele.suffixes,
  };

  const files: GeneratedFile[] = source.chords.map(({ chord }) => {
    const key = transpose(chord.key);
    return {
      file: path.join(DATA_DIR, 'ukulele-d', 'chords', keyDir(key), `${suffixSlug(chord.suffix)}.json`),
      json: {
        $schema: '../../../../schema/chord.schema.json',
        key,
        suffix: chord.suffix,
        voicings: (chord.voicings as FrettedVoicing[]).map((v) => {
          const [, dir, slug, n] = v.id.split('/');
          const { id: _, sources: __, verified: ___, ...shape } = v;
          return {
            id: `ukulele-d/${transposeDir(dir)}/${slug}/${n}`,
            ...shape,
            sources: [{ type: 'derived' as const, ref: v.id }],
          };
        }),
      },
    };
  });
  return { instrument, files };
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const { instrument, files } = generateUkuleleD();
  const dir = path.join(DATA_DIR, 'ukulele-d');
  fs.rmSync(dir, { recursive: true, force: true });
  for (const { file, json } of files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, formatJson(json));
  }
  fs.writeFileSync(
    path.join(dir, 'instrument.json'),
    formatJson({ $schema: '../../schema/instrument.schema.json', ...instrument })
  );
  console.log(`Wrote ${files.length} ukulele-d chords`);
}
