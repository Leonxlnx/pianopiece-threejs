# Global wrist-frame nonthumb plane: diagnostic rejected as a drop-in

The candidate gives visibly more coherent nonthumb flexion in some poses and reduces many finger crossings. It is **not accepted for global integration on the frozen score**, because it increases actual held-finger key intrusion. The frozen score and compact5 baseline remain unchanged.

`pianist-palm-plane.ts` changes only the nonthumb normal inside `fingerPoints`: transform local (-1,0,0) by palm quaternion, project it perpendicular to base→target, and normalize. When that projection has squared length below 1e-8, retain the old stable/world-up construction as a fallback. No opening special rest, thumb, wrist, contact, timing or score edits are included. `build.mjs` asserts the exact single source replacement; `build-provenance.json` contains before/after text and hashes. Forty-eight exact-axis tests on both hands/four fingers verify finite orthonormal normals at degeneracy.

Input is combined-v4 (efb1e0f4) plus frozen R79 v2, score SHA256 `09cfc46aceac1527e9f0b4f27bb8fa5110373bb7c889aae740c7258b9a4cbf90`. Baseline runtime is accepted arms+compact5 with the exact wrist arc sampler. The midpoint audit samples all 1,068 note midpoints plus start/end: 1,070 instants, both hands, 2,140 hand frames per runtime. It checks every owned digit/palm surface against all 88 animated beveled key cores, exact owned surface-triangle crossings, held IK and actual mesh-pad contact.

| Hand frames containing issue | Compact5 | Wrist plane |
| --- | ---: | ---: |
| Any >3 mm key-core intrusion | 394 | 556 |
| Active nonthumb >3 mm key-core intrusion | 43 | 146 |
| Idle digit >3 mm key-core intrusion | 308 | 396 |
| Palm >3 mm key-core intrusion | 52 | 49 |
| Any finger/palm crossing | 1,282 | 1,070 |
| Active finger / own palm crossing | 65 | 65 |
| Active / active crossing | 5 | 0 |
| Active / idle crossing | 821 | 819 |
| Idle pair crossing | 508 | 272 |
| Held IK or actual-pad failure | 0 | 0 |

The unchanged total of 65 active/palm frames hides 13 new and 13 removed frames. There are 111 new/worsened active nonthumb key frames, 27 new/worsened palm key frames, 13 new active/palm frames and 28 new active/idle frames. `comparison.json` also records improvements and worst depths. Thumb and wrist local quaternions are bit-exact at every sample; all chain points are finite. No frozen R79 reserved note context has a new active failure at these midpoints.

Most new active key occurrences are LIndex (108 patch/key occurrences), LRing (25), RIndex (20) and LMiddle (10). These are occurrence counts, not distinct frames. The largest new active intrusion is RIndex 6.601 mm at p981/p982 around 199.479 s; the largest new active middle intrusion is 6.380 mm at p978. The plane removes all five sampled active-active crossings, from RRing/RPinky in p721/p722/p723 around 159.26–159.31 s.

`active-affected-queue.json` records 80 active-note contexts with exact affected frame/types; simultaneous partners are retained for coherent follow-up fitting. `idle-affected-queue.json` records 167 exact previous/next gaps with sampled failures. These queues describe regressions from this diagnostic only; they do not replace the existing final-runtime repair queues. `regressions.json`, `improvements.json` and both raw row files preserve full surface evidence.

Sixteen native PNGs cover four identical score poses in top and oblique views for each runtime. All sixteen were directly inspected and are hash-bound to the exact score, rig and arc sampler (`renders/*/image-index.json`). Every renderer reported GL_NO_ERROR.

| Pose / view | Direct visible observation |
| --- | --- |
| 7.6533595, R, top and oblique | Index arc changes modestly. The old lateral target still forces an unusual sideways endpoint; the plane alone does not provide a natural idle shape. The torso occludes part of the oblique hand, so the top view supplies the useful comparison. |
| 25.5420075, L, top and oblique | The curling middle finger changes orientation under the palm. The new actual middle/palm crossing is mostly occluded in the still views; the geometric gate remains decisive. |
| 159.2921565, R, top and oblique | Outer ring/pinky overlap is reduced, matching the removed active-active crossing. Other idle fingers remain laterally displaced by their unchanged targets. |
| 199.479266, R, top and oblique | The broad sideways index/middle curl across the palm changes to a curl toward the keyboard, a visibly more coherent bending direction. Actual active index skin then enters key cores by 6.601 mm despite the unchanged precise pad target. This pose clearly shows why pad IK cannot certify the surface. |

This establishes a promising direction for a future coupled plane/contact/support fit, not a global acceptance. Complete intervals and temporal continuity were not tested for this rejected runtime; midpoint regressions already establish the rejection. Any later adoption requires refitting the affected held contacts and requalifying full intervals and idle paths against the chosen source.

Reproduce from `active-hand-fit`: `node nonthumb-plane/build.mjs`, run `nonthumb-plane/screen.mjs` with each rig through DAYBREAK_RIG_MODULE and exact DAYBREAK_WRIST_MODULE, then `python nonthumb-plane/compare.py`. `render.py` renders the four fixed same-pose cameras. `python nonthumb-plane/validate.py` checks the bounded diagnostic deliverable.
