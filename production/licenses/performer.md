# Human pianist asset source and license

## Recommended deliverable

`pianist-stage.glb` — a CC0 derivative of `avatars/mpfb.glb` by Mika Suominen / met4citizen, from the TalkingHead project. It is approximately 10.2 MB and self-contained. The asset is a realistic adult female human with brown ponytail, dark neutral short-sleeve top and trousers, a 67-joint humanoid skeleton, and 30 weighted articulated finger bones.

## Primary source verification (2026-09-05)

- Author repository and asset-specific licensing statement: https://github.com/met4citizen/TalkingHead#readme
- Source GLB: https://github.com/met4citizen/TalkingHead/blob/main/avatars/mpfb.glb
- Direct source download: https://raw.githubusercontent.com/met4citizen/TalkingHead/main/avatars/mpfb.glb
- Last asset-changing commit: `6318ff8c798e4a661fcd70c9373c4ab789c822bb` (recorded in `source-commit.json`).
- The author's README explicitly identifies this particular `mpfb.glb` as CC0, created with Blender and the MPFB extension. This is an asset-specific grant, independent of the repository's MIT software license. A retrieved copy is `primary-README.md`.
- CC0 1.0 Universal: https://creativecommons.org/publicdomain/zero/1.0/
- MakeHuman primary asset license FAQ: https://static.makehumancommunity.org/makehuman/faq/are_makehuman_files_free.html

CC0 permits redistribution and adaptation including commercial uses. No attribution is required by CC0; a voluntary concise credit is: “Human model: Mika Suominen / met4citizen, created with MakeHuman MPFB; CC0. Adapted for this performance.”

## Adaptations

- Preserved all eight meshes, all 67 bones, original vertex positions/normals/UVs/skinning/inverse bind matrices, and both eyes/hair.
- Removed speech and facial expression morph targets; retained `eyeBlinkLeft` / `eyeBlinkRight` where present for subtle natural blinking.
- Applied dark graphite to the existing clothing material, removing its blue/orange diffuse-map reference; preserved its normal mapping. This does not change the original top-and-trousers cut.
- Reencoded opaque textures as JPEG, retained alpha textures as PNG, preserved skin/hair at 2048px, and reduced less visible maps to 1024px. Exact byte changes are in `stage-packaging.json`.
- Original unmodified asset remains as `mpfb-source.glb`. The intermediate `pianist.glb` preserves original textures and clothing appearance while dropping unused morphs.

## Research alternatives and rationale

- Three.js Michelle is a Mixamo character. Adobe's official FAQ permits use of Mixamo characters/animations in projects, but its proprietary asset terms are not an unrestricted CC0 redistribution license. The explicitly CC0 MPFB model provides clearer public client delivery and adaptation rights. Adobe source: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
- The same TalkingHead repository's Ready Player Me example is explicitly noncommercial CC BY-NC; it was not selected.
- MakeHuman's CC0 formal suit packs are another valid asset route, but fitting them requires the original parametric MPFB source character and export workflow. We did not claim a fitted suit when only the clothed GLB was available.

## Limits

The model is suitable for artful real-time rendering, not a photoreal scan. It has bare feet and short sleeves; shoes are not included. Keep feet naturally placed at the pedals or add a fitted accessory if the scene requires shoes. The source skeleton is already in a relaxed standing pose, not a mathematically exact T-pose. Do not zero its bone rotations.

The software geometry previews use per-triangle shading and approximate texture sampling; their visible facets are a preview limitation. Final smooth shading, materials, seated pose, hand contact, and motion need integrated Three.js inspection.
