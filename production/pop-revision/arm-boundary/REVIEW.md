# Arm motion repair: numerical pass, garment review pending

The frozen `joint-transport-v4` arm audit found three inherited right-elbow speed failures: 3.9749 m/s at 3.741667 s, 4.1000 m/s at 103.741667 s, and 3.8089 m/s at 168.733333 s. Direct comparison confirms that all physical note fields, wrist curves, wrist sampling, posture, arm update and elbow-solving source match the 359-note physical baseline. Original failures and every sampled arm pose are retained.

The cause is the outward-clearance boundary `acos(required)`: its slope becomes unbounded as the admissible elbow circle angle collapses to zero. These events are not atan2 wrap flips or seek nondeterminism. The candidate changes only `supportedElbow`, tapering its angular allowance with `boundary * smooth(boundary / .65)`. A smaller allowed angle remains farther outward from the torso on the exact same two-link circle. Wrist targets and both segment lengths remain constrained.

Apply only the method hunk in `supported-elbow.patch` to the final shared source. Do not replace the complete pianist file: this candidate retains the earlier frozen finger branch. There is no score, wrist-data or model change.

| Gate | Original full 120 Hz | Candidate full 120 Hz |
|---|---:|---:|
| Elbow speed, limit <3 m/s | 4.1000 — fail | 2.6314 — pass |
| Arm angular speed, limit <20 rad/s | 19.6681 | 12.2012 |
| Segment length variation, limit <.001 mm | .00004624 | .00004624 |
| Wrist target error, limit <1 mm | .00013749 | .00013749 |
| Nonfinite poses | 0 | 0 |
| Discontinuity threshold failures | 3 | 0 |

The full candidate replay covers 27,254 frames. A separate 240 Hz replay covers 584 frames across the three failures and the 216.33 s near-limit control; maximum elbow speed is 2.6933 m/s and angular speed is 12.3177 rad/s. All 78 full-replay non-monotonic arm seek comparisons are exactly identical in position and quaternion components.

A paired full replay compares 1,144,668 wrist/finger transforms. Maximum position change is .00020171 mm; contact-error change is .00000341 mm and no contact identity changes. These remain within the existing .001 mm positional tolerance. Maximum quaternion-component change is .00000413. Only right-elbow positions change materially: 1,041 side/frame samples move over .1 mm, with a maximum of 21.0375 mm.

## Garment findings retained for exact-source visual review

Paired actual triangle tests cover 584 dense poses plus 24 full-song largest-displacement controls. They introduce no new intersecting pair rows and no forearm/body-torso crossings. Existing right armhole overlaps change:

- Dense right sleeve/torso counts increase in 220 frames; overall maximum 84→87, largest individual increase 74→87.
- Dense right upper-arm/blouse counts increase in 16 frames; overall maximum remains 92.
- The 24 global controls have 15 sleeve/torso increases and two upper-arm/blouse increases. No corresponding left-arm increases were found.

All added triangle-pair crossing points were localized at seven worst poses: 324 skin points and 474 sleeve points. Across landscape and portrait camera rays, 376 of 1,596 cases lack more than .5 mm of nearer garment cover: 166 skin and 210 sleeve cases. Many lie directly at the blouse surface. This does not by itself establish a visible hole, and it does not establish that every added crossing is hidden. Geometric overlaps remain explicit. Visual approval is pending.

Useful exact-source views are 102.633333 s (maximum elbow change), 168.700000 s (largest sleeve-count increase), 216.308333 s (upper-arm/blouse increase), and 103.445833 s. Root is reviewing these.

## Frozen evidence

`SUMMARY.json` is the portable, hash-bound result. `candidate-full-audit.json`, `candidate-neighborhood-audit.json`, `candidate-garment-summary.json`, `candidate-global-garment-summary.json` and `candidate-armhole-localization-summary.json` hold detailed metrics. Raw bone frames, triangle pairs and seek snapshots remain work-only. The original failed audit is `arm-motion-audit.json`; `failures.json` and `failure-neighborhoods.json` retain every failure.

- Candidate TS SHA-256: `38f295fa0c73598059447bc01bd264e64b6a9ff34361dab6c8a637175554af35`
- Candidate MJS SHA-256: `c1f289d7647e9ab8bcf489f5d5eaaca4f05d72a2962b3558d9ac2d97af019fdc`
- Score SHA-256: `9133e02225a71eda5d1c780d089645e89fb90e49fc789bd98ea23afc040c9cfd`
- Patch SHA-256: `66d28a77d22da20d42cf7e078333b36d307c869f88959fa74090d743e22f9f43`

Finite samples and the stated patch-ownership tests do not prove continuous collision freedom. The combined source needs re-verification after the separate finger and arm changes are merged.
