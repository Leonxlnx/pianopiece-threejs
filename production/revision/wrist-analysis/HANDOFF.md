# Frozen wrist trajectory — contact, skin, motion and seek pass

This supersedes the earlier research-only conclusions in `RECOMMENDATION.md`.

## Integrate

1. Apply `integration.patch` to the checkout. It adds `app/performance/wrist-motion.ts`, adds the optional motion data to `Score`, and lets `Pianist` use the baked absolute-time trajectory. It skips runtime pose fitting when motion data is present.
2. Copy **`score-with-motion.json`** to `public/assets/score.json`. This is the updated calibrated score with compact motion arrays embedded. No second network request is needed.
3. Recompile the existing offline QA modules, independently rerun the actual rig audit, and combine the inactive-finger improvements from the anatomy task before final motion review.

`planned-score.json` is the identical updated score without embedded motion. `wrist-motion.json` contains only the compact trajectory. `motion-plan.json` retains the verbose source knots and note groupings for review. `motion-runtime.mjs` installs the same curve externally for scratch audits. The production TypeScript sampler was compiled and compared against that audit override across **27,980 hand samples: maximum difference zero** (`runtime-parity.json`).

## Verified result

| Gate | Result |
|---|---:|
| Actual skin samples | 5,340 |
| Missing fingertip samples | 0 |
| Skin samples outside ±3 mm | 0 |
| Skin gap range | −2.38067 to +2.04259 mm |
| Maximum actual IK contact error | 0.92102 mm |
| Actual wrist speed maximum | 1.29301 m/s |
| Actual wrist acceleration maximum | 17.67414 m/s² |
| Absolute-time seek difference | 0 |
| Nonfinite positions | 0 |
| Held soprano / inner-voice entries retained | 40 / 40 |
| Maximum simultaneous keys, L / R | 3 / 4 |
| Maximum simultaneous span, L / R | 12 / 10 semitones |

The full audit replays 13,990 poses at 60 Hz using the current model, coherent thumb, z floor .295 and actual phrase-driven posture, including the scene’s 1.8-second energy blend (`full-rig-audit-blended.json`). It separately samples five positions within every physical note hold. Its pass expression includes wrist speed below 1.5 m/s and acceleration below 25 m/s² as well as contact, skin and seek gates.

**Separate remaining scope:** inactive-finger target animation still has speed and orientation issues, under active work by the anatomy agent. The highest reported inactive fingertip speed in this snapshot is about 5.02 m/s. The wrist/contact/skin pass does not certify those inactive arcs or a final visual review.

## Music and physical release changes

All **1,068 attacks, pitches, velocities, roles and hand ownership are unchanged**. Runtime remains **233.144228 s**, with the same written final chord and resonance tail. The DP changes 788 finger assignments. A total of 407 notes have earlier physical key releases after wrist and finger travel planning. Those releases are pedal-supported through their former audible endpoint, except for the ten explicitly authorized boundary adjustments below. Original physical durations are preserved in `writtenDuration`.

All 40 written inner-voice entrances still occur under a physically held soprano. One of those soprano notes, `p00923`, releases 28.172 ms earlier only after its final inner entrance; its sound remains carried by continuous pedal. No entry loses its held outer finger.

| Note ID | Bar | Pitch | Former audible end | New audible end | Earlier by |
|---|---:|---|---:|---:|---:|
| p00064 | 6 | A4 | 17.942139 | 17.917139 | 25 ms |
| p00170 | 14 | D♯5 | 40.405304 | 40.380304 | 25 ms |
| p00409 | 31 | E5 | 87.673639 | 87.648639 | 25 ms |
| p00440 | 33 | E5 | 93.224441 | 93.199441 | 25 ms |
| p00704 | 55 | D6 | 156.194243 | 156.169243 | 25 ms |
| p00734 | 57 | D5 | 161.823873 | 161.798873 | 25 ms |
| p00830 | 63 | A5 | 176.523885 | 176.516219 | 7.666 ms |
| p00838 | 63 | A5 | 177.848619 | 177.832219 | 16.4 ms |
| p00939 | 69 | D6 | 192.678489 | 192.670823 | 7.666 ms |
| p01016 | 74 | A4 | 207.858445 | 207.833445 | 25 ms |

`compare_audible.py` independently compares the frozen musical score (SHA256 `3915abaf49b17a7df0b7d18e88a735d27923b9c64af255b5d7853471b1c4b56f`) with this candidate using damper/pedal semantics. Its `audible-comparison.json` result confirms exactly 397 acoustically equivalent physical changes and these ten audible changes.

These ten ends now coincide with their pedal release. They total 206.732 ms across the entire performance and leave the attacks, rhythm, thematic contour and sustained counterpoint intact. Re-render the master using the updated score as planned.

## Why the curve works

The planner enumerates ordered finger combinations while preserving identities on held keys, evaluates actual rig poses, carries a previously feasible pose when possible and fits shared poses through four closely spaced RH groups. It then assigns quintic motion intervals from actual wrist displacement and angular motion. It tests every held key along each interval, advancing a physical release only when acoustically allowed. It uses no runtime low-pass, per-frame solver state or arbitrary teleport to a new attack target.

Forty-four note-specific `contactLift` values were recalibrated using actual skinned pad vertices after refingering. They are included in the delivered score and keyed to the final finger assignments.

## Reproduce

Run `bash reproduce.sh` in this directory to reproduce from the frozen `input-score.json`, `input-pianist.glb` and copied compiled rig modules. `input-manifest.json` records those source hashes. The current snapshot matches the root's compiled coherent-thumb and .043 phrase-amplitude source.

For a new model, calibration or posture change, first run `python prepare_inputs.py --source /workspace/sites/daybreak-piano-film`, then the reproduction script. That intentionally creates a new candidate and requires another independent audit.

`candidate-manifest.json` records output hashes. The integrated score hash is **5b47b2ba244b70fd2b7a63b47baccc366bdd0c7faaccbf00959c9aa43ae05baa**.

No checkout file was changed by this task.
