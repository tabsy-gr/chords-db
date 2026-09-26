/**
 * The scale table (data/scales.json) is the ground truth for the app's scale
 * pages. Each formula cites a source; this suite checks the table is
 * internally consistent and cross-checks the tonal-mapped scales against
 * tonal, an independent music-theory library. The chromas of the custom
 * scales (no tonal match) are pinned to the ones recorded in the research,
 * docs/scales-research.md.
 */
import { describe, expect, it } from 'vitest';
import { Scale } from 'tonal';
import { chromaOfIntervals, scaleById, scalePitchClasses, scales } from '../src/scales';
import type { ScaleInterval } from '../src/types';

/** 12-bit chromas (ascending form, C first) recorded for each custom scale in the research. */
const RESEARCH_CHROMA: Record<string, string> = {
  kiourdi: '101101100110',
  sabah: '101110011010',
  houzam: '100111011001',
  peiraiotikos: '110010111010',
  karsigar: '101101100110',
  segkiah: '100111010101',
};

const DEGREES = new Set<ScaleInterval>([
  '1', 'b2', '2', '#2', 'b3', '3', '4', 'b4', '#4', 'b5', '5', '#5', 'b6', '6', 'bb7', 'b7', '7',
]);

const pcs = (list: number[]) => [...new Set(list)].sort((a, b) => a - b).join(',');

describe('scales', () => {
  it('have unique ids', () => {
    const ids = scales.map((s) => s.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('have unique Greek aliases', () => {
    const els = scales.flatMap((s) => s.aliases.el);
    expect(els.filter((el, i) => els.indexOf(el) !== i)).toEqual([]);
  });

  it('start with the root, and only use known degrees', () => {
    expect(scales.filter((s) => s.intervals[0] !== '1').map((s) => s.id)).toEqual([]);
    const unknown = scales.flatMap((s) =>
      [...s.intervals, ...(s.descending ?? [])]
        .filter((iv) => !DEGREES.has(iv))
        .map((iv) => `${s.id} ${iv}`)
    );
    expect(unknown).toEqual([]);
  });

  it('every entry cites at least one source', () => {
    expect(scales.filter((s) => s.sources.length === 0).map((s) => s.id)).toEqual([]);
  });

  it('sameNotesAs is symmetric and truly equal', () => {
    const wrong: string[] = [];
    for (const scale of scales) {
      for (const other of scale.sameNotesAs ?? []) {
        const target = scaleById(other);
        if (!target) wrong.push(`${scale.id} -> ${other} (missing)`);
        else if (!target.sameNotesAs?.includes(scale.id)) wrong.push(`${scale.id} -> ${other} (not symmetric)`);
      }
    }
    expect(wrong).toEqual([]);
    for (const scale of scales) {
      for (const other of scale.sameNotesAs ?? []) {
        expect(scaleById(other)!.intervals, `${scale.id} vs ${other}`).toEqual(scale.intervals);
      }
    }
  });

  describe('pitch classes', () => {
    it('match tonal for every scale tonal knows', () => {
      const mismatches: string[] = [];
      for (const scale of scales) {
        if (!scale.tonalName) continue;
        const tonal = Scale.get(`C ${scale.tonalName}`);
        expect(tonal.empty, `tonal does not know "${scale.tonalName}" (${scale.id})`).toBe(false);
        const theirs = tonal.chroma;
        const ours = chromaOfIntervals(scale.intervals);
        if (theirs !== ours) mismatches.push(`${scale.id} (tonal ${theirs} vs ours ${ours})`);
      }
      expect(mismatches).toEqual([]);
    });

    it('match the chromas recorded in the research for the custom scales', () => {
      for (const [id, expected] of Object.entries(RESEARCH_CHROMA)) {
        const scale = scaleById(id);
        expect(scale, `missing scale ${id}`).toBeDefined();
        expect(chromaOfIntervals(scale!.intervals), id).toBe(expected);
      }
    });

    it('include the descending notes (rast adds b7)', () => {
      expect(scalePitchClasses('rast')).toEqual([0, 2, 4, 5, 7, 9, 10, 11]);
      expect(scalePitchClasses('meizona')).toEqual([0, 2, 4, 5, 7, 9, 11]);
      expect(scalePitchClasses('melodiki-elassona')).toEqual([0, 2, 3, 5, 7, 8, 9, 10, 11]);
    });
  });
});
