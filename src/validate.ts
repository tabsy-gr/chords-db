import { frettedMidi, keyboardMidi } from './midi';
import { compareByPlayability } from './playability';
import { intervalPitchClass, notePitchClass, parseSuffix } from './theory';
import type {
  Chord,
  FrettedInstrument,
  FrettedVoicing,
  Instrument,
  Interval,
  KeyboardVoicing,
  Voicing,
} from './types';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  /** Stable rule id, e.g. 'notes/foreign'. */
  rule: string;
  severity: Severity;
  message: string;
  /** The voicing the issue is about; absent for chord-level issues. */
  voicingId?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/** Every rule the validator applies, with what it checks. */
export const RULES: Record<string, { severity: Severity; description: string }> = {
  'chord/unknown-suffix': {
    severity: 'error',
    description: 'The suffix does not match any quality in data/qualities.json.',
  },
  'chord/suffix-not-listed': {
    severity: 'warning',
    description: "The suffix is missing from the instrument's suffix list.",
  },
  'chord/duplicate-voicing': {
    severity: 'error',
    description: 'Two voicings of the chord are identical.',
  },
  'chord/not-easiest-first': {
    severity: 'warning',
    description: 'The voicings are not ordered easiest first (by playability score).',
  },
  'notes/silent': { severity: 'error', description: 'No string or note sounds.' },
  'notes/foreign': {
    severity: 'error',
    description: "A note that is not in the chord (or the slash chord's bass).",
  },
  'notes/missing-root': {
    severity: 'error',
    description: "The chord's root does not sound, and the voicing is not marked rootless.",
  },
  'notes/rootless-has-root': {
    severity: 'error',
    description: 'The voicing is marked rootless, but the root sounds.',
  },
  'notes/missing-tone': {
    severity: 'error',
    description: 'A required chord tone does not sound (see the quality\'s "omittable" tones).',
  },
  'notes/missing-alteration': {
    severity: 'error',
    description: 'None of the tones the quality requires at least one of sounds (e.g. 7alt).',
  },
  'notes/wrong-bass': {
    severity: 'error',
    description: "A slash chord's lowest note is not its bass note.",
  },
  'degrees/mismatch': {
    severity: 'error',
    description: 'A keyboard voicing labels a note with the wrong chord degree.',
  },
  'fingers/unfingered': { severity: 'error', description: 'A fretted string has no finger.' },
  'fingers/on-unfretted': {
    severity: 'error',
    description: 'An open or muted string has a finger.',
  },
  'fingers/two-frets': {
    severity: 'error',
    description: 'One finger is placed on two different frets.',
  },
  'fingers/order': {
    severity: 'error',
    description: 'A higher-numbered finger sits on a lower fret than a lower-numbered one.',
  },
  'barres/undeclared': {
    severity: 'error',
    description: 'A finger covers several strings on one fret, but that fret is not in "barres".',
  },
  'barres/unplayed': {
    severity: 'error',
    description: 'A declared barre is not played by one finger across at least two strings.',
  },
  'barres/blocked': {
    severity: 'error',
    description:
      'A string under a barre is open or fretted below it, which the barre makes impossible.',
  },
  'barres/muted-inside': {
    severity: 'warning',
    description: 'A string under a barre is muted, so the player has to damp it separately.',
  },
  'span/too-wide': {
    severity: 'error',
    description: "The fretted notes cover more frets than the instrument's maxFretSpan.",
  },
  'capo/without-barre': { severity: 'error', description: '"capo" is set but there is no barre.' },
};

const issue = (rule: string, message: string, voicingId?: string): ValidationIssue => ({
  rule,
  severity: RULES[rule].severity,
  message,
  ...(voicingId ? { voicingId } : {}),
});

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const pcName = (pc: number) => NOTE_NAMES[pc];

const INTERVAL_NAMES = new Set<string>([
  '1', 'b2', '2', 'b3', '3', '4', '#4', 'b5', '5', '#5', 'b6',
  '6', 'bb7', 'b7', '7', 'b9', '9', '#9', '11', '#11', 'b13', '13',
]);

const isAscending = (pitches: number[]) => pitches.every((p, i) => i === 0 || p > pitches[i - 1]);

/**
 * Checks that a voicing's notes make the chord it belongs to: every sounding
 * note is a chord tone, every required tone sounds, and a slash chord's
 * lowest note is its bass.
 */
const checkNotes = (
  instrument: Instrument,
  chord: Pick<Chord, 'key' | 'suffix'>,
  voicing: Voicing
): ValidationIssue[] => {
  const parsed = parseSuffix(chord.suffix);
  if (!parsed) return [];
  const { quality, bass } = parsed;
  const root = notePitchClass(chord.key)!;
  const pcOf = (interval: Interval) => (root + intervalPitchClass(interval)) % 12;
  const id = voicing.id;

  const midi =
    instrument.kind === 'fretted'
      ? frettedMidi((voicing as FrettedVoicing).frets, instrument.tunings.standard)
      : keyboardMidi((voicing as KeyboardVoicing).notes);
  if (!midi.length) return [issue('notes/silent', 'nothing sounds', id)];

  const sounding = new Set(midi.map((m) => m % 12));
  const bassPc = bass === undefined ? null : notePitchClass(bass);
  const allowed = new Set([...quality.intervals.map(pcOf), ...(bassPc === null ? [] : [bassPc])]);
  const out: ValidationIssue[] = [];

  const foreign = [...sounding].filter((pc) => !allowed.has(pc));
  if (foreign.length) {
    out.push(
      issue(
        'notes/foreign',
        `${foreign.map(pcName).join(', ')} not in ${chord.key}${chord.suffix} (${quality.intervals.join(' ')})`,
        id
      )
    );
  }

  if (voicing.rootless) {
    if (sounding.has(root)) out.push(issue('notes/rootless-has-root', `${chord.key} sounds`, id));
  } else if (!sounding.has(root)) {
    out.push(issue('notes/missing-root', `no ${chord.key}`, id));
  }

  const omittable = new Set(quality.omittable ?? []);
  const missing = quality.intervals
    .filter((iv) => iv !== '1' && !omittable.has(iv) && !sounding.has(pcOf(iv)))
    .map((iv) => `${iv} (${pcName(pcOf(iv))})`);
  if (missing.length) out.push(issue('notes/missing-tone', `missing ${missing.join(', ')}`, id));

  if (quality.atLeastOneOf && !quality.atLeastOneOf.some((iv) => sounding.has(pcOf(iv)))) {
    out.push(
      issue('notes/missing-alteration', `needs one of ${quality.atLeastOneOf.join(', ')}`, id)
    );
  }

  // Only meaningful when the courses ascend in pitch: on a re-entrant tuning
  // (ukulele G4 C4 E4 A4) the lowest note is an artifact of the tuning.
  if (
    bassPc !== null &&
    instrument.kind === 'fretted' &&
    isAscending(instrument.tunings.standard.map((c) => frettedMidi([0], [c])[0]))
  ) {
    const lowest = Math.min(...midi) % 12;
    if (lowest !== bassPc) {
      out.push(issue('notes/wrong-bass', `lowest note is ${pcName(lowest)}, not ${bass}`, id));
    }
  }

  if (instrument.kind === 'keyboard') {
    const { notes, degrees } = voicing as KeyboardVoicing;
    const wrong = (degrees ?? []).flatMap((degree, i) => {
      const pc = notePitchClass(notes[i]);
      const expected = INTERVAL_NAMES.has(degree)
        ? (root + intervalPitchClass(degree as Interval)) % 12
        : null;
      return expected === pc ? [] : [`${notes[i]} labelled ${degree}`];
    });
    if (wrong.length) out.push(issue('degrees/mismatch', wrong.join(', '), id));
  }

  return out;
};

/** Checks that a fretted voicing's fingering can be played. */
const checkFingering = (instrument: FrettedInstrument, voicing: FrettedVoicing) => {
  const { frets, fingers, id } = voicing;
  const barres = voicing.barres ?? [];
  const out: ValidationIssue[] = [];

  const unfingered = frets.flatMap((f, i) => (f > 0 && fingers[i] === 0 ? [i + 1] : []));
  if (unfingered.length) {
    out.push(issue('fingers/unfingered', `course ${unfingered.join(', ')} fretted with no finger`, id));
  }
  const onUnfretted = frets.flatMap((f, i) => (f <= 0 && fingers[i] !== 0 ? [i + 1] : []));
  if (onUnfretted.length) {
    out.push(issue('fingers/on-unfretted', `finger on open/muted course ${onUnfretted.join(', ')}`, id));
  }

  // Where each finger is placed: finger -> courses.
  const placed = new Map<string | number, number[]>();
  frets.forEach((f, i) => {
    if (f > 0 && fingers[i] !== 0) placed.set(fingers[i], [...(placed.get(fingers[i]) ?? []), i]);
  });

  const fretOf = new Map<string | number, number>();
  for (const [finger, courses] of placed) {
    const distinct = [...new Set(courses.map((c) => frets[c]))];
    if (distinct.length > 1) {
      out.push(issue('fingers/two-frets', `finger ${finger} on frets ${distinct.join(' and ')}`, id));
      continue;
    }
    fretOf.set(finger, distinct[0]);
    if (finger !== 'T' && courses.length > 1 && !barres.includes(distinct[0])) {
      out.push(
        issue('barres/undeclared', `finger ${finger} covers ${courses.length} courses at fret ${distinct[0]}`, id)
      );
    }
  }

  const numbered = [...fretOf].filter(([f]) => f !== 'T') as [number, number][];
  for (const [a, fa] of numbered) {
    for (const [b, fb] of numbered) {
      if (a < b && fa > fb) {
        out.push(issue('fingers/order', `finger ${a} on fret ${fa} is above finger ${b} on fret ${fb}`, id));
      }
    }
  }

  for (const barre of barres) {
    const finger = [...placed].find(
      ([f, courses]) => f !== 'T' && courses.length > 1 && frets[courses[0]] === barre
    );
    if (!finger) {
      out.push(issue('barres/unplayed', `no finger barres fret ${barre}`, id));
      continue;
    }
    const courses = finger[1];
    for (let c = Math.min(...courses) + 1; c < Math.max(...courses); c++) {
      if (frets[c] === -1) {
        out.push(issue('barres/muted-inside', `course ${c + 1} is muted under the barre at fret ${barre}`, id));
      } else if (frets[c] < barre) {
        out.push(
          issue('barres/blocked', `course ${c + 1} is ${frets[c] === 0 ? 'open' : `at fret ${frets[c]}`} under the barre at fret ${barre}`, id)
        );
      }
    }
  }

  const pressed = frets.filter((f) => f > 0);
  if (pressed.length) {
    const covered = Math.max(...pressed) - Math.min(...pressed) + 1;
    if (covered > instrument.maxFretSpan) {
      out.push(issue('span/too-wide', `covers ${covered} frets (max ${instrument.maxFretSpan})`, id));
    }
  }

  if (voicing.capo && !barres.length) out.push(issue('capo/without-barre', 'capo without a barre', id));

  return out;
};

/**
 * Validates one voicing of a chord: its notes, and for fretted instruments its
 * fingering. Use this to check voicings that are not in the database, such as
 * generated ones.
 */
export const validateVoicing = (
  instrument: Instrument,
  chord: Pick<Chord, 'key' | 'suffix'>,
  voicing: Voicing
): ValidationResult => {
  const issues = parseSuffix(chord.suffix)
    ? checkNotes(instrument, chord, voicing)
    : [issue('chord/unknown-suffix', `no quality spells "${chord.suffix}"`, voicing.id)];
  if (instrument.kind === 'fretted') issues.push(...checkFingering(instrument, voicing as FrettedVoicing));
  return { ok: !issues.some((i) => i.severity === 'error'), issues };
};

/**
 * Validates a whole chord: every voicing, plus chord-level rules (suffix
 * listed, no duplicates, easiest voicing first).
 */
export const validateChord = (instrument: Instrument, chord: Chord): ValidationResult => {
  const issues: ValidationIssue[] = [];
  if (!parseSuffix(chord.suffix)) {
    issues.push(issue('chord/unknown-suffix', `no quality spells "${chord.suffix}"`));
  } else {
    for (const voicing of chord.voicings) {
      issues.push(...validateVoicing(instrument, chord, voicing).issues);
    }
  }
  if (!instrument.suffixes.includes(chord.suffix)) {
    issues.push(issue('chord/suffix-not-listed', `"${chord.suffix}" is not in ${instrument.id}'s suffixes`));
  }

  const seen = new Map<string, string>();
  for (const v of chord.voicings) {
    const shape = JSON.stringify('frets' in v ? v.frets : v.notes);
    const first = seen.get(shape);
    if (first) issues.push(issue('chord/duplicate-voicing', `same as ${first}`, v.id));
    else seen.set(shape, v.id);
  }

  if (instrument.kind === 'fretted') {
    const voicings = chord.voicings as FrettedVoicing[];
    const sorted = [...voicings].sort(compareByPlayability(instrument.tunings.standard));
    if (sorted.some((v, i) => v !== voicings[i])) {
      issues.push(
        issue('chord/not-easiest-first', `easiest first would be ${sorted.map((v) => v.id.split('/').pop()).join(', ')}`)
      );
    }
  }

  return { ok: !issues.some((i) => i.severity === 'error'), issues };
};
