# Bounded active-contact correction

Frozen score: `candidate-final.json`, SHA256 `9e737d73ef6071d5d7a168e4972a12fb2634c0a8bed65123b41cba8619a3c795`.
Baseline: `baseline-score.json`, SHA256 `ff25cbb97cca511a321d33097a11da8f85500c383827e50914dc185c3e1987c2`.

This pass preserves every attack, pitch, velocity, role, hand, tempo event, pedal event, section and overall duration. Eleven notes receive new finger assignments. Thirty-one wrist knots change pose and/or adjacent transition timing. Thirty-five physical key releases occur earlier; their total advance is 1718.366 ms. `candidate-manifest.json` specifies every changed field and knot. `articulation-report.json` lists exact old/new release times and pedal context.

The earlier releases are authored articulation changes. Half-pedal decay can change after a physical release; pedal coverage does not imply identical audio. Remaster this score. All 40 existing soprano-under-countervoice entrances retain physical soprano holds. No auditory pass is claimed here.

## Cause and correction

The previous wrist solver checked radial reach but allowed a proximal finger segment to point backward. Coalescing black-key and white-key figures into a single wrist pose amplified that problem. A second defect occurred near full extension while the wrist departed for the next figure: the inverse bend angle changed rapidly even while the fingertip remained on its key.

The correction enumerated five local finger alternatives with held-finger ordering and neighboring travel constraints. Eleven viable reassignments preserved the existing wrist. The remaining bad poses use bounded six-parameter wrist optimization with proximal forward direction, dorsal direction, radial reach margin and proximity to the original wrist pose in its objective. Adjacent moves retain quintic interpolation and are retimed only where the local wrist changed. Individual key releases precede the next pose's first contact/joint violation by 8 ms. Held soprano entrances were protected and checked again.

## Evidence

- `score-gates.json`: 1,068 notes; no overlap/order/span errors; all 40 held-soprano entries retained.
- `skin-report.json`, `extra-skin-report.json`, `final-two-skin-report.json`: 3,060 actual distal-pad mesh samples across 60 affected notes, zero missing or outside ±3 mm. Final range −2.331…+2.169 mm.
- `active-scan.json`: full score at 1 kHz analytically reconstructed from the actual active finger solver. Every targeted note and newly affected transition clears contact ≤0.65 mm, proximal forward ≥−0.12, and active local-joint speed ≤1,700 degrees/s. Remaining pre-existing diagnostic flags outside this bounded pass are retained in that report; none exceeds 1 mm contact, 3,000 degrees/s local-joint speed or non-thumb backward direction below −0.15 (0 severe remaining cases by those screening limits).
- `trajectory-check.json`: whole score at 1 kHz; wrist speed ≤1.300 m/s, acceleration ≤17.997 m/s². Absolute-time sampler remains unchanged.
- `enumeration.json` and `enumeration-current.json`: explicit alternate-finger feasibility evidence.
- `windows.json`: initial review windows; `candidate-manifest.json` is authoritative for exact changed intervals.

## Integration and reproduction

Copy `candidate-final.json` to the production score. No runtime source patch is needed; the embedded `wristMotion` data is authoritative. Do not override it with the old verbose `wrist-analysis/motion-plan.json`.

`node apply-active.mjs baseline-score.json reproduced-score.json` reproduces the exact frozen bytes. For local verification run `python score-gates.py`, `node scan-active.mjs`, and `node trajectory-check.mjs` from this directory. Optimizer experiments are `make-candidate.mjs`, `make-extra.mjs`, and the saved enumerations; the exact manifest provides the stable reproducible edit set.

The independent thumb agent owns two further non-overlapping assignments in `../thumb-transition/gap-score-edits.json`; apply those after this frozen score for the cumulative production candidate. Parent owns the combined runtime, whole-scene contact/skin/seek audit, visual review, and final audio render.
