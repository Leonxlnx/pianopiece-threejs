The held-thumb/core problem predates the endpoint substitutions. The frozen public score has 38 severe notes in 21 settled-grip families; the provisional endpoint score has 62 in 30. Five newly reviewed families have clearly visible under-edge thumb deformation, and one further family is a candidate regression. The other sixteen newly reviewed families have smaller measured contact intrusions and are not promoted as separate major posture defects.

| Score | Thumb notes | Held samples | Severe notes | Settled-grip families |
|---|---:|---:|---:|---:|
| Public b156 | 289 | 1,445 | 38 | 21 |
| Candidate 8d92 | 312 | 1,560 | 62 | 30 |

Of the 62 candidate severe notes, 37 were already severe in b156, 23 are new thumb assignments, and two are existing thumbs newly severe after candidate wrist changes (p00419, p00781). Baseline severe notes no longer severe: p00855.

Primary additional queue (existing eight endpoint families remain composer-owned):

| Family | Notes | Core depth, mm | Below top, mm | Finding |
|---|---|---:|---:|---|
| T002 | p00013, p00310, p00317 | 6.25 | 7.21 | Thumb side/body intersects the white-key front edge; the lower thumb contour is cut away at contact. Clear solid overlap in the full-size representative, with an otherwise less extreme pose than the deepest families. |
| T033 | p00323 | 5.89 | 11.03 | Right thumb curls from below the front edge and reads as a small disconnected tip above the key. Same visible under-edge failure as the earlier rejected p00528 substitution. |
| T043 | p00419, p00781 | 4.09 | 5.45 | Existing thumbs p00419/p00781 cross the severe-core threshold after the candidate wrist changes. The representative shows edge clipping, less dramatic than the five primary visible families; correct this bounded regression with the endpoint batch. |
| T044 | p00423 | 5.39 | 9.32 | Right thumb body curls under the hand and key front; the played-key surface cuts through the thumb silhouette. |
| T046 | p00427, p00522 | 7.84 | 14.59 | Left thumb body passes through the white-key front and only its distal tip/nail emerges above the key. Clearly visible under-edge fold. |
| T092 | p00789, p00932, p00949 | 7.84 | 14.59 | Left thumb repeats the deep under-edge fold: key edge divides the thumb body from its visible distal tip. |

Measurement: actual body-mesh vertices carrying at least 65% total skin weight to the three thumb joints are transformed into the played key's animated local coordinates. Its bounding box is shrunk by the actual bevel radius (white 1.4mm, black 2mm), excluding ambiguous bevel/cap contact. A severe sample has at least one such vertex more than 3mm from the closest of the six key faces. The separate below-top measurement is vertical depth below the top, not minimum penetration depth. The 3mm cutoff matches the magnitude of the existing contact tolerance; it is an engineering screen, not a clinical or perceptual threshold.

All thumb notes were sampled at held fractions 0.001, 0.25, 0.5, 0.75, and 0.999. Equivalent families use the 25%-held wrist/key-relative pose, quaternion, lift, and simultaneous grip, quantized to 1e-5. Grouping settled poses does not claim equivalent approach/release trajectories. Five samples for every note are preserved in the raw reports.

This checks the played key core and thumb-owned vertices. It is not a complete triangle, adjacent-key, palm, or continuous-time collision test. The 22 new representative images are actual offline renders of the same frozen rig and model; they do not verify live browser rendering.

The experimental solid candidate was separately frozen at hash 5909c1c2292cc334378c6ee7057bc39309ce35f44ebdb43f0ff74f77287c1662. Its three tested notes p00775, p00414, and p00528 have zero inside-core vertices across all 15 held samples. This is a bounded geometry pass only; it does not accept the whole experimental score.

Exact hashes:

baseline:
- score: `b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773`
- rigSource: `fedec1a81e52ccfc87527b3522100d8a6facd2674b6ed2a7b145e50f48cdc184`
- compiledRig: `95c86dc13c75058c1ca836adc458a1a3d723515d679eb18600f5c1ae9c5f02d2`
- model: `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`

candidate:
- score: `8d92b2080768b6cfc8cc81a9e6ad1ff2d56577ca96078510281da5b0b090c4fb`
- rigSource: `fedec1a81e52ccfc87527b3522100d8a6facd2674b6ed2a7b145e50f48cdc184`
- compiledRig: `95c86dc13c75058c1ca836adc458a1a3d723515d679eb18600f5c1ae9c5f02d2`
- model: `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`

Files: `reviewed-family-queue.json` contains all 30 severe families and exact priorities/image paths. `screen-b156.json` and `screen-8d92.json` contain every sample, actual vertex evidence, chains, signatures, and hashes. `visual-sample-rendered.json` maps all 22 additional representatives. Contact sheets: `render-new-L/review-sheet-0.jpg`, `render-new-L/review-sheet-1.jpg`, `render-new-R/review-sheet-0.jpg`.

Reproduce from this directory:

```sh
SCORE_PATH=score-b156.json SCREEN_REPORT=screen-b156.json node screen.mjs
SCORE_PATH=score-8d92.json SCREEN_REPORT=screen-8d92.json node screen.mjs
SCORE_PATH=score-solid-spot.json SCREEN_REPORT=screen-solid-spot.json NOTE_IDS=p00775,p00414,p00528 node screen.mjs
```
