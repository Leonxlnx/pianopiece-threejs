# Resumed hand revision checkpoint, 8 September 2026

Read `../current.json`, this file, then the relevant leaf's review before using any candidate. These are work-in-progress sources and measured evidence, not a new public release. The app still uses the primary score `9db662f1…`; none of the combined review scores has final whole-hand acceptance.

`manifest.json` records every copied file's exact original bytes and SHA256. Large raw JSON reports are stored as deterministic gzip files. Run `python restore-evidence.py` to verify all bytes and restore the referenced JSON filenames locally. Shared model/texture assets and installed dependencies are already elsewhere in the project and are not duplicated here. Some scratch harnesses contain the original absolute paths; adapt those paths to the restored checkout while retaining the pinned input hashes.

## Useful new work

- `combined-review/candidate-v4.json` (`efb1e0f4…`) combines the prior natural E5 grip, R76 middle phrase, and eleven LH55/60 held targets. LH55/60 changes 24 notes and 24 wrist knots, with no new musical release edits. It passes 1,421 target-held poses; 49 inactive gaps remain queued. The delta replays with exact guards.
- `idle-nonthumb/` preserves frozen additive corrections for RH107, LH91, RH68/RH73 and repeated D5 Index release/arrival. They act only while the bound finger is inactive. Each delivery has exact score/gap bindings, finite geometry/motion evidence, and limitations. Rebind and check the final combined score before integration. RH68 includes a documented small increase in an already-intersecting pair's triangle count.
- `rh89-idle/` preserves the three-curve qualified subset: Pinky short-gap motion, Ring approach, late Index key clearance. Earlier Index release and Ring release are still unresolved; rejected fast motion must not be merged.
- `yaw-passages/` contains a useful second held-passage yaw/translation delta near 187 seconds. The first passage remains rejected; the second still has idle failures. It is not in combined-v4.
- `opening-revision/` is a new root-owned natural opening fingering (B4/G4/E4/D4/G4/A4 = 5/3/2/1/3/4), extended through the following phrase. Its 988-pose check has zero active key/pad/IK/palm failures. Idle and opposing-hand motion remains work in progress. This supersedes neither the combined score nor the previous rejected opening diagnostics until its delta and motion are qualified.

## Rejected global experiments

- `curled-idle/`: graded rest angles reduce some collision observations but visibly fan the fingers. Uniform 60-degree MCP/55-degree PIP/25-degree DIP produces more key collisions. Neither is accepted.
- `neutral-target/`: a fixed wrist-local target visibly curves free fingers; global key-core observations increase 357 to 412. Seven short observed clear intervals do not validate conditional entry/exit paths. Keep the explicit 372-context regression queue.
- `hand-runtime/pianist-arms-compact11.ts`: a curved thumb neutral improves selected static poses but increases whole-score midpoint key observations from 30 to 135 on combined-v3. Rejected globally. Compact5 remains the reference for the additive deliveries.
- Root compact6–10 and older E5 experiments remain diagnostic. The old raised E5 thumb solution is superseded by the natural E5 refingering. The R852-to-R855 geometry-clear trajectory still reaches 4.253 m/s and is not a final motion solution.
- Compact12 and compact14 are scoped opening experiments, not app runtime. Compact14 uses the actual moving key height during the two opening thumb approaches; its checked opening thumb key cores clear, while opposing thumb crossings remain under refinement.

## Work continuing outside this frozen checkpoint

Active leaves are fitting R79/early R76, L62, and R81/later R76 held grips. The inactive-finger leaf is transferring the qualified repeated D5 correction only to explicitly checked gaps. Root is refining the opening thumb and assembling the combined review. No new final master or complete film has started, and no revised public deployment has happened.

The native preview still reports WebGL disabled. Transport works in audio-only fallback; live 3D/synchronization and critical listening are unverified. Native EGL images are actual scene exports, not browser recordings. Meaningful work resumed at 13:42 UTC today; the interruption since the earlier approximately 5h40m session is not counted toward the requested twelve hours.
