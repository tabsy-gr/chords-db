import { toChordDiagram } from './diagram';
import type { FrettedVoicing, Pitch } from './types';

/**
 * How hard a voicing is to fret. Lower is easier; only the ordering matters.
 *
 * Ported from @tabsy-gr/shared (chord-view-utils.ts), where the weights were
 * tuned against chords whose first-taught shape is not in dispute. They follow
 * the capo-suggestion heuristic of ChordMiniApp: a barre is the biggest single
 * cost, then how far up the neck the hand is, then stretches beyond four
 * frets, then muted strings, with open strings a small bonus. Two departures:
 * the barre penalty is 3 rather than 5 (at 5 a chord's standard barre loses to
 * awkward high-neck shapes), and each distinct fretting finger costs a little,
 * which separates shapes the other terms tie (open Em from open C).
 */
export const playabilityScore = (voicing: FrettedVoicing, courses: Pitch[][]): number => {
  const { frets, baseFret, barres } = toChordDiagram(voicing, courses);
  const pressed = frets.filter((fret) => fret > 0);
  const span = pressed.length > 1 ? Math.max(...pressed) - Math.min(...pressed) : 0;
  const open = frets.filter((fret) => fret === 0).length;
  const muted = frets.filter((fret) => fret < 0).length;
  const fingers = new Set(voicing.fingers.filter((finger) => finger !== 0)).size;
  return (
    barres.length * 3 +
    Math.max(0, baseFret - 1) * 1.35 +
    Math.max(0, span - 4) * 0.75 +
    Math.max(0, muted - 1) * 0.2 -
    open * 0.2 +
    fingers * 0.3
  );
};

/**
 * Easiest first. Ties break the way a player would choose: lower on the neck,
 * then fewer barres, then more open strings. Scores are float sums, so they
 * are compared with a small epsilon.
 */
export const compareByPlayability =
  (courses: Pitch[][]) =>
  (a: FrettedVoicing, b: FrettedVoicing): number => {
    const delta = playabilityScore(a, courses) - playabilityScore(b, courses);
    if (Math.abs(delta) > 1e-9) return delta;
    const da = toChordDiagram(a, courses);
    const db = toChordDiagram(b, courses);
    if (da.baseFret !== db.baseFret) return da.baseFret - db.baseFret;
    if (da.barres.length !== db.barres.length) return da.barres.length - db.barres.length;
    const open = (frets: number[]) => frets.filter((fret) => fret === 0).length;
    return open(b.frets) - open(a.frets);
  };
