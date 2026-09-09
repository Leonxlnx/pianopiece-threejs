# Gates: L62 active-grip family

Scope: Scratch-only family p00130,p00455,p00698,p00705,p00711,p00972,p00979,p00987 on active-hand-fit/lh55-60-on-combined-v3-review.json SHA prefix efb1e0f4. Reserve exact neighboring notes and wrist knots before edits. Preserve all musical attacks, pitches, velocities and durations, outside-family notes/knots, p00914 support and root-owned p01008 fields. No global idle or yaw replacement; no new agents or checkout edits.

- [x] L1: Exact baseline/rig/model hashes and finite note/knot ownership are frozen, with overlap coordination and p01008 compatibility guard.
  EVIDENCE: reservation.json freezes 27 notes and 27 knots plus moveStart-only L237; guarded-delta.json verifies musical/outside fields exact, source/model/arc hashes, p457/p458/p914/p1008 guards. Coordination is recorded in HANDOFF.md.
- [x] L2: Natural family fingering/support candidates are checked against actual whole-held key cores, terminal pads, own-palm and neighbor geometry at dense held/end/move boundaries.
  EVIDENCE: validation-summary.json and candidate-finger-235-held-240.json: 8 targets/722 samples and 27 reserved notes/2534 samples, zero active-anchor failures. Complete actual key/pad/palm/neighbor measurements remain attached, including inactive failures.
- [x] L3: Incoming/departure motion and held-neighbor effects are densely checked; p00987→p01008 compatibility is preserved or explicitly localized for root.
  EVIDENCE: candidate-finger-235-contexts-240.json and baseline-score-contexts-240.json cover 4182 poses each; zero new active-anchor failures, 219 all-hand residual intervals and 52 exact idle gaps retained. root-thumb-compatibility.json proves p1008 approach/end exact.
- [x] L4: Actual matched views, arm reach, deterministic boundary continuity and visible grip shape substantiate the chosen result or rejection.
  EVIDENCE: evidence/index.json pins 23 inspected actual PNGs (18 matched plus 5 finite alternative). motion-report.json covers 500 Hz motion, 160 boundary checks and exact seek parity; candidate-eight-garment.json covers 24 actual outer garment poses. HANDOFF.md records early velocity increase and visible idle limitations.
- [x] L5: Minimal guarded delta, exact hashes, reproducible scripts and finite residual queue are returned without overstating acceptance.
  EVIDENCE: candidate-eight.json, guarded-delta.json, HANDOFF.md, hashes.json and check.mjs package the exact active-anchor review candidate, source scripts, finite queue, and explicit lack of whole-hand final acceptance.
