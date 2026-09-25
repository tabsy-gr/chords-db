# Migrating from tombatossals/chords-db

This project is a hard fork of
[tombatossals/chords-db](https://github.com/tombatossals/chords-db) at commit
[`df06fa7`](https://github.com/tombatossals/chords-db/commit/df06fa7b) (v0.6.0).
It does not try to stay compatible with the original. Instead, every change
is listed here so you can decide whether and how to move over.

This guide covers changes to the package, the data format and the API. It
grows with each release.

## Package

| | tombatossals/chords-db | This fork |
| --- | --- | --- |
| Package name | `@tombatossals/chords-db` | `@tabsy-gr/chords-db` |
| Registry | npmjs.com | GitHub Packages (npmjs.com once stable) |
| Data | `lib/guitar.json`, `lib/ukulele.json`, `lib/piano.json`, `lib/instruments.json` | `@tabsy-gr/chords-db/guitar`, `/ukulele`, `/piano`, `/instruments` |
| Helpers | none published (`main: index.js` did not exist) | ES module and CommonJS entry point with TypeScript types |
| JSON Schemas | none | `@tabsy-gr/chords-db/schema/*` |
| Node.js | not specified | 20.11 or later |

## Chord data: what changed in the voicings

Every voicing that differs from upstream, and why, is listed in
[UPSTREAM-DIFF.md](./UPSTREAM-DIFF.md). It is generated from `data/changes.json`
by comparing every voicing with upstream's own build (pinned in
`test/fixtures/upstream-v0.6.0`); the tests fail on any difference it does
not explain.

## Data format

### Published instrument files

Upstream published an instrument's source object with the positions
processed:

```js
// upstream lib/guitar.json
{ main, tunings, keys, suffixes, chords: { C: [...], Csharp: [...] } }
```

This fork publishes the instrument definition and the chords separately:

```js
// @tabsy-gr/chords-db/guitar
{ instrument: { id, name, kind, tunings, maxFretSpan, keys, suffixes },
  chords: { C: [...], 'C#': [...] } }
```

| Upstream | This fork |
| --- | --- |
| `main.name` (`'guitar'`) | `instrument.id` (`'guitar'`), plus a display `instrument.name` (`'Guitar'`) |
| `main.strings` | the number of courses: `instrument.tunings.standard.length` |
| `main.fretsOnChord` | `instrument.maxFretSpan` (fretted instruments only) |
| `main.keys` (piano: 88) | `instrument.keyCount` |
| — | `instrument.kind`: `'fretted'` or `'keyboard'` |
| `tunings.standard: ['E2', 'A2', …]` | `tunings.standard: [['E2'], ['A2'], …]`: each course is a list of pitches, so doubled courses (e.g. bouzouki) can list both strings |
| piano `tunings` (a C major scale, unused) | removed |
| `chords` keyed by `C`, `Csharp`, `Fsharp`, … | keyed by the key as written: `C`, `C#`, `F#`, … |
| order of chords within a key: the order upstream's source files happened to be imported in | the instrument's `suffixes` order; suffixes missing from that list come last, alphabetically |
| `lib/instruments.json`: `{ guitar: { strings, fretsOnChord, name, numberOfChords } }`, where `numberOfChords` counted positions | `/instruments`: `{ guitar: { name, kind, chordCount, voicingCount } }` |

### Chords and voicings

| Upstream | This fork |
| --- | --- |
| `positions` | `voicings` |
| — | `id` on every voicing, e.g. `guitar/C/major/1`. Permanent: it never changes, even if the voicing is corrected. For upstream voicings, the number is the upstream position (1-based). |
| — | `sources` on every voicing; upstream ones are `{ "type": "upstream", "ref": "tombatossals/chords-db@df06fa7" }` |
| — | `verified` (optional): who confirmed the voicing, and when |
| — | `rootless` (optional): the voicing deliberately leaves out the root |

### Fretted voicings

| Upstream (published) | This fork |
| --- | --- |
| `frets`: relative to `baseFret` | `frets`: **absolute** fret numbers. Use `toChordDiagram()` for the relative form. |
| `baseFret` | computed by `toChordDiagram()` |
| `barres`: relative to `baseFret`, `[]` when none | absolute frets; omitted when none. `toChordDiagram()` returns the relative form. |
| `fingers`: `-1` where the source had `x` | `0` |
| — | `"T"` allowed in `fingers` for the thumb |
| `capo: true` | unchanged |
| `midi` | unchanged |

`toChordDiagram(voicing, instrument.tunings.standard)` returns exactly
upstream's published position shape (`frets`, `fingers`, `baseFret`,
`barres`, `capo`, `midi`), so a renderer that consumed upstream positions,
such as react-chords, can keep working.

### Piano voicings

| Upstream | This fork |
| --- | --- |
| `frets`: note names | `notes` |
| `fingers`: `['1', '3', '5', 'b7', …]`. Despite the name, these are chord degrees, not fingers. | `degrees` |
| `midi`: flat notes (`Bb`, `Eb`, …) were **silently dropped**. Upstream's note lookup only knew sharp names, so 84 of the 528 piano voicings had missing notes, e.g. C13 without its B♭. | every note is included |

The piano data is no longer upstream's: every voicing is generated from the
formulas in `data/qualities.json` by `scripts/generate-piano.ts`. As a result:

- notes have **octaves** (`C4 E4 G4 Bb4 D5 F5 A5`), stacked upward from the
  root, so `midi` is the real voicing;
- notes are **spelled by letter** for their key (E♭m is `Eb Gb Bb`, not
  upstream's `D# F# A#`; C♯ major is `C# E# G#`). A double accidental is
  written as its simpler enharmonic (Cdim7's ♭♭7 is `A`);
- `degrees` use the interval names from `data/qualities.json` (Cdim7's
  7th is `bb7`, not upstream's `6`);
- suffixes use the same spelling as the other instruments: `minor` (not
  `m`), `7#9` (not `7sharp9`), `maj7#5`, `9#11`, `7b9#5`, `7b5#9`, `7#5#9`.
  The old spellings still parse through `parseSuffix()`;
- every quality is covered, including those upstream piano lacked (such as
  `sus2sus4`, `add11`, `13b9`, `m13`), except `7alt`, which has no fixed set
  of tones.

Voicing ids are kept (`piano/C/m/1` is still the C minor voicing).

### Source files

Upstream kept one JavaScript module per chord under
`src/db/<instrument>/chords/<key>/<suffix>.js`, with frets and fingers as hex
strings (`'x32010'`, `a` = 10). This fork keeps one JSON file per chord under
`data/<instrument>/chords/<key>/<suffix>.json`, checked against
`schema/chord.schema.json`. File names spell `#` as `sharp` and `/` as `_`;
upstream used `#` in file names, which breaks ES module loading.

## Helpers

Upstream's `src/tools.js` was never published. This fork publishes:

| Upstream (`src/tools.js`) | This fork |
| --- | --- |
| `chord2midi(frets, tuning)` | `frettedMidi(frets, courses)` |
| `notes2midi(notes)` | `keyboardMidi(notes)`: also handles flats |
| `getNoteFromMidiNumber(n)` | `midiToNoteName(n)` |
| — | `noteToMidi(note, defaultOctave = 4)` |
| — | `toChordDiagram(voicing, courses)` |
| `strChord2array`, `processString`, `generate`, `numberOfBarres`, `unique` | removed; they processed the old hex-string format |
| — | `validateVoicing(instrument, chord, voicing)` and `validateChord(instrument, chord)`: check notes, fingering and order (see the README) |
| — | `qualities`, `parseSuffix(suffix)`: what each chord suffix contains, from `data/qualities.json` |
| — | `playabilityScore(voicing, courses)`, `compareByPlayability(courses)`: sort voicings easiest first |

## Tooling (contributors only)

- Babel, Jest, Husky and lint-staged are replaced by TypeScript, Vitest, tsx
  and tsup.
- `npm run build:data` builds `lib/` from `data/`; `npm run format:data`
  formats the data files.
- CI checks `data/` against the schemas and the formatting rules, and fails if
  the committed `lib/` does not match what `data/` builds.
- Upstream's tests are ported unchanged in `test/upstream-checks.test.ts`,
  including their per-instrument differences.
