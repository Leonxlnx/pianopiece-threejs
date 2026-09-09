# Held-thumb fitting handoff

71 held-thumb note fixes are ready to merge into the combined score. They pass the declared actual-geometry contact gates on the frozen compact5 rig. 69 unreserved notes remain explicit whole-grip exceptions; 13 additional bad thumb notes belong to root or active_hand_fit. Idle transitions and combined support changes still require root's review.

Use `changes.json` as the merge surface. `candidate-score.json` is a complete frozen-score example, SHA-256 `6d187b2459b7ecaf91bd7368156389f80c0810a6d48dc3194a4a2ce2348a5a85`. Apply only the 71 note deltas to the latest combined score with `node apply-changes.mjs INPUT_SCORE OUTPUT_SCORE`; this checks event/fingering and changed-field preconditions and writes a separate output. The merge check is semantically identical to the candidate; JSON serialization can produce a different file hash.

## Frozen inputs and ownership

- Baseline score: `9db662f1e9d4037cc8c505b9818b7782ac1fb52fe70cff85bf362a00a9fb3b30`.
- compact5 TypeScript source: `4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45`.
- Original compiled rig: `c1926fa883fbc1b7e6be198851a037b5d40c5da79b46319864d62c4e29663cbf`.
- Model: `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`.

`input-hashes.json` pins the copied model, score, source, compiled rig and local dependency files. `rig-local.mjs` only redirects the original compiled rig's imports into the frozen local dependency copy. `reservations.json` contains 72 reserved note IDs: root's five, active_hand_fit's low-support notes and whole phrases, plus newly assigned neighbors p00426/p00427/p00788/p00789. The two newly reserved thumb notes were restored to baseline and excluded from delivered changes.

## Complete finite audit and fit

All 289 thumb notes were initially audited at 13 declared held fractions: 0.001, 0.02, 0.05, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.95, 0.98, 0.999. That produced 3,757 actual-geometry samples and a finite queue of 153 bad notes. After the two ownership transfers, 140 bad notes were available for this leaf: 71 received accepted held solutions and 69 became whole-grip exceptions.

The bounded search changed only `note.contactZ`, `note.contactLift` and `note.thumbOpposition`. It first tried small lift changes, then limited opposition and a finite depth/lift/opposition grid, followed by three small refinement steps. Opposition remained within ±0.85 rad, lift within 0.5–16 mm and contact depth on the key surface. 45 accepted changes are lift-only; 26 change opposition or depth. No note timing, duration, velocity, MIDI pitch, fingering, audio event, wrist knot, rig, model or app source was changed.

Final combined validation contains 8,857 geometry samples across all 289 thumb notes. The 71 changed holds account for 4,900 samples at 120 Hz plus held fractions and explicit contained wrist knot, moveStart, moveEnd and neighboring note-event boundaries. All remaining thumb notes were rechecked at the declared fractions plus those event boundaries. This is finite temporal sampling with exact event boundaries, not an analytic continuous-volume proof.

| Result on the 71 changed holds | Measured value |
| --- | ---: |
| Maximum owned thumb/palm key-core penetration | 2.774557 mm |
| Lowest terminal pad/key gap | −2.305104 mm |
| Highest terminal pad/key gap | +2.068933 mm |
| Missing terminal pad footprint samples | 0 |
| Owned thumb/palm triangle crossings | 0 |
| Owned thumb/neighbor triangle crossings | 0 |
| Maximum solver point-contact error | 0.000216 mm |
| Newly failing thumb notes | 0 |
| Unauthorized field changes | 0 |

The key-core measurement uses actual skinned vertices against transformed key boxes with the harness's bevel margins, and records depth inside the key volume. The terminal pad measurement uses actual vertices with more than 65% Thumb3 weight, measuring the lowest surface inside the key's beveled footprint. It does not substitute the fingertip helper target for skin contact. Own-palm and neighbor checks use noncoplanar intersections between owned skin triangles. Shared skin boundary regions are excluded by the ownership threshold, so these metrics do not certify every mixed vertex or every neighboring inactive finger/key condition.

The local thumb-bone quaternion-from-rest measure was also checked on every changed hold using the same definition as root's rejected wide-opposition experiment. The largest first-bone rotation is 1.150105 rad, at p00969. This combines rig bend/rotation and is not a clinical joint-angle claim.

## Actual render review

Six actual native EGL top renders compare the baseline and candidate at p00013/4.5384775s, p00514/105.7149985s and p00906/187.4408685s. They cover a −0.7 opposition case, the largest lift case and a depth/opposition case. All six images report `GL_NO_ERROR`; source comparison shows only the score and renderer camera plumbing differ. The p00013 thumb is more rounded/open; p00514 has a small local contour adjustment. The p00906 thumb remains mostly hidden beneath the hand in this top view. No new obvious thumb collapse was observed in these representative views. They do not certify all 71 visual poses or any idle transition.

`evidence-manifest.json` records all six copied image hashes and both full original renderer reports. These are offline native renders; no browser pixel-equivalence claim is made.

## Finite remaining work for the parent

`whole-grip-exceptions.json` contains all 69 unreserved exceptions, with exact note/time/hand, baseline failures, best bounded trial and trial count. In overlapping categories, 52 involve thumb/palm crossings, 21 thumb/neighbor crossings, 13 palm/key penetration, 22 thumb/key penetration and 27 low pad surfaces. The queue has been sent to active_hand_fit. No unsupported claim of mathematical impossibility is made: these notes failed the declared limited parameter search and need coherent grip/support or fingering work.

`root-transition-queue.json` contains 119 unique affected thumb idle transitions and 71 paired-event review entries. Timing is unchanged, but changed endpoints alter compact5's idle interpolation. Root must validate those transitions, paired articulation and the final score after other agents' wrist/support changes. This leaf deliberately does not claim final film readiness.

The 13 reserved bad thumb IDs are p00193, p00194, p00323, p00329, p00419, p00423, p00427, p00533, p00781, p00789, p00855, p00862 and p01008. Their fields are unchanged here.

## Evidence and reproduction

- `baseline-audit.json`, `bad-note-queue.json`: every audited thumb and finite failure queue.
- `fit-report.json`: 71 held solutions, 69 exceptions and two reserved records from the running search.
- `validation-report.json`, `joint-review.json`: final combined actual geometry and local rotation evidence.
- `changes.json`, `apply-changes.mjs`: guarded merge surface.
- `whole-grip-exceptions.json`, `root-transition-queue.json`: explicit remaining work.
- `hashes.json`, `input-hashes.json`, `check.mjs`, `GATES.md`: provenance and runnable ledger.

Run `node check.mjs` in this directory to check hashes, counts, merge parity, ownership and acceptance thresholds. Run `node validate.mjs` to repeat the final geometry check. All four local gates are complete, with the authorized finite exception and parent-transition handoffs recorded. Root checkout and Sites were not modified.
