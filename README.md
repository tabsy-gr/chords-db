# chords-db

> **Pre-release.** This fork is under active development and nothing here is
> stable yet; see the [Roadmap](#roadmap).

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

Each instrument is published as one JSON file: the instrument, and its chords
grouped by key.

```js
import guitar from '@tabsy-gr/chords-db/guitar' with { type: 'json' };
import { toChordDiagram } from '@tabsy-gr/chords-db';

const cMajor = guitar.chords.C.find((chord) => chord.suffix === 'major');
const voicing = cMajor.voicings[0];
// { id: 'guitar/C/major/1', frets: [-1, 3, 2, 0, 1, 0],
//   fingers: [0, 3, 2, 0, 1, 0], sources: [...], midi: [48, 52, 55, 60, 64] }

// Frets relative to a base fret, as chord-diagram renderers expect:
toChordDiagram(voicing, guitar.instrument.tunings.standard);
// { frets: [-1, 3, 2, 0, 1, 0], fingers: [...], baseFret: 1, barres: [], midi: [...] }
```

Also published: `@tabsy-gr/chords-db/ukulele`, `/piano`, `/instruments` (an
index with chord and voicing counts), and the JSON Schemas under `/schema/*`.

## Data format

The source data lives in `data/`, one directory per instrument:

```
data/guitar/
├── instrument.json            # tunings, keys and suffixes
└── chords/
    └── D/
        └── sus2.json          # every voicing of D sus2
```

File names spell `#` as `sharp` and `/` as `_` (`chords/Csharp/m_E.json` is
C#m/E). Every file is checked against the JSON Schemas in `schema/`. For
example, part of `data/guitar/chords/D/sus2.json`:

```json
{
  "$schema": "../../../../schema/chord.schema.json",
  "key": "D",
  "suffix": "sus2",
  "voicings": [
    {
      "id": "guitar/D/sus2/1",
      "frets": [-1, -1, 0, 2, 3, 0],
      "fingers": [0, 0, 0, 2, 3, 0],
      "sources": [{ "type": "upstream", "ref": "tombatossals/chords-db@df06fa7" }]
    },
    {
      "id": "guitar/D/sus2/4",
      "frets": [-1, 7, 7, 7, 10, 10],
      "fingers": [0, 1, 1, 1, 4, 4],
      "barres": [7, 10],
      "capo": true,
      "sources": [{ "type": "upstream", "ref": "tombatossals/chords-db@df06fa7" }]
    }
  ]
}
```

A fretted voicing has:

- `id`: permanent. Assigned once when the voicing is added and never changed,
  even if the voicing is corrected or moved, so issues and tests can refer to
  it.
- `frets`: the absolute fret on each course, lowest first. `-1` is muted and
  `0` is open.
- `fingers`: the finger on each course: `1` (index) to `4` (little), `"T"`
  (thumb), or `0` (none).
- `barres` (optional): the frets barred by one finger.
- `capo` (optional): draw the barre as a capo.
- `sources`: where the voicing comes from.
- `verified` (optional): who confirmed it, and when.

A keyboard (piano) voicing has `notes` (note names, lowest first) and
`degrees` (each note's chord degree, e.g. `"b7"`) instead of `frets` and
`fingers`.

Run `npm run format:data` after editing data files; CI checks the formatting.

## Validation

Every voicing is checked against two sets of rules, defined in
`src/validate.ts`:

- **Notes.** Every note is a tone of the chord, every required tone sounds,
  and a slash chord's lowest note is its bass. What each chord contains, and
  which tones a voicing may leave out, is in `data/qualities.json`, with a
  source cited for every formula. The formulas are also cross-checked against
  the [tonal](https://github.com/tonaljs/tonal) library, and every
  disagreement is documented in `test/qualities.test.ts`.
- **Fingering** (fretted instruments). Every fretted string has a finger; no
  finger is on two frets; fingers don't cross; barres are declared, played by
  one finger, and don't sit over open or lower-fretted strings; and the hand
  stays within the instrument's fret span.

Voicings should also be ordered easiest first, by a playability score.

The same checks are published, so you can validate voicings of your own:

```js
import { validateVoicing } from '@tabsy-gr/chords-db';

validateVoicing(guitar.instrument, { key: 'C', suffix: 'major' }, voicing);
// { ok: false, issues: [{ rule: 'notes/foreign', severity: 'error',
//   message: 'F not in Cmajor (1 3 5)', voicingId: '…' }] }
```

[`reports/validation.md`](./reports/validation.md) lists every current
finding. The data inherited from the original database is still being
corrected, so for now CI only checks that the report is up to date. Once the
data is clean, any error will fail CI.

## Development

```sh
npm install
npm run build:data   # regenerate lib/ from data/
npm run format:data  # format data/ files
npm run test:run     # run the test suite
npm run validate     # regenerate reports/validation.md
npm run typecheck
npm run build        # regenerate lib/ and build the package
npm run authors      # regenerate AUTHORS from git history
```

## Roadmap

1. ~~A new data format: JSON files checked against a JSON Schema, plain number
   arrays instead of hex strings, and a stable ID and source for every voicing.~~
   Done.
2. ~~A validator that checks every voicing's notes against the chord's
   intervals and that its fingering can actually be played.~~ Done; see
   [Validation](#validation).
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
