# Upstream v0.6.0 snapshot

The generated `lib/*.json` of [tombatossals/chords-db](https://github.com/tombatossals/chords-db)
at commit `df06fa7` (v0.6.0), byte for byte, taken with
`git show df06fa7:lib/<file>.json`.

It is the baseline for:

- `scripts/upstream-diff.ts` and `test/upstream-diff.test.ts`, which compare
  every voicing in `data/` with upstream and require each difference to be
  explained in `data/changes.json`; and
- the generated `UPSTREAM-DIFF.md`.

Never edit these files.
