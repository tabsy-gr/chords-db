import scalesJson from '../data/scales.json';
import type { Scale, ScaleInterval } from './types';

/** The scales in data/scales.json. */
export const scales: Scale[] = (scalesJson as { scales: Scale[] }).scales;

const SEMITONES: Record<ScaleInterval, number> = {
  '1': 0, b2: 1, '2': 2, '#2': 3, b3: 3, '3': 4, '4': 5, b4: 4, '#4': 6, b5: 6, '5': 7,
  '#5': 8, b6: 8, '6': 9, bb7: 9, b7: 10, '7': 11, b8: 11,
};

const byId = new Map(scales.map((scale) => [scale.id, scale] as const));

/** Looks up a scale by its id; undefined if there is none. */
export const scaleById = (id: string): Scale | undefined => byId.get(id);

/**
 * Pitch classes (0-11) the scale covers, ascending plus descending forms,
 * sorted from the tonic. An empty array for an unknown id.
 */
export const scalePitchClasses = (id: string): number[] => {
  const scale = byId.get(id);
  if (!scale) return [];
  const pcs = new Set(
    scale.intervals.concat(scale.descending ?? []).map((interval) => SEMITONES[interval])
  );
  return [...pcs].sort((a, b) => a - b);
};

/** The pitch classes of one interval list, as a 12-character bitmask, C first. */
export const chromaOfIntervals = (intervals: ScaleInterval[]): string => {
  const chars = Array<string>(12).fill('0');
  for (const interval of intervals) chars[SEMITONES[interval]] = '1';
  return chars.join('');
};
