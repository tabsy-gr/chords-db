# Verifiers

People who may sign off voicings as verified (`"verified": { "by", "date" }`
on a voicing). A verified voicing has been played or checked by one of them,
on top of passing the validator. Consumers may choose to show only verified
voicings, for example for the bouzouki.

| GitHub | Name | Instruments |
| --- | --- | --- |
| `geoioannid` | Giorgos Ioannidis | bouzouki (tetrachordo, trichordo) |

To sign off voicings you have checked:

    npm run verify -- --by <your-login> <voicing-id> [<voicing-id> …]

An id ending in `*` stamps every voicing with that prefix. Commit the result;
the stamp records who and when. To become a verifier, add yourself here in a
pull request.

## Scales

The scale library (`data/scales.json`) has no `verified` stamps; instead each
scale carries a `confidence` rating from the research
([docs/scales-research.md](./docs/scales-research.md)): `high` means the
sources agree and the equal-tempered form is settled, `low` means they
disagree or the makam has a neutral pitch 12-TET cannot play. If you play a
scale and its formula here is wrong for real playing, open an issue
naming the scale and the correction, ideally with a source; entries,
especially the low-confidence `kiourdi`, `sabah`, `houzam` and `segkiah`, can
be corrected with one.
