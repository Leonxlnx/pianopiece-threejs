# Daybreak pop revision — integration in progress

This checkpoint continues the recovered GitHub `d020ecc` source. It does not claim to recover the lost v10 experiments. The user requested a substantial continuation: better hands, clothing and interior, plus a new original piano melody with an uplifting pop-song direction.

## Implemented

- New original 88-bar, 1,011-note, 227.101587-second composition at 96 BPM. A recurring melodic hook develops through verses, returning choruses, a quieter bridge, a higher final chorus and a resolved coda. The arrangement uses at most two held notes per hand and a maximum held span of seven semitones.
- Matching sampled-piano master rendered after 152 physical key-release adjustments. Public MP3: 320 kbps, −19.00 LUFS integrated, −1.63 dBTP, 7.3 LU loudness range. All 10,015,180 decoded samples are finite; six separated codec comparisons show zero sample lag. No critical listening was possible in this environment.
- Supported two-link elbow placement and a 10 cm seating/bench adjustment, preserving world-space feet and keyboard targets. Baked quintic wrist trajectories satisfy the physical release constraints.
- Twenty-two verified active grip corrections, plus a local db00108 ring-contact correction. The idle path follows the actual moving key height, with a compact three-axis thumb rest and cadence-dependent nonthumb lift. This clears the finite severe idle-key queue; neighboring-finger crossings remain under repair.
- Ivory crepe blouse and midnight wool trousers, eased garment geometry, rounded cuffs and facings, seam threads, placket and pearl buttons. The original adult body, face, skin, hand geometry, skeleton and bind matrices are preserved exactly. This is authored cloth, not cloth simulation.
- Rebuilt staggered floor boards, corrected wood grain and limestone mapping, linen acoustic panels, olive upholstered seating, ceramic and stone furnishings, a reading lamp, and softer room fill. Static batches retain shadow flags and named architecture membership for audits. Lounge chairs face the performance, side returns close the entrance corners, and solid door jambs, a header and a meeting rebate remove exterior light leaks.
- Corrected lid-prop contact against the actual underside, grounded laminated bridges and steel string tails. Dynamic keys, dampers and pedals remain separate.
- Twenty-four newly phrase-timed shots, including the bridge portrait, final chorus and high-note closeup. Hand portraits now retain both full hands and keep the head outside the image at 9:16 and 4:5. Portrait compositions and reduced-motion camera/FOV behavior are explicit.
- Hair motion rebaked from the new score and supported posture. A lossless, hash-verified character source archive reduces repository payload while restoring the identical runtime GLB during development and builds.

## Evidence and remaining blockers

The production build passes with the new source-asset pipeline and integrated idle changes. The five existing tests and twenty mocked lifecycle checks pass in the integration work; final verification will bind the final combination. The camera audit covers 672 room-framing samples plus 96 reduced-motion samples; keyboard geometry covers all 88 real keys and 52,800 rays.

On the identical 22-note active-grip score, old idle produced 22 severe key intersections across 19 of 72 contexts. The replacement has zero severe key rows in that screen and in 167 additional dense transition samples. Opposing-hand rows fall from three to zero. Full 60 Hz motion verification is being repeated after final grip integration.

**Do not call the whole hand collision-free.** The expanded every-note-midpoint baseline (`all-midpoint-baseline.json`) covers 863 unique times across all 1,011 notes. It finds 57 key-core rows deeper than 3 mm, 53 own-palm rows, 624 neighboring-finger rows and zero opposing-hand rows. The earlier 72-context idle screen was too narrow to establish global clearance. Independent surface localization confirms real crossings beyond the shared web in several families. Pads alone do not establish a good hand. The retained blocker is independently measured key-core penetration deeper than 3 mm; triangle-pair counts are not penetration depth. The local ring correction clears its own-palm defect across 158 matched contexts without new key or patch-pair collisions, while leaving other neighbor defects explicit.

Global predictive-weight and stronger shaft-direction experiments were rejected because they introduced new key penetrations or exceeded the retained fingertip-speed limit. Keep accepted source and finite repairs separate from those experiments.

The final room still uses the original moderate-detail face and ponytail. Offline images use actual scene and skin geometry with approximate material lighting; they do not establish browser pixel parity. Supported browser preview timed out on both bounded attempts. The original Sites project returned 404 in this workspace, so its hosting identity was retained and no replacement Site was created. The public release has not been updated.

The full new native 1080p/30 fps film has not been rendered. Its inherited CPU estimate was 13–20 hours. The export script now derives duration from the actual score and uses portable paths; strict source, frame, decode and audio guards remain in place.

## Evidence map

| Folder or report | Scope |
| --- | --- |
| `music/` | Composition, pinned samples, render/verify scripts, frozen audible score, mastering and codec evidence |
| `character/` | Deterministic garment generator, bind/mesh invariants and matching before/after views |
| `hair/` | Exact-posture motion bake and dependency-signature checker |
| `active-grips/` | Finite active repair and actual key-pad/skin evidence |
| `reviews/` | Independent hand, room and integration findings |
| `camera-room-audit.json` | Actual architecture framing and reduced-motion camera checks |
| `keyboard-geometry-audit.json` | Hinged key geometry against actual triangle surfaces |
| `asset-reproduction.json` | Fresh character restoration, byte identity and corrupted-input rejection |
| `release-fit.json` | Wrist trajectory and physical-release fitting decisions |

Reports named `pop-initial`, `pop-support`, `pop-all-knuckle` and `pop-fitted` are **intermediate experiments**, not final acceptance. Some intentionally retain failed candidates as evidence. Read each report's input state and limitations.

## Portable evidence

Public numerical reports retain the measured failures, sample queues, thresholds and input checksums. Raw per-vertex locations, triangle-index pairs, bone weights and private workspace paths remain in local diagnostic output. `production/qa/portable-report.py input.json output.json` creates a separate portable copy; it refuses to rewrite an authoritative performance score. The character paired-pose caches are also local: the verifier reconstructs them from the frozen source and repeats the same mesh and reviewed-image hash checks when they are missing. Missing caches do not skip validation.

## Reproduce

```sh
npm run assets:prepare
python production/pop-revision/character/verify.py --input production/revision/wrist-analysis/input-pianist.glb --asset public/assets/pianist.glb
node production/pop-revision/hair/check-posture-inputs.mjs
node production/qa/export-scene.cjs
node production/qa/audit-camera-room.mjs production/pop-revision/camera-room-audit.json
node production/qa/verify-keyboard.mjs production/pop-revision/keyboard-geometry-audit.json
```

Music scripts use their own directory for outputs. Fetch the pinned sample bank with `fetch_samples.py`, then run `render.py` and `verify.py --score ../../../public/assets/score.json` from `production/pop-revision/music/`. Read its composition and provenance files first. WAV intermediates and the sample bank are reproducible and intentionally ignored. Finger-only changes preserve the audible-event signature; pitch, attack, duration, velocity or pedal changes require a new master. A final immutable film job must bind its final score to matching verified audio.
