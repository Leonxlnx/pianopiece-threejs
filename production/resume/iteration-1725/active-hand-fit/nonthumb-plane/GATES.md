# Wrist-frame nonthumb flexion-plane feasibility

- [x] P1: Freeze combined-v4 + R79 v2 and construct a scratch runtime changing only global nonthumb normal with degeneracy fallback.
  EVIDENCE: build.mjs, build-provenance.json; r79-frozen-v2 SHA09cfc46a; 48 finite orthonormal exact-axis tests.
- [x] P2: Screen all 1070 note midpoint/start/end instants, both actual skinned hands, active key/pad/IK/palm and neighbor triangles; report regression queues and unchanged thumb/wrist quaternions.
  EVIDENCE: comparison.json, both raw rows, 80 active-note contexts and 167 exact idle-gap regressions. Active nonthumb core frames 43→146 requires rejection.
- [x] P3: Render and directly inspect several identical poses; report acceptance or rejection and preserve the frozen score/runtime baseline.
  EVIDENCE: REVIEW.md; all 16 same-pose top/oblique images directly inspected. Candidate rejected as a global drop-in; source remains diagnostic only.
  CHECK: python nonthumb-plane/validate.py
