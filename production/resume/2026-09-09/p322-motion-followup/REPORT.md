# p322 motion followup: retain the merged geometric candidate

None of the six earlier-release / curve-timing trials qualifies. They reduce the release fingertip peak modestly, but all introduce Index–Middle / Index–Ring pair regressions and slightly increase the Index MCP peak. The existing merged p322 delta is retained; no further score or runtime change is recommended from this bounded followup.

The parent current merged score was identified as `e069b93647c20a4b9c6f5b932966a0efcac2daad3f9fa4bc7edf82cca845097b`. The replay uses the previously delivered isolated geometric equivalent, as requested. No Site checkout was edited.

## Fixed and varied fields

The p322 attack (71.178428), MIDI 43, velocity 0.555, written duration 0.324909, contact settings, wrist trajectory, pedal and three neighboring-finger support curves remain fixed. The next Index attack remains 71.531337. Every trial preserves the pre-release joint pose and restores exact joint parity at that next attack. All RH quaternions remain exact.

Only the physical duration, its exact idle-envelope duration guard, and the released Index curve timing vary. The original physical note-off is 71.448396. Releases 10, 20 and 30 ms earlier were tried with:

- **Scaled:** all four release-curve knot offsets are multiplied by the new gap / old gap ratio, retaining the same phase within the longer transfer.
- **Fixed:** the original +13, +27 and +60 ms curve offsets remain relative to the earlier release.

Every curve keeps the established 4° MCP lift, −4° spread, 16° PIP lift, and 0° DIP control. Exact fields and knots are in `trials.json`.

All trial releases occur under the unchanged pedal value 0.73. The intended acoustic behavior is pedal-supported ringing while the finger gets more travel time. No remaster or listening comparison was performed; none of these physical note-off changes is accepted.

## Paired results

Every variant and the reference was measured at the same 481 times over 70.821600–71.700000: 240 Hz across the local support interval, 1 kHz across release/transfer, and all relevant musical/curve boundaries plus ±1 µs. The held target core stays at 2.182062 mm in every trial.

| Variant | Physical note-off | Transfer tip peak, m/s | Index MCP peak, rad/s | Added >3 mm key rows | Added pair rows |
|---|---:|---:|---:|---:|---:|
| Current reference | 71.448396 | 3.012585 | 75.411428 | 0 | 0 |
| −10 ms, scaled | 71.438396 | 2.826199 | 75.642518 | 0 | 57 |
| −10 ms, fixed | 71.438396 | 2.826199 | 75.642518 | 0 | 57 |
| −20 ms, scaled | 71.428396 | 2.856084 | 76.215978 | 0 | 61 |
| −20 ms, fixed | 71.428396 | 2.856084 | 76.215978 | 0 | 61 |
| −30 ms, scaled | 71.418396 | 2.891468 | 76.809034 | 2 | 56 |
| −30 ms, fixed | 71.418396 | 2.891468 | 76.809034 | 0 | 56 |

The current reference's 75.411 rad/s versus the prior 75.192 rad/s report reflects the different finite sampling grid, not a source change. `comparison.json` retains exact peak time intervals and every added key/pair row. New pair rows include any newly appearing or increased exact triangle-pair count; no positive pair allowance is used. Key comparisons use the existing 3 mm threshold and 0.05 mm allowance against an already deeper matching key/patch baseline collision.

The first added Index–Middle crossings occur at 71.444000 for −10 ms, 71.434000 for −20 ms, and 71.425000 for −30 ms. Thus the slower fingertip motion does not provide a collision-free hand transfer with these fixed support/curve controls. A broader solver or support-pose change would exceed the authorized followup, so no further search was performed.

## Evidence

`comparison.json`, `trials.json`, the source/score variants, `build-trials.py`, `compile-trials.mjs`, `probe.mjs`, and `compare.py` reproduce the finite experiment. `evidence.json.gz` losslessly contains all seven paired probe outputs. `source-manifest.json` and `SHA256SUMS` bind the exact files.
