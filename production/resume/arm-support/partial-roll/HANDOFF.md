# Partial forearm roll: rejected bounded experiment

Retain the accepted arm source `22e2db7b7da490b83d7aaa9111a069f3b1ce3043f61f7c9df6fcba0f68731075`. Reject all three partial-roll variants. None clearly improves the retained wrist narrowing across the three declared poses. No patch is proposed, and this line of search stops here.

Exactly 10%, 20% and 30% interpolation toward the hand-relative neutral forearm roll were tested at 38.85258, 188.70254 and 233.144228 seconds. The reference aligns the forearm axis to the existing elbow–wrist direction, then blends its world quaternion with the accepted lower-arm quaternion. The final authored hand world quaternion is reapplied. No shoulder, elbow, wrist target, bone length, model, score or seat change is included.

## Rendered result

All 24 images were inspected: four sources × three poses × matching top and side cameras. The actual native EGL exporter rendered the complete clothed character, piano and scene at 1280×720 with `GL_NO_ERROR`. Source parity was checked; only the pianist source and declared camera override differ. This is an offline render comparison, not a browser equivalence claim.

| Pose | Top wrist silhouette | Side / elbow assessment |
| --- | --- | --- |
| 38.85258 | Small local changes along the forearm; the left wrist's inward notch and narrow diagonal transition remain in all variants. | At 30%, the near elbow underside is more angular than the accepted smooth arc. At 10/20%, differences are smaller and do not provide a decisive wrist gain. |
| 188.70254 | Slight contour redistribution, with narrowing retained at both wrists. No clearly superior blend. | The near forearm underside becomes flatter as roll increases; no compelling wrist benefit. |
| 233.144228 | The right wrist's abrupt diagonal transition and inward notch remain obvious even at 30%. | The side wrist silhouette changes only slightly; the 30% top view also sharpens the inner elbow contour. |

The 10% and 20% candidates are rejected for weak improvement. The 30% candidate is rejected for weak wrist improvement plus the more angular elbow contour. These observations concern mesh deformation in the fictional adult character only.

## Geometry and contact measurements

Measurements cover the same three declared poses. `metrics-report.json` records all 12 source/pose rows and the exact input hashes.

| Blend | Maximum change among 348 mixed Forearm/Hand vertices | Maximum wrist shift | Maximum hand world-Q difference | Maximum contact error change |
| --- | ---: | ---: | ---: | ---: |
| 10% | 4.172815 mm | 0.000021199 mm | 4.214685e-8 rad | 0.000004917 mm |
| 20% | 8.316507 mm | 0.000022612 mm | 2.980232e-8 rad | 0.000015013 mm |
| 30% | 12.402186 mm | 0.000032624 mm | 6.664002e-8 rad | 0.000023478 mm |

Elbows are unchanged exactly in all measured rows. The actual elbow–wrist / wrist–MiddleMCP angle is unchanged by this experiment: the endpoints and hand world orientation are fixed. Vertex displacement is a deformation measurement, not proof of an improved silhouette.

`upper-depth-report.json` measures actual exposed upper-arm vertices against the closest outer torso-cloth triangles, excluding the sleeve attachment patch. Maximum negative signed depth is zero for both sides in every source/pose row. This local closest-triangle normal metric is not a watertight volume proof. No full-score validation is claimed for these rejected variants; the accepted arm's prior full-score evidence remains untouched.

## Exact sources and evidence

| Source | SHA-256 |
| --- | --- |
| Accepted baseline | `22e2db7b7da490b83d7aaa9111a069f3b1ce3043f61f7c9df6fcba0f68731075` |
| 10% scratch experiment | `1332ef9e7291b1a38bd31b47e3b7425a0f133bb1f181706bb99c5a7df68748ec` |
| 20% scratch experiment | `468920345428797bed36fdd009da328d06a002527545cd8d3027fc539989e178` |
| 30% scratch experiment | `4990717854d9f7e860c3a7e9445b41ecd784d6c4c1874f9d175157d62a26a23c` |
| Frozen score | `b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773` |
| Frozen model | `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d` |

`evidence-manifest.json` links and hashes all 24 copied PNGs and eight original renderer reports. The reports include source, model, dependency and camera provenance. `hashes.json` hashes sources, scripts, measurements and this handoff. All evidence lives under `/workspace/scratch/2e8cc8e77f98/arm-support/partial-roll`.

Reproduce geometry measurements from the parent arm-support directory with `node partial-roll-metrics.mjs` and `node partial-upper-depth.mjs`. The three source variants are compiled by `node partial-roll-compile.cjs`. `render-remaining.py` records the sequential side-camera and final top-camera render commands; the first three top commands use the same helper, frozen score and their explicit source override.

Run the evidence check from this directory with `node check.mjs`. The four local gates are complete. Root checkout, accepted candidate and its five prior acceptance gates were not modified by this followup.
