# Left-ring release candidate: db00407

This is a finite repair candidate, awaiting parent numerical and native visual review. It changes one released finger during 90.35175–90.49175 seconds. The original 80 ms joint blend crossed the resting pinky, then met the approaching middle finger. The candidate uses a 140 ms joint-space path with a small sideways movement, axial turn, and later lift. The first and last keyframes are zero offsets. Held notes, audible score fields, other joints, and the existing wrist-volume corrector remain unchanged.

`integration.patch` contains the typed source changes against parent source SHA-256 `67e774039e4c14272c2f88f08cbc44c210f79f3aed8c57aaf96bcaba65ed52ca`. `score-delta.json` contains only the `db00407` releasePose addition. Apply this delta to the current score; do not overwrite another agent's accepted edits with the frozen score here. The patch adds optional release keyframes to the existing joint transport. It preserves the existing 55° lift cap. A 10° axial turn changes the flexion plane while preserving the MCP–PIP centerline. The existing wrist corrector is already integrated and must not be added again.

`baseline/` and `candidate/` freeze the complete 13-module dependency set and scores. Baseline score SHA-256 is `90751a15d17721f1f72595089c567e47f22e729ba485e921105c7bb7189ca912`; candidate is `4af5c2d706b7bb849de58f24885938cd81d18fc33001afc58e174e1e48f6f7ed`. Candidate compiled pianist is `e2fc3f12a5bdf5facac8416eb4580af2845a1504c9d2bbf54dd0381b2420cce6`. The frozen modules are evidence, not replacements for the parent's later room or camera improvements.

Checks use model SHA-256 `be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc`, the body/rig also preserved by the later 3b10 garment asset. No model, image, or raw mesh dump is included here. The original model is already recoverable from the repository's previous compressed asset. In the current session it is `/dev/shm/daybreak-night-882c1c2d8c18/original-pianist.glb`.

After reading the checkers, run them with the project providing its locked `three` dependency and the original model path:

```sh
DAYBREAK_PROJECT=/absolute/path/to/pianopiece-threejs DAYBREAK_MODEL_PATH=/absolute/path/to/original-pianist.glb node qa/verify.mjs baseline candidate /absolute/path/to/new-240-report
DAYBREAK_PROJECT=/absolute/path/to/pianopiece-threejs DAYBREAK_MODEL_PATH=/absolute/path/to/original-pianist.glb node qa/verify-960.mjs baseline candidate /absolute/path/to/new-960-report
```

The package must reside beneath the repository, or have a local `node_modules` link to the project's locked dependencies. For the separate dense-held checker, copy `windows.json` beside a writable candidate score/module copy and run `node qa/dense-held.mjs candidate baseline` with `DAYBREAK_MODEL_PATH` set. It writes only `candidate/dense-held.json`. The verification checkers write their chosen output folder and capture input hashes before and after.

The surface oracle uses actual animated inner key boxes and noncoplanar intersections of strongly owned skin triangles. It includes mixed-web skin against all 88 keys; pair tests exclude mixed webs, coplanar pairs, and completely enclosed surfaces. Pair counts are incidences, not penetration depth or distinct visual crossings. Remaining middle–ring crossings and other inherited defects remain explicit. This does not establish whole-song collision clearance.

`render-times.json` lists the final inspection times. Native review must load both candidate rig and candidate score, with no extra wrist-corrector override. The broader default-arc grids, broad world waypoints, and early single-envelope candidates were rejected because they moved collisions into another key or finger. Version 1 passed 240 Hz geometry but failed the additional 960 Hz surface screen; only this later axial-turn candidate is submitted.
