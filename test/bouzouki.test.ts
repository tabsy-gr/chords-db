/**
 * The bouzouki voicings come from reference dataset A. Every voicing must be
 * one of its shapes, and every voicing that isn't a reference shape must say
 * where it comes from instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadInstruments, ROOT } from '../scripts/data-source';
import { parseSuffix } from '../src/theory';
import type { FrettedVoicing } from '../src/types';

describe.each(['cfad', 'dad'])('bouzouki-%s', (tuning) => {
  const source = loadInstruments().find((s) => s.instrument.id === `bouzouki-${tuning}`)!;
  const reference = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'test/fixtures/reference-a', `bouzouki-${tuning}.json`), 'utf8')
  ) as { chords: { key: string; quality: string; voicings: number[][] }[] };

  it('only uses shapes from the reference dataset for voicings that cite it', () => {
    const shapes = new Set(
      reference.chords.flatMap((c) => c.voicings.map((f) => `${c.key} ${c.quality} ${f.join(',')}`))
    );
    const untraced = source.chords.flatMap(({ chord }) =>
      (chord.voicings as FrettedVoicing[])
        .filter((v) => v.sources.some((s) => s.type === 'reference-dataset' && s.id === 'ref-a'))
        .filter((v) => !shapes.has(`${chord.key} ${parseSuffix(chord.suffix)!.quality.id} ${v.frets.join(',')}`))
        .map((v) => v.id)
    );
    expect(untraced).toEqual([]);
  });

  it('covers the core chords in every key', () => {
    // Three courses can't hold a full 6, m6 or 9 chord, and on the trichordo the
    // reference's augmented triads stretch five frets in most keys (the limit is four).
    const core = ['major', 'minor', '7', 'm7', 'maj7', 'dim', 'sus2', 'sus4'].concat(
      tuning === 'cfad' ? ['aug', '6', 'm6', '9'] : []
    );
    const missing = source.instrument.keys.flatMap((key) =>
      core.filter((suffix) => !source.chords.some(({ chord }) => chord.key === key && chord.suffix === suffix)).map((s) => `${key}${s}`)
    );
    expect(missing).toEqual([]);
  });
});
