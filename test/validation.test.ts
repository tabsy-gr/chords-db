/**
 * The hard gate: every voicing in data/ passes the validator with no errors.
 * Warnings (listed in reports/validation.md) are allowed.
 */
import { describe, expect, it } from 'vitest';
import { loadInstruments } from '../scripts/data-source';
import { validateChord } from '../src/validate';

describe.each(loadInstruments())('$instrument.id', ({ instrument, chords }) => {
  it('has no validation errors', () => {
    const errors = chords.flatMap(({ chord }) =>
      validateChord(instrument, chord)
        .issues.filter((i) => i.severity === 'error')
        .map((i) => `${i.voicingId ?? `${chord.key}${chord.suffix}`} ${i.rule}: ${i.message}`)
    );
    expect(errors).toEqual([]);
  });
});
