# Daybreak garden refinement candidate

Apply `garden.patch` to `app/performance/stage.ts`. The patch is limited to the garden block. Full source snapshots under `baseline/` and `candidate/` are for reproducing the comparison; do not overwrite the current checkout from them.

## Changes

- Continuous, gently rolling planted ground extends to the distant view, with subtle vertex-color variation.
- A limestone walk wraps the reflecting pool. Pavers have visible joints, and low coping continues around the pool ends and planting edge.
- Eighteen trees now have bent, tapering segmented trunks, unevenly spaced limbs, separate elbows and twig tips. Tree positions, heights and canopy spread vary deterministically.
- Forty-four loose shrub groups add lower cover between trunks. Their stems and leaves share the tree instance batches.
- Fine grass tufts and small weathered planting stones add a near-to-far ground scale. Grass density and terrain divisions are reduced on mobile.
- Uses existing limestone material and vertex colors. No new textures, lighting, camera or performance animation changes.

## Cost

| Stage geometry | Before | After | Change |
|---|---:|---:|---:|
| Desktop triangles | 228,836 | 298,124 | +69,288 |
| Mobile triangles | 161,444 | 208,290 | +46,846 |
| One-pass draw calls | 87 | 89 | +2 |

Triangle counts include the indoor stage/pavilion as well as garden. Draw-call counts are material/geometry submissions for one pass; shadows and reflection captures add passes. This is a static scene count, not a browser FPS measurement.

## Validation

Patch applies cleanly to the current checkout with `git apply --check`. TypeScript check passed using `tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --skipLibCheck app/performance/stage.ts`. Geometry counts are reproducible with `stage-stats.mjs`.

Paired renders use the same score, character, camera and renderer at 1.5s (opening wide), 172.5s (interior portrait control) and 181.3s (later wide). Both snapshots include the root agent's separately authored sun-height correction (4.8m) and non-shadow-casting glazing; these changes are excluded from the garden patch. Offline renderer approximations still apply and these renders are not live-browser verification.

Final comparison paths: `render-before-final/gl-1440-0.jpg` and `render-after-final/gl-1440-0.jpg` for the opening; index 1 is the unchanged interior portrait control. The second garden-visible wide is `render-baseline-wide2/gl-1440-0.jpg` against `render-candidate-wide2/gl-1440-0.jpg`.

The opening comparison was visually reviewed: the garden now has planted ground continuity, varied tree silhouettes, foreground shrubs and fine grass. The room, performer and piano retain their framing. The portrait control shows no material or anatomical regression from this garden-only change.

The second wide at 181.3s was visually reviewed as well. It retains the performer/piano framing while showing lower shrubs, irregular trees and planted ground through the windows. No new occlusion of the performance is introduced.
