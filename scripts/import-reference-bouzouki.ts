/**
 * Builds the bouzouki voicings from reference dataset A
 * (test/fixtures/reference-a, used with permission; the source is not named
 * by agreement). For each chord it keeps the reference shapes that pass the
 * validator once fingered, easiest first, up to MAX_PER_CHORD. Voicings are
 * written unverified: a verifier listed in VERIFIERS.md signs them off with
 * `npm run verify`.
 *
 *   npx tsx scripts/import-reference-bouzouki.ts
 *
 * Re-running keeps existing voicings (and their verified stamps) and only adds
 * shapes that aren't there yet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { compareByPlayability } from '../src/playability';
import { qualities } from '../src/theory';
import type { Finger, FrettedInstrument, FrettedVoicing } from '../src/types';
import { validateVoicing } from '../src/validate';
import { DATA_DIR, ROOT, keyDir, suffixSlug } from './data-source';
import { formatJson } from './format-json';

const MAX_PER_CHORD = 6;
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const INSTRUMENTS: Record<string, Omit<FrettedInstrument, 'keys' | 'suffixes'>> = {
  cfad: {
    id: 'bouzouki-cfad',
    name: 'Bouzouki (tetrachordo, C F A D)',
    kind: 'fretted',
    tunings: { standard: [['C3', 'C4'], ['F3', 'F4'], ['A3', 'A3'], ['D4', 'D4']] },
    carriesBass: false,
    maxFretSpan: 4,
  },
  dad: {
    id: 'bouzouki-dad',
    name: 'Bouzouki (trichordo, D A D)',
    kind: 'fretted',
    tunings: { standard: [['D3', 'D4'], ['A3', 'A3'], ['D4', 'D4']] },
    carriesBass: false,
    maxFretSpan: 4,
  },
};

const OPTIONS: Finger[] = [1, 2, 3, 4];

/** The simplest valid fingering for fixed frets: fewest fingers, then fewest barres. */
function finger(instrument: FrettedInstrument, chord: { key: string; suffix: string }, frets: number[]) {
  const pressed = frets.flatMap((f, c) => (f > 0 ? [c] : []));
  let best: FrettedVoicing | null = null;
  let bestScore = Infinity;
  for (let n = 0; n < OPTIONS.length ** pressed.length; n++) {
    const fingers: Finger[] = frets.map(() => 0);
    let k = n;
    for (const c of pressed) {
      fingers[c] = OPTIONS[k % OPTIONS.length];
      k = Math.floor(k / OPTIONS.length);
    }
    const barres = [
      ...new Set(
        pressed
          .filter((c) => pressed.some((d) => d !== c && fingers[d] === fingers[c] && frets[d] === frets[c]))
          .map((c) => frets[c])
      ),
    ].sort((a, b) => a - b);
    const voicing: FrettedVoicing = {
      id: 'x/x/x/1',
      frets,
      fingers,
      ...(barres.length ? { barres } : {}),
      sources: [{ type: 'reference-dataset', id: 'ref-a' }],
    };
    if (validateVoicing(instrument, chord, voicing).issues.length) continue;
    const score = new Set(fingers.filter((f) => f !== 0)).size + barres.length * 0.5;
    if (score < bestScore) {
      bestScore = score;
      best = voicing;
    }
  }
  return best;
}

for (const [tuning, base] of Object.entries(INSTRUMENTS)) {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'test/fixtures/reference-a', `bouzouki-${tuning}.json`), 'utf8')
  ) as { chords: { key: string; quality: string; voicings: number[][] }[] };
  const covered = qualities.filter((q) => fixture.chords.some((c) => c.quality === q.id));
  const instrument: FrettedInstrument = { ...base, keys: KEYS, suffixes: [] };
  const dir = path.join(DATA_DIR, instrument.id);
  const suffixes = new Set<string>();

  for (const entry of fixture.chords) {
    const quality = covered.find((q) => q.id === entry.quality)!;
    const suffix = quality.spellings[0];
    const chord = { key: entry.key, suffix };
    const file = path.join(dir, 'chords', keyDir(entry.key), `${suffixSlug(suffix)}.json`);
    const existing: FrettedVoicing[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).voicings : [];
    const have = new Set(existing.map((v) => v.frets.join(',')));
    const candidates = entry.voicings
      .filter((frets) => !have.has(frets.join(',')))
      .map((frets) => finger(instrument, chord, frets))
      .filter((v): v is FrettedVoicing => v !== null)
      .sort(compareByPlayability(instrument.tunings.standard));
    const room = Math.max(0, MAX_PER_CHORD - existing.length);
    let next = existing.reduce((n, v) => Math.max(n, Number(v.id.split('/').pop())), 0);
    const added = candidates.slice(0, room).map((v) => ({
      ...v,
      id: `${instrument.id}/${keyDir(entry.key)}/${suffixSlug(suffix)}/${++next}`,
    }));
    const voicings = [...existing, ...added].sort(compareByPlayability(instrument.tunings.standard));
    if (!voicings.length) continue;
    suffixes.add(suffix);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, formatJson({ $schema: '../../../../schema/chord.schema.json', ...chord, voicings }));
  }

  const ordered = covered.map((q) => q.spellings[0]).filter((s) => suffixes.has(s));
  fs.writeFileSync(
    path.join(dir, 'instrument.json'),
    formatJson({ $schema: '../../schema/instrument.schema.json', ...instrument, suffixes: ordered })
  );
  console.log(instrument.id, 'suffixes:', ordered.join(' '));
}
