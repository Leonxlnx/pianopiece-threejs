Read-only finger-rig diagnostic and isolated candidate
====================================================

Use the coherent **thumb-only** candidate after recalibrating thumb-pad contact. Do not adopt the non-thumb fixed-plane experiment on its own: it leaves invalid target poses and worsens one web deformation. No Site files were changed.

The snapshot is the actual `app/performance/pianist.ts`, original `score.json`, and current `public/assets/pianist.glb`. The audit sampled 6,996 poses at 30 Hz over 233.144228 seconds / 1,068 notes. JSON reports contain SHA-256 identifiers for all inputs. Skin contact was separately sampled at 5%, 50%, and 95% of every note. This is a kinematic and skin-deformation diagnostic, not muscle simulation or a clinical range-of-motion assessment.

1. Thumb IP orientation is the clearest isolated error
----------------------------------------------------

Baseline `update()` solves a planar chain, then replaces only its thumb PIP-equivalent point using the anatomical rest pole. The second and third joint points and final normal remain from the original plane. The resulting **actual** thumb IP bend greatly exceeds the intended `.35 * bend` coupling, despite sub-millimetre endpoint contact at many poses. Shortest-arc orientation leaves thumb bones 1 and 2 with effectively zero local axial twist; the incompatible final frame places most roll into bone 3.

The thumb-only candidate derives a rest bend normal from the first two thumb segment directions, expresses it in wrist coordinates, transports it with the wrist, and projects it perpendicular to the target axis. It solves all three links in that plane and calibrates all three frame offsets against the same plane. It removes both the PIP-only replacement and the two shortest-arc exceptions.

| Metric, degrees | Baseline | Thumb-only candidate |
|---|---:|---:|
| Left thumb maximum IP bend | 89.73 | 25.68 |
| Right thumb maximum IP bend | 103.35 | 29.38 |
| Left thumb bone 3 local axial twist | −21.86 to 45.89 | −2.02 to 1.05 |
| Right thumb bone 3 local axial twist | −49.26 to 20.74 | −1.05 to 2.48 |
| Left thumb bone 1 local axial twist | approximately zero | −33.72 to 35.72 |
| Right thumb bone 1 local axial twist | approximately zero | −24.88 to 46.27 |

Thumb MCP centerline maxima remain 73.36° left / 83.94° right. The patch fixes the inconsistent chain; it does not assert these poses are a final anatomical solution. Real thumb functional axes are oblique and coupled, so these swing/twist measures are rig diagnostics rather than functional joint angles. [Chang and Pollard, 2008](https://publications.ri.cmu.edu/storage/publications/pub_files/pub4/chang_lillian_y_2008_2/chang_lillian_y_2008_2.pdf)

All non-thumb min/max/median joint metrics are **identical to baseline, zero difference** in the thumb-only candidate. Segment lengths, reachable-distance function, bend cap, contact depth, and wrist plan are preserved. Radial mesh closeups at 76.666667 s and 98.904343 s confirm the hooked distal thumb contour becomes a continuous, flatter thumb.

The changed pad orientation needs new contact offsets: with existing `contactLift`, right-thumb mesh samples lie 3.63–7.03 mm below the keys; left-thumb samples reach 6.30 mm below. This is why a correct tip marker alone cannot certify skin contact. Recalibrate from the final skinned pad and rerun reach/plan/contact checks after integration.

2. MCP direction is unconstrained, including active notes
------------------------------------------------------

Baseline rest-relative proximal swing reaches 113.18° at left middle / 161.7667 s (active), 104.99° at right ring / 67.8667 s (active), and 102.11° at right pinky / 67.9 s (idle). At 67.9667 s the actual mesh shows the ring crossing diagonally across its neighbouring fingers while the pinky projects sharply away from the hand. Limiting PIP/DIP curl cannot prevent this.

Current MCP projected spread ranges can exceed ±90°, but the largest values occur near a vertical proximal segment, where planar azimuth is poorly conditioned. Use the proximal direction itself in a calibrated palm frame, plus rest-relative swing, to score feasibility. Penalize/reject targets that require proximal segments pointing behind the palm or nearly dorsally upward; distinguish resting/transition fingers from contacting ones. Leave exact art bounds to the final model/pose review rather than treating these measurements as clinical limits. A piano-motion study also finds distinct MCP contributions; fixed distal coupling is only an approximation. [Goebl and Palmer, 2013](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0050901)

3. A stable normal helps frame continuity, but cannot repair infeasible targets
----------------------------------------------------------------------------

Baseline right-middle local MCP rotation changes 137.80° between 162.466667 and 162.5 s. In that interval its base translates about 55 mm, target-relative X changes from +22.86 to −26.17 mm, and the flexion normal changes from approximately `(0.125,0.063,0.990)` to `(0.435,0,−0.900)`. This combines the planner movement with the world-up plane turning rapidly; it is not solely an axial-spin bug.

The requested all-finger palm-lateral experiment reduces the highest sampled MCP angular speed from 4,134 to 3,489°/s, but still produces invalid near-vertical/crossing poses. It worsens the same ring/pinky web's blended-transform determinant from 0.117 to 0.046. Keep `pianist-coherent-all.ts` as an experiment, not the recommended patch. Revisit after the trajectory/fingering work removes these target configurations.

4. The mesh needs pose checks before weight changes
-------------------------------------------------

There are 3,422 body vertices with finger-bone influence. At baseline 67.9667 s, vertex 2348 blends approximately 52.18% right pinky 1, 40.80% ring 1, and 7.02% hand. Its blended linear transform has determinant 0.117. This is a useful **LBS contraction proxy**, not a measured volume ratio or collision test; varying weights mean it is not the full spatial deformation Jacobian. Adjacent-finger weights can be valid webbing weights, so this alone does not establish bad painting.

First fix crossing poses and large relative MCP rotations. Then inspect that ring/pinky web and the thumb web under the accepted pose. If a pinch remains, use a localized pose corrective or reviewed web/knuckle weights. Dual-quaternion skinning is an alternative for rotation-related contraction, but needs matching CPU audit and render paths; it does not fix crossed centerlines. [Kavan et al., 2007](https://users.cs.utah.edu/~ladislav/kavan07skinning/kavan07skinning.html)

Files and reproduction
----------------------

- Recommended source: `pianist-thumb-only.ts`; minimal unified diff: `thumb-only.patch`.
- Baseline: `pianist-baseline.ts`, `finger-audit-baseline.json`.
- Thumb-only metrics: `finger-audit-thumb-only.json`, `contact-thumb-only.json`.
- Non-thumb experiment: `pianist-coherent-all.ts`, `finger-audit-coherent-all.json`.
- Audit scripts: `compile.cjs`, `audit.mjs`, `contact-candidate.mjs`, `focused.mjs`.
- Baseline overhead / candidate experiment: `render-baseline/gl-960-{0,1,2}.jpg`, `render-candidate/gl-960-{0,1,2}.jpg`; times 67.966667, 76.666667, 138.2 s.
- Recommended thumb comparison: `render-thumb-baseline/gl-960-{0,1}.jpg`, `render-thumb-only/gl-960-{0,1}.jpg`; times 76.666667 and 98.904343 s.
- Rendering uses copies of the existing EGL QA renderer and actual skinned mesh / normals. It is a diagnostic render, not the browser's final output.

Everything above is under `/workspace/scratch/2e8cc8e77f98/finger-analysis/`. `pianist.ts` and `compiled/pianist.mjs` currently select the thumb-only candidate. `node compile.cjs && node audit.mjs` rebuilds and audits that scratch snapshot; it writes `finger-audit.json` without altering previous named reports.
