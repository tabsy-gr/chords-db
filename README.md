# chords-db

> **Pre-release.** This fork is under active development. The data format will
> change (see [Roadmap](#roadmap)) and nothing here is stable yet.

A database of chord voicings for string instruments and piano, where every
voicing is checked for correctness.

This is a hard fork of [tombatossals/chords-db](https://github.com/tombatossals/chords-db)
by David Rubert and contributors, which is no longer maintained. It is
maintained by [Tabsy](https://tabsy.gr), which uses it for its chord diagrams.

**Adopting this fork from the original?** Every difference from the original
database is documented in
[MIGRATING-FROM-CHORDS-DB.md](./MIGRATING-FROM-CHORDS-DB.md): what changed in
the package, the data format and the API, and how to move over.

## Instruments

| Instrument | Tuning                 | Source                 |
| ---------- | ---------------------- | ---------------------- |
| Guitar     | Standard (E A D G B E) | tombatossals/chords-db |
| Ukulele    | Standard (G C E A)     | tombatossals/chords-db |
| Piano      | n/a                    | tombatossals/chords-db |

## Install

```sh
npm install @tabsy-gr/chords-db
```

The package is published to GitHub Packages, which requires a GitHub token
with `read:packages` even for public packages. It will also be published to
npmjs.com once it is stable.

## Usage

The generated data lives in `lib/` as one JSON file per instrument:

```js
import guitar from '@tabsy-gr/chords-db/lib/guitar.json' with { type: 'json' };

const cMajor = guitar.chords.C.find((chord) => chord.suffix === 'major');
cMajor.positions[0];
// { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0],
//   baseFret: 1, barres: [], midi: [48, 52, 55, 60, 64] }
```

In the generated JSON, `-1` is a muted string and `0` an open one, and `frets`
are relative to `baseFret`.

## Data format

Chords are defined in `src/db/<instrument>/chords/<key>/<suffix>.js`. For
example, part of the guitar `Dsus2`:

```js
export default {
  key: 'D',
  suffix: 'sus2',
  positions: [
    {
      frets: 'xx0230',
      fingers: '000230',
    },
    {
      frets: 'x777aa',
      fingers: '011144',
      barres: [7, 10],
      capo: true,
    },
  ],
};
```

Each *position* is one voicing of the chord:

- `frets`: one character per string, lowest string first. `x` is muted, `0` is
  open, and frets above 9 are written in hexadecimal (`a` = 10, `c` = 12).
- `fingers`: the finger on each string (1 = index … 4 = little), `0` for none.
- `barres`: the fret, or list of frets, barred by one finger.
- `capo`: draw the barre as a capo.

This format is being replaced by JSON files with a JSON Schema; see the
[Roadmap](#roadmap).

## Development

```sh
npm install
npm run build:data   # regenerate lib/*.json from src/db
npm run test:run     # run the test suite
npm run typecheck
npm run build        # regenerate the data and build the package
npm run authors      # regenerate AUTHORS from git history
```

## Roadmap

1. A new data format: JSON files checked against a JSON Schema, plain number
   arrays instead of hex strings, and a stable ID and source for every voicing.
2. A validator that checks every voicing's notes against the chord's intervals
   and that its fingering can actually be played.
3. Fixes for the incorrect voicings reported against the original database.
4. Chord-symbol aliases and a reference parser (`C°7`, `Cø`, `CΔ7`, …).
5. Greek bouzouki: tetrachordo (C F A D) and trichordo (D A D).

## Credits

- **[David Rubert](https://github.com/tombatossals)** created the original
  chords-db, together with the contributors listed in [AUTHORS](./AUTHORS).
- The piano data was contributed upstream by Claudemir Casa
  ([tombatossals/chords-db#34](https://github.com/tombatossals/chords-db/pull/34)),
  who names pianoapi.jsdisco.dev as its source.
- Fixes that come from bug reports on the original repository credit the
  reporter in the commit (`Reported-by:`) and link the original issue.

## License

[MIT](./LICENSE). The original copyright notice is kept alongside ours.
