# Actual current app versus V6: whole-song pair comparison

Both exact-source scans completed all **13,628 frames** at 60 Hz, including the exact 227.101587-second endpoint. Current app is commit `b8c30b0e21d56606e6b158b8079d86c316c0d18f`; V6 is the frozen numerical candidate. All original ownership and intersection gates remain unchanged. This is finite geometric evidence, not approval of either complete performance.

| Pair-screen measure | Actual current app | V6 |
|---|---:|---:|
| Pair-positive frames | 1,516 | 1,434 |
| Patch-pair rows | 1,731 | 1,569 |
| Triangle-pair incidences | 41,442 | 94,731 |
| Held-digit-involved frames | 60 | 42 |
| Held-digit-involved pair rows | 60 | 42 |
| Nonfinite skinned vertices | 0 | 0 |
| Exact matches to the source's 240 pilot frames | 240 | 240 |
| Runtime, seconds | 458.017 | 449.682 |

| Kind | Current frames / rows / incidences | V6 frames / rows / incidences |
|---|---:|---:|
| neighbor | 1516 / 1719 / 41163 | 1434 / 1557 / 94434 |
| own-palm | 12 / 12 / 279 | 12 / 12 / 297 |
| opposing | 0 / 0 / 0 | 0 / 0 / 0 |

Counts measure noncoplanar triangle-pair incidence, not penetration depth, overlap volume, or visual severity. A lower total cannot establish improvement across all moments. The exact timestamp/patch-pair comparison preserves both improvements and regressions.

| V6 change at the same frame and patch pair | Rows | Distinct frames | Triangle-pair delta |
|---|---:|---:|---:|
| introduced | 737 | 705 | +41,380 |
| resolved | 899 | 840 | -17,797 |
| increased-count | 647 | 614 | +32,273 |
| decreased-count | 150 | 150 | -2,567 |
| equal-count | 35 | 35 | +0 |

All equal-count rows are retained. Equal counts do not prove identical posed geometry. Changed rows form **1,352 observed consecutive intervals**, grouped into **1,293 source-aware pair/event contexts**. These are finite sampled intervals, not continuous collision-duration bounds.

## Evidence files

- `current-pairs60.json` and `v6-pairs60.json` retain every frame, including zero-hit frames, and every scalar pair row with exact active-note and phase context.
- `pair-row-deltas.json` retains every union frame/patch-pair row, including introduced, resolved, increased-count, decreased-count and equal-count rows.
- `changed-intervals.json` joins consecutive changed samples only when pair, change category and both source event contexts agree.
- `event-contexts.json` provides full event-context groups plus a per-source, per-note index for hybrid decisions. Note indexes overlap when the same pair involves multiple events; their totals must not be summed as unique frame counts.
- `comparison-summary.json`, `snapshot-manifest.json` and `score-equality.json` bind all inputs and summarize the checks.

The source-aware labels deliberately differ where transport differs: current nonthumb short gaps use the continuous complete-pose arch; V6 uses independent approach/release windows with per-note controls. Both previous and next notes remain explicit where no single event owns a pose. The pair hits themselves are independent of these labels.

## Frozen identity

The actual current source was snapshotted from the tracked commit exactly and transpiled locally. The V6 source is frozen separately. Both use the identical actual Human model and piano geometry. Scores are structurally equal after removing only `approachPose`, `releasePose`, `approachTravel` and `releaseTravel`; all physical, audible, section, pedal and wrist-data fields are unchanged.

- current rig JavaScript: `43c5989539f1bc4029d50b6223709c10618ff6df96b5a5abf219594ff137c2cf`.
- current rig TypeScript: `577fb14cd0e20dec5d0563b4dbc2e205cc1b0ef2d900b7ff379da97093797512`.
- current score: `661d2ac0801f54902a293e5d29c92718249a199462d39efa34d587927ffe025a`.
- v6 rig JavaScript: `ee81045d8e8d0d42b343549546023af96b2c3b30900cfeac42644267fb4635df`.
- v6 rig TypeScript: `26db9864514b523f825b6afcc6232eb5a2429ee6889bbf6ebf6662853f8eb500`.
- v6 score: `b0474db884b74a74858ef0f9347ce0b8188e086fbd81eacd33ff02e79dd1ef40`.
- Shared Human model: `be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc`.
- Shared piano: `f8953670a15920735245c059a83e81fba20a97b3713a6d8f2a7a7c3fbd6b6e79`.

The scanner verifies input and dependency hashes at startup, repeatedly during each scan, and after completion. At each of the original 240 pilot frame indices, every scalar pair row is checked for exact equality against that source's pilot. All 240 comparisons pass for both sources.

## Reproduction

From the workspace root, run the following two independent scans; the source-bound 240-frame cost pilots and frozen sources are under `work/active-grips/runtime-baseline-comparison/`:

```sh
node work/contact-visibility/global-pairs-current-v6/scan-pairs.mjs --project pianopiece-threejs --rig work/active-grips/runtime-baseline-comparison/current-app/pianist.mjs --piano work/active-grips/runtime-baseline-comparison/current-app/piano.mjs --score work/active-grips/runtime-baseline-comparison/current-app/score.json --model pianopiece-threejs/public/assets/pianist.glb --transport current --pilot work/active-grips/runtime-baseline-comparison/current-pair-pilot.json --out work/contact-visibility/global-pairs-current-v6/current-pairs60.json
node work/contact-visibility/global-pairs-current-v6/scan-pairs.mjs --project pianopiece-threejs --rig work/active-grips/runtime-baseline-comparison/v6/pianist.mjs --piano work/active-grips/runtime-baseline-comparison/v6/piano.mjs --score work/active-grips/runtime-baseline-comparison/v6/score.json --model pianopiece-threejs/public/assets/pianist.glb --transport v6 --pilot work/active-grips/runtime-baseline-comparison/v6-pair-pilot.json --out work/contact-visibility/global-pairs-current-v6/v6-pairs60.json
python work/contact-visibility/global-pairs-current-v6/compare.py
python work/contact-visibility/global-pairs-current-v6/write-review.py
```

The copied intersection functions are unchanged from the pilot: all vertices of a tested triangle share a digit/palm owner above 65%; disjoint axis-aligned tree boxes are rejected conservatively; remaining pairs use the incumbent two-sided segment/triangle intersection tests. All same-hand digit pairs, all digit/own-palm pairs and all opposing-hand patch pairs are included. No raw vertex positions, triangle indices or crossing coordinates are written into these portable reports.

Mixed-web pair surfaces, coplanar/edge-only intersections and completely enclosed surfaces remain excluded by the incumbent screen. Actual piano animation still drives exact rig contact poses, but this task does not recheck keys, pad rays, finger shape, arm speed, garments or visual appearance. Sampling at 60 Hz can miss shorter events. Final combined-source and 240 Hz gates remain separate.
