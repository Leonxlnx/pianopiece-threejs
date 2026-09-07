# Daybreak continuation, September 7–8

Work resumed at 2026-09-07 14:52:02 UTC / 22:52:02 China. The user requested active implementation and reference comparisons through at least September 8 06:00 China (September 7 22:00 UTC), with frequent GitHub saves. This log records actual checkpoints; an interruption does not count as work and the time target is not yet met.

Starting branch: `codex/daybreak-pop-revision`, commit `66253da40dbf9090036b52c92b560918fb0e0b51`. The repository was freshly cloned and its clean head verified. No lost animation checkpoint has been silently relabeled as recovered.

## Recovery and current evidence

- Existing locked dependencies installed successfully; the exact 17,123,372-byte character was restored and SHA-256 verified.
- A fresh production build passed on the saved application. This does not certify a future animation candidate.
- Native EGL rendering works again. Fresh actual-scene views at 0, 53 and 170 seconds were reviewed at 1280×720. They show the current hand/wrist defects, dark lacquer, flat warm lid underside and room contrast; these remain improvement targets.
- The QA compiler now compiles every performance dependency, records source/output hashes and refuses stale compiled input. A changed-source control was correctly rejected.
- The pose renderer supports an isolated rig path and records exact input hashes so a candidate cannot be confused with the installed runtime.
- Research is running independently on real reference images, A4 release geometry, wrist skin deformation and exact-score audio recovery. Candidate results are not installed until reviewed.

The original Sites identity was checked through its owning connector again and still reports project not found. Preserve it; no replacement Site has been created. Public deployment and full new film remain unfinished. Do not retry the previously rejected screenshot uploads through another route.

## Continuing checks

Compile with `node scripts/compile-performance.mjs`, verify with `--verify`, then use the existing geometry audits. `production/qa/export-scene.cjs` remains a compatible compilation entrypoint. `bash scripts/render-native.sh` uses system EGL or an explicitly prepared `DAYBREAK_EGL_ROOT`; it does not install or replace system libraries. The environment's software renderer is an approximation of the actual Three.js shading, not a claim of browser parity or live audio playback.

Keep the fitted musical score. Rerunning the composer is not a substitute for preserving physically fitted releases. Any integrated audible changes need matching audio provenance; posture changes need matching hair motion. Keep the current 3 mm skin/key, 5 m/s fingertip, 1.5 m/s wrist and 25 m/s² wrist acceleration bounds, and actual surface/visual checks.

## Recovered runtime checkpoint, approximately23:28 China

Restored integrated V7/E3+9 finite release routes+2 short-gap lift controls and matching reproduced MP3. Full240Hz audit passed54506frames/5055skin samples, finger4.963512m/s, wrist1.499355m/s, acceleration24.957809m/s². See production/pop-revision/overnight. The audit now hashes inputs before replay and rejects input changes; its final unequal time interval uses measured elapsed time. Wrist volume, other collisions, final hair, online preview and full film remain outstanding. Piano cast-frame supports, tuning-pin support and lid veneer refined against inspected references. Root cleared only completed reproducible scene/download caches after disk pressure.
