# Repository instructions

Context for GitHub Copilot when reviewing pull requests in this repository —
and for anyone (human or agent) changing this code. Read this before judging
a change.

## What this repository is

A **general-purpose, open-source (MIT) chord and scale database** intended to
be used by anyone: chord finders, diagram renderers, music-education tools,
any project. It is a maintained fork of tombatossals/chords-db.

**Blocking review rule:** nothing here may reference or serve Tabsy's own
products. Flag any change that mentions or depends on the tabsy.gr app,
dashboard, API, or consumer route structures (e.g. `/klimakes`, `/akorda`),
or that adds product-specific behaviour instead of reusable data/API. The
public API and the docs must make sense to a consumer who has never heard of
Tabsy.

## How the data works (what a good PR must respect)

- `data/` is the source of truth; `lib/` and `reports/validation.md` are
  **generated**. Never hand-edit them; regenerate with `npm run build:data`
  and `npm run validate` and commit the result. CI fails if they are stale.
- Every chord quality (`data/qualities.json`) and scale
  (`data/scales.json`) entry **cites a source**. `derivation: "cited"`
  requires a verbatim `quote`; `derivation: "compositional"` requires an
  `explanation`. A PR adding or changing a formula without a checkable source
  should not be approved.
- All data files validate against the JSON Schemas in `schema/`, and must be
  canonically formatted (`npm run format:data`; CI checks it).
- Voicing `id`s are **permanent**: assigned once, never renamed or moved, so
  verifiers and issues can refer to them.
- Scale conventions: dromoi default to tonic D (the bouzouki is tuned D-A-D),
  Western scales to C or A; `confidence` (`high|medium|low`) and `caveats`
  (`microtonal|naming|contested|non-octave`) must be justified by the sources;
  Greek dromos names are **not** the homonymous Turkish makams (Greek Ουσάκ =
  Turkish Kürdî) — copy that claims otherwise should be flagged.
- Formulas are cross-checked against the tonal library in
  `test/qualities.test.ts` and `test/scales.test.ts`. New or changed data
  needs matching test coverage; a documented divergence from tonal is fine,
  a silent one is not.
- Docs (`README.md`, `VERIFIERS.md`, `CHANGELOG.md`) are part of a data PR:
  changes to the data format or additions to the library must update them in
  the same PR.

## Housekeeping

- No scratch files: `.handoff/`, transcripts, local notes must not be
  committed.
- Commit titles follow Conventional Commits (`feat:`, `fix:`, `docs:`,
  `chore(data):`, …).
- `npm run typecheck`, `npm run test:run` and `npm run check:format` must
  pass; CI runs the same plus the build.
