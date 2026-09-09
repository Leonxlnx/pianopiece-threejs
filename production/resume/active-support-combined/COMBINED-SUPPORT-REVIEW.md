# Combined active-support candidate atop primary9db

`candidate-combined-support-v1.json` SHA256 `59087f3271cba8156cbd102e18eb3b41e9b94a64dd99d26b065d438416b05351` combines the eight bass-octave repairs and coda, RH107 phrase, two LH refrains, and RH68 phrase. Primary9db was already integrated separately.

Apply `combined-support-v1-manifest.json` using `guarded-score-apply.mjs INPUT MANIFEST OUTPUT`. It checks the musical attack/pitch/velocity/hand/role contract, exact field expectations, knot index/time identity, and allows already-applied fields. It rejects conflicting fields before writing. The manifest contains62 note edits and54 wrist-knot edits atop9db; replay and idempotence are verified. The tiny `wrist-motion-arc.ts` sampler addition is a runtime dependency for L215/L387; its absence otherwise retains exact baseline interpolation.

The only physical release edits atop9db are p00410,p00411,p00771,p00772 each25ms earlier, and p00457,p00458 each20ms earlier. All are LH C3/C4 bass notes. Written durations remain preserved, all1068 events/attacks/pitches/velocities remain exact, and all40 held soprano entries remain held and legally fingered. These release edits require the final score's exact remaster.

`combined-support-v1-boundaries.json` checks636 actual mesh poses at26 arrival/departure boundary windows, compared with each independently validated component score on the same combined runtime. There are zero new active key, IK, pad, active pair, inactive key or inactive pair failures introduced by the merge. This is an interaction check, not a global-clearance claim.

Component evidence and explicit residual idle pairs are in MERGED-V2-REVIEW.md, RH107-REVIEW.md, REFRAINS-REVIEW.md and RH68-REVIEW.md. Root's renderer owns the remaining RH88 phrase; root and idle-motion leaves own final runtime and visual combination. Do not infer all-finger clearance from these bounded active checks.

`remaining-exception-families.json` and REMAINING-EXCEPTIONS.md group the inherited69 held-thumb exceptions into16 finite pose families on this exact score. Five-fraction reproduction still flags68; three are reserved opening/E5 tasks, leaving65 available across the families. p00717 now clears this representative screen after neighboring support changes; that five-sample result is not a dense clearance certificate.
