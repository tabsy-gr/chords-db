import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import chordSchema from '../schema/chord.schema.json';
import instrumentSchema from '../schema/instrument.schema.json';
import { loadInstruments } from '../scripts/data-source';

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateInstrument = ajv.compile(instrumentSchema);
const validateChord = ajv.compile(chordSchema);

const describeErrors = (errors: typeof validateChord.errors) =>
  (errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');

describe.each(loadInstruments())('$instrument.id', ({ file, text, chords }) => {
  it('instrument.json matches the instrument schema', () => {
    const ok = validateInstrument(JSON.parse(text));
    expect(ok, `${file}: ${describeErrors(validateInstrument.errors)}`).toBe(true);
  });

  it('every chord file matches the chord schema', () => {
    const failures = chords
      .filter(({ text }) => !validateChord(JSON.parse(text)))
      .map(({ file }) => `${file}: ${describeErrors(validateChord.errors)}`);
    expect(failures).toEqual([]);
  });
});
