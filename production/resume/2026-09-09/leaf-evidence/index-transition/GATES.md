# RH short phrase transition repair

Scope: reviewable improvement candidate for106.65–107.55; existing residual collisions are explicitly retained in the handoff.

- [x] G1 — Preserve score identity outside two explicitly authorized physical releases; all attacks, pitches, velocities, fingering, written durations, and pedal events retained.
  CHECK: python /workspace/scratch/2e8cc8e77f98/index-transition/finalize.py
  EXPECT: PASS score identity
  EVIDENCE: handoff.json records only p00519 and p00524 physical durations plus original writtenDuration values; all non-note fields exact. Root explicitly authorized physical-release changes and25ms acoustic breathing.
- [x] G2 — Improve the transition with finite high-rate before/after movement and unchanged pose outside the bounded correction.
  EVIDENCE: 2kHz index peak144.326168→28.263924rad/s; wrist0.998949→1.180555m/s and acceleration21.758164→59.533306m/s² disclosed; ten outside pose hashes exact. audit-proposed.json and audit-baseline.json.
- [x] G3 — Preserve held support; compare actual key cores and all finger surfaces without adding a new crossing family.
  EVIDENCE: 561 matched exact surface samples; held violations0, active/palm cores2.686990/0mm, pad gap max1.674843mm; index transfer cores0 and1.991259mm. Existing Index/Middle remains, pair sum8561→4763, max62→43; former Middle/Ring family removed. handoff.json explicitly says not collision-free.
- [x] G4 — Inspect native-renderable source after implementation, expert read, defect hunt, and polish.
  EVIDENCE: Three current source native frames rendered;106.895,107.0,and107.22 all viewed directly. Final native report /workspace/scratch/2e8cc8e77f98/render-recovery/reviews/d90cb414c0c5d130/report-960.json; 561 native/harness pose hashes exact. Straight lifted neutral and refinger-only variants rejected; live key heights replaced depressed future anchors; removing wrist arcs reintroduced7.233/5.169mm core penetration and was rejected.
- [x] G5 — Provide reproducible delta/source, exact hashes, and all material limits for integration review.
  EVIDENCE: score-delta.json, proposed-extension.ts, proposed-runtime.ts, proposed-rig.mjs, proposed-native.ts, handoff.json. Typed extension adds no diagnostics to the six pre-existing baked-baseline diagnostics. No Site/git/browser edits or audio rendering performed.
