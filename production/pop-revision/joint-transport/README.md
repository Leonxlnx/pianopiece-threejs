# Joint transport review

These are frozen candidates and measurements. The application in this checkpoint retains the previously accepted thumb, held-grip and elbow changes; the natural nonthumb transport is still being combined and reviewed.

The actual application baseline is commit `b8c30b0e21d56606e6b158b8079d86c316c0d18f`. Both that baseline and V6 pass the 60 Hz hand-shape bounds. The excessive folds documented under `rejected-travel/` belong to a different, rejected world-space solver.

| Complete 60 Hz measure | Current application | V6 candidate |
| --- | ---: | ---: |
| Frames checked | 13,628 | 13,628 |
| Severe key-intersection frames | 731 | 240 |
| Severe patch/key rows | 821 | 249 |
| Maximum key-core depth | 7.959 mm | 7.246 mm |
| Fingertip-speed failures | 4 | 0 |
| Held-pad samples outside the retained bound | 0 / 5,055 | 0 / 5,055 |
| Pair-positive frames | 1,516 | 1,434 |
| Finger-surface pair rows | 1,731 | 1,569 |
| Intersecting triangle incidences | 41,442 | 94,731 |
| Opposing-hand rows | 0 | 0 |

The changes are mixed. V6 clears many key crossings but introduces others, and moving Middle/resting Ring crossings account for most of the added triangle incidence. Triangle counts are not penetration depths. Complete timestamp rows and source-aware event indexes remain available; no failed row or threshold was removed to make the candidate pass. A crossing that moves in time is distinguished from a genuinely new complete-gesture failure.

V7 adds twelve locally verified distal-timing controls to V6. Across 375 actual skin times and 120 held-pad samples, these clear the selected neighboring-finger routes without introducing or increasing pair or severe-key rows. Its whole-song scan retains all 249 V6 severe-key rows unchanged; eleven additional shallow-hit frames remain explicit. This is a local neighbor repair, not a global clearance result.

The separately approved E3 voicing changes only two accompaniment pitches and two bar labels. Its dense thumb check eliminates 4,448 triangle incidences across 482 matched times, with all retained contact and motion bounds passing. Root reviewed five actual V7/E3 poses. A fresh matching audio render is still required before the two-note revision enters the public performance.

## Files and reproduction

- `v6/`: source patch against the stated application baseline, frozen score, eleven reviewed images and complete key failure inventory.
- `v7/`: patch against V6, twelve explicit controls, exact score including the separate E3 option, numerical comparison and five reviewed images.
- `e3-voicing/`: exact audible/metadata delta, generator patch and musical/physical justification.
- `current-v6/`: direct current-application comparison, including complete whole-song key and pair observations.
- `portable-reports.json`: original diagnostic hash, portable JSON hash and stored-file hash for every newly packaged numerical report. Files ending in `.json.gz` are ordinary gzip; decompression produces the exact listed portable JSON bytes.

Portable copies omit raw vertex coordinates and workspace paths. They preserve every failure, case, source checksum, count and threshold. The original diagnostics remain unchanged. Finite 60 Hz scans are not continuous collision proofs and do not replace final 240 Hz motion/contact verification or actual visual review.
