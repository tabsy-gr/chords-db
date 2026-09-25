# Verifiers

People who may sign off voicings as verified (`"verified": { "by", "date" }`
on a voicing). A verified voicing has been played or checked by one of them,
on top of passing the validator. Consumers may choose to show only verified
voicings, for example for the bouzouki.

| GitHub | Name | Instruments |
| --- | --- | --- |
| `geoioannid` | Giorgos Ioannidis | all: bouzouki (tetrachordo, trichordo), guitar, ukulele, ukulele-d, cavaquinho, piano |

To sign off voicings you have checked:

    npm run verify -- --by <your-login> <voicing-id> [<voicing-id> …]

An id ending in `*` stamps every voicing with that prefix. Commit the result;
the stamp records who and when. To become a verifier, add yourself here in a
pull request.
