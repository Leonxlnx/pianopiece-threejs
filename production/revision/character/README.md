# Daybreak character refinement

`pianist-refined.glb` is a controlled refinement of the existing clothed MPFB pianist. It preserves the same identity, graphite short-sleeve top and trousers, body proportions, skeleton and hand skinning. This is not a replacement photogrammetry character.

## Integration

Copy `pianist-refined.glb` as the performer asset. **Remove the old runtime clothing offset (`position += normal * .0035`).** That clearance is already baked before constructing the turned garment hems. Applying it again would separate the edge normals from the outer fabric surface.

All original node names, node transforms, joint order and inverse bind matrices are unchanged. The first 11,779 body vertices retain exact POSITION, NORMAL, UV, JOINTS and WEIGHTS values. Hands have no new vertices, no changed indices and no painted weight edits. Existing blink names stay first in the morph dictionaries that contain them.

The eyes carry glTF `KHR_materials_clearcoat` for a wet surface highlight. Three.js GLTFLoader recognizes the extension. All 11 body morph influences default to zero; the animation should set a control on every mesh containing that name so eyes, brows and lashes move together.

The modest expression tested in `face-refined-threequarter.png` is:

| Control | Value |
|---|---:|
| browInnerUp | 0.025 |
| mouthSmileLeft / mouthSmileRight | 0.045 each |
| eyeLookDownLeft / eyeLookDownRight | 0.25 each |
| eyeSquintLeft / eyeSquintRight | 0.035 each |

Do not simultaneously apply a full downward eye-bone rotation and full downward eye morph without accounting for the combined rotation. A restored `mouthClose` candidate produced visible corner artifacts at 0.2 and was removed.

## Changes and measurements

| Measure | Existing asset | Refined asset |
|---|---:|---:|
| File bytes | 10,157,684 | 15,237,668 |
| Total vertices | 53,116 | 73,587 |
| Total triangles | 83,686 | 123,026 |
| Body vertices | 11,779 | 24,629 |
| Body triangles | 21,380 | 46,700 |
| Garment vertices | 2,377 | 9,998 |
| Garment triangles | 4,236 | 18,256 |
| Rig joints | 67 | 67 |
| Body facial targets | 2 | 11 |

- Face: one curved PN edge refinement above y = 1.51 m. It inserts interpolated surface vertices without moving the originals. Curvature correction is capped at 1.5 mm. Facial morph positions and normals are interpolated consistently onto the refined surface. Skin texture is unchanged.
- Clothes: one curved edge refinement rounds the neckline and sleeve contours and supplies more triangles for bent poses. Existing 3.5 mm outer clearance is baked first. All seven real garment openings get 1.4 mm edge thickness and a 4 mm inward turn: 328 refined boundary edges, 1,014 added hem vertices, 1,312 added triangles. Fabric normal texture and graphite color are unchanged.
- Eyes: roughness 0.36, clearcoat 0.8, clearcoat roughness 0.1.
- Facial controls: eyeBlinkLeft/Right, browDownLeft/Right, browInnerUp, mouthSmileLeft/Right, eyeLookDownLeft/Right, eyeSquintLeft/Right. Matching source targets are retained on brow, lash and eyeball meshes.
- Packing: sparse morph accessors; unused original orange/blue garment diffuse is removed. Existing compressed bitmap data is copied verbatim; there is no image retouching or upscaling.

## Validation and limitations

`validation.json` records exact rig/body preservation, valid indices and skin-joint bounds, finite arrays, normalized normals, correct target sizes, and no zero-area triangles in any output mesh. Largest skin-weight sum error is 1.1921e-7.

`three-loader-validation.json` records loading all eight skinned meshes through the project's actual Three.js GLTFLoader. All have 67 joints; maximum rest reconstruction error is 1.773e-6 m, consistent with floating-point bind matrices.

EGL diagnostic renders were visually inspected: face quarter view in neutral and light expression, neckline detail, and full clothed rest pose. The refined chin, cheek and collar contours are smoother. These renders use neutral asset lighting with base color, normal mapping and approximate PBR highlights. They do not establish a visual pass for the production lighting, seated pose, clothing-body collision, finger contacts or animation.

The source head retains moderate geometric and 2K texture detail. Hair cards and individual eyebrow/lash geometry can still alias at small screen sizes. Turned hems are garment geometry, not a cloth simulation. The skin has no new pore normal map or subsurface-scattering extension.

## Hand findings for the rig author

No unweighted body vertices were found. Each side has 1,917 vertices receiving hand/finger influence above 0.001. Thumb joints 1/2/3 affect 118/217/164 vertices on both sides. Their normalized skinning and affected counts are bilaterally coherent. This does not prove every weight is ideal, but it does not justify blind weight repainting.

The thumb's proximal source frame differs substantially from the index's frame. LeftHandThumb1 quaternion is approximately `[0.507197, -0.349992, -0.021995, 0.787257]`; LeftHandIndex1 is `[0.094902, -0.187580, -0.031761, 0.977138]`. Thumb2 and Thumb3 also carry large non-identity rest rotations. Right-hand rotations mirror the appropriate components. A shared finger flexion/roll frame that erases these anatomical offsets can distort the palm/thumb web even when weights are normalized. Parent animation work should review these frames and roll continuity before any skin edit.

## Source, license and reproduction

Source avatar: [met4citizen/TalkingHead avatars/mpfb.glb](https://github.com/met4citizen/TalkingHead/blob/main/avatars/mpfb.glb).

The [upstream README](https://github.com/met4citizen/TalkingHead#readme), asset licensing section, states the MPFB example avatar was created with Blender/MPFB and licensed under [CC0](https://creativecommons.org/public-domain/cc0/). A retrieved copy is saved as `sources/TALKINGHEAD_README.md`. This applies to the MPFB avatar, not the other avatars in that repository. The original palette was already changed in Daybreak; this derivative retains the existing graphite palette.

Source SHA256: `63c645a2a863b9972e9a9c2ed576a1de4c390b8475508e1473e69c87a3ee299c`.

Output SHA256: `7a5af041e5e8323d30f6476fd543c747bee3bc81b6ea64361713906f6739ab40`.

`baseline-materials.json` and `baseline-textures/` preserve the pre-refinement Daybreak appearance data. Those texture bytes were extracted from the existing asset; no raster artwork was edited. To rebuild from the downloaded source with Python, NumPy and Pillow:

```bash
python refine_character.py --source sources/mpfb.glb --output pianist-refined.glb
```

To derive from a different original-topology Daybreak asset while retaining its materials and textures, supply `--current path/to/pianist.glb`. The current body positions and source node structure must match the canonical source or the script stops. A resulting refined asset is not a valid `--current` input because it has additional vertices.

`glb_tools.py` implements GLB reading/packing; `refine_character.py` implements geometry and source morph transfer. `render_character.py` produces the EGL diagnostic images and requires ModernGL plus Mesa/EGL. `check-three-loader.mjs` validates the actual Three.js loader; set `DAYBREAK_THREE_ROOT` if its package is elsewhere.

The source-only rebuild was checked: JSON structures are equal and the entire binary chunk is byte-identical to the delivered candidate. JSON property order can differ because the source and compact template were exported with different ordering, so the outer GLB hash can differ while the model and binary payload remain identical.

No Site files were edited by this subtask.
