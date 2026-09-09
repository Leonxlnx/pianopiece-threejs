# Gates: repair two per-key idle regressions

Scope: frozen audited v11 source, LH curve-007 and supported index-059 only. No Site edits or lifecycle. Root's later RH changes do not overlap these LH gaps. Existing pair-count increases remain separately reported and do not measure penetration depth.

- [x] G1: Freeze exact target records, gap bindings, and baseline/candidate hashes; preserve the original completed replay.
  CHECK: python verify.py inputs
  EXPECT: INPUTS PASS
  EVIDENCE: INPUTS PASS: 7 immutable sources; one bound record field and default-preserving helper multiplier; curve unchanged

- [x] G2: Find a minimal record-bound correction, or preserve a finite blocker if no qualified correction exists.
  EVIDENCE: delta.json binds earlyRelease [176.02, 176.065] to p00800/p00831 with a default-preserving multiplier. The complete index screen clears new/worsened deep per-key contacts versus no helper; blocker.json preserves curve-007 after 113 completed finite trials. Restored old contacts remain explicit.

- [x] G3: Verify both complete affected gaps against moving per-key solids, all affected-hand patches and own/neighbor surfaces; report original/fixed/baseline tradeoffs separately.
  CHECK: python verify.py geometry
  EXPECT: GEOMETRY PASS
  EVIDENCE: GEOMETRY PASS: 1986 complete states; index novelty/worsening clear vs base; curve blocker and restored old contacts explicitly retained

- [x] G4: Verify active joint parity and complete-gap motion with exact note/curve boundaries and dense samples; quantify any retained or lost baseline improvement.
  CHECK: python verify.py motion
  EXPECT: MOTION PASS
  EVIDENCE: MOTION PASS: 4208 active finger states; exact active/other-finger/outside-change parity; index tip peak does not increase

- [x] G5: Deliver a minimal explicit delta with endpoint IDs/times, bounded evidence, hashes and a concise finite queue; re-read the result adversarially.
  CHECK: python verify.py evidence
  EXPECT: EVIDENCE PASS
  EVIDENCE: EVIDENCE PASS: 34 hashes; 113 completed curve trials; finite blocker; losses and strict pair counts explicit
