# Authored camera review after the accepted posture integration

The +0.10 m posture works in the sampled wide and face compositions. No general camera elevation or target change is needed. Two finite composition changes are proposed in `direction-candidate.patch`: add 3 degrees of lens width to “Across the strings,” and replace the six portrait hand compositions with a centered vertical keyboard view. The patch is scratch-only and awaits root visual acceptance.

Evidence covers all 24 authored landscape shots at start, midpoint, and end minus 1 ms (72 actual 960×540 frames), plus 12 critical portrait shots at the same fractions (36 actual 540×960 frames). All 108 frames were visually reviewed in six landscape and four portrait sheets. The final candidate has 21 additional actual frames: three landscape and eighteen portrait. All 21 were visually reviewed. Two previous-posture portrait frames establish that the conspicuous partial faces in the original portrait hand shots predate the posture change. Diagnostic camera overrides were not used for this audit.

## Finite changes

| Change | Observed issue | Candidate result |
|---|---|---|
| Shot 05, “Across the strings”: FOV 43→41 becomes 46→44 | At 62.8689785 s the ponytail touches the left edge; the instrument detail also feels tightly bounded. | The added 3° restores clear left margin at start/mid/end. The intended piano interior remains prominent. |
| Portrait hand shots 02, 07, 11, 14, 18, 21: centered near overhead view, keyboard vertical, FOV 52 | All six original portrait hand compositions include a conspicuous partial face at a side edge. Matched old-rig frames at 29.239194 and 130.1203755 s show the same issue. | Both hand regions and fingertips remain inside all eighteen sampled frames; no face intrudes. Forearms intentionally enter at the side edge. |
| Reset `camera.up` before each update | The portrait keyboard view uses a roll; later seeks and viewport switches must reset it. | Seven mixed portrait/landscape seeks match freshly initialized cameras exactly. |

The first portrait draft at FOV 48 retained a cropped fingertip in the high-note start frame. That draft is preserved under `rejected-v1`; the returned source centers the keyboard target and widens to FOV 52. The final candidate does not contain that crop in the sampled frames.

The lid obscures part of the far hand at the start of the piano-interior shot. It is an instrument composition rather than a hand detail, and the performer, near hand, strings, and later paired hands remain legible. No camera change is proposed for this intended foreground overlap. Face shots also use the piano as foreground while keeping the complete head readable.

## Shot ledger

Every landscape entry below refers to its three actual start/mid/end renders. Portrait entries marked reviewed also have three actual renders. “No crop issue” means none observed in these rendered samples; it is not a claim of continuous full-film certification.

| Index | Authored shot | Landscape review | Portrait review |
|---:|---|---|---|
| 00 | First light | Complete seated figure; ample head/lid margin | Reviewed: wide context and complete head retained |
| 01 | A window opens | Head, shoulder, exposed arm silhouette readable | Not selected |
| 02 | Hands · the theme | Both hands clear; torso crop suits detail | Reviewed: inherited partial face; candidate clears it |
| 03 | The answering phrase | Complete head and arm-to-key relationship readable | Not selected |
| 04 | Room to breathe | Complete seated figure and lid retained | Not selected |
| 05 | Across the strings | Left hair margin too tight at midpoint; candidate adds margin | Reviewed: authored overhead interior is usable, unchanged |
| 06 | A little farther | Wide room, figure, and lid retained | Not selected |
| 07 | Daybreak · touch | Hand regions clear; shoulder intentionally outside detail | Reviewed: inherited partial face; candidate clears it |
| 08 | Daybreak | Complete head and figure readable | Not selected |
| 09 | The inner voice | Complete face/head; piano foreground intentional | Reviewed: complete face/head retained |
| 10 | What the night kept | No new head/shoulder crop issue | Not selected |
| 11 | Left hand · response | Both hands readable in oblique composition | Reviewed: inherited partial face; candidate clears it |
| 12 | A quieter answer | No new head/shoulder crop issue | Not selected |
| 13 | The light returns | Wide head/lid margin retained | Not selected |
| 14 | Everything opens · hands | Both hands visible; torso crop suits detail | Reviewed: inherited partial face; candidate clears it |
| 15 | A new breath | Complete face/head; piano foreground intentional | Reviewed: complete face/head retained |
| 16 | The unfolding phrase | No new head/shoulder crop issue | Not selected |
| 17 | Everything opens | Wide head/lid margin retained | Not selected |
| 18 | The highest note | Both hand regions visible | Reviewed: inherited partial face; final candidate includes both complete hand regions |
| 19 | Full light | Complete head and figure readable | Not selected |
| 20 | Coming home | No new head/shoulder crop issue | Not selected |
| 21 | Home in the light | Both hands visible; torso crop suits detail | Reviewed: inherited partial face; candidate clears it |
| 22 | The last phrase | Complete head and relaxed arms readable | Reviewed: head and seated posture retained |
| 23 | Daybreak · ending | Wide head/lid margin retained | Reviewed: complete figure and room framing retained |

The integrated arms are visible in the actual authored medium shots, especially “A window opens” at 18.007612 s and the widened string shot at 62.8689785 s. No exposed arm protrusion through the torso was apparent in these camera-review images. This is visual camera evidence, not a replacement for the arm agent's geometric collision checks. Current score b156 still shows the separate hand/thumb issues being fitted by root; camera acceptance does not certify hand anatomy or note contact.

## Validation and provenance

- Frozen snapshot: `12df4efb5ce15f92`; all file hashes are in `frozen-source.json`.
- Pianist SHA256: `22e2db7b7da490b83d7aaa9111a069f3b1ce3043f61f7c9df6fcba0f68731075`.
- Piano SHA256: `915ae12f1d71c669f1fd811720ad1aadba447f9cdbeb687a67912808ec883733`.
- Score SHA256: `b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773`.
- Original direction SHA256: `d257271fb746320d6abafa1bad496db4487b1a7565a34ca730141bbb8c6bb468`.
- Proposed direction SHA256: `2d07c3e01aef3d7b731e86ed71f877a9525a5118547a571ef31c75dc6b8d4942`.
- All 129 final-source baseline/candidate images match recorded file hashes, time, shot, dimensions, and `GL_NO_ERROR`; actual framebuffer MSAA remains 4. Original renderer SHA is unchanged. Portrait export changes only the scratch wrapper's viewport-aspect argument; the strict GL-check function is bytecode-independent AST identical to the accepted wrapper.
- Existing room audit passes 672 samples across four aspect ratios for both original and candidate directions, minimum camera-origin room clearance 0.30 m. This tests room clearance and the central sightline, not complete image occlusion.
- Camera-state comparison across all 24 shots at three times and two aspect ratios: 123 states identical; exactly 21 intended changes (3 landscape and 18 portrait). Seven mixed viewport/direct-seek checks pass.
- Baseline landscape initialization 10.45 s; 72 frame+PNG operations total 60.52 s; sampled peak process-tree RSS 907,870,208 bytes. Portrait initialization 8.99 s; 36 frame+PNG operations total 32.69 s; peak 894,988,288 bytes. These are bounded still-frame measurements, not a full-film throughput estimate.

`commands.json` reproduces the baseline selection. `render-candidate.py` reproduces the final candidate selection. Source and image validation commands: `python check-review.py`, `python check-candidate.py`, and `node check-direction.mjs` from this directory with the parent `env.sh` sourced. The room audit's algorithm is unchanged; only its output path was redirected to scratch.

No checkout edit, Sites/browser action, or full-film render occurred in this task. Final camera adoption and final-score/master freeze remain with root.
