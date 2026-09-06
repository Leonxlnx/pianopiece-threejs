> Historical research notes. The later validated candidate and integration instructions are in `HANDOFF.md`.

# Wrist trajectory analysis and recommended implementation

## Confirmed causes

1. `plannedPose` holds an independently fitted wrist pose until the note ends. A 24-ms physical release gap becomes a 20-ms movement after `next.time - .004`. The worst sampled transition is G4/finger 5 to C5/finger 1 at 124.253776 s: wrist displacement 167.521 mm. A five-semitone pitch gap does not reveal that large fingering-induced hand translation.
2. The score's pitch-center travel check cannot substitute for a rig-specific wrist trajectory check. Refingering must consider actual fitted hand position, not MIDI distance alone.
3. The hard wrist-z floor of .341 blocks the left F♯2/F♯3 octave near 161.822873 s. All ordered finger assignments failed a 4-mm geometric reach gate in the scratch test. Lowering the floor to .295 allowed every attack group to obtain a pose below .65-mm reach error. Six selected LH poses used z below .30, so simply changing the floor to .31 is not equivalent to the tested change.
4. Synthetic neighbor grips can force abrupt changes in independently optimized poses. Reuse a preceding pose whenever it remains feasible; solve a shared reachable envelope for rapid inner-voice events. A future note is an alternative fingertip target, not necessarily a simultaneous key.
5. `continuousPedal` must allow pedal-up exactly at the previous key's original end. A clear at that instant preserves the original sound if the key released earlier. Use `event.time < oldEnd - epsilon`, not `<= oldEnd`.

## Numerical experiments

All measurements below are geometric checks at 120 Hz using the copied rig. They are not full skinned-mesh, shoulder/posture or visual approvals.

| Trial | Peak wrist speed | Maximum reach error | Result |
|---|---:|---:|---|
| Current interpolation | 11.186 m/s | 11.769 mm | Fails movement/contact |
| Simple onset-to-onset smoothing | 0.915 m/s | 136.488 mm | Reject: hides the speed problem by losing contact |
| Fixed 250-ms blend | 1.233 m/s | 124.306 mm | Reject |
| Approximate-center fingering DP | 12.717 m/s | 11.893 mm | Reject: proxy center misses actual solver changes |
| Actual-pose DP + retained feasible poses + quintic timing | 1.684 m/s | 29.370 mm | Promising movement, 11 unresolved pedal-boundary notes; not ready |
| Scalar reach corridor on that plan, LH | 1.007 m/s | 0.000224 mm | Contact/velocity feasible in the scalar model; acceleration still spikes |
| Scalar corridor, RH with small yz corrections | 1.681 m/s | 3.968 mm | Still has infeasible points; not ready |

The quintic trial selectively advances 284 physical releases by an average of 53.2 ms. Every accepted release is continuously pedal-sustained until its original end. No soprano held across a countervoice attack is shortened. The remaining melody failures occur at pedal boundaries, usually where the physical melody extends 7–25 ms beyond pedal-up.

The later `coalesced` experiment also fits a shared pose for nearby inner-voice attacks. Its generated artifacts are experimental and require another end-to-end evaluation after the current anatomy and contact calibration changes. Reports record the exact trial they describe; do not treat the most recently written score file as automatically matching an earlier report.

## Robust implementation

1. **Snapshot the calibrated inputs.** Use the current thumb formula, contactLift values, posture code and model. Solve against those exact inputs and retain their hashes. Re-run after skin calibration changes.
2. **Assign fingers globally.** Group rolled attacks; enumerate ordered combinations of available fingers; preserve finger identity for every still-held note. Carry multiple candidate actual hand poses for a fingering, including the previous pose if reachable. Minimize actual translation and rotation cost across the phrase. Reject candidates with unreachable fingers or invalid proximal directions. Keep several pose states for the same finger assignment; a single fitted pose can hide a better future trajectory.
3. **Use the whole held-note interval.** Build a dense time grid containing every key onset and release as well as regular motion samples. For each time, derive the wrist's feasible region from all active fingertips, arm reach at the actual posture, and directional finger constraints. Reach-shell distance alone does not rule out crossed or overhead proximal links.
4. **Optimize one trajectory inside that region.** Prefer an offline spline or sparse constrained optimization minimizing velocity, acceleration and jerk. Include explicit bounds on first and second differences. The scalar x-corridor prototype demonstrates the method, but its fixed y/z/quaternion assumptions fail at a few RH transitions. Optimize those dimensions too in the failing windows, retaining boundary position and velocity. Do not average the endpoints of an empty feasible interval and call it solved.
5. **Handle physical release selectively.** Only shorten a key when its sound remains continuously carried by pedal through its original end. Preserve `writtenDuration`. Keep all melody notes held across inner-voice events. If a pedal boundary blocks a transition, replan the preceding fingering/pose rather than silently truncating the melody or moving through an unreachable pose.
6. **Bake absolute-time output.** Store trajectory coefficients or sampled poses and evaluate them by timestamp. Avoid stateful damping, which makes scrubbing and paused poses differ. Use a continuous interpolation with matching derivatives between segments; quintic easing alone does not fix short, incompatible segment constraints.
7. **Audit the actual rig.** Re-run the full skin/contact audit using the new thumb plane and real time-dependent posture. Check wrist and fingertip velocities, acceleration, finite values, arm reach, proximal directions, held-soprano identity, key overlap/order and seek equivalence. The music master need not change when only fingering and acoustically equivalent physical releases change.

## Concrete code changes

- In `handPose`, test a wrist-z lower bound near .295 instead of .341, then validate torso/arm reach and actual skin contact.
- In `planHand`, stop constructing one mandatory wrist target per isolated attack. Retain feasible preceding poses and allow a shared reachable hand position through an inner-voice figure.
- Replace `plannedPose`'s `begin = prev.end` rule with a precomputed motion trajectory. The trajectory must have been checked against every active key over the entire interpolation interval.
- Fix the exact-end comparison in pedal-release planning.
- Add explicit movement thresholds to the final audit's `passed` expression. Currently the audit reports speed peaks but does not fail on them.

## Reproducible scratch tools

`prepare_inputs.py` snapshots the latest compiled code, calibrated score and model. It applies the tested wrist-z floor only to the scratch copy. Run it after the checkout has compiled the latest thumb/posture changes.

`refinger_actual.mjs` performs actual-pose beam DP with held-finger identity and feasible-pose reuse, then attempts to coalesce rapid neighboring attacks. `evaluate_actual.mjs` plans quintic windows, considers acoustically safe releases and reports geometric errors. `corridor.mjs` explores the scalar contact corridor and explicitly reports invalid or infeasible intervals. These are research prototypes, not approved production replacements.

Typical sequence:

```sh
python prepare_inputs.py --source /workspace/sites/daybreak-piano-film
node refinger_actual.mjs
node evaluate_actual.mjs
node corridor.mjs
```

The scratch directory's `node_modules` link resolves the checkout's installed Three.js dependency. No checkout file was modified by this task.
