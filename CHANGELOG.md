# Changelog

This fork's changes are listed here. Everything below "Forked" is the history
of the original [tombatossals/chords-db](https://github.com/tombatossals/chords-db).
For a full comparison with the original, see
[MIGRATING-FROM-CHORDS-DB.md](./MIGRATING-FROM-CHORDS-DB.md).

## Unreleased

### Added
* Scale library: `data/scales.json` with 27 scales — the Greek dromoi, the
  major/minor family, the church modes, the pentatonics and the blues
  scales — every formula with a cited source. New `scaleById()`,
  `scalePitchClasses()`, `scales` and `chromaOfIntervals()` exports, and the
  schema `@tabsy-gr/chords-db/schema/scales.schema.json`. The dromoi are the
  equal-tempered forms Greek sources teach, with `confidence` and `caveats`
  fields for the 12-TET and naming caveats. The full research report is in
  `docs/scales-research.md`.

### Changed
* All bouzouki voicings, tetrachordo (1,367) and trichordo (445), are signed
  off as verified by `geoioannid`. Each one passes the validator and a
  separate check of its notes against the chord formulas.

## 0.9.0

### Added
* Greek bouzouki, tetrachordo (C F A D, 252 chords, 1,367 voicings) and
  trichordo (D A D, 147 chords, 445 voicings), with octave courses, built
  from reference dataset A: shapes that pass the validator, fingered, up to
  six per chord. Published as `@tabsy-gr/chords-db/bouzouki-cfad` and
  `/bouzouki-dad`. They are unverified until signed off.
* `VERIFIERS.md` and `npm run verify -- --by <login> <ids>` to sign off
  voicings.

## 0.8.0

### Changed (breaking)
* Suffixes that started with `b` are renamed so they can follow a root in a
  chord symbol: `b5` → `(b5)`, `b13b9` → `7b9b13`, `b13#9` → `7#9b13`. The
  old names still resolve through `parseSuffix()`.
* Guitar `sus` is merged into `sus4`.

### Added
* `parseChordSymbol()` and `findChord()`: read chord symbols with their
  usual symbols and synonyms (`CΔ7`, `F♯ø`, `Amin`, `C6/9`) and find chords
  whatever the enharmonic spelling (`A#m7` → `Bbm7`,
  tombatossals/chords-db#24). `qualityInputs()` and `chordSymbolSource()`
  for matching chord symbols in text. Symbols live in `data/notation.json`,
  synonyms in `data/qualities.json`.

## 0.7.2

### Added
* Cavaquinho (D G B D), from tombatossals/chords-db#43 by Hugo Rezende:
  1,052 validated voicings in 168 chords. Every change to the contributed
  data is listed in UPSTREAM-DIFF.md.
* Ukulele in D tuning (A D F# B), generated from the ukulele, after
  tombatossals/chords-db#32 by Henry.
* The C/G triad xxx010, from tombatossals/chords-db#38 by jonmach.
* Instrument setting `carriesBass`, and source type `derived`.

## 0.7.0

The first release of the fork.

### Changed
* **Schema v2.** The data moves from JavaScript modules with hex strings to
  one JSON file per chord under `data/`, checked by JSON Schemas in `schema/`.
  Frets and fingers are absolute number arrays and barres are always arrays.
  The published files move to `@tabsy-gr/chords-db/<instrument>`. See
  MIGRATING-FROM-CHORDS-DB.md for the field-by-field mapping.
* Every voicing has a permanent `id` and its provenance in `sources`.
* Piano `fingers` are renamed `degrees`, which is what they hold.
* The helpers are renamed (`frettedMidi`, `keyboardMidi`, `midiToNoteName`);
  the hex-string helpers are removed. `toChordDiagram()` returns upstream's
  published position shape.
* Forked from tombatossals/chords-db v0.6.0 (`df06fa7`) and renamed to
  `@tabsy-gr/chords-db`.
* Replaced Babel and Jest with TypeScript, Vitest, tsx and tsup.
* The helpers are exported from the package root, with TypeScript types.

### Fixed
* Every voicing is validated; the inherited data was corrected issue by
  issue (#4–#13). Every change from upstream, and why, is in
  UPSTREAM-DIFF.md. In short:
  * restored 7 guitar chords upstream never built (#4);
  * corrected or removed voicings with wrong notes, including chord files
    upstream copied from a neighbouring key (#5), and relabelled
    mislabelled families: alt → b5, 9#11 → 7#11, m9/♭7 → 7sus2/♭7 (#6);
  * marked the deliberately rootless ukulele and guitar voicings (#7);
  * fixed impossible fingerings and declared implied barres (#8, #9);
  * put the root in the bass where the next string plays it (#11);
  * regenerated the piano voicings from the formula table (#12);
  * ordered every chord's voicings easiest first (#10);
  * added D7/F# (#13).
* Piano `midi` left out every flat note, so 84 of 528 voicings (e.g. C13,
  missing its B♭) were incomplete.
* Guitar F major position 2 had `x` instead of `0` in its fingers.

### Added
* Validation is a hard gate: any validation error fails CI.
* Publishing to GitHub Packages on every change to `master`.
* `UPSTREAM-DIFF.md`: every voicing that differs from the original database,
  and why, generated from `data/changes.json`. The tests fail on any
  unexplained difference.
* A voicing validator (`validateVoicing`, `validateChord`). It checks each
  voicing's notes against the chord's formula, the fingering against
  playability rules, and that voicings are ordered easiest first.
* `rootless: true` on a voicing marks a deliberately rootless voicing (common
  for extended chords on ukulele); the validator then requires the root to
  be absent.
* `data/qualities.json`: a formula for every chord quality, with a cited
  source, the tones a voicing may omit, and the suffix spellings each
  instrument uses. Cross-checked against tonal.
* `reports/validation.md`: every current finding. CI checks it is up to date.
* CI that typechecks, builds, tests, and checks that `lib/` is up to date.
* `AUTHORS`, generated from git history, crediting every contributor to the
  original project.

## Forked

## 0.6.0 (May 20, 2024)

### Instruments
* Added Piano as a new instrument with all its chords.
* Refactored build scripts to support different instrument types (stringed vs. keyboard).

## 0.5.1 (Nov 2, 2019)
* Renamed the slash chords

## 0.5.0 (Oct 27, 2019)
* Added a lot of new guitar chords thanks to @szaza
* Fixed some typos

## 0.4.3 (Jul 20, 2018)
* Renamed "ukelele" to "ukulele"
* Updated libraries

## 0.4.2 (May 07, 2018)
* Updated @babel package dependencies.

## 0.4.1 (May 07, 2018)
* Solved some errors on Guitar Amaj11 chords.
* Updated package dependencies.

## 0.4.0 (Feb 27, 2018)
* Solves some errors on Guitar B chords

## 0.3.9 (Sep 3, 2017)

### Database
* All guitar chords completed
* All tests passing
* New JSON structure

## 0.3.7 (Jun 07, 2017)

### Database

* All ukelele chords finished

## 0.3.6 (Jun 03, 2017)

### Database

* All ukelele chords added

### Tests

* Lot of new testing

## 0.3.5 (May 30, 2017)

### Database

* Fixed build

## 0.3.4 (May 30, 2017)

### Database

* Lots of new Ukelele chords

## 0.3.3 (May 05, 2017)

### Database

* New Ukelele C chords

## 0.3.2 (Apr 17, 2017)

### Database

* Unified instrument name

## 0.3.1 (Apr 07, 2017)

### Database

* Auto-generating MIDI notes of the intrument chords

## 0.3.0 (March 25, 2017)

### Database

* Reversed finger notation for better understanding

## 0.2.2 (Febraury 28, 2017)

### Database

* Updated dependencies and better chord generation

## 0.2.1 (October 30, 2016)

### Database

* Rebuild DB.

## 0.2.0 (October 30, 2016)

### Database

* Reverse chord notation as the standard.

## 0.1.9 (October 29, 2016)

### Database

* Added the instrument name and type to the database.

## 0.1.8 (October 24, 2016)

### Database

* Added all missing ukelele chords

## 0.1.7 (October 22, 2016)

### Schema

* Added the number of frets to be shown on a rendered chord

### Database

* More Ukelele Chords

## 0.1.6 (October 17, 2016)

### Instruments

* Added Ukelele

## 0.1.5 (October 15, 2016)

### Database

* Added all remaining chords: Dd, F#, Ab, Bb

## 0.1.4 (October 12, 2016)

### Database

* Added first sharp chord: C#

## 0.1.3 (October 10, 2016)

* Fixed some tests and database errors

## 0.1.2 (October 09, 2016)

### Database

* Added the B chords

## 0.1.1 (October 09, 2016)

### Schema

* Auto-generation of JSON database with all the needed properties

### Database

* A chords added

## 0.1.0 (October 09, 2016)

### Schema

* Abbreviated methods for frets and fingers using strings

### Database

* G chords completed

## 0.0.15 (October 08, 2016)

### Database

* F chords completed

## 0.0.14 (October 08, 2016)

### Database

* E chords completed

## 0.0.13 (October 08, 2016)

### Database

* D chords completed

## 0.0.12 (October 07, 2016)

### Schema

* No need for barres explicit strings

### Database

* D chords

## 0.0.11 (October 06, 2016)

### Database

* More C chords

## 0.0.10 (October 06, 2016)

### Schema

* Splitted the schema in multiple files

### Database

* More C chords

## 0.0.9 (October 05, 2016)

### Database

* More C chords

### Testing

* Added more tests

## 0.0.8 (October 05, 2016)

### Database

* Fixed bugs in some chords

### Testing

* Added more tests

## 0.0.7 (October 04, 2016)

### Database

* Added more C chords

### Testing

* Added first tests

## 0.0.6 (October 04, 2016)

### Database

* Solved some bugs with the Cmajor alternative chords

## 0.0.5 (October 03, 2016)

### Schema

* Changed schema structure, allowing multiple versions of the same chord

### Chords

* Added all chords of Cmajor

## 0.0.4 (October 02, 2016)

### Sources

* Export splitted instruments so they can be imported individually

## 0.0.3 (October 02, 2016)

### Sources

* Working transpiled babel version

## 0.0.2 (October 02, 2016)

### Sources

* Include the babel transpiled code inside the "dist/" folder

## 0.0.1 (October 02, 2016)

### Guitar Database

* Added the first version of the guitar database, with some basic chords, and the chord database definition.
