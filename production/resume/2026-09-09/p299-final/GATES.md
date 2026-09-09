# p00299 support transition leaf

- [x] G1: Preserve attacks, pitches, velocities, written durations, and all score fields outside explicit local fingering/contact/physical-release deltas.
  EVIDENCE: handoff.json and rejected-score-delta.json; exactly p296/p299 changed in scratch. Attack/pitch/velocity/hand and all non-note fields exact. No accepted delta.
- [x] G2: Test the finite p299 pinky/support candidate through complete affected gaps and neighboring held notes, with exact surfaces and high-rate motion.
  EVIDENCE: audit-baseline-final.json, audit-candidate-final.json, per-key-final.json;1271 matched states across64.15–69.15,500Hz in affected releases and2kHz motion. QUALIFICATION FAILED: Index/key75 new3.12–3.56mm contacts and same-key5.72mm vs3.27mm at64.214.
- [x] G3: Inspect a native-renderable candidate after implementation, expert read, defect hunt, and a bounded polish pass.
  EVIDENCE: final native report /workspace/scratch/2e8cc8e77f98/render-recovery/reviews/e6caa037449cbcf2/report-960.json;four final stills viewed. Main contact/return looks plausible; earlier index release remains numerically invalid. native-parity.json1271/1271 exact.
- [x] G4: Deliver a qualified local delta with hashes and outside identity, or retain rejected work in scratch and name the precise blocker.
  EVIDENCE: handoff.json status REJECTED_NOT_FOR_INTEGRATION;all candidate changes scratch-only.14 outside poses exact;later Pinky rebound and remaining context exact. README.md explains blocker and no accepted score/audio edit.
- [x] G5: Complete the parent's one scalar-guard followup, prove the cause, and freeze exact deltas for parent visual review with the unchanged numeric flag disclosed.
  EVIDENCE: guard-handoff.json, guard-delta.json, guard-per-key.json, GUARD_REVIEW.md. Old next-envelope0.14897594070608658 versus new0;295 early Index chains exactly restored.1271 native poses exact. One existing Index/F#5 flag remains+0.250809mm at66.964;parent acceptance pending. Final native2f9060f11e9a7b8f stills viewed.
