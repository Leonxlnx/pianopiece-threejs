# Hand and arm review — independent continuation

Scope: read-only inspection of the recovered repository, an immutable original-rig geometry check, a reusable finite actual-surface audit, and repair recommendations. Root owns integration. The new score supersedes the old per-note repair lists. None of the historical score candidates is a final current fix.

## Decision

Retain the original continuous skinned hand. Its normalized, bilaterally coherent weights and original joint offsets do not support a claim that the mesh itself is fundamentally broken. The most damaging configurations come from unconstrained MCP directions, thumb opposition/roll, low proximal support, and independently animated inactive fingers. Solve those poses before deciding whether localized skin corrections are necessary. A capsule/cylinder replacement would lose the accepted continuous wrist/palm/knuckle skin and create a separate renderer/audit path.

The practical order is: accept the +0.10 m seat and constrained elbow pole; compose/refinger the NEW song against this rig; fit supported contact poses; use actual local joint rest priors for inactive digits; resolve full-hand collisions through each transition; then do any narrow web-weight/pose-corrective work still justified by visible deformation.

## Fresh baseline observations

`baseline.json` was computed from the frozen original compiled `pianist.mjs`. The matching original TypeScript was recovered from Git and independently recompiled byte-for-byte (`check-snapshot.cjs`). Source SHA is f0407941995f70ecafecebe9559e0289716620f656b51affcfe279aade9c94b8; model 77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d; score b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773. Live source changed during the run, so its end-of-run hash is explicitly separate and does not identify the sampled rig.

| Original time | Inactive digit | Real key | Closest-face core depth |
|---:|---|---:|---:|
| 11.700326 | R thumb | 65 | 6.913281 mm |
| 188.702540 | L thumb | 57 | 7.369309 mm |
| 191.861656 | R thumb | 76 | 7.689004 mm |
| 191.861656 | R index | 77 | 7.914226 mm |
| 191.861656 | R middle | 80 | 6.491549 mm |
| 233.144228 | L thumb | 52 | 5.926086 mm |
| 233.144228 | R thumb | 59 | 3.370372 mm |

These use exact deformed Human vertices with >65% summed digit ownership, all 88 animated key solids, and the actual white 1.4 mm / black 2 mm bevel core reduction. They reproduce retained inventory measurements where the score context matches. They are not estimates from markers or a renderer screenshot.

`known-positive-control.json` verifies the reusable audit at four original contexts: all four contain >3 mm key-core penetration, one contains own-palm intersections, all four contain same-hand digit intersections, no nonfinite points. Maximum key-core depth is 7.914226 mm while the maximum active marker error is only 0.0000958 mm. This is a useful positive control against accidentally auditing markers, undeformed vertices, an empty patch set, or the wrong key transform.

The retained `rest-review-sheet.jpg` was visually inspected. Its five views show actual finger shafts disappearing through the white/black key edges and a thumb body vanishing into a key while the distal tip remains visible. The retained `frame-26.05.jpg` was also inspected: attractive skin/shading does not conceal the sharply deviated wrist and folded left thumb from the production hand camera.

Historical quantitative context (not a new run): b156 had 38 severe held-thumb notes in 21 settled families. A later provisional score had 62/30. The old inactive-key inventory found 624 severe digit/key rows, 345 in long rests; a local score still had 498/220. v7 retained 70 active-note own-palm cases (56 thumbs). These establish the mechanism and provide known failures; none is a checklist to painstakingly restore against a new melody.

## Arms and seating

Original `pianist.ts` line 43 and posture line 112 each set model z=.65; both must become .75 for the +0.10 m change. Bench geometry in `piano.ts` lines 190–196 must move +.10 m with it. World heel/toe targets, keyboard and wrist targets remain anchored. Root has begun this integration.

For shoulder S, wrist W, upper length a and forearm b:

- u=(W−S)/d, d=|W−S|.
- k=(a²−b²+d²)/(2d), C=S+k u.
- h=sqrt(a²−k²). Every valid elbow lies on E(θ)=C+h(cosθ e1+sinθ e2) in the plane perpendicular to u.
- Derive palm-forward F from the wrist to mean index/middle/ring MCP roots. The ideal elbow is D=W−bF.
- Project D−C onto the circle plane; this gives the elbow direction minimizing forearm/palm angular deviation.
- Constrain θ against the outer blouse/torso expanded by forearm radius and an outward anatomical branch prior. Find the closest point in a continuous feasible angular interval. Do not lerp two valid elbow points in Cartesian space; that leaves the elbow circle and changes effective segment length.
- Use absolute-time geometry. A coarse per-frame candidate argmin can switch branches; use continuous feasible-interval clamping and a stable outward pole when the projected desired direction degenerates.

The new seat historically cut median geometric bend from about L52.6°/R50.5° to L22.94°/R21.64°. The unconstrained pole was rejected because it put the elbow inside the blouse. +.14 m was also rejected for a 13.664 mm reach deficit and 4.024 mm contact error; +.10 m had no such reach failure. Those numbers apply to the historical score only.

Important skin dependency: 348 mixed Forearm/Hand vertices historically moved by as much as 39.10 mm under the pole change even while purely hand-weighted vertices moved only .00228 mm. Freeze the actual arm/seat version before final web/contact calibration. Outer blouse intersections must be localized; retained skin beneath an opaque sleeve is not automatically a visible garment failure.

## Why the present finger solver can still fail

References below use the immutable original source line numbers in `input-pianist.ts`.

- `fingerPoints`, lines 160–182, chooses one planar three-link solution from endpoint distance. Reach-shell membership is not an anatomical pose constraint. The complete chain can have a bad MCP direction or pass through its palm while its endpoint remains exact.
- The nonthumb plane blend, lines 176–177, mixes a world +X reference with `e×worldUp`. When the target points behind the palm those can oppose and approach a zero vector. Such a pose should be rejected/replanned; changing the flexion normal cannot make a backward target appropriate.
- `handPose` lines 216–237 penalizes radial reach and weak forward/dorsal link terms. It never tests the actual skin against played/adjacent keys, palm, or other fingers. A low-cost pose can visibly fail all three.
- `idle` at line 257 raises only its tip target. The deep inactive key vertices in the retained inventory were mostly Index1/Middle1 proximal-owned vertices (about 89–98% weight), so raising a fingertip can simply arch it above a proximal shaft still inside a key.
- Thumb/nonthumb idle branches, lines 273–314, slerp entire endpoint joint poses. This preserves continuity better than world targets, but interpolating two valid endpoints is not a collision-free path. An invalid endpoint should not drag an entire gap through its bad configuration.
- If `score.wristMotion` is present, `load` and `plannedPose` bypass `planHand`/`handPose`. Any new melody must remove/rebuild the old baked trajectory. Root's new score correctly has no old wristMotion, but the runtime fallback is not a replacement for a final optimized trajectory.

## Repair the hand as a coupled problem

Use the present analytic solution as an initializer. Fit all five fingers against one supported wrist pose, even when only one plays. Four nonthumb chains should use calibrated rest-relative MCP flexion/spread and PIP/DIP bends. A single hard DIP/PIP ratio is a prior, not the complete solution. Preserve segment lengths and reject reversed/behind proximal directions in the wrist frame.

The thumb requires its own local CMC frame with two swing/opposition parameters plus restrained MCP/IP flexion. Compose changes around the original nonidentity rest rotations; do not replace the thumb root with the generic index frame. Keep the solution close to a compact neutral prior. Its scored `thumbOpposition` rotates the whole planar solution about base-to-tip and is useful as a search parameter, but it must be bounded by actual web and neighboring surface checks.

For a candidate contact/grip cost, include:

1. Actual pad contact position/normal on the animated assigned key, with dominant contact weight.
2. Positive clearance of the remaining phalange and web skin above every relevant adjacent key core, especially black-key front corners.
3. Palm/digit separation and neighboring active/inactive digit separation.
4. Rest-relative joint limits, compact MCP spread, and distance from a relaxed pose.
5. Supported wrist height/depth and actual arm reach.

Collision capsules are useful broad-phase constraints, but calibrate their radii from the actual mesh and confirm the final pose on the real skin. Do not solve solely against tip-marker endpoints.

For inactive digits, author a small number of wrist-local relaxed chain priors with smooth support-height adaptation. Fit a complete idle gap (release, local rest, approach) with exact active endpoint poses and no modulation during active holds. Optimize small MCP flexion/spread plus distal curvature against fixed active neighbors. Bake absolute-time local joint curves; avoid frame-history damping. A gap of 24–50 ms needs one continuous arch rather than two independent arcs returning to zero at the midpoint.

The 5° supported-index patch is a valid narrow historical improvement but not the whole-hand solution: it reduced 156 to 104 severe inactive poses while leaving low-support and neighbor cases. Do not generalize it to all fingers without the coupled checks.

## Thumb prior findings

The actual neutral GLB thumb already points steeply down in wrist space. Its L tip in authored rest is roughly [−37.9,106.4,68.5] mm relative to the wrist, where local +Y is forward and +Z points down at PALM_Q. Raw rest is therefore not a playable idle pose.

A simple correction Rx(−.80) applied before Thumb1 rest rotation moves its tip to [−37.9,129.1,2.5] mm. This looked plausible from centerlines but FAILED the actual mesh test: about 24–26 thumb/palm triangle pairs repeatedly, new neighboring finger intersections in several contexts, and key-core body penetration up to 7.96 mm on low old wrist poses. It must not be promoted as a completed fix. `thumb-prior-check.json` preserves the rejected result. A coupled CMC lift plus outward yaw and modest MCP adjustment is being searched, with real surface checks.

## Skinning/topology decision

The original first 11,779 Human vertices and hand weights were intentionally preserved by the character refinements. Thumb affected counts are symmetric (Thumb1/2/3 118/217/164 vertices per side). The source thumb rest frames differ substantially from the index frames; this is expected anatomy, not bad metadata.

Historical mixed ring/pinky vertex 2348 carried roughly 52.18% Pinky1 / 40.80% Ring1 / 7.02% Hand. Under a crossed pose its blended linear-transform determinant fell to .117; a blindly changed flexion plane worsened it to .046. That is a contraction proxy, not proof of malformed weights. First prevent the divergent rotations. If a localized web pinch persists with accepted joint positions, use a local pose corrective or reviewed weight redistribution preserving the same continuous vertices/bind/skeleton and inspect both dorsal/palmar views. Dual-quaternion skinning would require matching browser, CPU audit and export implementation and still would not repair crossed centerlines; it is not the least-risk current fix.

## Reusable audit and stop condition

Run `audit-hand-surfaces.mjs` with `--rig`, `--piano`, `--score`, `--model`, and `--out` absolute paths. `--count 48` samples evenly distributed actual per-hand note midpoints, every section's nearest midpoint, opening and ending. `--all-midpoints` expands to all note midpoints. `--times` accepts comma-separated seconds or a JSON array / `{rows:[{time:...}]}` file.

It uses the actual candidate module and GLB, real animated key meshes, all digit/palm owned vertices, additional mixed-web vertices for key cores, own-palm intersections, all same-hand digit pairs, and opposing hands. It records exact input hashes, deepest vertices/weights, triangle IDs, marker error and nonfinite state. It does not pretend that zero finite patch intersections proves continuous clearance. Mixed web/coplanar/enclosed surfaces remain outside the pair test; vertex key cores do not detect a triangle crossing with every vertex outside the key.

The root should first run the retained four-time known-positive control on the original inputs to ensure the harness is observing real failures. For the NEW final score, use the bounded screen to identify a finite set, repair those contexts, then sample each affected full held/idle interval and boundaries. Only after score/rig freeze run the single agreed whole-motion/contact audit, inspect real mesh closeups from above and key height, and remaster the exact score. Do not keep restoring and retesting every historical p-number when the new song has different grips.

The task leaf is diagnosis/recommendations, not an assertion that the hands are globally repaired. Root records `.unlazy/daybreak/gates/leaf-1.3.md` status using this report, the independently matched baseline, known-positive control, and reusable audit.

## Document coverage

All source documents read, code/queue references, and actually inspected images are enumerated in `documents-read.json`. Historical names do not imply the corresponding original scratch artifact survived the transfer.

## Follow-up: calibrated outward thumb prior

The local-prior search has completed (`thumb-prior-search.json`): 288 combinations of thumb CMC lift, outward yaw and small MCP flexion were evaluated against the actual left thumb/palm patches at the old ending. 223 had zero owned-surface intersections. The best candidate under a compact tip envelope and small-rest-change preference is:

```ts
// These axes are in the wrist parent frame; multiplication order matters.
const lift = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -.80);
const outward = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 0, 1), hand.side === 'L' ? .30 : -.30,
);
const thumbRest = [outward.multiply(lift).multiply(finger.rest[0]),
                   finger.rest[1].clone(), finger.rest[2].clone()];
```

Use that as the inactive local-pose PRIOR, blended to exact active anchors over the entire gap. Do not apply it abruptly after solving or overwrite active thumbs. The experimental wrapper intentionally did a static replacement only to test the reference shape, so it is not an accepted transition implementation.

For L, the first quaternion is `[.2082371009,-.3032159098,.2526068016,.8949230486]`; R mirrors y/z to numerical source tolerance. The L tip is wrist-local `[−63.50,119.49,2.54]` mm. It is more laterally open than the rejected tilt-only prior and keeps the original anatomical MCP/IP rest rolls.

`thumb-prior-outward-check.json` checks eight actual old wrist/neighbor contexts on both hands. Every modified inactive thumb has zero own-palm and zero opposing-hand patch intersections, compared with repeated 24–26 own-palm pairs for tilt-only. At 11.700326, 26.05, 224.25 and 233.144228, thumb key cores and every thumb-neighbor pair are also clear. This is a bounded actual-surface property, not full visual or motion acceptance.

Four old low-support contexts remain key failures. L-thumb intersects L-middle (131 pairs) at 87.807644 and L-ring (14 pairs) at 88.523026. Those L wrists are y=.7406 m, below the unpressed keytop=.742 m. At 191.861656, R wrist y=.7396 m is also below the keyboard. Thumb root starts about 8.7 mm below the wrist in PALM_Q. No attractive ordinary open-rest reference can compensate for that low support without changing its functional shape or moving the wrist. The NEW seven-semitone-span arrangement should avoid these old stretched/low support families. A wrist height prior near .775 m is a useful new-score search initializer, with depth allowed to adapt for black keys; actual reach/skin, rather than that number alone, accepts it.

A pure-thumb/palm patch pass excludes the mixed web itself. Final dorsal/palmar rendered inspection remains required to reject thin sheets or unnatural splay. The candidate is recommended over tilt-only for the root's new-score trials because it fixes the measured own-palm failure while preserving the continuous hand skin; it is not described as a globally fixed hand.
