# Two-record idle repair review

The index-059 early-release candidate removes new/worsened per-key core contacts relative to the frozen no-helper baseline while retaining most of its measured improvement. Curve-007 remains an explicit blocker. This is a review delta, not a clean-hand or whole-piece clearance certification.

## Minimal delta

Add `earlyRelease: [176.02, 176.065]` only to the LH Index record bound to previous note `p00800`, release `171.873523`, next note `p00831`, onset `176.201552`. Multiply its existing lift amount by `1 - idleSmooth((time - start) / (end - start))` for that optional tuple. The multiplier is exactly 1 when the field is absent. The current endpoint ID/time guards and inactive-only call remain intact.

This preserves the original lift until 176.02 s, fades it smoothly over 45 ms, and restores the no-helper index pose from 176.065 s until the next note. All other records retain their default behavior. `delta.json` provides exact before/after fields and helper expression; `fixed.mjs` and `data-fixed.json` are frozen reproduction inputs. Apply the small delta to newer data; do not overwrite newer complete files with this snapshot.

## Finished coverage

Completed 1,986 states: 1,562 for the index gap and 424 for the curve gap. Both complete gaps include 150 ms margins, a 240 Hz grid, exact note/curve/helper boundaries with ±1 microsecond probes, and an additional 480 Hz grid through the index arrival. Every state checks all six LH patches against actual moving key core solids and all 15 own-hand surface pairs. Both hands' active joint parity is checked. The earlier 13,441-timestamp replay was not repeated.

## Geometry tradeoff

Counts below use the same complete-gap sample set for all three rigs. Boundary probes are samples, not durations.

| Index-059 metric | No helper | Original helper | Early release |
|---|---:|---:|---:|
| Core-positive patch states (>3 mm) | 467 | 409 | 410 |
| Core-positive patch/key states (>3 mm) | 484 | 422 | 423 |
| New per-key >3 mm states versus no helper | 0 | 3 | 0 |
| Per-key >3 mm worsening >0.25 mm versus no helper | 0 | 10 | 0 |
| Strict existing finger-pair increases versus no helper | 0 | 21 | 21 |

The candidate retains 57 of the original 58 net improved core-positive patch states, and 61 of 62 net improved patch/key states. It restores four old per-key >3 mm states relative to the original helper and worsens 15 old per-key states by >0.25 mm; these stay within the no-helper comparison and remain listed in `finite-queue.json`. These event counts overlap. There are no new own-palm or finger-pair types versus either comparator in this index gap. The 21 strict existing finger-pair increases remain a separate issue. A triangle-pair count does not measure penetration depth.

## Motion and parity

Active local/world joint deltas, wrist deltas and outside-gap deltas are exactly zero across 4,208 active finger states. Other LH digits' joints/tips are unchanged. The original index pose is exact through 176.02 s, and the index matches the no-helper pose after 176.065 s. Index peak fingertip speed decreases from 1.031247 to 1.023369 m/s; its peak sampled joint angular speed decreases from 1494.911 to 1477.947 degrees/s. These measurements do not certify natural motion.

## Curve-007 blocker

The unchanged LH Index curve binds `p00424` release 90.407126 to `p00434` onset 91.530895; its four knots span 91.46–91.518 s. The complete 240 Hz gap screen finds 5 new per-key >3 mm states and 6 worsened per-key states, including LIndex/MIDI 58 at 91.470833333 s (0 → 4.0555 mm) and LIndex/MIDI 56 at 91.4625 s (3.8957 → 4.5583 mm). The earlier 60 Hz screen found fewer states because it did not contain these intermediate times.

The finite curve search completed 113 trials, including 112 nonzero settings across lift, spread, PIP/DIP controls, amplitude and timing adjustments. None met the local per-key novelty/worsening screen. This is not proof that no possible route exists. Deletion was clear relative to the no-helper baseline but forfeits 8 improved core-positive patch states and 10 improved patch/key states. I preserved the curve and this blocker rather than labeling deletion a complete geometric repair.

The curve's local support peak tip speed is 1.039697 m/s without the helper versus 1.981064 m/s with it. The full-gap peak is already 2.800611 m/s near 90.458333 s in both rigs; reporting only that overall maximum would mask the curve's additional local motion.

## Evidence and limits

`qualified-rows.jsonl.gz` contains all completed comparison states; `qualified-queue.json` stores exact event rows; `finite-queue.json` groups them into a finite queue. `summary.json`, `blocker.json`, `local-motion.json`, `delta.json`, `inputs.json` and `hashes.json` preserve results, bindings and provenance. Verification commands are in `GATES.md`.

The earlier whole-gap deletion and 0.8-second arrival-fade trial are preserved separately. The fade trial is excluded because the 480 Hz check found an additional deep-key worsening; the final cutoff is the candidate in `delta.json`.

The source/score are the frozen audited v11 inputs. Root's later RH Middle curve and p170 contact-lift change are not included; they do not overlap these LH scopes. No Site edits were made. Moving-key core solids and owned hand-surface subsets follow the preserved harness. Opposing-hand surfaces, continuous-time guarantees, mesh rendering, browser playback, audio and visual naturalness remain outside this leaf.
