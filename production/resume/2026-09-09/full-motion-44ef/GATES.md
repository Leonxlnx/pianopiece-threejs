# Frozen delivery motion audit

- [x] G1: Verify exact delivery score/rig hashes and freeze runnable audit inputs.
  EVIDENCE: input-manifest.json; exact score44ef4cdc and rig2599ff6f verified against immutable snapshot dc1a0bfe8fa61c9a. Local source/runtime copies retained.
- [x] G2: Complete one 120 Hz full-piece paired sweep with sign-normalized quaternion angular speed, actual fingertip/wrist speed, and finite-value checks.
  EVIDENCE: audit.mjs, audit.log, motion-report.json;27,979 samples,115 channels,99,493,324 finite scalars,zero invalid speeds. One sweep completed in41.964s at reduced CPU priority.
- [x] G3: Preserve extrema with exact sample intervals and real note context; identify increases outside documented accepted local windows.
  EVIDENCE: motion-report.json preserves top8/channel, exact frames/times, actual note context and paired deltas. Outside-window raw difference exactly0;no new outside peaks. Existing high-speed baseline moments and within-window increases remain explicit.
- [x] G4: Deliver concise report, runnable audit, and hashes without editing source or performing parameter searches.
  EVIDENCE: README.md, motion-summary.json, audit.mjs, input-manifest.json, SHA256SUMS. All work confined to final-motion-review;no source changes, extra sweeps, triangle grids, or parameter searches.
