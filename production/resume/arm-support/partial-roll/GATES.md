# Gates: Bounded partial forearm roll comparison

Scope: Exactly 10%, 20%, 30% forearm-roll blends on accepted 22e2 arm at 38.85258, 188.70254, 233.144228 seconds; no root, Site, bone-length or GLB changes.

- [x] P1: Three exact source variants and fixed score inputs are isolated and hashed.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: hashes.json and metrics-report.json pin all three sources, accepted baseline, frozen score and model.
- [x] P2: Wrist targets/hand world orientation, actual mixed skin changes and exposed upper-arm/clothing depth are measured at all three poses.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: metrics-report.json contains 12 source/pose rows, 348 mixed vertices, maximum wrist change 0.000032624 mm; upper-depth-report.json shows zero exposed upper-arm signed depth at all 12 source/pose rows.
- [x] P3: Actual wrist and elbow rendered silhouettes are compared at the same three poses.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: evidence-manifest.json contains 24 SHA-verified matching top/side PNGs with GL_NO_ERROR; all inspected, observations by pose recorded in HANDOFF.md.
- [x] P4: Clearly superior candidate gets a patch; weak improvement/new creases cause rejection and stop without further search.
  EVIDENCE: HANDOFF.md rejects all three variants. Wrist narrowing persists; 30% adds a more angular near-elbow underside at 38.85258 and ending top inner contour. No patch proposed and no further variants tested.
