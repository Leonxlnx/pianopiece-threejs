Inactive finger/key review is complete for the frozen baseline and one captured local candidate. Numerical evidence is broader than the original three idle windows. Five baseline closeups were actually rendered and inspected; they confirm visible intersections in the selected resting silhouettes. No runtime, score, GLB or checkout change was made.

Baseline: score `8d92b208`, performer source `fedec1a8`, accepted model `77423a38`. Candidate: captured merged-local score `5fcc7633`, field-capable module `3a105375`. Full SHA-256 values, source snapshots and the score copies are preserved. Candidate results are a snapshot, not a claim about a later mutable candidate file.

| Screen | Baseline | Captured merged local |
| --- | ---: | ---: |
| Relevant playing-hand midpoints | 1068 | 1068 |
| Inactive-digit poses | 4035 | 4032 |
| Digit/key rows deeper than 3 mm | 624 | 498 |
| Hand midpoints containing such a row | 372 | 337 |
| Long-rest rows deeper than 3 mm | 345 | 220 |

Each note is sampled at its own held midpoint. Only inactive digits in that note’s playing hand are checked. Every exact skinned Human vertex with at least 65% summed ownership by one finger is tested against all 88 actual key solids: rounded-box bounds conservatively reduced by the real bevel radius, 1.4 mm white / 2 mm black. The reported depth is distance to the nearest original box face, matching the existing key-core tools. This does not detect triangle-only crossings, inactive hands with no sampled note, or behavior between the finite samples.

An independent copy of the existing all-key core harness matched seven poses and 28 inactive digit/key pairs exactly: maximum depth difference 0 mm. This also checks the current virtual key meshes against the earlier unbatched key geometry. See `reference-parity.json`.

The rendered shortlist and its candidate status are below. Comparison joins by note ID: p00410 and p00426 have changed durations, so their candidate midpoint differs. Every image is baseline geometry; candidate rows below are numerical only.

| Note / inspected idle digits | Baseline time | Candidate time | Candidate >3 mm rows |
| --- | ---: | ---: | --- |
| p00410 / L2, L3 | 87.807644 | 87.795644 | L2→56 4.601 mm |
| p00416 / L2, L3 | 88.523026 | 88.523026 | L1→59 5.189 mm; L2→59 7.245 mm; L2→58 3.951 mm; L3→57 6.897 mm |
| p00426 / L2, L3, L4 | 90.576673 | 90.569173 | No >3 mm rows at this midpoint |
| p00914 / L1 | 188.702540 | 188.702540 | L1→58 6.315 mm; L1→57 7.369 mm; L1→55 6.978 mm |
| p00937 / R1, R2, R3 | 191.861656 | 191.861656 | R1→77 7.447 mm; R1→76 7.689 mm; R2→78 6.949 mm; R2→77 7.914 mm; R3→80 6.492 mm |

In the inspected baseline views, L2/L3 low proximal portions disappear through white-key edges at 87.807644 and 88.523026 seconds. The 90.576673 view also shows a black-key wedge crossing a finger silhouette; its candidate note midpoint no longer has a >3 mm inactive row. At 188.702540 the idle left thumb visibly crosses neighboring key geometry. The right-hand view at 191.861656 shows low proximal index/middle portions meeting and disappearing into key edges. Individual views and `rest-review-sheet.jpg` preserve the evidence. These character/key-only diagnostic views are not a production room, browser, timing or listening check.

Deepest selected nonthumb vertices mostly belong to proximal segments: L2 v9017 is 92.88% Index1; L3 v9040 is 95.34% Middle1; R2 v3188 is 89.25% Index1; R3 v1932 is 98% Middle1. This implicates proximal clearance, not only fingertip-pad offsets. Left-thumb v8952 is 79.57% Thumb1; right-thumb v3577 is 90.24% Thumb2. Exact full weights, coordinates, and MCP/PIP/DIP/tip chains are in `visual-segment-ownership.json`. The named joint weights identify deformation ownership; they are not a clinical model.

Known contexts are kept separate. Baseline midpoint sampling finds three >3 mm rows in the known right-hand 147.388–148.819 window; it has no such inactive rows in the two named left-hand windows or coda. The captured candidate has two rows in each left-hand window, three in the right-hand window, and none in coda. This finite result does not clear those intervals between midpoints. Baseline and candidate each have 27 rows across 21 midpoint poses overlapping the six promoted nonthumb held-family queues; those remain assigned to the existing held-fit work.

The following ranked mechanism queue excludes the named windows and promoted held-note overlaps. Rest groups receive visual priority; other rows still require their own representative inspection. Complete repeated grip/neighbor structural families and every hit remain in the JSON inventories; a broad digit/phase group is not pose equivalence.

| Candidate additional context | Rows | Representative note / time | Key | Maximum closest-face depth |
| --- | ---: | --- | ---: | ---: |
| L1 approach | 33 | p00430 / 90.975582 | 55 | 7.996 mm |
| R2 rest | 82 | p00937 / 191.861656 | 77 | 7.914 mm |
| R1 short-gap | 18 | p00854 / 180.123598 | 79 | 7.909 mm |
| L1 short-gap | 45 | p00980 / 199.452857 | 60 | 7.895 mm |
| R1 release | 20 | p00535 / 109.127683 | 79 | 7.830 mm |
| R1 approach | 38 | p00537 / 109.469093 | 77 | 7.815 mm |
| R1 rest | 58 | p00939 / 192.314647 | 76 | 7.689 mm |
| L1 rest | 36 | p00914 / 188.702540 | 57 | 7.369 mm |
| R3 approach | 13 | p00912 / 188.436369 | 78 | 7.250 mm |
| L2 rest | 13 | p00777 / 167.957062 | 59 | 7.245 mm |
| L4 short-gap | 8 | p00521 / 106.967779 | 51 | 7.243 mm |
| R2 short-gap | 4 | p00648 / 141.180236 | 75 | 7.197 mm |
| L2 short-gap | 7 | p00798 / 171.385522 | 58 | 7.176 mm |
| L2 approach | 15 | p00442 / 93.383980 | 51 | 7.153 mm |
| R2 approach | 19 | p00316 / 69.988531 | 76 | 7.059 mm |
| L1 release | 14 | p00880 / 183.744681 | 61 | 7.014 mm |
| L3 rest | 2 | p00416 / 88.523026 | 57 | 6.897 mm |
| L3 approach | 10 | p00745 / 163.306389 | 56 | 6.766 mm |
| L4 approach | 8 | p00699 / 154.972313 | 54 | 6.665 mm |
| R4 approach | 5 | p00889 / 185.441363 | 82 | 6.652 mm |
| R3 rest | 2 | p00937 / 191.861656 | 80 | 6.492 mm |
| R2 release | 3 | p00314 / 69.631204 | 75 | 6.409 mm |
| R3 short-gap | 2 | p00112 / 27.638497 | 75 | 4.576 mm |
| R4 short-gap | 6 | p00866 / 181.799006 | 80 | 3.846 mm |
| L3 release | 1 | p00749 / 163.942154 | 54 | 3.554 mm |
| R3 release | 1 | p00421 / 89.268408 | 75 | 3.202 mm |
| L4 release | 1 | p00259 / 58.840404 | 56 | 3.137 mm |

Reproduce the baseline with `node inventory.mjs`. The script reuses its frozen source/score snapshots. The candidate invocation uses `INVENTORY_OUTPUT=current-local`, `INVENTORY_TAG=merged-local`, `SCORE_PATH` pointing to the captured candidate or original source, and `RIG_MODULE` pointing to the final-fields module; its existing snapshots take precedence. `python summarize.py` regenerates the ranked queue and review sheet. Renderer scripts and logs preserve the five exact camera/time requests. Completed scene interchange caches are removed after inspection; scripts, source, hashes, reports and images remain.
