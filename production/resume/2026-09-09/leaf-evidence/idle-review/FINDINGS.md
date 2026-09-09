# Completed replay findings

Completed 13,441 timestamps, 17,019 affected-hand states and 102,114 patch states across all 120 records (85 index gaps, 35 curves).

| Measure | Baseline | Candidate / regression |
|---|---:|---:|
| Core-positive patch states (>3 mm) | 4,330 | 3,633 |
| Core-positive patch/key states (>3 mm) | 4,769 | 4,064 |
| New >3 mm patch states | — | 0 |
| >0.25 mm worsened deep patch states | — | 0 |
| New >3 mm patch/key states | — | 4 |
| >0.25 mm worsened deep patch/key states | — | 4 |
| New finger-pair type states | — | 0 |
| New own-palm type states | — | 0 |
| Strict existing finger-pair increases | — | 1,028 |
| Strict existing own-palm increases | — | 1 |
| Existing pair increases >2 (finger / own-palm) | — | 806 / 0 |

There are 1,017 regression hand states, including 1,013 with only strict existing-pair count increases. The detailed queue contains 86 entries (4 core/new-type and 82 strict existing-pair entries). Categories can overlap and must not be added as unique failures.

Active-joint parity: 23,222 active finger states, 278,664 local quaternion components and 1,114,656 world matrix components. Maximum active local/world component deltas: 0 / 0. Wrist deltas: 0 / 0.

New deep key states on active digits: 0. New finger-pair states involving active digits: 0; new own-palm states involving active digits: 0.

The helper improves the aggregate core count while introducing the regressions enumerated below. It does not pass a zero-regression combined support gate. Geometry results do not certify natural-looking hand movement.

## Core and new-type queue by concurrent support set

| Support records (hand/finger, previous → next) | Sampled failure range (s) | Hand states | Event states | Worst witness |
|---|---|---:|---|---|
| curve-007 (L2, p00424 → p00434) | 91.473999000–91.474001000 | 3 | newCoreKey: 3, worsenedCoreKey: 3 | LIndex:58 at 91.474001000: 0.0000 → 3.8025 |
| index-059 (L2, p00800 → p00831) | 176.083333333–176.083333333 | 1 | newCoreKey: 1, worsenedCoreKey: 1 | LIndex:58 at 176.083333333: 2.8889 → 3.3026 |

The full finite `replay-queue.json` also lists every strict existing-pair group. Ranges summarize sampled states and do not imply continuous failure. Overlapping support membership is attribution context, not individual causal isolation.

The preserved harness uses moving key core solids and owned mesh subsets; opposing-hand intersections, continuous motion/twist quality, rendering, browser playback, audio, and synchronization are outside this replay. See `README.md` for exact definitions and limitations.
