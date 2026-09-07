# Hand planning experiment: no candidate accepted

This bounded experiment compared the current whole-figure planner against softer predictive constraints and stronger proximal-shaft constraints. **Retain the integrated planner and the separately verified per-note grip repairs. None of these global alternatives is a safe drop-in improvement.**

The repository was read-only. All snapshots, source patches, fitted scores and finite evidence are in this directory. `comparison.json` records exact score, source and model hashes.

## Held constant

- Original new-pop `production/pop-revision/score-contact-input.json`, including the grace-note fingering correction but excluding the later 22-note active-grip patch.
- A frozen copy of `work/hand-fit/final-idle-2/pianist.ts`. The evolving idle implementation was not silently pulled into comparisons.
- The exact Human skin and body rig from the current `public/assets/pianist.glb`.
- The 72 explicit times from `work/hand-fit/integrated-baseline-surface.json`.
- All previous `wristMotion` was deleted before planning. Every candidate recomputed its hand poses, fitted actual physical releases with a 75 ms minimum hold, and baked fresh quintic wrist trajectories. The fitter rejects unresolved releases.

## Results

| Candidate | Severe key-core rows / 72 | Own-palm rows / 72 | Neighbor rows / 72 | Neighbor triangle pairs | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Equal-weight baseline | 0 | 6 | 51 | 3,635 | Comparison control |
| Virtual-note weight 0 | — | — | — | — | Rejected by physical release fitter |
| Virtual-note weight 0.15 | 6 | 10 | 50 | 2,996 | Rejected: skin clearance regressions |
| Virtual-note weight 0.35 | 4 | 9 | 50 | 3,078 | Rejected: skin clearance regressions |
| 15 mm adjacent-MCP avoidance, weight 800 | 0 | 1 | 51 | 3,725 | No material neighbor improvement; increases pairs |
| 17 mm adjacent-MCP avoidance, weight 800 | 1 | 2 | 50 | 3,558 | Rejected: severe key regression |
| 15 mm adjacent-MCP avoidance, weight 2,500 | 1 | 2 | 50 | 3,704 | Rejected: severe key regression |
| Proximal direction costs 0.5 / 0.5 | 0 | 1 | 51 | 3,350 | Rejected on denser transition/motion checks |

Actual and held support notes retain objective weight 1 in the weighted variants. Predictive notes get the experimental weight in both the initial palm centroid and per-note objective. The pose-cache key includes each weight so previously computed equally weighted poses cannot leak into these comparisons.

Removing predictive notes entirely produces six repeated chorus transitions whose required wrist moves allow only approximately 31–35 ms physical holds; the unchanged 75 ms minimum rejects those transitions. Softer predictive weights satisfy the release fitter, but the small reduction in neighbor pair counts introduces substantially worse actual key penetration. Counts alone therefore do not support promoting these variants.

## Stronger direction-cost candidate

`direction05.patch` changes only the existing proximal direction penalties from 0.015 backward / 0.03 sideways to 0.5 for each. It removes all six baseline sampled ring/palm intersections, while introducing one new right-middle/palm intersection at 77.711125 s. This is a useful diagnostic result, not global acceptance.

Full replay of its fresh fitted score:

- 5,055 actual held-pad samples: zero missing and zero outside ±3 mm; range −1.847 to +1.885 mm.
- Maximum active marker error: 0.635 mm.
- 13,627 frames at 60 Hz: maximum wrist speed 1.489 m/s, wrist acceleration 24.337 m/s²; both within retained limits.
- Seek reproducibility error: zero. Nonfinite positions: zero.
- Maximum fingertip speed: **6.025 m/s**, exceeding the retained 5 m/s limit at the short left-index arrivals around 17.2 / 27.2 / 37.2 s. This is the frozen idle-trajectory problem, only slightly reduced by re-planning.
- The 167-time dense transition screen finds **two new inactive right-ring key-core penetrations**, 3.123 and 3.328 mm into key 75 at 131.812930 and 131.821163 s. Both remain disqualifying even though the held-pad report passes.

The complete candidate is in `direction05/pianist.ts`, with its matching `direction05/score.json`, `release-fit.json`, `surface.json`, `dense-surface.json` and `rig-audit.json`. Do not copy its score over a master without re-rendering that exact score: physical releases differ.

## Scope limits

The surface screen uses actual deformed Human vertices against all 88 actual animated key cores and actual noncoplanar triangle intersections for sufficiently owned digit/palm patches. It does not prove continuous clearance or characterize penetration depth between fingers. Mixed-web, coplanar and fully enclosed intersections are outside the pair screen. No candidate received visual approval or audio-listening approval. The rejected variants were not tested further merely to accumulate passing checks.

The remaining neighboring-finger problem is concentrated near fixed MCP roots, where a released digit cannot simply lift away from an active shaft passing through its root. Predictive weighting by itself does not resolve that anatomy. Continue with the separately verified finite grip repairs and the coordinated idle-transition work rather than replacing the integrated planner with this experiment.
