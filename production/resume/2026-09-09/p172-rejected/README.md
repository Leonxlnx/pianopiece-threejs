# Frozen p172 candidate — fails the 3 mm key gate

The parent requested this exact candidate be frozen for visual and motion review. No further parameter grid was run. The candidate removes all added finger/palm pair rows in the full affected gaps, but it is **not gate-passing**: finer sampling finds a one-vertex MIDI 41 core depth of **3.1813081778738206 mm** at **40.69170000000003 s**.

## Minimal delta

`delta.json` contains the complete guarded note before/after and four curve records. If the parent elects to use this tradeoff, merge those two note fields and append the four curves to the existing idle data. The full `m26-s10.ts` / `.mjs` and `score.json` are immutable review references; do not overwrite the parent's newer combined source or score with them.

- p00172 remains MIDI 40 / LH Index, attack 40.404304, physical duration 0.277896, note-off 40.682200, velocity 0.525 and written duration 0.332837. Wrist motion and pedal are unchanged.
- `contactLift` changes from 0.006282452073018519 to 0.002 m; `contactZ` becomes explicitly 0.280 m.
- Middle support uses [26°,10°]; Ring and Pinky use [20°,10°]. Each keeps its exact bound previous/next note IDs. Support fades in from 40.284304 to 40.354304, holds until 40.722200, and ends at 40.802200.
- The p00172→p00174 released Index curve uses [4°,−4°,16°,0°] at 40.695200 and 40.709200, with zero endpoints at 40.682200 and 40.742200. It uses the existing four-control helper.
- Unlike p322's delta, this p172 candidate adds **no runtime envelope logic**. No physical duration or audio-event change is included.

## Full-gap result

`full-comparison.json` compares **3,648 shared states** over **37.284846–48.540428 s**: 240 Hz across the full affected gaps, 1 kHz around the transition, musical/curve boundary samples, and added 0.1 ms samples around the remaining key witness.

| Check | Frozen result |
|---|---:|
| Held p172 samples | 351 |
| Maximum held active core depth | 2.182056665106 mm |
| Held own-palm / active-active pair maximum | 0 / 0 |
| Maximum held target-point error | 0.000097713 mm |
| Added finger/palm pair rows | 0 |
| Added out-of-range active contact rows | 0 |
| Added >3 mm key-core rows | **5 — fails** |
| Other active LH samples with exact quaternion parity | 2,401 |
| RH quaternion delta | exactly 0 |
| Quaternion delta outside 40.223900–40.802200 | exactly 0 |

Every remaining failing row concerns **one Index vertex, 7666, on MIDI 41**. Exact rows are preserved below; the last two are near-identical times from the two sampling grids, so these are five rows at four nominal decimal times.

| Exact sampled time, s | Witness count | Depth, mm |
|---:|---:|---:|
| 40.69160000000003 | 1 | 3.0562541498140305 |
| 40.69170000000003 | 1 | **3.1813081778738206** |
| 40.691800000000036 | 1 | 3.138694859229685 |
| 40.69189999999891 | 1 | 3.0072615006587755 |
| 40.69190000000004 | 1 | 3.0072614997719294 |

At the maximum witness time, the baseline same-key depth was 2.9362901746053938 mm with three vertices, while the candidate has one vertex at 3.1813081778738206 mm. The same baseline state also had a different MIDI 43 collision at 4.4879114892425465 mm. The aggregate improvement does not cancel the disclosed MIDI 41 regression. The comparator keeps the 3 mm threshold and 0.05 mm allowance against an already deeper matching key/patch baseline; it gives no positive allowance for pair counts.

The first 1 kHz probe saw only the 3.0072615006587755 mm row. The finer 0.1 ms evidence supersedes that preliminary maximum. All measurements remain finite samples; no continuous maximum is claimed.

## Motion and viewed native frames

In the changed window, measured Index fingertip peak changes from **3.302903699246 to 3.011716985702 m/s**. Normalized Index MCP angular peak changes from **71.719157035233 to 75.319107390813 rad/s**. The candidate reduces the fingertip peak but increases the MCP angular peak; parent motion review remains necessary.

Four native 1280×720 oblique frames were rendered from this exact frozen TS and score at 40.381900, 40.430000, 40.691700 and 40.720000, and all four were viewed. They show the approach, held support, peak key-witness time and late release. This is a still-frame review, not proof of continuous motion or browser parity. The actual source, frame hashes and GL checks are in `native-report.json`.

## Evidence and scope

`comparison.json` records the finite six-option local set: Middle lift 20/24/26° and spread 10/12°, with the transferred release shape fixed. `m26-s10` was the closest option and is frozen. No further controls, timings, notes or family sweeps were tried. No Site checkout was changed.

Raw paired full-gap rows are preserved losslessly in `full-baseline.json.gz` and `full-candidate.json.gz`, with uncompressed hashes in `source-manifest.json`. `sample-times.json` preserves the exact grid. `SHA256SUMS` binds the frozen files. The status remains **FROZEN FOR PARENT REVIEW — FAILS 3 MM KEY GATE**.
