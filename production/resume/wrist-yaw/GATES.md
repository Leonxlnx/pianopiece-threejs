# Gates: Wrist yaw feasibility

Scope: Assess two declared left-hand poses, 105.7149985 and 187.4408685 seconds, on frozen held71 score and compact5 rig. Exactly -10, -20 and -30 degree world-Y palm yaw variants. Keep authored wrist positions and note targets; finger and elbow solvers retarget from the altered palm pose. No global score/checkout changes or acceptance as a final anatomical solution.

- [x] Y1: Inputs, poses, metric definitions and exact source variants are frozen and hashed.
  EVIDENCE: input-hashes.json, target-freeze.json; exact source variants retained.
- [x] Y2: Actual forearm/palm alignment, wrist position parity, finger reach, terminal skin contact and whole-hand intersections are measured for all six variant/pose combinations against the two baselines.
  EVIDENCE: comparison-report.json and each variant-report.json; six variant/pose pairs plus two baselines, fixed key targets.
- [x] Y3: Matching actual top views are inspected to determine whether the visible lateral kink improves and whether finger shape/skin problems appear.
  EVIDENCE: render-manifest.json records ten actual PNGs and export reports; all inspected; HANDOFF.md records visual result.
- [x] Y4: A bounded feasibility recommendation and explicit remaining limitations are delivered; no unsupported full-score or anatomical-final claim.
  EVIDENCE: HANDOFF.md rejects standalone larger yaw and states interval/garment/anatomical limitations.

- [x] Y5: The same two poses receive one finite coupled wrist-translation/contact-depth feasibility pass; note events and fingering remain fixed, and actual whole-hand geometry determines feasibility.
  EVIDENCE: coupled-summary.json, coupled-fit-report.json (87 and 89 finite trials); two chosen actual renders inspected, all events/fingering fixed.
