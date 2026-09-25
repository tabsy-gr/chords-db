import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import chordSchema from '../schema/chord.schema.json';
import instrumentSchema from '../schema/instrument.schema.json';
import qualitiesSchema from '../schema/qualities.schema.json';
import changesSchema from '../schema/changes.schema.json';
import { loadChangesFile, loadInstruments, loadQualitiesFile } from '../scripts/data-source';

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validateInstrument = ajv.compile(instrumentSchema);
const validateChord = ajv.compile(chordSchema);

const describeErrors = (errors: typeof validateChord.errors) =>
  (errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');

it('qualities.json matches the qualities schema', () => {
  const validateQualities = ajv.compile(qualitiesSchema);
  const { file, text } = loadQualitiesFile();
  const ok = validateQualities(JSON.parse(text));
  expect(ok, `${file}: ${describeErrors(validateQualities.errors)}`).toBe(true);
});

it('changes.json matches the changes schema', () => {
  const validateChanges = ajv.compile(changesSchema);
  const { file, text } = loadChangesFile();
  const ok = validateChanges(JSON.parse(text));
  expect(ok, `${file}: ${describeErrors(validateChanges.errors)}`).toBe(true);
});

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
