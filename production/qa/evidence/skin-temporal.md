# Actual skinned fingertip contact over time

**No additional contact failure was found between calibration frames.** Across58,688 held-note skin samples for all1,467 notes, the existing calibration footprint gives clearances of **−1.312721 to+0.450259 mm**. No sample exceeds±1.5 mm, and no fingertip pad loses footprint coverage. The largest within-note change is **0.088290 mm**; the next largest is below0.000007 mm.

These results support retaining the current contactLift calibration for held-note motion. Remaining approximately1 mm intersections are static calibration details already present in the original single-pose measurements, rather than missed orientation-dependent problems.


**Post-fix update:** Root corrected the repeated-key envelope identified below. A focused1 kHz recheck of both complete affected holds (523 samples) confirms keyDown=1 throughout and skin clearance stable at−0.286115 mm. The former0.088290 mm drift is eliminated; the full sweep below is retained as pre-fix evidence. No whole-performance rerun was needed.

## What was sampled

The exact GLTF is loaded with GLTFLoader, and the actual Human SkinnedMesh vertices are deformed through Three.js. Pianist.load/update and GrandPiano.update/contact run directly. Textures use no-op placeholders; no rendering or browser is involved.

The distal pad selection exactly reproduces production/qa/skin-contact.mjs: vertices with at least.35 weight on the distal finger bone, within the final11 mm of that bone's selected vertex extent. Saved vertex IDs are in pad-selection.json. The original calibration time is onset+min(45 ms,45% of hold), which is usually early in the note rather than its midpoint.

Coverage:

- 20,625 initial poses: the complete229-second performance at60 Hz, every note onset/release sampled on both sides at±1 microsecond, and every original calibration time.
- 49,048 initial held-note skin measurements.
- Adaptive refinement on57 notes selected for largest penetration, separation, or within-note range:2,558 extra poses and9,640 extra held-note measurements. Each extremum receives24 subdivisions within its surrounding frame interval, clipped to the physical hold.
- Final total:23,183 poses and58,688 held-note skin samples;7–307 samples per note.
- 45,348 samples have multiple simultaneous notes in the same hand.982 notes overlap another same-hand note, and891 notes span a change in the same-hand held-note count.
- Additional downward ray intersections against the actual rounded key mesh check the worst cases and30 distinct low/high notes. These distinguish real rounded-surface contact from a conservative infinite top-plane estimate at a bevel.

## Comparison with single-pose calibration

Negative clearance means the sampled skin vertex lies below the key surface; positive means above it.

| Scope | Samples | Minimum | Median |95th percentile|Maximum|Missing coverage|
|---|---:|---:|---:|---:|---:|---:|
| Original calibration times and footprint |1,467|−1.312721 mm|−0.286125 mm|+0.082746 mm|+0.450259 mm|0|
| Full temporal sweep, same footprint |58,688|−1.312721 mm|−0.289849 mm|+0.082768 mm|+0.450259 mm|0|
| Full temporal sweep, actual key mesh footprint |58,688|−1.312721 mm|−0.363999 mm|+0.007313 mm|+0.162374 mm|0|

All three scopes have zero samples outside±1.5 mm or±3 mm. The adaptive sample distribution deliberately emphasizes extreme cases; these percentiles are sample summaries, not time-weighted prevalence estimates.

The mesh-footprint variant includes pad vertices over the complete assigned key's actual x/z bounds. The production legacy mask restricts white-key vertices to z=.230–.275 and black-key vertices to.133–.221. This can exclude valid contact elsewhere on the same assigned key: the legacy+0.450259 mm maximum at p01248 becomes−0.543377 mm when all distal pad vertices over the actual key footprint are considered.

## Actionable note and time cases

| Note | Hand / finger / MIDI | Physical hold | Evaluation time | Finding | Implication |
|---|---|---|---|---|---|
|p01240|R thumb /68|184.812–185.112115s|184.812001s|Legacy/plane−1.312721 mm; actual rounded-mesh ray−1.014844 mm|The plane's lowest vertex is on a bevel. Static contact polish only.|
|p01370|R thumb /66|199.196–199.344521s|199.196001s|Actual rounded-mesh ray−1.198784 mm|Deepest intersection among30 distinct rounded-mesh confirmation notes; already present at calibration time.|
|p01376|R thumb /75|200.396–200.733953s|200.396001s|Actual rounded-mesh ray−1.150214 mm|Another static contact polish candidate.|
|p01248|R middle /84|186.020–186.234898s|186.234897s|Legacy+0.450259 mm; full key footprint−0.543377 mm|Legacy front-only mask overstates apparent separation; pad coverage on the actual key remains.|
|p00333|R middle /78|58.520–58.775s|58.774305s|Clearance changes from−0.286115 to−0.374405 mm|Largest temporal change,0.088290 mm; caused by repeated-key anticipation described below.|
|p00785|R middle /78|125.720–125.975s|125.974305s|Same0.088290 mm change|Repeat of the same timing/keyboard-envelope case.|

No lift change is required to resolve a newly discovered held-note problem. If the remaining static approximately1.2 mm intersections are polished, use the rounded-mesh evidence and rerender those notes after a localized lift adjustment; the optimizer can change wrist pose when lift changes.

## Small keyboard-envelope issue — identified and corrected

The only nontrivial temporal drift comes from the next note's anticipation overriding an already-held instance of the same key, rather than a wrist-overlap problem:

- p00333 holds MIDI78 until58.775s. Next same-key p00335 starts58.804s; its30 ms preparation starts58.774s, one millisecond before the old hold ends.
- p00785 holds until125.975s. Next same-key p00787 starts126.004s, creating the same one-millisecond overlap at125.974s.

GrandPiano.update processes each note sequentially, so that future note's partial down amount overwrites the preceding full down amount. The resulting orientation change shifts skin clearance by only0.088 mm. Root implemented the correction by taking the maximum per-key down amount. The focused post-fix verification below confirms it eliminates this drift.

## Scope and limits

This is an actual skinned distal-pad vertex audit over the assigned key, including adaptive temporal and rounded-surface checks. It is not a complete continuous triangle-collision proof or a whole-hand/adjacent-key collision audit. It found no missing pad coverage and no new held-contact failure in the sampled performance. The production checkout was read-only throughout.

## Reproducible evidence

`node /workspace/scratch/daybreak-assets/skin-temporal-review/sweep.mjs`

`node /workspace/scratch/daybreak-assets/skin-temporal-review/rounded-mesh-check.mjs`

- report.json: full summary, worst cases, temporal ranges, and initial rounded-mesh confirmations.
- per-note.json: every note's start/end, lift, sample count, baseline, minimum, maximum, and maximum change.
- samples.json: all58,688 held-note vertex-clearance measurements.
- rounded-mesh-checks.json:30 distinct note confirmations against actual rounded key triangles.
- coverage.json: overlap and per-note sample coverage.
- pad-selection.json: exact selected distal pad vertex IDs.
- snapshot.json: complete source hashes; source, score, and GLB snapshots are included.

Snapshot SHA256:

| Source | Hash |
|---|---|
|pianist.ts|`ca95cc78d4bd6522e893f53f402ce2f3b47acf034819fadd44684779685d9289`|
|piano.ts|`8a094c89843878b3b7b31dbee818ec4eaba6f5d4152e19154fa76dc621a3cadc`|
|score.json|`0587348ddda6c2fb7c415148ffca11c09c64e844069b0d4426fc6dff89d24f84`|
|pianist.glb|`48aa8727f23d2102ec83b6e0ce44baaeb05f3f89c106b656b2094c37cc70f014`|

## Focused verification after envelope correction

Current production source was snapshotted in envelope-fix/. The two affected physical holds were sampled every1 ms, with exact near-onset/near-release samples and the original calibration times. Actual GLTF skin deformation and GrandPiano methods were used, with the current math.pedalPosition helper supplying visual pedal position.

| Note | Samples | Key down range | Skin gap range | Within-note range | Missing coverage |
|---|---:|---:|---:|---:|---:|
|p00333,58.520–58.775s|262|1–1|−0.286114981 to−0.286114928 mm|5.366e−8 mm|0|
|p00785,125.720–125.975s|261|1–1|−0.286114874 to−0.286114835 mm|3.907e−8 mm|0|

The changes are now numerical noise. No skin lift, arm, or finger recalibration is indicated. The whole-performance sweep was not repeated.

Reproduce: `node /workspace/scratch/daybreak-assets/skin-temporal-review/focused-repeat-check.mjs`

Evidence: focused-repeat-check.json; envelope-fix/snapshot.json. Focused snapshot hashes:

- pianist.ts: `25f541d5dca0fe6bb51f7d0b205d85514dfbef1916cbe769a75de4e3abb69362` (only a shoe comment differs from the full-sweep pianist snapshot).
- piano.ts: `388f6fdd8ce6ee7347f2643cd582b8be01c8a9ba4918a75f496b7b91a18342c8`.
- math.ts: `d3c255aded15a1df21d64b84c6705194397ba3ca095bc277e7238238f7812468`.
- Score and GLB hashes are unchanged.
