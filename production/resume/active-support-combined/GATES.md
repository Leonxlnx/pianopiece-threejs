# Gates: active hand fit

Scope: Reproduce four known held hand defects from public b156 and deliver finite score candidates, exact surface evidence, and a reproducible full-interval neighbor validation.

- [x] G1: Frozen baseline inputs and four-defect reproduction are recorded.
  CHECK: node verify.mjs baseline
  EXPECT: baseline verified
  EVIDENCE: baseline verified: frozen inputs; 20 actual surface samples; four defects reproduced

- [x] G2: Candidate preserves all attacks, pitches, velocities, durations and 40 held soprano entries with legal simultaneous fingering.
  CHECK: node verify.mjs score
  EXPECT: score verified
  EVIDENCE: score verified: {"passed":true,"notes":1068,"heldSopranoEntries":40,"changedFingerAssignments":4,"changedDurations":0,"scoreSha256":"9db662f1e9d4037cc8c505b9818b7782ac1fb52fe70cff85bf362a00a9fb3b30"}

- [x] G3: Three primary own-palm folds are absent and all four primary held poses have no >3 mm key-core/palm blockers at120Hz; affected neighbors have no new severe held, contact or nonthumb pair failures.
  CHECK: node verify.mjs geometry
  EXPECT: geometry verified
  EVIDENCE: geometry verified: {"samples":1859,"primaryFrames":308,"primaryBlockerFrames":0,"newSevereHeldFrames":0,"newContactFailures":0,"newMeshContactFailures":0,"newActiveNonthumbPairFrames":0}

- [x] G4: Candidate and exact per-note/knot manifest, reproduced hashes and geometry scope/limitations are delivered to root for combined arm validation.
  EVIDENCE: candidate-primary-v1.json; primary-v1-manifest.json; PRIMARY-REVIEW.md; full-hold-validation.json. Root must combine accepted arms and inspect sub3mm contact tolerance.
