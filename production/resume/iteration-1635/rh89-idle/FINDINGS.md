# RH89 additive idle batch: qualified subset, two releases remain open

Three bounded curves are ready for root review on the frozen compact5 rig: R5 p00415→p00418 motion, R4 p00401→p00423 approach clearance, and the late key-core portion of R2 p00421→p00436. The full four-gap batch is not accepted. R4's release and R2's early release still fail either actual surfaces or motion; neither correction is in the delivered subset.

## Exact deliverable and inputs

Append `rh89-clear-subset-v2.json`'s three curves to the existing additive helper data. SHA `593e5fff7c07ed59f75544c3c0a62ec7b6b53096f387a2f70760b2721a2f2b90`. `rh89-clear-subset-data.ts` contains the same array. The schema is unchanged: zero-based hi/fi, exact previous/next note IDs and release/attack times, wrist-local MCP lift/spread and PIP/DIP lift, `hermite-controls` interpolation. The unused supported-index list is empty in the native review source.

Frozen endpoint score SHA `be4f29f8d0c4ff8384f147e021537c2a4e3e5d238499611b88aa23169c31ff0e`; original arms/compact5 source is 4ef26cd, localized rig SHA `f67551a5e632ec5946fe747da8d0537348ad0bfc59ca06e3499066bdd6521122`. Combined score is the frozen root candidate-v2 SHA `335e91845dfb5a6126e7b83d1818ac841f6852694f24348b24e0f182c3b76e60`, with its optional arc sampler copied into `combined/`. Exact endpoint fields are unchanged between these scores for all owned gaps. Neither score, held anchor, attack, pitch, velocity, duration, or pedal was edited. No remaster is needed for these additive curves.

| Delivered correction | Bound gap | Actual correction support |
|---|---|---|
| R5 motion | p00415 release88.357021 → p00418 attack88.407021 | 88.357021–88.407021 |
| R4 approach | p00401 release86.658911 → p00423 attack89.480345 | 89.200000–89.480345 |
| Late R2 key core | p00421 release89.455345 → p00436 attack91.884804 | 90.770000–90.880000 |

These calibrations are tied to compact5. A different neutral/idle source must requalify them.

## Whole surfaces, held parity, and combined rebind

`subset-frozen-surfaces.json` and `subset-combined-surfaces.json` each contain 713 actual states across 88.33–90.90 at 240 Hz, with exact note and curve boundaries added. All five same-hand digit surfaces, own palm, all keys, palm key cores and opposing-hand surfaces are checked. Both comparisons have zero new surface/key/palm/opposing regressions. Opposing checks use actual owned skin bounds; overlapping bounds would trigger exact triangle checks.

The first R4 fit reduced core depth but left two samples just over 3 mm. The final v2 changes only that ring curve. `subset-v2-ring-surfaces.json` and `subset-v2-combined-ring-surfaces.json` recheck its complete entry/exit at 500 Hz plus boundaries: 187 states each, zero new regressions, zero new palm/opposing pairs, and maximum R4 core 2.894 mm. The unchanged late R2 correction has maximum core 2.614 mm; R5 core is zero. Every delivered target has zero own-palm or same-hand neighbor crossings in these checks.

`subset-v2-zero-outside.json` has 747 samples across the entire union of bound gaps, including boundaries: held quaternion components, held tips, and every pose outside correction support are bit-identical. The earlier combined full-gap parity check also has zero component/tip delta; v2 changes only the already rechecked ring support. Direct seek delta is zero. The surface report's angle-based held metric can show ~6e-8 radians from acos roundoff on identical components; the component comparison is exactly zero.

`native-helper-v2-parity.json` proves the inline native-scene helper and the experimental post-pose helper are bit-identical over 701 states and all ten fingers. This avoids treating the rendering implementation as an unverified approximation.

## Actual motion

All rows below use 2 kHz actual local joints, chain points, and owned finger skin, including whole entry/exit. The R5 combined-score rebind produces identical results.

| Correction | Joint-rate maximum, base → candidate (rad/s) | Tip maximum, base → candidate (m/s) | Skin maximum, base → candidate (m/s) |
|---|---:|---:|---:|
| R5 gap | 123.134 → 82.312 | 2.144 → 2.606 | 2.830 → 2.712 |
| R4 approach | 4.498 → 43.407 | 0.478 → 1.941 | 0.522 → 2.131 |
| Late R2 core | 8.807 → 11.559 | 1.818 → 1.739 | 1.908 → 1.898 |

The previously reviewed R5 MCP peak was 98.465 rad/s near 88.3915. Full-gap inspection found a separate earlier PIP peak of 123.134 rad/s at 88.3675. The delivered correction reduces the full-gap maximum and maximum skin speed. Its fingertip peak increases, so this tradeoff is explicit rather than hidden behind the joint-rate improvement. Maximum 0.5 ms skin step is 1.356 mm, compared with 1.415 mm baseline. The ring now lifts clear and returns to its exact held pose, with a faster approach; its maximum 0.5 ms skin step is 1.065 mm. No held notes are moved.

## Native visual review

`subset-v2-image-index.json` contains 16 native 960×540 frames: four times × top/oblique × baseline/candidate, all hash-verified and strict `GL_NO_ERROR`, accepted 4× MSAA and one temporal sample. All four matched sheets in `evidence/subset-v2-*.png` were viewed.

At 88.3675 and 88.3915 the pinky bends through a clear path while the neighboring held silhouette remains fixed. At 89.44 the ring hovers above the key region instead of passing into it. At 90.835 the index clears the key with a modest outward shift. Existing idle/thumbnail defects outside these three supports remain. These are diagnostic hand cameras, separate from film shots. No full film was rendered.

## Two rejected release paths

`remaining-release-queue.json` retains exact signatures, original defect intervals, failed candidate files, and motion evidence.

- R4 p00423→p00452, original defect around 89.867–90.008: static fits exist, but coherent and anticipatory interpolation trials still cross keys or held R5 near 89.955–89.962. The point-driven `surface-v0.json` has no new same-hand regression at 120 Hz, yet its actual 2 kHz skin peak rises 0.768→5.659 m/s near 89.958. Rejected. No R4 release correction is delivered.
- R2 p00421→p00436, early portion around 89.457–89.502: `candidate-v7.json` clears same-hand surfaces at 240 Hz using secondary idle R3 p00396→p00447, but index skin peaks at 5.860 m/s and R3 skin at 5.053 m/s. Earlier R3 preposition can also move palm skin into the still-held index when combined with the ring approach. Rejected. The delivered late R2 correction does not resolve this early crossing.

Multiple pose searches, shared poses, coherent control paths, and anticipatory paths were tried. The observed failures do not prove mathematical impossibility of a better additive path; they are concrete reasons not to integrate these candidates. No secondary R3 curve is delivered. The full batch gate remains open for a better bounded path or a separately qualified idle basis.

## Reproduction

Source `env.sh`, set `DAYBREAK_IDLE_CURVES` to the absolute v2 JSON path, then use `verify-surfaces.mjs begin end fps output hi`, `verify-zero-outside.mjs output`, and `localize-motion.mjs begin end zeroBasedFinger output`. For the combined rebind, set `DAYBREAK_RIG_MODULE` to `combined/rig.mjs` and `DAYBREAK_SCORE_PATH` to `combined/score.json`. The exact source bake, native renderer invocation, image index and validation checker are included. Shared assets and Node dependencies remain external; they are not duplicated into the bundle.
