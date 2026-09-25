# Changelog

This fork's changes are listed here. Everything below "Forked" is the history
of the original [tombatossals/chords-db](https://github.com/tombatossals/chords-db).
For a full comparison with the original, see
[MIGRATING-FROM-CHORDS-DB.md](./MIGRATING-FROM-CHORDS-DB.md).

## Unreleased

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
* Piano `midi` left out every flat note, so 84 of 528 voicings (e.g. C13,
  missing its B♭) were incomplete.
* Guitar F major position 2 had `x` instead of `0` in its fingers.

### Added
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
