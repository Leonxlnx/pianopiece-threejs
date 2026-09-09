# Combined final review candidate

- [x] G1: Freeze supported input; re-extract only dependent departure endpoints; compose three fixed thumb curves.
  EVIDENCE: input.ts bff30b61, input.json5c7337e, endpoint-data.json, source-vs-supported.patch; incoming endpoint triples remain exact and LH departure re-extracted.
- [x] G2: Full gap vs supported and original44ef; finite motion/held/outside/native parity and chronological review.
  EVIDENCE: audit-supported.json.gz, audit-original.json.gz, audit-after.json.gz, vs-supported-summary.json, vs-original-summary.json, pose-check-summary.json, native/;1349times,2698native states exact,397heldsamples preserved, zero nonfinite.
- [x] G3: Freeze exact deltas/reports/hashes for parent, with every residual disclosed.
  EVIDENCE: README.md, delta.json, SHA256SUMS, source-vs-original.patch, score-deltas-vs-original.json; eight new shallow per-key samples, existing palm increments and inherited original-baseline collisions explicitly disclosed; parent review pending.
