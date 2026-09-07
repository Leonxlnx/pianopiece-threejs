# Wrist and forearm deformation candidate

Status: numerically checked candidate, reviewed in six root native closeups. A further side/sleeve review and parent re-verification remain integration gates. It is not a claim that the whole pianist is anatomically finished.

Production source: `wrist-volume.ts`. `integration.patch` adds its import, constructs the correction once for `Human`, and updates it after the final posed hands. Copy the source into `app/performance/wrist-volume.ts` before applying the patch. Required settings are `{rollForearm:true,smoothWeights:8}`. The unsmoothed and DQ-only options are research comparisons, not accepted alternatives.

## What it changes

The current single forearm joint leaves roughly 93°/109° left/right axial rotation at the wrist at 170 seconds. Ordinary linear blending collapses the wrist; 127 central wrist vertices have minimum distance-to-wrist ratio 0.545 relative to their authored skin. Replacing only this narrow band with DQ restored radius but left folds. Rotating the actual forearm bone improved the wrist while moving the collapse into the elbow and displacing some existing forearm-weighted thumb skin by 3.23 mm.

The candidate instead distributes **skin** pronation gradually along the lower arm, from zero near the elbow to the palm-aligned frame at the wrist. It uses virtual rigid forearm frames, not new or changed skeletal joints. A fixed eight-pass topology smoothing produces a continuous wrist blend while leaving original skin weights intact. Thumb-joint contributions remain linear so thumb flexion cannot inflate the wrist blend. It adjusts 542 existing vertices; all finger-owned vertices, skeleton matrices, bind matrices, indices, and original skin weights stay exact.

Each frame starts from immutable original position/normal attributes, computes the corrected surface, and maps it backward through that frame's original skin matrix. Ordinary Three GPU skinning and `getVertexPosition` therefore produce the same result. Relative and absolute morph position/normal contributions are included; singular absolute-morph and nonrigid bone cases restore the uncorrected frame instead of accumulating invalid values. GPU uploads cover only the two arm ranges.

## Checks and scope

- `node verify.mjs --roll`: 457 frames over the score, actual protected world vertices, immutable bone matrices/skin data, direct and repeated seeks, independent float32 shader-equivalent positions/normals, nonrigid and morph negative controls, and nine actual animated key-core samples. There were no fallback frames or new checked wrist/key-core contacts. This is not the full project's finger-surface audit.
- `node surface-final.mjs 8`: 96 representative score times, selected independently by per-hand note quantiles and section centres. Every affected triangle is tested against all 7,320 local arm/hand triangles. Exact coincident rest vertices are welded only for adjacency exclusions. The accepted candidate has no detected nonadjacent wrist/forearm intersections or new degenerate faces in this sample. Existing unrelated digit collisions remain outside this local check. Coplanar overlaps and fully enclosed surfaces are not certified by the edge/triangle oracle.
- `node verify-typed.mjs`: the typed source transpiles to the exact same JavaScript program as the audited implementation.
- Strict TypeScript compilation passed. The most recent numerical reports bind the source/model/score hashes and exact candidate hash. The root must reverify on its final integrated source.

The immutable fingers make this change compatible with the separate finger-route work. No score or posture bone changes are made, so music and hair-motion data do not require rebaking for this correction alone.

## Remaining manual acceptance

Root must inspect fresh native closeups at 0, 5, 26.05, 64, 105, 130, 170 and 210 seconds, plus an elbow/sleeve view. The virtual forearm correction moves skin up to about 45 mm around the arm axis; this is a real anatomical/contour change and needs visual review. The inherited R wrist still has about 80.5° residual bend at 5 seconds after removing axial pronation. This algorithm repairs collapsed skin, not that skeletal pose. It also does not add pores, veins, musculature, or higher mesh density. No existing shape/contact tolerances were relaxed.

Six native frames at 5, 26.05, 64, 105, 170, and 210 seconds were inspected from `work/night/wrist-volume-a/gl-1280-0.jpg` through `gl-1280-5.jpg`: the severe pinched wrist shelves have gone, both arm contours are continuous, and no new open seam or local inverted flap is visible. The held right wrist remains sharply bent at 5/105 seconds; this is explicitly a secondary posture issue. Root independently agreed that the scoped volume change is a coherent improvement. The very small TypeScript parity cleanup following the rendered module removes an unused map and adds an already-satisfied construction guard; it does not change any valid-asset deformation calculation.

## Portable verification

The verifier discovers a sibling `pianopiece-threejs` checkout, a repository three levels above the verifier directory, or the current directory. Set `DAYBREAK_PROJECT=/absolute/repository` explicitly for other layouts. `DAYBREAK_RIG=/absolute/compiled/pianist.mjs` can select a preserved baseline rig. Preserve `load.mjs`, `verify.mjs`, `surface-final.mjs`, `wrist-volume.mjs`, `wrist-volume.ts`, and `verify-typed.mjs` together when saving this research evidence. The scripts write only beside themselves. Run the project's compilation helper before verifying changed production TypeScript; a source-only edit is not a tested rig until its compiled module is current.

Rejected experiment evidence remains in the directory: DQ-only cases produced new folds; full/partial actual-bone twist redistributed the collapse into the elbow; four-pass target smoothing missed two dense-review poses. Use the final settings and final reports only.

## Four passes

1. Loaded exact GLB weights and current transforms; implemented reversible DQ skinning with protected endpoints.
2. Compared real reference and actual mesh; traced concentrated pronation, compared actual bone twist, and rejected its elbow/contact regressions.
3. Tested actual triangles, found folds invisible to radius and contact metrics, distributed virtual pronation, smoothed the wrist target, and repeated the broader score sample.
4. Added independent GPU-normal/morph/seek checks, typed-source identity, targeted GPU update ranges, allocation reduction, integration patch, explicit limitations, and source-bound gate recording. Native visual review remains the parent acceptance step.

## Primary technical references

- [Kavan et al., Geometric Skinning with Approximate Dual Quaternion Blending](https://users.cs.utah.edu/~ladislav/kavan08geometric/kavan08geometric.html), 2008: normalized dual-quaternion blending and its rigid-transform advantages.
- [Disney Animation, Enhanced Dual Quaternion Skinning for Production Use](https://media.disneyanimation.com/uploads/production/publication_asset/98/asset/dualQ.pdf): production caveats, scale handling, and combining DQ with linear skinning.
- Installed Three.js `SkinnedMesh.js`, `skinning_vertex.glsl.js`, and `skinnormal_vertex.glsl.js` were read directly for the exact application version. The correction uses those existing CPU/GPU paths without a shader override.

Visual reference inspected: `../reference-research/photos/hisasue-hands.jpg`; existing actual scene inspected: `../pianopiece-threejs/work/night/baseline/gl-1280-2.jpg`. The reference supports smooth supported forearm/wrist contours; it is not used as a copied texture or model.
