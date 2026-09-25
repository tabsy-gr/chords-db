/**
 * Compares data/ with tombatossals/chords-db v0.6.0 (df06fa7), pinned in
 * test/fixtures/upstream-v0.6.0, and checks every difference against the
 * entries in data/changes.json. Renders UPSTREAM-DIFF.md.
 *
 * Voicings are matched by id: an upstream position's id is
 * <instrument>/<key dir>/<suffix slug>/<position number>, which is the id its
 * converted voicing kept.
 */
import fs from 'node:fs';
import path from 'node:path';
import { toChordDiagram } from '../src/diagram';
import type { FrettedInstrument, FrettedVoicing, KeyboardVoicing, Voicing } from '../src/types';
import { DATA_DIR, loadInstruments, ROOT, suffixSlug } from './data-source';

export type DiffKind =
  | 'added'
  | 'removed'
  | 'relabelled'
  | 'frets'
  | 'fingers'
  | 'barres'
  | 'capo'
  | 'rootless'
  | 'notes'
  | 'degrees'
  | 'order';

export interface Diff {
  id: string;
  kind: DiffKind;
  before: string;
  after: string;
}

export interface ChangeEntry {
  ids: string[];
  kinds?: DiffKind[];
  change: string;
  issue?: number;
  pr?: number;
  upstream?: string;
  reportedBy?: string;
}

interface V1Position {
  frets: (number | string)[];
  fingers: (number | string)[];
  baseFret?: number;
  barres?: number[];
  capo?: boolean;
}
type V1Chords = Record<string, { key: string; suffix: string; positions: V1Position[] }[]>;

const FIXTURES = path.join(ROOT, 'test', 'fixtures', 'upstream-v0.6.0');
/**
 * Instruments contributed through an upstream pull request never merged there
 * are compared with that PR's build instead of v0.6.0.
 */
const PR_FIXTURES: Record<string, string> = {
  cavaquinho: path.join(ROOT, 'test', 'fixtures', 'upstream-pr-43', 'cavaquinho.json'),
};
export const CHANGES_FILE = path.join(DATA_DIR, 'changes.json');
export const UPSTREAM_DIFF_FILE = path.join(ROOT, 'UPSTREAM-DIFF.md');

export const loadChanges = (): ChangeEntry[] =>
  JSON.parse(fs.readFileSync(CHANGES_FILE, 'utf8')).changes;

/** 'x32010': muted as x, frets above 9 in hex, as upstream wrote them. */
const chart = (frets: (number | string)[]) =>
  frets.map((f) => (typeof f === 'number' ? (f < 0 ? 'x' : f.toString(16)) : f)).join('');
const list = (values: unknown[] | undefined) => (values?.length ? values.join(' ') : '—');

interface Located {
  key: string;
  suffix: string;
  index: number;
}

/** Every difference between data/ and upstream, sorted by id. */
export const computeDiffs = (): Diff[] => {
  const diffs: Diff[] = [];
  const add = (id: string, kind: DiffKind, before: string, after: string) =>
    diffs.push({ id, kind, before, after });

  for (const { instrument, chords } of loadInstruments()) {
    // An instrument upstream didn't have starts from nothing: all its voicings are added.
    const fixture = PR_FIXTURES[instrument.id] ?? path.join(FIXTURES, `${instrument.id}.json`);
    const v1: V1Chords = fs.existsSync(fixture)
      ? JSON.parse(fs.readFileSync(fixture, 'utf8')).chords
      : {};

    const upstream = new Map<string, Located & { position: V1Position }>();
    for (const [dir, list] of Object.entries(v1)) {
      for (const chord of list) {
        chord.positions.forEach((position, index) => {
          const id = `${instrument.id}/${dir}/${suffixSlug(chord.suffix)}/${index + 1}`;
          upstream.set(id, { key: chord.key, suffix: chord.suffix, index, position });
        });
      }
    }

    const current = new Map<string, Located & { voicing: Voicing }>();
    for (const { chord } of chords) {
      chord.voicings.forEach((voicing, index) =>
        current.set(voicing.id, { key: chord.key, suffix: chord.suffix, index, voicing })
      );
    }

    for (const [id, was] of upstream) {
      const now = current.get(id);
      if (!now) {
        add(id, 'removed', `${was.key}${was.suffix} ${chart(was.position.frets)}`, '—');
        continue;
      }
      if (was.key !== now.key || was.suffix !== now.suffix) {
        add(id, 'relabelled', `${was.key}${was.suffix}`, `${now.key}${now.suffix}`);
      }

      if (instrument.kind === 'fretted') {
        const voicing = now.voicing as FrettedVoicing;
        const diagram = toChordDiagram(voicing, (instrument as FrettedInstrument).tunings.standard);
        const before = was.position;
        // Compare absolute frets (upstream published them relative to baseFret).
        const absolute = (frets: number[], base = 1) =>
          frets.map((f) => (base > 1 && f > 0 ? f + base - 1 : f));
        const wasFrets = absolute(before.frets as number[], before.baseFret);
        if (chart(wasFrets) !== chart(voicing.frets)) add(id, 'frets', chart(wasFrets), chart(voicing.frets));
        if (list(before.fingers) !== list(voicing.fingers)) {
          add(id, 'fingers', list(before.fingers), list(voicing.fingers));
        }
        const wasBarres = absolute(before.barres ?? [], before.baseFret);
        if (list(wasBarres) !== list(voicing.barres)) add(id, 'barres', list(wasBarres), list(voicing.barres));
        if (!!before.capo !== !!diagram.capo) add(id, 'capo', String(!!before.capo), String(!!diagram.capo));
      } else {
        const voicing = now.voicing as KeyboardVoicing;
        if (list(was.position.frets) !== list(voicing.notes)) {
          add(id, 'notes', list(was.position.frets), list(voicing.notes));
        }
        if (list(was.position.fingers) !== list(voicing.degrees)) {
          add(id, 'degrees', list(was.position.fingers), list(voicing.degrees));
        }
      }
      if (now.voicing.rootless) add(id, 'rootless', 'false', 'true');
    }

    // Reordering: compare the relative order of the upstream voicings still
    // in each chord. Voicings moving in or out alone doesn't reorder the rest.
    for (const { chord } of chords) {
      const kept = chord.voicings
        .map((v) => v.id)
        .filter((id) => {
          const was = upstream.get(id);
          return was && was.key === chord.key && was.suffix === chord.suffix;
        });
      const expected = [...kept].sort((a, b) => upstream.get(a)!.index - upstream.get(b)!.index);
      kept.forEach((id, rank) => {
        if (expected[rank] !== id) {
          add(id, 'order', `position ${upstream.get(id)!.index + 1}`, `position ${current.get(id)!.index + 1}`);
        }
      });
    }

    for (const [id, now] of current) {
      if (upstream.has(id)) continue;
      const shape =
        'frets' in now.voicing ? chart(now.voicing.frets) : list((now.voicing as KeyboardVoicing).notes);
      add(id, 'added', '—', `${now.key}${now.suffix} ${shape}`);
    }
  }

  return diffs.sort((a, b) => a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));
};

const matches = (pattern: string, id: string) =>
  pattern.endsWith('*') ? id.startsWith(pattern.slice(0, -1)) : pattern === id;

const covers = (entry: ChangeEntry, diff: Diff) =>
  entry.ids.some((p) => matches(p, diff.id)) && (!entry.kinds || entry.kinds.includes(diff.kind));

export interface Coverage {
  /** Differences no entry explains. */
  uncovered: Diff[];
  /** Entries (by index) that explain nothing, and literal ids that did not change. */
  stale: string[];
  /** The differences each entry explains, by entry index. */
  byEntry: Diff[][];
}

export const checkCoverage = (diffs: Diff[], entries: ChangeEntry[]): Coverage => {
  const byEntry = entries.map((entry) => diffs.filter((diff) => covers(entry, diff)));
  const uncovered = diffs.filter((diff) => !entries.some((entry) => covers(entry, diff)));
  const stale: string[] = [];
  entries.forEach((entry, i) => {
    if (!byEntry[i].length) stale.push(`entry ${i + 1} ("${entry.change.slice(0, 50)}…") covers nothing`);
    for (const id of entry.ids.filter((p) => !p.endsWith('*'))) {
      if (!byEntry[i].some((d) => d.id === id)) stale.push(`entry ${i + 1}: ${id} has no matching difference`);
    }
  });
  return { uncovered, stale, byEntry };
};

const REPO = 'https://github.com/tabsy-gr/chords-db';
const UP = 'https://github.com/tombatossals/chords-db';
const KINDS: DiffKind[] = [
  'added', 'removed', 'relabelled', 'frets', 'fingers', 'barres', 'capo', 'rootless', 'notes', 'degrees', 'order',
];

export const renderUpstreamDiff = (diffs: Diff[], entries: ChangeEntry[]): string => {
  const { byEntry } = checkCoverage(diffs, entries);
  const instruments = [...new Set(diffs.map((d) => d.id.split('/')[0]))].sort();
  const voicings = (kind: DiffKind, instrument: string) =>
    new Set(diffs.filter((d) => d.kind === kind && d.id.startsWith(`${instrument}/`)).map((d) => d.id)).size;

  const lines = [
    '# Differences from tombatossals/chords-db',
    '',
    'Every voicing that differs from the original database, [tombatossals/chords-db](' + UP + ')',
    'v0.6.0 (`df06fa7`), and why. The cavaquinho, which upstream never had, is compared with',
    'the dataset contributed in [tombatossals/chords-db#43](' + UP + '/pull/43). Generated by `npm run upstream-diff` from `data/` and',
    '`data/changes.json`; do not edit by hand. A test fails if any difference is not',
    'explained here.',
    '',
    'Voicings are matched by id: upstream position *n* of a chord became voicing',
    '`<instrument>/<key>/<suffix>/n`, and ids never change. For format changes (file',
    'layout, field names) see [MIGRATING-FROM-CHORDS-DB.md](./MIGRATING-FROM-CHORDS-DB.md).',
    '',
    '## Summary',
    '',
  ];

  if (!diffs.length) {
    lines.push('No voicing differs from upstream.', '');
  } else {
    lines.push(
      `| Change | ${instruments.join(' | ')} |`,
      `| --- | ${instruments.map(() => '---:').join(' | ')} |`,
      ...KINDS.filter((k) => diffs.some((d) => d.kind === k)).map(
        (k) => `| ${k} | ${instruments.map((i) => voicings(k, i)).join(' | ')} |`
      ),
      '',
      'Counts are voicings; one voicing can have several kinds of change.',
      ''
    );
  }

  lines.push('## Changes', '');
  entries.forEach((entry, i) => {
    const refs = [
      entry.issue ? `[#${entry.issue}](${REPO}/issues/${entry.issue})` : null,
      entry.pr ? `[#${entry.pr}](${REPO}/pull/${entry.pr})` : null,
      entry.upstream
        ? `upstream [${entry.upstream.replace('tombatossals/chords-db', '')}](${UP}/issues/${entry.upstream.split('#')[1]})`
        : null,
      entry.reportedBy ? `reported by [${entry.reportedBy}](https://github.com/${entry.reportedBy})` : null,
    ].filter(Boolean);
    const affected = byEntry[i];
    const count = new Set(affected.map((d) => d.id)).size;
    lines.push(`### ${i + 1}. ${entry.change}`, '');
    if (refs.length) lines.push(refs.join(' · '), '');
    const rows = affected.map((d) => `| \`${d.id}\` | ${d.kind} | \`${d.before}\` | \`${d.after}\` |`);
    const table = ['| Voicing | Change | Before | After |', '| --- | --- | --- | --- |', ...rows];
    if (count > 20) {
      lines.push('<details>', `<summary>${count} voicings</summary>`, '', ...table, '', '</details>', '');
    } else {
      lines.push(...table, '');
    }
  });

  return lines.join('\n');
};

// Run as a script: write UPSTREAM-DIFF.md, or fail if a difference is unexplained.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const diffs = computeDiffs();
  const entries = loadChanges();
  const { uncovered, stale } = checkCoverage(diffs, entries);
  if (uncovered.length || stale.length) {
    for (const d of uncovered) console.error(`unexplained: ${d.id} ${d.kind} ${d.before} -> ${d.after}`);
    for (const s of stale) console.error(`stale: ${s}`);
    process.exit(1);
  }
  fs.writeFileSync(UPSTREAM_DIFF_FILE, renderUpstreamDiff(diffs, entries));
  console.log(`${diffs.length} differences, all explained. Wrote UPSTREAM-DIFF.md`);
}
