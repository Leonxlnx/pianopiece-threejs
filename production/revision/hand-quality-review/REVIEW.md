# Independent hand silhouette review

Frozen inputs: pianist `e85f297e6bc9d419b567fa30bed99c7e0abef1bc47989c37b8d9a28cfbbf8f66`, score `b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773`.

Twenty deterministic actual-scene closeups were reviewed: one held phrase/chord in each section for each hand, plus two substantial released-thumb register gaps per hand. The sample excludes the existing 33 endpoint notes and p00489/p00720/p00893, including 300 ms margins. `sample.json` records the exact selection. This is a bounded visual review, not a whole-performance pass.

## Confirmed unique issue: idle fingers occupy held-finger space

The contact solver preserves played key positions, but other fingers can retain their neutral paths directly through those played fingers. This produces merged silhouettes even when the active MCP pose is reasonable.

| Score time | Played finger | Intersecting idle finger | Evidence |
|---|---|---|---|
| 98.746043 | L ring, p00473 | L pinky | `render-L/gl-960-5.jpg`; 136 surface triangle pairs |
| 177.973583 | L ring, p00839 | L pinky | `render-L/gl-960-8.jpg`; 141 pairs, repeated version of the same grip |
| 226.076406 | L middle, p01063 | L index | `render-L/gl-960-9.jpg`; 137 pairs; particularly clear crossing silhouette |
| 148.380422 | R middle, p00675 | R ring and pinky | `render-R/gl-960-7.jpg`; 84 and 78 pairs |

The L-index coda example is a neutral-pose failure: its last note ended at 222.633022 seconds and it has no future note. More release time cannot repair that case. The R-pinky at 148.380 seconds is also well away from its own note boundaries. Inactive fingers need space around occupied neighboring fingers while active contact stays fixed. The anatomy agent owns this bounded correction.

`mesh-crossings.mjs` independently confirms actual intersections of deformed finger surface patches, not just projected overlap. Each tested triangle has all three vertices assigned more than 65% total weight to one finger, excluding shared web/palm regions. The diagnostic checks noncoplanar edge/triangle intersections. Counts are intersecting triangle pairs; **they are not penetration depth**. The test directs visual review and does not establish that every reported tiny crossing is a visible blocker.

Other sampled poses also have small or partially obscured intersections; these were not promoted into additional fix requirements. The finite cases above are sufficient to address the visible family and test a general inactive-clearance response.

## One observed endpoint just outside the existing cutoff

At 108.071767 seconds, R-ring retains a pronounced hook 22.5 ms after p00528 ends. It intersects idle index/middle patches (128/74 pairs). See `render-R/gl-960-5.jpg`.

p00528 is held from 107.601592 to 108.049229 seconds, MIDI 79, finger 4. The existing spread report measures 74.9018 degrees, narrowly below the selected 75-degree cutoff. This is a visibly confirmed additional endpoint case, not a reason to widen an arbitrary angle gate across the entire score. The composer was sent this one note; it should be corrected at its contact pose instead of forcing the released path to escape a folded endpoint.

## Bounded thumbs verdict

No new thumb-specific collapse or plane inversion is apparent in these 20 views. The thumb can form a long open arc in low-register holds, but the contour remains continuous in the reviewed sample. This does not override the pending complete combined motion and contact audits.

## Reproduction and follow-up

Run `node compile.cjs`, then `node mesh-crossings.mjs` from this directory for the 20-pose surface report. The same harness accepts `CROSSING_SAMPLE` and `CROSSING_REPORT` environment variables. `finite-crossing-sample.json` samples the four visible collision cases through their held intervals and adjacent release/preparation time. `finite-crossings-baseline.json` is the baseline for the inactive-clearance candidate.

`render-sample.py` produces the two reviewed contact sheets using actual deformed meshes and the current offline rendering pipeline. Material, shadow, and environmental reflections remain approximations of the live Three.js renderer; no browser playback claim is made.

The next independent verdict should compare the candidate against these exact finite surface cases, review the four affected closeups and a short motion span, confirm active vertices unchanged, and check the same 20-pose sample for an obvious new silhouette problem. No score/audio release edits are needed for neutral idle collisions.
