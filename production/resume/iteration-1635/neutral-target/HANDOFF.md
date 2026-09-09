# Wrist-local curved nonthumb neutral diagnostic

The target-based neutral produces clearly curved inactive fingers. The best finite candidate is forward .72 of chain reach, down0. It is rejected as a global replacement because the complete score screen increases key collisions and has959 strict regression rows. Seven short observed intervals remain useful as qualification evidence for targeted follow-up. No checkout, score, held source, thumb branch, model or arm changes were made.

## Exact implementation and inputs

Inside only `!n && fi>0`, neutral target is the current MCP origin plus `pose.q * (0,.72*reach,0)`. Existing coupled fingerPoints and frameOffsets construct its local joint rotations. Existing complete endpoint interpolation applies directly; the backward world-target fallback and its envelope blend are removed only in this inactive nonthumb branch. The flexion-plane construction inside fingerPoints is unchanged. No authored-rest MCP fan or fixed Euler curl is used.

Base TS compact5 SHA4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45; combinedv2 score335e91845dfb5a6126e7b83d1818ac841f6852694f24348b24e0f182c3b76e60; unchanged model77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d. Integrated wrist-arc TS792e453eff0a959b970120a8e46f0dcaa1f78872ba87baaa1ab25293996cc256 compiles byte-exactly to frozen MJS c9f33ac6b0a5064efde8a85fe53a653cc05bf421cee0fe4dc5de39a14e4acf9f. Render reports pin the same score/source/arc/model inputs.

Best candidate neutral-f72-d0.ts SHA12eac38277cd3682540249a7b29963259852975d3fa660c461f400744344ff36. Minimal neutral-f72-d0.patch is diagnostic and must not be applied globally as an accepted fix.

## Nine variants and actual visual review

Exactly3x3 neutral targets: forward.72/.79/.86 × down0/.07/.14, at11.700326,39.9,44.965,56.47,72.04,173.007,224.25. All63 candidate contexts and seven baselines were measured for actual owned skin/key cores and triangle intersections on both hands. Every held joint/tip component is exactly unchanged in the seven-context comparison.

Best .72/0 has46 inactive nonthumb observations:6 key-core failures,0 own-palm failures,8 neighbor failures,5 strict all-hand regressions;34 individual inactive observations have clear geometry and a curved chain. Baseline has4 core failures and15 neighbor failures. Longer/downward targets generally worsen key clearance; no search outside the declared grid was performed. Full variant table and concrete regressions are in seven-comparison.json.

Actual intersegment turns in the best seven-context observations are PIP57.026–71.083° and DIP27.373–34.120°. These are animation chain metrics, not clinical limits. Fourteen paired1280px oblique renders were inspected across all seven contexts. The bent finger silhouettes are visible, replacing the straighter fan; residual key intersections at44.965/56.47/173.007 remain documented. render-manifest.json pins all PNG and export-report paths/hashes.

## Best-only full score screen

1070 unique midpoint/start/end times plus the seven contexts, both hands, exact>65% owned triangles and all88 beveled key cores. All-hand regression checks include active fingers and opposing hands. Count increases are retained, even when a different total improves.

|Metric|Baseline|Candidate|
|---|---:|---:|
|Inactive nonthumb observations|6751|6751|
|Key-core observations>3mm|357|412|
|Own-palm intersection observations|2|3|
|Neighbor intersection observations|2126|1409|

There are959 strict regression rows and1135 improvement rows. Held7539 local joint rotations and tip positions are component-exact across the full screen; this does not imply every mixed-weight skin vertex remains unchanged. Actual geometry regressions are still counted. regression-queue.json groups the959 rows into372 finite active-note or previous/next-finger contexts, retaining times, key depth and neighbor-pair details. Global application is rejected.

## Motion and finite qualifications

Both rigs were checked at all2121 unique note attack/release boundaries at±1microsecond, with no joint step>.001rad or tip step>.01mm. Seeking the seven contexts is component-exact. Seven surrounding .7s windows were sampled at240Hz: peak joint rate52.787→50.646rad/s and peak tip speed2.432→2.461m/s. This finite motion screen is not a full-time collision proof; motion-screen-report.json localizes every rate and boundary result.

183 whole-hand sampled poses are completely clear with no strict regression;90 improve a baseline failure. From those, twelve declared .32s windows received1005 total actual geometry samples at240Hz plus event boundaries. Seven contiguous clear segments of at least.08s remain, totaling350 samples/1.379s. Both hands satisfy core≤3mm, exact owned/neighbor pairs0 and point error≤.2mm throughout the sampled segments.

|Observed interval, seconds|Samples|Max core,mm|Peak joint rate,rad/s|
|---|---:|---:|---:|
|149.722747–149.997747|70|2.199|23.137|
|224.169188–224.352522|45|2.199|6.267|
|3.309670–3.622170|76|0.000|3.512|
|130.153561–130.391062|58|0.000|6.972|
|26.074998–26.179164|29|2.843|2.868|
|131.729440–131.833606|29|2.642|3.587|
|131.883606–132.046106|43|2.580|13.361|

qualification-subset.json includes held notes and exact measurements for these seven segments. They were observed with the candidate enabled globally; conditional runtime activation and entry/exit blending have not been tested. They are a finite starting set for targeted qualification, not accepted per-gap runtime instructions. Other twelve-window failures remain in qualification-motion-report.json.

## Reproduction and status

Run `node compile.mjs`, `python run-seven.py`, `node screen.mjs`, `node motion-screen.mjs`, `python qualify.py`, `node qualification-motion.mjs`, `python package.py`, `node check.mjs`. root node_modules is used through the existing symlink; no install is needed.

check.mjs verifies input/source/held parity, full screen counts, boundary/seek checks, observed clear-segment limits, and fourteen inspected render hashes. hashes.json contains exact source, patch, script and report hashes. All five diagnostic gates are met; global acceptance remains rejected.
