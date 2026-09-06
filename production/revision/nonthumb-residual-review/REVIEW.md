The bounded 37-note queue has been independently rescreened and visually triaged. Five notes now have no key-core vertices at all five held samples. The other 32 notes remain unaccepted: six representative groups show a visible assigned-finger/key intersection, while twenty groups have an inspected but occluded or ambiguous contact boundary. No numeric residual is labeled tolerable.

Frozen inputs are merged score `80b5a1c63ab6a13862c7b55ed9f6a2d252cbe59c52a56a886feb02496e9b336e`, field-capable runtime `3a10537593a511c81355383199faaac2a51b60952ba6093945f8f30e779897c3`, TS `f0407941…de9c94b8`, and model `77423a38…c433d`. This score incorporates the earlier twenty accepted repairs and incoming-thumb requirements. The later p00416/p00777 and p00937/p00939 support candidates are not included. Every source/hash/score is preserved outside the checkout.

The five omitted notes are p00426, p00521, p00788, p00931 and p00948. Each has zero core vertices at held fractions .001, .25, .5, .75 and .999. This is finite clearance at those samples, not continuous clearance or a new visual pass. The two composer-owned coda notes were outside this task’s 37-note subset.

The remaining 32 notes produce 26 current grip signatures across 25 original family labels: the N117 local changes split p00410 and p00771. Each signature includes assigned finger, key color, contact lift, wrist position relative to the played key, wrist quaternion and active relative grip at quarter hold. One worst sampled state per signature was rendered. The extra lower-angle G03 view brings the total to the authorized limit of 27 views.

All numeric tests use exact finger-owned skinned vertices (>65% summed ownership) against all 88 actual rounded-key cores, shrunk by their 1.4 mm white / 2 mm black bevel radii. Reported depth is from the nearest original key-box face, not below-top distance alone. The tests do not detect triangle-only intersections or events between samples.

The confirmed visible queue is:

| Original family / current group | Note / digit | Time | Played → intersected MIDI | Closest-face depth | Finding |
| --- | --- | ---: | --- | ---: | --- |
| N065 / G05 | p00165 L2 | 39.257495277 | 63 → 61 | 5.962 mm | The extended index shaft visibly traverses the nearer black-key edge before reaching its assigned farther black key. |
| N161 / G14 | p00520 L4 | 106.717452500 | 57 → 56 | 4.417 mm | The assigned ring distal segment crosses the neighboring black-key front corner, repeating the visible shape of G04 with different support. |
| N062 / G04 | p00161 L4 | 38.494752000 | 57 → 56 | 4.381 mm | The assigned ring distal segment meets and disappears into the neighboring black-key front corner. The dip-to-tip localization identifies the active finger rather than the nearby idle digit. |
| N273 / G23 | p00883 L3 | 184.435524500 | 57 → 58 | 3.857 mm | The active middle finger forms a low hook around the black-key front corner, with its lower segment visibly disappearing at the edge. |
| N225 / G18 | p00738 R2 | 162.109490121 | 66 → 68 | 3.760 mm | The index middle/distal portion lies across a neighboring black key while its tip reaches the assigned black key; the key edge interrupts its underside. |
| N063 / G06 | p00170 R2 | 40.356698333 | 75 → 75 | 3.097 mm | The assigned index pad visibly overlaps the played black-key corner; the lower pad boundary is interrupted at the key edge. This is the smallest promoted residual (3.097 mm). |

The following inspected groups are **unresolved and not accepted**. The full report records the specific occlusion and exact owned vertex/weights for each. Several curls are visibly tightly tucked under adjacent digits, but that observation is not presented as direct proof of the hidden key intersection. White-key upper-pad contact alone is also not treated as a tolerance decision.

| Original family / current group | Notes covered | Worst sampled time | Depth |
| --- | --- | ---: | ---: |
| N046 / G03 | p00106 | 26.613145756 | 6.924 mm |
| N012 / G13 | p00436, p00799, p00816, p00836, p00961 | 174.147724894 | 5.622 mm |
| N092 / G10 | p00292 | 65.440419207 | 5.604 mm |
| N044 / G01 | p00100 | 25.210170500 | 5.199 mm |
| N306 / G26 | p00965 | 196.884776172 | 5.172 mm |
| N218 / G17 | p00721 | 159.433397556 | 5.158 mm |
| N251 / G22 | p00808 | 172.870671727 | 5.000 mm |
| N077 / G09 | p00220, p00231 | 52.695398000 | 4.963 mm |
| N232 / G19 | p00755 | 164.776120327 | 4.908 mm |
| N301 / G25 | p00939 | 192.592913352 | 4.312 mm |
| N201 / G16 | p00664 | 144.204942343 | 4.106 mm |
| N117 / G21 | p00771 | 167.364673990 | 3.918 mm |
| N174 / G15 | p00568 | 119.727386500 | 3.839 mm |
| N042 / G02 | p00102 | 25.705731553 | 3.803 mm |
| N117 / G11 | p00410 | 87.918402990 | 3.796 mm |
| N070 / G07 | p00181, p00659 | 143.316790500 | 3.742 mm |
| N072 / G08 | p00187 | 43.221430784 | 3.742 mm |
| N237 / G20 | p00766 | 166.411927723 | 3.517 mm |
| N120 / G12 | p00420 | 88.774781941 | 3.346 mm |
| N284 / G24 | p00914 | 188.815817990 | 3.135 mm |

p00939/N301 is explicitly linked to batching’s ongoing p00937/p00939 support work. No duplicate correction was made. G24/p00914 has a conspicuous separate idle-thumb intersection; it was not used to confirm the active-index flag.

Unmodified rendered views are under `render-L`, `render-R`, and `render-low-G03`; the five `review-*.jpg` sheets retain all primary images. `localized-review-*.jpg` adds exact projected active joint chains and the deepest owned vertex solely to identify the correct finger. A projected internal point can remain hidden behind skin or keys, so this overlay is not a visual-pass shortcut. `visual-triage.json` is the precise machine-readable queue, including all32 IDs and per-group inspection findings.

Reproduction: `python prepare.py`, `node rescreen.mjs`, `python render-selected.py`, `node project-review.mjs`, `python project-review.py`, `python finalize.py`. Existing frozen files take precedence. The lower G03 view uses the same renderer with `LOW_DETAIL=1`, `HAND_INDEX=0`, `TIMES=26.613145755999998` and output `render-low-G03`. These character/key-only EGL views are not browser, production room lighting, playback-rate or listening evidence. Completed scene caches are removed; all scripts, hashes, numeric reports and images remain.
