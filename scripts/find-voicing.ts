/**
 * Checks whether a guitar voicing is already in the database and, if not,
 * validates it and optionally adds it.
 *
 *   npm run find-voicing
 *       prompts for the chord, frets and fingers, and offers to add the voicing
 *   npm run find-voicing -- --chord "Ab major" --frets 4,3,1,1,1,x --fingers 3,2,1,1,1,0 [--write]
 *       the same check non-interactively (in PowerShell write '--' in quotes)
 *
 * Nothing on disk changes unless a voicing is added. After adding, run
 * `npm run build:data` and `npm run validate` to refresh the generated files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { compareByPlayability } from '../src/playability';
import type { Chord, FrettedInstrument, FrettedVoicing } from '../src/types';
import { validateVoicing } from '../src/validate';
import { DATA_DIR, keyDir, loadInstruments, ROOT, suffixSlug, type ChordFile } from './data-source';
import { formatJson } from './format-json';
import {
  deriveBarres,
  deriveCapo,
  nextVoicingNumber,
  parseChordName,
  parseFingers,
  parseFrets,
  type ChordName,
} from './voicing-lookup';

const INSTRUMENT = 'guitar';

const source = loadInstruments().find((s) => s.instrument.id === INSTRUMENT);
if (!source || source.instrument.kind !== 'fretted') {
  console.error(`No fretted instrument "${INSTRUMENT}".`);
  process.exit(1);
}
const instrument = source.instrument as FrettedInstrument;
const courses = instrument.tunings.standard.length;

interface Candidate extends ChordName {
  frets: number[];
  fingers: FrettedVoicing['fingers'];
}

interface Addition {
  voicing: FrettedVoicing;
  file: string;
}

interface Outcome {
  status: 'exists' | 'different-fingers' | 'invalid' | 'new';
  notes: string[];
  addition?: Addition;
}

const sameFrets = (a: number[], b: number[]) => a.join() === b.join();
const findChord = (key: string, suffix: string): ChordFile | undefined =>
  source.chords.find(({ chord }) => chord.key === key && chord.suffix === suffix);

/** Looks the candidate up and, if it is new, validates it and builds the voicing to add. */
const check = ({ key, suffix, frets, fingers }: Candidate): Outcome => {
  const label = `${key} ${suffix}`;
  const notes: string[] = [];

  // The same shape filed under another chord (e.g. an Am7 shape that is also C6).
  for (const { chord } of source.chords) {
    if (chord.key === key && chord.suffix === suffix) continue;
    for (const v of chord.voicings as FrettedVoicing[]) {
      if (sameFrets(v.frets, frets)) {
        notes.push(`Note: these frets are also listed under ${chord.key} ${chord.suffix} (${v.id}).`);
      }
    }
  }

  const existing = findChord(key, suffix);
  const match = (existing?.chord.voicings as FrettedVoicing[] | undefined)?.find((v) =>
    sameFrets(v.frets, frets)
  );
  if (match && existing) {
    if (match.fingers.join() === fingers.join()) {
      notes.push(`Already exists: ${label} is ${match.id} (${existing.file}).`);
      return { status: 'exists', notes };
    }
    notes.push(
      `Frets already exist as ${match.id} (${existing.file}) with different fingers:\n` +
        `  existing: ${JSON.stringify(match.fingers)}\n  yours:    ${JSON.stringify(fingers)}`
    );
    return { status: 'different-fingers', notes };
  }

  const barres = deriveBarres(frets, fingers);
  const capo = deriveCapo(frets, barres);
  const file = path.join(DATA_DIR, INSTRUMENT, 'chords', keyDir(key), `${suffixSlug(suffix)}.json`);
  const voicing: FrettedVoicing = {
    id: `${INSTRUMENT}/${keyDir(key)}/${suffixSlug(suffix)}/${nextVoicingNumber(
      (existing?.chord.voicings ?? []).map((v) => v.id)
    )}`,
    frets,
    fingers,
    ...(barres.length ? { barres } : {}),
    ...(capo ? { capo: true as const } : {}),
    sources: [{ type: 'curated' }],
  };

  const result = validateVoicing(instrument, { key, suffix }, voicing);
  for (const issue of result.issues) notes.push(`${issue.severity}: ${issue.rule}: ${issue.message}`);
  if (!result.ok) {
    notes.push(`Not added: the voicing is not a valid ${label}.`);
    return { status: 'invalid', notes };
  }
  notes.push(
    `Not found: ${label} has no voicing with these frets. Would be ${voicing.id} in ${path.relative(ROOT, file)}:`,
    formatJson(voicing).trimEnd()
  );
  return { status: 'new', notes, addition: { voicing, file } };
};

/** Adds the voicing to its chord file, creating the file if needed. */
const add = ({ voicing, file }: Addition, { key, suffix }: ChordName) => {
  const compare = compareByPlayability(instrument.tunings.standard);
  const written: Chord & { $schema?: string } = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : { $schema: '../../../../schema/chord.schema.json', key, suffix, voicings: [] };
  const list = written.voicings as FrettedVoicing[];
  // Insert before the first voicing that is harder, so existing order is untouched.
  const at = list.findIndex((v) => compare(voicing, v) < 0);
  list.splice(at < 0 ? list.length : at, 0, voicing);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, formatJson(written));
  console.log(
    `Added ${voicing.id} to ${path.relative(ROOT, file)}.\n` +
      'Next: add an entry to data/changes.json for it, then run: npm run build:data && npm run validate && npm run upstream-diff'
  );
};

const isFailure = (value: unknown): value is { error: string } =>
  !!value && typeof value === 'object' && 'error' in value;

const interactive = async () => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  // Reading through the line iterator (not rl.question) also works with piped input.
  const lines = rl[Symbol.asyncIterator]();
  const read = async (prompt: string) => {
    process.stdout.write(prompt);
    const next = await lines.next();
    return next.done ? '' : String(next.value);
  };
  const isYes = (answer: string, fallback: boolean) =>
    answer.trim() === '' ? fallback : /^y/i.test(answer.trim());
  // Asks until the answer parses; an empty answer or 'q' quits (null).
  const ask = async <T>(prompt: string, parse: (answer: string) => T | { error: string }) => {
    for (;;) {
      const answer = (await read(prompt)).trim();
      if (answer === '' || /^q(uit)?$/i.test(answer)) return null;
      const parsed = parse(answer);
      if (!isFailure(parsed)) return parsed;
      console.log(`  ${parsed.error}`);
    }
  };

  console.log(`Check a ${instrument.name} voicing. Press Enter on an empty line or type q to quit.`);
  console.log(`Frets: ${courses} values, lowest string first, x for muted (e.g. 4,3,1,1,1,x).`);
  console.log('Fingers: 0 none, 1-4 index to little, T thumb (e.g. 3,2,1,1,1,0).\n');
  try {
    for (;;) {
      const name = await ask('Chord (e.g. Ab major, Cm7, A/G#): ', (a) => parseChordName(a, instrument.suffixes));
      if (!name) return;
      const frets = await ask('Frets: ', (a) => parseFrets(a, courses));
      if (!frets) return;
      const fingers = await ask('Fingers: ', (a) => parseFingers(a, courses));
      if (!fingers) return;

      const outcome = check({ ...name, frets, fingers });
      console.log(`\n${outcome.notes.join('\n')}\n`);
      if (outcome.addition && isYes(await read('Add it? (y/N) '), false)) {
        add(outcome.addition, name);
      }
      if (!isYes(await read('\nCheck another? (Y/n) '), true)) return;
      console.log();
    }
  } finally {
    rl.close();
  }
};

const { values } = parseArgs({
  options: {
    chord: { type: 'string' },
    frets: { type: 'string' },
    fingers: { type: 'string' },
    write: { type: 'boolean', default: false },
  },
});

if (!values.chord && !values.frets && !values.fingers) {
  await interactive();
} else {
  const fail = (message: string): never => {
    console.error(message);
    process.exit(1);
  };
  if (!values.chord || !values.frets || !values.fingers) {
    fail(
      'Usage: npm run find-voicing -- --chord "Ab major" --frets 4,3,1,1,1,x --fingers 3,2,1,1,1,0 [--write]\n' +
        'Or run npm run find-voicing with no arguments to be prompted.'
    );
  }
  const name = parseChordName(values.chord!, instrument.suffixes);
  if (isFailure(name)) fail(name.error);
  const frets = parseFrets(values.frets!, courses);
  if (isFailure(frets)) fail(frets.error);
  const fingers = parseFingers(values.fingers!, courses);
  if (isFailure(fingers)) fail(fingers.error);

  const outcome = check({ ...(name as ChordName), frets: frets as number[], fingers: fingers as Candidate['fingers'] });
  console.log(outcome.notes.join('\n'));
  if (outcome.status === 'invalid') process.exit(1);
  if (outcome.addition) {
    if (values.write) add(outcome.addition, name as ChordName);
    else console.log('Re-run with --write to add it.');
  }
}
