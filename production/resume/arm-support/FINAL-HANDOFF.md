# Final arm and seating candidate

Use `candidate-final/pianist.ts`, `candidate-final/piano.ts`, and `arm-seat-final.patch`. Earlier V3/V4/V5/V6 and full-roll files are experiments; this handoff supersedes them. The root checkout was not edited.

| Source | SHA-256 |
| --- | --- |
| pianist.ts | 22e2db7b7da490b83d7aaa9111a069f3b1ce3043f61f7c9df6fcba0f68731075 |
| piano.ts | 915ae12f1d71c669f1fd811720ad1aadba447f9cdbeb687a67912808ec883733 |
| unchanged score.json | b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773 |
| unchanged pianist.glb | 77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d |

The patch translates the model and bench +0.10m in Z, adds0.04rad of seated spine lean, and rotates existing clavicles about world Y by L−0.32/R+0.43rad. These clavicle rotations retain their lengths and attachment. Elbows stay on fixed-length two-link circles; the objective follows actual wrist-to-MiddleMCP palm forward and an expanded torso envelope constrains upper arms and forearms. Upper-arm samples begin at49.4% L/54% R of their length. Authored wrist/foot targets, score, key geometry, finger solver and GLB are unchanged. The extra lean/protraction was necessary: a pure seat/pole revision retained exposed upper-arm penetration up to35.51mm.

## Verification on this exact source

`final-motion-report.json`:27,979 frames at120Hz. No reach deficits or nonfinite transforms. Maximum wrist shift0.000043749mm, finger-marker shift0.002118786mm, contact-error delta0.000096753mm, foot-marker shift0.000537340mm. Maximum elbow speed1.078239m/s and arm angular speed5.156256rad/s. Limb-length numerical variation0.000085840mm.

`final-continuity-report.json`:6,352 distinct event boundaries/12,704 evaluations at±1µs plus374 scrambled direct seeks. Maximum boundary displacement0.002594485mm; normalized quaternion change0.000572932°. Direct-seek position error0, quaternion error7.30e-8rad. The quaternions are normalized before angular comparisons to avoid measuring Float32 norm noise.

`final-depth-sweep-report.json`:2,196 actual geometry poses:4Hz across the score, all1,068 note midpoints, declared extremes, and20Hz in the finite residual windows42.7–43.2s,188.5–190.5s and223.8–233.144228s. Among exposed upper-arm vertices beyond sleeve distal extent+2mm, maximum local signed-normal depth into actual torso cloth is L1.623428mm at189.85s/R0.892291mm at225.45s. Zero poses exceed the declared2mm contact approximation. Worst vertex/triangle IDs, coordinates and normals are retained.

`candidate-final-clearance.json`:20 declared opening/extreme/interior/ending poses;0 noncoplanar forearm/torso triangle intersections across40 comparisons. Minimum sampled forearm-vertex to torso-triangle clearance40.448708mm. Inner sleeve/torso junctions still intersect as overlapping garment construction; these are separate from the exposed-arm depth gate and are not claimed globally watertight.

`final-alignment-report.json` measures actual elbow-to-wrist against wrist-to-MiddleMCP at30Hz,6,996 endpoint-inclusive frames. Sideways and normal projections are also retained. These are geometric animation measures, not clinical limits.

| Actual palm/forearm angle | Baseline L | Final L | Baseline R | Final R |
| --- | ---: | ---: | ---: | ---: |
| Median |52.8128°|39.1288°|50.5505°|34.3011°|
| 95th percentile |60.2635°|51.3317°|63.6843°|57.3281°|
| Maximum |63.2767°|62.7517°|69.4711°|66.2221°|
| Ending |49.5448°|31.8043°|65.6122°|66.2221°|

The ending right angle increases0.61° while the large upper-arm/torso overlap is removed. Typical pose and global-maximum improvement are preserved. The120Hz motion report uses a different bone-axis measure; do not substitute it for this table.

`bench-report.json`:5,980 noninstanced vertices translated+0.10m;168,226 unchanged within that census;0 unexpected vertices;88 key pivots unchanged. `final-skin-parity-report.json`:348 mixed Forearm/Hand vertices move up to20.180947mm over20 poses;3,486 fully hand-weighted vertices move at most0.000356035mm. Final hand fitting must use this arm source.

## Rendered review and residual limits

Seven actual EGL frames in `final-evidence/` were inspected: front0/30.766667/189.762023/233.144228s and side0/189.762023/233.144228s. Both render reports record GL_NO_ERROR. The arm and garment exterior remains coherent across these views; a dark underarm seam recess remains visible in the side view, and the retained wrist skin still has some narrowing. These renders do not certify hands or browser playback.

The full hand-bind-relative forearm-roll experiment was rejected because it created an elbow contour crease and did not fix the torso penetration. Its isolated evidence remains in `ROLL-HANDOFF.md`.

Depth uses nearest-triangle outward normals on an open cloth patch, not a watertight volume classifier or a mathematical swept-volume proof. The2mm limit is an explicit animation contact approximation. Forearm clearance is a20-pose screen. Hair/camera/framing and whole-hand solids require the parent's final integrated audits because the posture and mixed hand/forearm skin changed.

## Reproduction

Run in this folder with the root-installed dependencies:

```
node compile.cjs
node final-compile.cjs
node final-motion.mjs
node final-continuity.mjs
node final-alignment.mjs 30
node final-depth-sweep.mjs
node final-skin-parity.mjs
node check-final.mjs
```

`shared.mjs` pins root model/score paths. The final source, scripts, reports, patch and seven rendered PNGs are bound by `final-hashes.json`. Parent owns integration/persistence and final whole-character acceptance. Leaf gates:5/5 checked with the stated geometric tolerance and sampling scope.
