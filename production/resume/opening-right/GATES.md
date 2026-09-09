# Gates: Opening RH supported phrase

Scope: Finite opening RH phrase, p00019/p00020/p00022/p00023/p00025/p00027 and RH wrist knots 9–14. Scratch only. Preserve attacks, pitches, velocities and held soprano; no broad exception search.

- [x] O1: Exact frozen baseline, rig, notes, wrist knots and phrase/departure boundaries are listed, hashed and reserved without ownership conflict.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: reservation.json contains the six notes, six edited knots and unchanged departure context; active_hand_fit confirmed no intro conflict; input-hashes.json pins inputs.
- [ ] O2: A bounded coherent support/refingering candidate is completed; actual terminal skin/pad, whole-hand key core and own/neighbor crossings determine acceptance.
  EVIDENCE: No acceptable whole-hand candidate was found. Whole-hand depth remains 7.642714 mm and crossing count 219 in the diagnostic; actual renders confirm the failure.
ABANDON: O2 The finite support/fingering/contact experiment did not clear compact5 idle and neighbor paths. No app-code changes are authorized here; diagnostic delta is rejected for integration and residuals are handed to root.
- [x] O3: Full finite phrase including incoming and departure boundaries passes actual held/motion geometry or has explicit localized residuals; authored events and held soprano are preserved.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: validation-report.json contains 870 samples per source at 240 Hz plus event boundaries; authored events/fingering are unchanged; residual-intervals.json localizes nine remaining intervals.
- [x] O4: Minimal note/knot delta, exact hashes and paired actual rendered views are packaged for root; no checkout or Sites changes.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: diagnostic-delta.json has six knot translations and one contactZ change; evidence-manifest.json contains six SHA-verified actual oblique images with GL_NO_ERROR, all inspected; HANDOFF.md rejects integration and states the remaining lateral wrist kink.
