# Camera coverage review — current corrected paths

**Result:** No unresolved major framing obstruction in the sampled current views. Two hand-camera shoulder obstructions were found, corrected in the Site source by the root agent, and successfully rechecked. The remaining portrait profile crop is an optional composition choice, described below.

## Coverage and method

Rendered and visually inspected **62 offline frames**: the initial 48 landscape + 6 portrait views, followed by 8 correction checks. The current selection contains **56 samples**: 48 landscape quartiles, 6 portrait quartiles, and the two corrected hand shots at 98%. Six original frames are superseded by corrections.

Each of the 24 authored automatic shots was sampled at **25% and 75% of its actual time interval**. The cameras were automatic (`override = -1`), not fixed midpoint overrides. Landscape renders are 640×360; portrait renders are 360×640 at 9:16. All use eight Cycles samples. Every produced frame was inspected in contact sheets and/or at full resolution; suspect crops and all corrected views received full-resolution inspection.

The current coda timing is included: shot 22 starts at **211.935970 s**, shot 23 at **221.036350 s**. The final shot ends with the score at 229.036350 s. Source, compiled modules, score, bake script and SHA256 manifests were snapshotted locally. The correction snapshot also includes the later pedal-position helper and combined keypress envelopes. No Site checkout was edited for this review.

## Confirmed defects and correction checks

| Shot | Original defect | Current source correction | Recheck result |
| --- | --- | --- | --- |
| 02 — Hands · melody | At 26.4 s the shoulder/torso filled over half the frame and largely hid the hands. It already competed with the intended detail at 21.6 s. | Camera from `[.55,1.34,.43]` to `[.39,1.29,.46]`; look `[.07,.753,.16]`; FOV 43→41. | Clear at **21.600000, 26.400000 and 28.608000 s**. Both hands visible. The far hand is near the top edge at 25%, with the complete hand inside the frame. |
| 14 — Reprise · hands | At 141.6 s the actual left hand disappeared behind the torso; its fallboard reflection remained visible. | Camera from `[.76,1.30,.49]` to `[.50,1.31,.46]`; look `[.05,.756,.16]`; FOV 41→43. | Clear at **136.800000, 141.600000 and 143.808000 s**. Both hands visible. Updated 9:16 samples at 25% and 75% also retain both hands. |

**Recommendation:** retain both corrections. No additional mandatory camera move follows from the inspected samples.

## All authored shots

Shot numbers are zero-based, matching the bake/director interface. Times below are seconds.

| Shot | Name | 25% | 75% | Finding |
| ---: | --- | ---: | ---: | --- |
| 00 | First light | 2.400000 | 7.200000 | Full establishing composition; performer, piano and bench contained. |
| 01 | The first phrase | 12.000000 | 16.800000 | Face and hands clear; instrument/furniture crops suit the medium view. |
| 02 | Hands · melody | 21.600000 | 26.400000 | Corrected: both hands visible at 25%, 75% and 98%; far hand near top edge at 25% but complete. |
| 03 | A quiet beginning | 31.200000 | 36.000000 | Opposite-side medium; face and keyboard clear. Piano body crop is intentional. |
| 04 | Toward the horizon | 40.800000 | 45.600000 | Revised pullback contains raised lid and feet; earlier tight-wide concern resolved. |
| 05 | Across the strings | 50.400000 | 55.200000 | Elevated instrument detail; lid occupies foreground without hiding the face. Partial hand coverage fits the instrument-focused shot. |
| 06 | Daybreak | 60.000000 | 64.800000 | Complete performer/piano wide at both samples. |
| 07 | Weight and touch | 69.600000 | 74.400000 | Both hands and keyboard clear; head excluded cleanly for detail. |
| 08 | In the light | 79.200000 | 84.000000 | Opposite-side wide remains legible; no lid/performer obstruction. |
| 09 | Afterglow | 88.800000 | 93.600000 | Face clear of lid and frame edges at both samples. |
| 10 | The road behind | 98.400000 | 103.200000 | Face and hands clear in the side medium. |
| 11 | Left hand | 108.000000 | 112.800000 | Left-hand emphasis with both hands visible; forearms remain connected in frame. |
| 12 | One more breath | 117.600000 | 122.400000 | Medium-to-wide framing stays clear; early furniture crop is acceptable for the medium. |
| 13 | Daybreak · reprise | 127.200000 | 132.000000 | Complete rear three-quarter wide at both samples. |
| 14 | Reprise · hands | 136.800000 | 141.600000 | Corrected: both hands visible at 25%, 75% and 98%; updated portrait also retains both. |
| 15 | Before the sun | 146.400000 | 151.200000 | Face insert remains clear; piano/lid edges do not cover facial features. |
| 16 | A held breath | 156.000000 | 160.800000 | Tight side view preserves face and hands; piano-body crop reads as intentional. |
| 17 | Everything opens | 165.600000 | 170.400000 | Wide rise keeps the performer and piano contained. |
| 18 | The lift | 175.200000 | 180.000000 | Hand detail keeps both hands visible; top crop is at neck rather than an accidental face fragment. |
| 19 | Full light | 184.800000 | 189.600000 | Complete opposite-side wide at both samples. |
| 20 | The final phrase | 194.400000 | 199.200000 | Medium-wide keeps face and hands clear; foreground leg crop does not impair the performance view. |
| 21 | Home in the light | 204.183992 | 209.351978 | Revised higher hand camera retains both hands and removes the earlier incidental chin fragment. |
| 22 | The last phrase | 214.211065 | 218.761255 | Coda medium keeps face and hands clear; partial piano/lid crop is intentional. |
| 23 | Daybreak · ending | 223.036350 | 227.036350 | Ending pullback contains performer, bench and piano at both samples. |

## Portrait coverage

| Shot | Times | Finding |
| --- | --- | --- |
| 09 — Afterglow | 88.800000 / 93.600000 | Face remains inside the frame and clear of the lid. Hands partly fall behind the foreground instrument, appropriate for this face insert. |
| 14 — Reprise · hands, corrected | 136.800000 / 141.600000 | Both hands and the active keyboard area remain visible. The back of the head is cropped at the left edge; eyes/nose/mouth in the visible profile stay inside. This reads as a hands-focused view with the performer at the edge, rather than a clean portrait. Optional polish only. |
| 16 — A held breath | 156.000000 / 160.800000 | Face, both hands, seated posture and bench remain legible. The piano extends beyond the left boundary as expected in a narrow side view. |

## Scope limits

These are offline Cycles renders of baked Three.js geometry and poses with approximate material/lighting conversion. They are **not browser visual QA** or real-time playback approval. Reflection behavior, non-mesh details, UI overlays, loading states and display scaling are outside this check.

Quartile samples do not prove every moment along every path is clear. Only corrected shots 02 and 14 also received a 98% check. Different note positions between samples can change hand silhouettes. Portrait testing covers the selected demanding hands, side and face paths at 9:16; it does not cover every aspect ratio or every portrait shot.

Lid, leg and bench crops were flagged only when they undermined the intended composition. Cropped instrument edges in a medium or instrument-detail view, and exclusion of a head in a hand insert, were not treated as defects by themselves.

## Evidence files

- `current-landscape-sheet-1.png` through `current-landscape-sheet-6.png`: current quartile selections, four shots per sheet
- `current-portrait-sheet.png`: current six portrait samples
- `camera-coverage.csv`: shot/time coverage table
- `current-view-manifest.json`: the 56 current sample paths and metadata
- `coverage-evidence.json`: all 62 inspected renders, including superseded originals
- `coverage-plan.json`, `snapshot-sha256.json`: original coverage snapshot
- `corrections/coverage-plan.json`, `corrections/snapshot-sha256.json`: fresh corrected snapshot and near-end checks

All PNGs and metadata are retained. Raw geometry JSON was removed only when matched to retained metadata and a valid PNG; frozen scripts/assets can reproduce the samples.
