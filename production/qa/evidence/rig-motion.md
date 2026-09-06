# Final rig temporal and key-surface verification

The key-surface sign mismatch is fixed. Actual GrandPiano meshes, update envelopes, and contact methods agree with the analytical surface to floating-point precision. All held contact target projections stay inside their key top footprints. The calibrated contact lifts preserve endpoint accuracy and produce motion statistics similar to round6.

## Exact snapshot

| File | SHA256 |
|---|---|
| pianist.ts | `3bec2bf62fc678f1f05e6cd187313faa12165333f6404488adc60a2de4f03ce7` |
| piano.ts | `8a094c89843878b3b7b31dbee818ec4eaba6f5d4152e19154fa76dc621a3cadc` |
| math.ts | `3d682c80a8dfc1e84b7d2181357f398a9bb048b2599db77b0e0f09ec6edeb862` |
| score.json | `0587348ddda6c2fb7c415148ffca11c09c64e844069b0d4426fc6dff89d24f84` |
| pianist.glb | `48aa8727f23d2102ec83b6e0ce44baaeb05f3f89c106b656b2094c37cc70f014` |

The score includes per-note animation contactLift values; both the optimizer and runtime target consume them. Source snapshots and metadata are retained here. The GLB was read from the public asset path and matches the recorded hash.

## Method

One full sequential60 Hz pass,13,743 frames over229.036 seconds. The GLB skeleton is reconstructed with exact node transforms, then the actual snapshot Pianist.load/update methods run. GrandPiano is instantiated directly with a no-op canvas drawing context; its actual update/contact methods drive the keys. No renderer, browser, alternate key-angle mock, or Site checkout writes.

During the same pass, each analytical key-surface contact point is transformed into its actual key Mesh local space. The test compares local y against the generated geometry's top plane and checks x/z containment, with a conservative rounded-edge allowance. Marker endpoint residual uses the complete desired target including that note's calibrated contactLift. These checks do not independently validate the skinned fingertip area; root's skin-vertex calibration addresses that separate quantity.

## Results

| Measurement | Result |
|---|---:|
| Held contact samples |31,981|
| Maximum marker target residual |0.000361 mm|
| Contact residuals >5 mm / >10 mm |0 / 0|
| White analytical surface vs actual mesh top |max3.800e−10 m|
| Black analytical surface vs actual mesh top |max2.235e−11 m|
| Contact projections outside key geometry |0|
| Wrist displacement,99th percentile |22.623 mm/frame|
| Wrist displacement,maximum |45.605 mm/frame|
| Wrist steps >50 mm |0|
| Finger local rotation,99th percentile |19.532°/frame|
| Finger local/world rotation,maximum |81.697° / 81.745° per frame|
| Finger local/world rotations >90° |0 / 0|
| Non-thumb PIP/DIP bend,maximum |106.208° / 69.035°|

Footprint breakdown:

| Type | Samples | World target z | Minimum edge margin | Conservative flat-top margin |
|---|---:|---:|---:|---:|
| White |21,614|.230–.264 m|11.35 mm|9.95 mm|
| Black |10,367|.175037–.216 m|7.25 mm|5.25 mm|

## Remaining motion qualification

There are **227 local finger rotations >45°** among412,260 finger-joint frame pairs:212 proximal and15 middle-joint changes; none distal. None occur while the finger is held in both adjacent frames;8 occur entering contact. This is similar to round6's220, with no new >90° event.

The largest remaining cases are R index at184.7833→184.8000s (81.697°), R index185.1333→185.1500s (78.843°), R middle190.2000→190.2167s entering contact (78.810°), and L pinky31.7333→31.7500s /92.0333→92.0500s (72.662°). These are the useful frame ranges for the parallel rendered motion review. Numerical endpoint and bend checks should not be described as complete natural-motion validation.

The older full onset/release boundary suite was not repeated, as requested. The prior round6 boundary checks passed; this final pass found no contact regression after the lift calibration.

## Reproduction and evidence

`node /workspace/scratch/daybreak-assets/temporal-final/audit.mjs`

- `audit.json`: final combined motion, endpoint, rotation-count, and actual-mesh footprint evidence.
- `plan-knots.json`: every hand knot, note, timing, lift, wrist position, and quaternion.
- `snapshot.json`: source hashes and capture timestamp.
- `replay.mjs`, `audit.mjs`: exact offline replay and combined gate.
- `pianist.ts`, `piano.ts`, `math.ts`, `score.json` plus compiled `.mjs`: immutable audit snapshots.

No additional tests or source mutations were performed after these gates completed.
