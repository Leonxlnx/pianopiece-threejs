# Gates: Lid material diagnosis

- [x] L1: Freeze source and identify serialized material/geometry at beige pixels.
  EVIDENCE: `serialized-lid.json`, `pixel-geometry.json`, sourceSHA d58f11ba3db81dd6e17f1eac654e7187254100775c1d2fdc9e6e78b5fb9e3701; four first ray hits are exact lacquer material24.
- [x] L2: Render sentinel and physically plausible finish with strictGL to separate material identity from reflected lighting.
  EVIDENCE: `sentinel-0.800.png`, `matte-0.800.png`, `matte-64.600.png`, `matte-120.500.png`; four accepted strictGL frames and4×MSAA. Sentinel colors exact panel; rough no-coat finish removes beige reflection.
- [x] L3: Return proven finite source fix, visual evidence and renderer limitations without production edits.
  EVIDENCE: `proven-fix.patch`, `candidate-matte.ts`, `comparison.png`, `FINDINGS.md`, `verification.json`; source-only one-line change, reflection approximation documented.

- [x] L4: Render requested restrained satin compromise at0.8s against proven.82 matte, inspect soft sheen and return source/property parity.
  EVIDENCE: `satin-0.800.png`, `satin-report.json`, `three-finishes-0.800.png`, `three-finish-pixels.json`; strictGL_NO_ERROR,4×MSAA. Actual runtime geometry/props/keys/dampers/contacts are exact across baseline/matte/satin in `geometry-parity.json` (33states,14520contacts each).
