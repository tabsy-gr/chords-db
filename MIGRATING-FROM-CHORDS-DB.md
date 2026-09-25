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
| Entry point | `main: index.js` (the file did not exist) | `exports` map: `.` for the helpers, `./lib/*.json` for the data |
| Node.js | not specified | 20 or later |

## Data

The generated `lib/guitar.json`, `lib/ukulele.json`, `lib/piano.json` and
`lib/instruments.json` are **byte-for-byte identical** to the original v0.6.0
build. No chord data has changed yet.

## Helpers

The helpers from `src/tools.js` are now exported from the package root, with
TypeScript types, and behave the same:

```js
import {
  strChord2array,
  processString,
  chord2midi,
  notes2midi,
  getNoteFromMidiNumber,
  numberOfBarres,
  unique,
  generate,
} from '@tabsy-gr/chords-db';
```

## Tooling (contributors only)

- Babel, Jest, Husky and lint-staged are replaced by TypeScript, Vitest, tsx
  and tsup.
- `npm run build` now regenerates `lib/` and then builds the package;
  `npm run build:data` regenerates `lib/` only.
- CI fails if the committed `lib/` does not match what `src/db` generates.
