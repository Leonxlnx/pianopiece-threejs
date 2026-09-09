# LH55 and LH60 held support gates

- [x] L1: Exact note/wrist reservations and accepted neighbor guards recorded before fitting.
  EVIDENCE: lh55-60-reservation.json; lh55-60-base-merge.json preserves combined-v2 fields with no conflict. Final changed subset is 24 notes / 24 knots; L191/L251/L423 change moveStart only and retain accepted octave destination poses.
- [x] L2: Fit all eleven assigned contexts using natural fingers and coherent wrist support; complete held surfaces and neighboring active pad/key/IK checks, with real inactive residuals explicit.
  CHECK: node validate-lh55-60-gates.mjs
  EXPECT: PASS
  EVIDENCE: lh55-60-target-held-summary.json and lh55-60-v4-full-hold-validation.json; 5,476 actual mesh poses, 3,367 reserved held poses. All eleven target digit cores zero, owned-palm/active-active crossings zero, no new neighbor core/IK/pad failures. 894 reserved active/idle pair frames remain; full-hand acceptance is open in the inactive leaf.
- [x] L3: Verify music contract, no new physical releases, held soprano, motion and deterministic seek. Return guarded deltas and all idle residual gaps.
  CHECK: node validate-lh55-60-gates.mjs
  EXPECT: PASS
  EVIDENCE: lh55-60-frozen-v1-score-gates.json preserves 1,068 events and all 40 held soprano entries, with the six preceding authorized-proposal release deltas unchanged. Motion: 9,525 poses at 500 Hz, peak tip 3.187 m/s, wrist 1.781 m/s, seek zero. lh55-60-frozen-v1-manifest.json replays exactly/idempotently and applies with no conflict to combined-v3. 49 exact inactive gaps are in lh55-60-v4-idle-gap-queue.json; peak idle Pinky2 rate 126.160 rad/s is explicitly open for the curve leaf.
