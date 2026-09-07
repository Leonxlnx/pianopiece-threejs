# Compact inactive thumb repair — final candidate

Only root may integrate. Candidate is `compact-final/pianist.ts`; apply `compact-thumb-prior-final.patch` to `src/performance/pianist.ts`. Do not copy sibling source modules or the frozen score into the checkout.

This changes the inactive thumb prior from root Rx −.70, mirrored Rz ±.20, Thumb2 Rx −.15 to root Rx −.90, mirrored Rz ±.55, Thumb2 Rx −.45, Thumb3 Rx +.20. Mirrored Ry ±.75 is unchanged. It also extends the short-gap thumb arrival blend from 25 to 27 ms. Active solving, contact targeting, every nonthumb branch, wrists, score, sound, assets and rendering remain unchanged. The original continuous hand mesh and MCP/IP rest frames are retained. Absolute-time evaluation has no collision history or frame integration.

The former compact thumb still crossed the neighboring index shaft during held E3 notes and their approaches. The new thumb rests slightly higher and shorter through the distal joints. The 2 ms arrival extension removes a speed overshoot caused by the larger departure from contact pose; it is confined to sixteen short thumb gaps.

## Actual triangle and key-core evidence

The specialized audit is copied from the production full-hand audit. Pair testing includes every thumb/palm, thumb/digit and opposing thumb/hand patch pair. Key tests include all checked vertices with any positive thumb-bone weight, including mixed web or palm vertices, against all 88 actual hinged key meshes. No count or depth threshold changed. Pair triangle ownership, mixed-web exclusions and finite-sampling limitations remain identical to the original audit; counts are incidences, not penetration depth.

| Screen | Baseline | Candidate |
|---|---:|---:|
| Thumb neighbor rows in 863 unique note midpoints | 122 | 0 |
| Thumb pair incidences at these midpoints | 7,652 | 0 |
| Thumb neighbor rows in 3,571 matched dense times | 687 | 0 |
| Thumb pair incidences in dense screen | 43,911 | 0 |
| Thumb/palm or opposing rows in these screens | 0 | 0 |
| New >3 mm core rows in dense comparison | — | 0 |
| All-hand 72 contexts, severe key-core rows, current db00108 score | — | 0 |
| All-hand 72 contexts, own-palm / opposing rows | — | 0 / 0 |
| All-hand 72 contexts, remaining neighbor rows | — | 44 |

Dense times cover nine implicated idle gaps totaling 50.295 seconds, regular samples at 60 Hz plus release/approach windows at 240 Hz. Both hands are tested at every time. See `windows.json`, `dense-times.json`, `baseline-dense.json`, `compact-curl-dense.json`.

The final 27 ms blend does not execute at any of the 863 midpoint times, original 72 times, or the three rendered times. Exactly seven dense times change from the already-cleared compact-curl result; they were re-run with the final source and are all surface/core clear (`compact-final-seven-dense-arrivals.json`). Every one of the sixteen affected short-thumb arrivals was additionally sampled at 240 Hz, 160 times (`compact-final-all-short-arrivals.json`). No thumb pair intersection was found. The matching baseline has 29 thumb-neighbor rows in these 160 times; candidate has zero. Both retain the same fifteen severe core row identities, with no depth increase (ten active, five arriving).

## Remaining failures are visible

The 863 midpoint baseline contains 39 inactive core hits, all nonthumb (20 LIndex, 4 RIndex, 4 LPalm, 3 RRing, 3 RMiddle, 2 LMixedWeb, 2 LRing, 1 LMiddle). The idle thumb patch cannot fix them.

Twenty ACTIVE thumb core hits also remain unchanged: left G3 thumb shafts enter key F3 in sixteen sampled contexts, and right D4 shafts enter key E4 in four contexts. Their detailed note IDs and geometry are in `full-midpoint-thumb-failures.json`. Dense sampling retains the same 44 active and 12 immediately-arriving inactive thumb core hits as baseline. No new severe row was introduced, and no existing severe depth increased; the 12 approach depths decrease by up to 0.589 mm. These approaches converge to the existing bad active endpoint and require active physical grip repair. This patch does not declare the whole performance collision-free.

## Input provenance

The frozen score `score.json` contains the 22 active-note patch. Root's `all-midpoint-baseline.json` and `score-with-db00108.json` additionally change db00108 contactZ to .236 and lift to .002; this is the only decoded score difference. No thumb note, timing, wrist or audio field differs. The original 863 baseline has no thumb pair collision at db00108. Full 72 candidate verification explicitly uses the newer score with db00108. Every audit records exact source, score, piano and GLB SHA-256 values.

## Visual inspection

Fresh exact-source offline EGL images are `render-compact-curl/gl-1400-0.jpg` (76.0859375 s held E3), `gl-1400-1.jpg` (72.15649195 s formerly intersecting approach) and `gl-1400-2.jpg` (220.6984765 s ending hands). I inspected all three. The idle thumb remains compact, separate from the index and original palm surface. The final close-hand frame has no opposing owned-patch triangles. Existing web/thenar highlight pinching remains a model shading limitation. This offline renderer is an approximation, not browser visual approval.

## Motion

Final full-song 240 Hz thumb-only replay PASSED (`compact-final-motion.json`): 54,505 frames, max thumb tip speed 4.759082 m/s, wrist speed 1.499355 m/s, wrist acceleration 24.957809 m/s², max marker error .517764 mm, seek error zero, nonfinite zero. The first compact-curl pose with old 25 ms arrival had max thumb speed 5.068 m/s and was rejected for integration. The final 27 ms blend resolves that peak. This is a thumb motion gate, not an all-finger or skin-pad-contact gate. The existing RMiddle 240 Hz peak of 5.799 m/s reported by the active-grip agent is unchanged by this thumb-only patch.
