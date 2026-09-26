# chords-db

> **Pre-release.** This fork is under active development and nothing here is
> stable yet; see the [Roadmap](#roadmap).

A database of chord voicings for string instruments and piano, where every
voicing is checked for correctness. It also publishes a library of scales
(the Greek dromoi, the major/minor family, the church modes, pentatonics and
blues), with a cited source for every formula — see [Scales](#scales).

**This is a general-purpose, open-source library (MIT), intended for anyone:**
chord finders, diagram renderers, music-education tools, your own project.
Nothing in the data or the API is tied to any product or website — if you
find something here that only makes sense for Tabsy's own use, that is a bug:
please open an issue.

This is a hard fork of [tombatossals/chords-db](https://github.com/tombatossals/chords-db)
by David Rubert and contributors, which is no longer maintained. It is
maintained by [Tabsy](https://tabsy.gr) and its contributors.

**Adopting this fork from the original?** Every difference from the original
database is documented:

- [MIGRATING-FROM-CHORDS-DB.md](./MIGRATING-FROM-CHORDS-DB.md): what changed in
  the package, the data format and the API, and how to move over.
- [UPSTREAM-DIFF.md](./UPSTREAM-DIFF.md): every voicing that was added,
  corrected, relabelled or removed, and why. Generated, and checked by the
  tests.

## Instruments

| Instrument | Tuning                 | Source                 |
| ---------- | ---------------------- | ---------------------- |
| Guitar     | Standard (E A D G B E) | tombatossals/chords-db |
| Ukulele    | Standard (G C E A)     | tombatossals/chords-db |
| Piano      | n/a                    | Generated from `data/qualities.json` |
| Ukulele (D tuning) | A D F# B      | Generated from the ukulele ([tombatossals/chords-db#32](https://github.com/tombatossals/chords-db/pull/32)) |
| Cavaquinho | D G B D                | [tombatossals/chords-db#43](https://github.com/tombatossals/chords-db/pull/43), validated |
| Bouzouki, tetrachordo | C F A D (octave courses) | Reference dataset A, validated; awaiting sign-off (see [VERIFIERS.md](./VERIFIERS.md)) |
| Bouzouki, trichordo | D A D (octave course) | Reference dataset A, validated; awaiting sign-off |

## Install

```sh
npm install @tabsy-gr/chords-db
```

The package is published to GitHub Packages on every change to `master`,
which requires a GitHub token with `read:packages` even for public packages.
Add to your `.npmrc`:

```
@tabsy-gr:registry=https://npm.pkg.github.com
``` It will also be published to
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

Also published: `@tabsy-gr/chords-db/ukulele`, `/ukulele-d`, `/cavaquinho`,
`/bouzouki-cfad`, `/bouzouki-dad`,
`/piano`, `/instruments` (an
index with chord and voicing counts), and the JSON Schemas under `/schema/*`.

## Drawing a diagram

The database holds data, not pictures. To draw a chord diagram in React, pair
it with a renderer such as
[@techies23/react-chords](https://www.npmjs.com/package/@techies23/react-chords)
(a maintained fork of tombatossals/react-chords). `toChordDiagram()` returns the
shape it expects:

```jsx
import Chord from '@techies23/react-chords';
import guitar from '@tabsy-gr/chords-db/guitar';
import { findChord, toChordDiagram } from '@tabsy-gr/chords-db';

const courses = guitar.instrument.tunings.standard;
const instrument = {
  strings: courses.length,
  fretsOnChord: guitar.instrument.maxFretSpan,
  name: guitar.instrument.name,
  keys: [],
  tunings: { standard: courses.map((course) => course[0].replace(/\d+$/, '')) },
};

export function ChordDiagram({ symbol, position = 0 }) {
  const chord = findChord(guitar, symbol);
  if (!chord) return null;
  const diagram = toChordDiagram(chord.voicings[position], courses);
  return <Chord chord={diagram} instrument={instrument} />;
}

// <ChordDiagram symbol="Am7" />, <ChordDiagram symbol="F#ø" position={1} />
```

Voicings are ordered easiest first, so position 0 is a sensible default. A
thumb (`"T"` in `fingers`) is drawn as a "T" on its dot.

## Chord symbols

`parseChordSymbol()` reads a chord symbol the way people write it, and
`findChord()` looks it up in an instrument's data whatever the enharmonic
spelling:

```js
import { parseChordSymbol, findChord } from '@tabsy-gr/chords-db';

parseChordSymbol('F♯ø');   // { root: 'F#', suffix: 'm7b5', bass: null, quality: … }
parseChordSymbol('Am/G');  // { root: 'A', suffix: 'm/G', bass: 'G', … }
findChord(guitar, 'A#m7'); // the Bbm7 chord (guitar lists B♭, not A♯)
findChord(guitar, 'D/Gb'); // the D/F# chord
```

Quality synonyms (`min`, `-`, `mM7`, `6/9`, `sus`, …) are spellings in
`data/qualities.json`; symbols (`ø`, `Δ`, `°`, `+`, `♯`, `♭`) are in
`data/notation.json`. Symbols are only read after a chord's root, so the
Greek capital Delta (Δ) in lyrics is never taken for a chord.
`chordSymbolSource()` gives a regular expression for finding chord symbols in
text. No canonical suffix starts with `b`, because `Cb5` reads as C-flat.

## Scales

The package also publishes `data/scales.json`: the Greek dromoi, the
major/minor family, the church modes, the pentatonics and the blues scales —
27 scales, every formula with a cited source. The research behind them, with
the full source quotes, is in
[docs/scales-research.md](./docs/scales-research.md).

```js
import { scales, scaleById, scalePitchClasses } from '@tabsy-gr/chords-db';

scaleById('hitzaz').aliases.el;          // ['Χιτζάζ', 'Χιτζαζ']
scaleById('hitzaz').tonalName;           // 'phrygian dominant'
scalePitchClasses('hitzaz');             // [0, 1, 4, 5, 7, 8, 10]
```

By family:

**Dromoi.** The Greek modes, as played on fretted instruments. They default
to the tonic D, because the bouzouki is tuned D-A-D.

| id | Greek | Formula | Confidence | tonal name |
| --- | --- | --- | --- | --- |
| `ousak` | Ουσάκ | 1 b2 b3 4 5 b6 b7 | high | `phrygian` |
| `kiourdi` | Κιουρντί | 1 2 b3 4 b5 6 b7 | low | — |
| `hitzaz` | Χιτζάζ | 1 b2 3 4 5 b6 b7 | high | `phrygian dominant` |
| `hitzazkiar` | Χιτζαζκιάρ | 1 b2 3 4 5 b6 7 | high | `double harmonic major` |
| `rast` | Ραστ | 1 2 3 4 5 6 7 (desc. b7) | medium | `major` |
| `sabah` | Σαμπάχ | 1 2 b3 b4 5 b6 b7 | low | — |
| `niavent` | Νιαβέντ | 1 2 b3 #4 5 b6 7 | high | `hungarian minor` |
| `nikriz` | Νικρίζ | 1 2 b3 #4 5 6 b7 | high | `dorian #4` |
| `houzam` | Χουζάμ | 1 #2 3 4 5 b6 7 | low | — |
| `peiraiotikos` | Πειραιώτικος | 1 b2 3 #4 5 b6 b7 | medium | — |
| `karsigar` | Καρσιγάρ | 1 2 b3 4 b5 6 b7 | medium | — |
| `segkiah` | Σεγκιάχ | 1 #2 3 4 5 6 7 (desc. b7) | low | — |

**Major/minor family, modes, pentatonics, blues.** Western scales, all with
an exact tonal match; they default to C (major family and modes) or A (minor
family, blues).

| id | Greek | Formula | tonal name |
| --- | --- | --- | --- |
| `meizona` | Μείζονα (Ματζόρε) | 1 2 3 4 5 6 7 | `major` |
| `fysiki-elassona` | Φυσική ελάσσονα | 1 2 b3 4 5 b6 b7 | `minor` |
| `armoniki-elassona` | Αρμονική ελάσσονα | 1 2 b3 4 5 b6 7 | `harmonic minor` |
| `melodiki-elassona` | Μελωδική ελάσσονα | 1 2 b3 4 5 6 7 (desc. natural minor) | `melodic minor` |
| `ionikos` | Ιωνικός | 1 2 3 4 5 6 7 | `ionian` |
| `dorios` | Δώριος | 1 2 b3 4 5 6 b7 | `dorian` |
| `frygios` | Φρύγιος | 1 b2 b3 4 5 b6 b7 | `phrygian` |
| `lydios` | Λύδιος | 1 2 3 #4 5 6 7 | `lydian` |
| `mixolydios` | Μιξολύδιος | 1 2 3 4 5 6 b7 | `mixolydian` |
| `aolikos` | Αιολικός | 1 2 b3 4 5 b6 b7 | `aeolian` |
| `lokrios` | Λόκριος | 1 b2 b3 4 b5 b6 b7 | `locrian` |
| `pentatoniki-mizona` | Μείζονα πεντατονική | 1 2 3 5 6 | `major pentatonic` |
| `pentatoniki-elassona` | Ελάσσονα πεντατονική | 1 b3 4 5 b7 | `minor pentatonic` |
| `blouz` | Μπλουζ | 1 b3 4 b5 5 b7 | `minor blues` |
| `blouz-mizona` | Μείζονα μπλουζ | 1 2 b3 3 5 6 | `major blues` |

**The 12-TET caveat.** The dromoi come from Turkish makams, which have
microtones that fretted, equal-tempered instruments cannot play. Rebetiko has
been played on such instruments since the early 1930s, so each dromos here is
the equal-tempered form Greek sources teach, not the makam it came from.
Also:

- Greek dromos names do not always mean what the homonymous Turkish makam
  means: the Greek Ουσάκ is the Turkish *Kürdî*, and the Greek Νιαβέντ is the
  Turkish *Neveser*, not *Nihavend*. Each entry's `caveats: ['naming']` flags
  this.
- Low-confidence entries (`kiourdi`, `sabah`, `houzam`, `segkiah`) are ones
  where Greek sources disagree, or where the makam's tonic is a neutral pitch
  12-TET cannot represent. Σαμπάχ's upper octave is not a clean octave
  (`caveats: ['non-octave']`), so its pitch classes end on the b7.
- Scales that share a pitch-class set with another scale are linked through
  `sameNotesAs` rather than duplicated: Ουσάκ ↔ Φρύγιος, Κιουρντί ↔
  Καρσιγάρ, Ραστ ↔ Μείζονα.

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
- `rootless` (optional): the voicing deliberately leaves out the root, as
  extended chords on four-string instruments often do.
- `sources`: where the voicing comes from.
- `verified` (optional): who confirmed it, and when.

A keyboard (piano) voicing has `notes` (note names, lowest first) and
`degrees` (each note's chord degree, e.g. `"b7"`) instead of `frets` and
`fingers`, and can also be `rootless`.

`data/scales.json` holds the scale library (see [Scales](#scales)). Each
scale has:

- `id`, `name` (English) and `family` (`dromos`, `major-minor`, `mode`,
  `pentatonic`, `blues`).
- `intervals`: every note of the ascending scale, tonic first, as degrees
  (`"1"`, `"b2"`, …). `descending` (optional) lists the descending form where
  it differs (Ραστ, Σεγκιάχ, μελωδική ελάσσονα).
- `aliases`: the names musicians use, per language — `el` (Greek, required),
  `tr` (Turkish), `en` (English).
- `defaultTonic`: the root the scale is conventionally taught on. `D` for the
  dromoi (the bouzouki is tuned D-A-D), `C` for the major family and modes,
  `A` for the minor family and blues.
- `tonalName` (optional): the [tonal](https://github.com/tonaljs/tonal)
  library's name for the scale with the same intervals.
- `tetrachords` (optional): how a dromos is built — the lower tetrachord (or
  pentachord) and the upper one, e.g. `["hitzaz", "ousak"]`.
- `confidence` (`high`, `medium`, `low`) and `caveats` (`microtonal`,
  `naming`, `contested`, `non-octave`), which decide the caveat text
  consumers show.
- `sameNotesAs` (optional): ids of scales with exactly the same intervals, in
  the same order.
- `sources`: where the claims come from; every scale cites at least one
  source, and a `cited` source carries the quote. The full research report
  with all quotes is in [docs/scales-research.md](./docs/scales-research.md).

Run `npm run format:data` after editing data files; CI checks the formatting.

When a change makes a voicing differ from the original database, add an entry
to `data/changes.json` saying which voicings and why, then run
`npm run upstream-diff`. The tests fail on any unexplained difference.

## Validation

Every voicing is checked against two sets of rules, defined in
`src/validate.ts`:

- **Notes.** Every note is a tone of the chord, every required tone sounds,
  the root sounds unless the voicing is marked `rootless` (and doesn't if it
  is), and a slash chord's lowest note is its bass. What each chord contains, and
  which tones a voicing may leave out, is in `data/qualities.json`, with a
  source cited for every formula. The formulas are also cross-checked against
  the [tonal](https://github.com/tonaljs/tonal) library, and every
  disagreement is documented in `test/qualities.test.ts`.
- **Fingering** (fretted instruments). Every fretted string has a finger; no
  finger is on two frets; fingers don't cross; barres are declared, played by
  one finger, and don't sit over open or lower-fretted strings; and the hand
  stays within the instrument's fret span.

The scale library has its own suite, `test/scales.test.ts`: every scale has
at least one source; the ones with a `tonalName` match the
[tonal](https://github.com/tonaljs/tonal) library's chroma exactly; the
custom scales (no tonal match) match the chromas recorded in the research;
`sameNotesAs` is symmetric and the intervals are truly equal. The schema in
`schema/scales.schema.json` is checked in `test/schema.test.ts`.

Voicings should also be ordered easiest first, by a playability score.

The same checks are published, so you can validate voicings of your own:

```js
import { validateVoicing } from '@tabsy-gr/chords-db';

validateVoicing(guitar.instrument, { key: 'C', suffix: 'major' }, voicing);
// { ok: false, issues: [{ rule: 'notes/foreign', severity: 'error',
//   message: 'F not in Cmajor (1 3 5)', voicingId: '…' }] }
```

**Any validation error fails CI**, so every voicing in a release passes these
checks. Warnings are allowed and are listed, with every other finding, in
[`reports/validation.md`](./reports/validation.md), which CI keeps up to date.

## Development

```sh
npm install
npm run build:data   # regenerate lib/ from data/
npm run format:data  # format data/ files
npm run test:run     # run the test suite
npm run validate     # regenerate reports/validation.md
npm run upstream-diff  # regenerate UPSTREAM-DIFF.md from data/changes.json
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
3. ~~Fixes for the incorrect voicings reported against the original database.~~
   Done; see [UPSTREAM-DIFF.md](./UPSTREAM-DIFF.md).
4. ~~Chord-symbol aliases and a reference parser (`C°7`, `Cø`, `CΔ7`, …).~~
   Done; see [Chord symbols](#chord-symbols).
5. ~~Greek bouzouki: tetrachordo (C F A D) and trichordo (D A D).~~ Added;
   the voicings are being signed off by the verifiers in
   [VERIFIERS.md](./VERIFIERS.md).
6. Scale library (`data/scales.json`). Added; see [Scales](#scales). The
   low-confidence dromoi (`kiourdi`, `sabah`, `houzam`, `segkiah`) are open
   to correction: the sources disagree, and the books that would settle them
   (Signell, *Makam: Modal Practice in Turkish Art Music*; Mavroeidis, *Οι
   μουσικοί τρόποι στην Ανατολική Μεσόγειο*; Voúlgaris & Vandarákis, 2007)
   are not available online. Corrections welcome with a source.

## Credits

- **[David Rubert](https://github.com/tombatossals)** created the original
  chords-db, together with the contributors listed in [AUTHORS](./AUTHORS).
- The cavaquinho was contributed by Hugo Rezende
  ([tombatossals/chords-db#43](https://github.com/tombatossals/chords-db/pull/43)), and
  the ukulele in D tuning follows Henry's approach
  ([tombatossals/chords-db#32](https://github.com/tombatossals/chords-db/pull/32)).
- The piano data was contributed upstream by Claudemir Casa
  ([tombatossals/chords-db#34](https://github.com/tombatossals/chords-db/pull/34)),
  who names pianoapi.jsdisco.dev as its source.
- The bouzouki shapes come from a reference used with its owner's
  permission (reference dataset A); by agreement it is not named.
- Fixes that come from bug reports on the original repository credit the
  reporter in the commit (`Reported-by:`) and link the original issue.

## License

[MIT](./LICENSE). The original copyright notice is kept alongside ours.
