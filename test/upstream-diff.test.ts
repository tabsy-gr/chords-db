/**
 * Every difference from upstream v0.6.0 must be explained in
 * data/changes.json, and UPSTREAM-DIFF.md must be current. An unchanged
 * voicing therefore reproduces upstream's position exactly.
 */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import guitarV1 from './fixtures/upstream-v0.6.0/guitar.json';
import pianoV1 from './fixtures/upstream-v0.6.0/piano.json';
import ukuleleV1 from './fixtures/upstream-v0.6.0/ukulele.json';
import { loadInstruments } from '../scripts/data-source';
import {
  checkCoverage,
  computeDiffs,
  loadChanges,
  renderUpstreamDiff,
  UPSTREAM_DIFF_FILE,
} from '../scripts/upstream-diff';

const diffs = computeDiffs();
const entries = loadChanges();

describe('differences from upstream', () => {
  const { uncovered, stale } = checkCoverage(diffs, entries);

  it('are all explained in data/changes.json', () => {
    expect(uncovered.map((d) => `${d.id} ${d.kind}: ${d.before} -> ${d.after}`)).toEqual([]);
  });

  it('are not over-explained (no entry covers nothing)', () => {
    expect(stale).toEqual([]);
  });

  it('are documented in an up-to-date UPSTREAM-DIFF.md (npm run upstream-diff)', () => {
    expect(fs.readFileSync(UPSTREAM_DIFF_FILE, 'utf8')).toBe(renderUpstreamDiff(diffs, entries));
  });
});

describe('instrument metadata', () => {
  const v1: Record<string, { keys: string[]; tunings: Record<string, string[]>; main: Record<string, unknown> }> = {
    guitar: guitarV1 as never,
    ukulele: ukuleleV1 as never,
    piano: pianoV1 as never,
  };

  it.each(loadInstruments().filter(({ instrument }) => instrument.id in v1))('$instrument.id keeps upstream keys and tuning', ({ instrument }) => {
    const before = v1[instrument.id];
    expect(instrument.keys).toEqual(before.keys);
    if (instrument.kind === 'fretted') {
      expect(instrument.tunings.standard.map((course) => course[0])).toEqual(before.tunings.standard);
      expect(instrument.maxFretSpan).toBe(before.main.fretsOnChord);
    } else {
      expect(instrument.keyCount).toBe(before.main.keys);
    }
  });
});
