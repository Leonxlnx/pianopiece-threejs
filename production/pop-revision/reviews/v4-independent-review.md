# Independent coherent-v4 camera and garment review

The final portrait B camera still fits the newer coherent v4 performance. The larger wrist supports do not introduce an exposed forearm-through-blouse failure in the inspected set. They increase some inner upper-arm/armhole intersections, which remain recorded; localized retained examples sit under the outer sleeve and behind other clothing in the actual shots. The small right-armhole crescent visible at the ending is unchanged by this support-repair series.

## Frozen evidence

The score, combined incumbent rig, current root direction and verified model were copied before checking. Source changes afterward do not silently alter this evidence.

| Input | SHA-256 |
| --- | --- |
| Coherent v4 score | `401c48eeb4ced0bb50189609a5aa6b1a3890cba17c5cb2894199876a4a029369` |
| Incumbent pianist source | `59dc8e3e3d55856b0741d6e8029ca4cf40951de57c828df0395db94bedd8e1f1` |
| Actual root direction source | `1352a4fc49797dd312df26e4c410b331a6f99721f1c2e55f45a048019da0691f` |
| Verified character | `be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc` |

Each numerical summary includes hashes for all supporting modules. Portable summaries contain numerical results and scope, without workspace paths or raw model/bone coordinates. Raw geometry and intermediate source copies remain outside the checkout.

## Actual final camera result

`v4-portrait-summary.json` checks the actual frozen `Direction.update`, rather than substituting equivalent camera math. It covers every exact note midpoint within all seven hand shots: **276 poses, 552 cases at 9:16 and 4:5**. Both C6 midpoint poses are included. Conservative world bounds are formed from 16,951 actual skinned head/neck vertices and 3,622 actual hand vertices.

- Head/neck intrusion: **0 cases**.
- Hand clipping/margin failure: **0 cases**.
- Minimum hand margin: **4.854% of the image**.
- Minimum head/neck exclusion beyond the frame: **2.155% of the image**.
- Worst hand case remains 174.554875 s; maximum absolute projected hand NDC is .902911.

The margin changes by only about .017 percentage points from the earlier score. The newer supports therefore do not materially erode the selected camera margin. This check certifies the two requested aspect ratios and frozen poses; it does not certify arbitrary narrower viewports or hand self-collision.

## Paired arm and garment result

`v4-arm-garment-summary.json` compares eaffbe6's earlier score against coherent v4 using the **same incumbent source and same model**. The score pair differs at 28 wrist knots above the translation/rotation selection thresholds. All 28 are included, each in its hold and preceding transition, for **56 matched poses per version**. The largest resulting wrist displacement is 56.604 mm and elbow displacement 56.796 mm, so the test includes the full combined vector displacement rather than only an individual axis component.

The adapted retained triangle/BVH method tests exact noncoplanar edge/triangle crossings after conservative bounds. Every triangle vertex must have more than 65% ownership in its selected region; mixed armhole junction triangles are excluded. The base blouse torso has 6,181 triangles; left/right sleeves have 1,333/1,317; forearms have 390 each and upper arms 335 each.

| Pair | Before crossing poses | V4 crossing poses | Interpretation |
| --- | ---: | ---: | --- |
| Left forearm / outer blouse torso | 0 | 0 | No new crossing in this inspected region |
| Right forearm / outer blouse torso | 0 | 0 | No new crossing in this inspected region |
| Left upper-arm skin / blouse torso | 49 | 54 | Five newly intersecting poses, retained for localization |
| Right upper-arm skin / blouse torso | 56 | 56 | Already present throughout this set |
| Left sleeve / blouse torso | 56 | 56 | Existing armhole overlaps; some pair counts increase |
| Right sleeve / blouse torso | 56 | 56 | Existing armhole overlaps |

The five new left upper-arm rows occur at 56.6195, 64.1642495, 64.27575, 134.16425 and 134.27575 s. The left sleeve count grows from 55 to 113 pairs at 24.428 s and from 54 to 104 at 206.6195 s. These findings remain explicit in the summary. Triangle-pair count is not penetration depth. The retained hidden body-torso patch has only 33 triangles, so its zero counts must not be presented as a full bare-torso clearance result.

## Localization against the actual outer sleeve

`v4-armhole-localization-summary.json` examines the retained representative intersections at seven new/worst poses. The 28 skin points lie **40.9–46.1% along the shoulder-to-elbow axis**, on the inner upper arm. The nearest actual outer sleeve is **16.74–20.25 mm away**, with a positive outward displacement of **3.48–20.10 mm** relative to the arm axis. This supports an internal armhole/overlap interpretation rather than skin emerging beyond the outer sleeve.

The actual opaque blouse, folded facings, buttons and thread were posed and ray-tested with their actual material-sidedness. Across 112 landscape/portrait projections of 56 retained skin/cloth crossing points, 80 lie in frame. **All 80 have nearer opaque clothing**, at least 182.42 mm before the crossing point along the actual view ray. None of those representative points is an exposed through-garment hole.

These quantities are intentionally precise in meaning: nearest-sleeve distance is unsigned geometric separation; view-ray cover is depth behind a nearer garment surface. Neither is a claim to have measured the full penetration depth of every overlapping triangle. The report covers four retained intersections per pair/pose, excludes coplanar/enclosed cases, and preserves the underlying overlaps. It does not justify calling the full garment collision-free. The current evidence does not support regressing successful held grips merely to reduce these internal pair counts.

## Ending crescent

The supplied actual ending image at 220.6984765 s shows a small pale crescent at the right armhole. `v4-ending-garment-summary.json` checks that pose and the cleaner 190.017 s pose against the earlier score under the same source/model:

- 468 right-arm skin vertices: **exactly 0 mm change**.
- 788 blouse sleeve vertices: **exactly 0 mm change**.
- 172 facing vertices and 396 seam-thread vertices: **exactly 0 mm change**.
- Right upper-arm, elbow and wrist bones: **exactly 0 mm change**.

The ending crescent is therefore inherited garment/armhole appearance, not a regression from the current wrist-support repairs. Any further improvement should address the garment seam/coverage directly. This comparison does not approve that appearance or prove every garment surface at every pose is clear.

## Deliverable summaries

- `v4-portrait-summary.json`: final camera fit over all relevant note midpoints.
- `v4-arm-garment-summary.json`: paired arm/sleeve/torso counts, including failures and selection scope.
- `v4-armhole-localization-summary.json`: outer-sleeve separation and actual-camera occlusion of representative crossings.
- `v4-ending-garment-summary.json`: exact ending/right-sleeve regression comparison.

No checkout changes, browser/Sites activity, audio listening, blanket hand approval or publication claim was made.
