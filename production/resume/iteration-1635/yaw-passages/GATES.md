# Gates: Two coherent left-hand yaw passages

Scope: Scratch-only score deltas atop combined-review/candidate-v1.json SHA 7cc3dbdd44befd4d22793a8ac266a8414480a8486e79167b1552514087f7a1c1. Preserve all musical events, all right-hand fields, and unreserved notes/knots (outgoing knot446 moveStart subsequently included to preserve the last held note; its pose/time and p914/knot447 remain guarded). Use compact5 rig and unchanged model. No global yaw hook. Local fingering may change only within p00513/p00514/p00516 and p00903/p00905/p00907, as parent clarified existing user authorization on 2026-09-08; no audio or held-voice changes.

- [x] P1: Exact finite note/knot ownership, baseline score/rig/model hashes, and outside-scope guards are recorded before edits.
  EVIDENCE: ownership.json froze baseline/source/model and finite reservations before edits; HANDOFF.md records later authorized local fingering and departure-timing extension; check.mjs guards all musical/outside changes.
- [ ] P2: Complete held groups satisfy actual whole-hand key core ≤3 mm, terminal pad approximately ±2.5 mm, exact owned/neighbor crossings zero, and exact finger/wrist reach.
  EVIDENCE: held-summary.json: second passage all429 held samples pass, but first remains blocked by actual index/palm and neighbor crossings. No full-passage acceptance.
- [x] P3: Incoming/outgoing segments, held endpoints and wrist move boundaries are evaluated at 240 Hz plus exact boundaries; candidate has continuous deterministic poses and concrete residuals are resolved or explicitly rejected.
  EVIDENCE: diagnostic-candidate-audit-240.json and baseline-score-audit-240.json include1146/1148 samples; motion-report.json records boundaries, deterministic seeking and elevated peak motion rates; residual-intervals.json explicitly rejects unresolved spans.
- [x] P4: Actual palm/forearm alignment and outer garment clearance are measured at opening, extremes and endings; matching actual renders show the corrected passages.
  EVIDENCE: motion-report.json preserves actual palm-frame metrics; diagnostic-candidate-garment.json has19 actual depth poses with0 depth/forearm crossings; render-manifest.json has12 inspected actual paired views; visual finger fold is explicitly rejected.
- [x] P5: Minimal guarded score manifest and reproducible reports are packaged atop the frozen combined score; limitations are explicit.
  EVIDENCE: HANDOFF.md, second-held-delta.json, diagnostic-delta.json, apply-delta.mjs and hashes.json package exact guarded candidates and limitations.

ABANDON: P2 The finite score-only support/contact/fingering study did not clear both complete held groups and their paths. First passage is rejected; second held-only candidate awaits seven localized idle-window fixes by root. No broader score or app-code changes are made here.
