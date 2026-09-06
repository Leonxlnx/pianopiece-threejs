# Tailored concert garment variant

`pianist-tailored.glb` refines only the clothing of `../pianist-refined.glb`. All other mesh definitions and binary accessors, rig nodes, skin joint order and bind matrices are unchanged. It retains the same clothed adult character and the graphite palette.

The blouse has eased lower panels that hang from the shoulder/chest region and gather gently above the waistband. Localized folds follow armhole tension, upper-arm support and the waist. Sleeve ease increases toward the cuff. This creates a garment silhouette rather than uniformly offsetting the whole surface.

The trousers have varying ease through thigh, calf and lower leg, localized folds on the compression side of the seated knee and at the upper thigh, a restrained pressed front crease, and actual side-seam ribbons. The central joining seam is protected from opposing radial expansion. The final panel deformation has no reversed triangles.

Constructed details include an 8 mm bound neckline, 12 mm sleeve cuffs, 5 mm blouse hem, 18 mm waistband and trouser turn-ups, a 12 mm front placket, and six small dark buttons. Bands, placket, seams and buttons carry interpolated weights from the garment surface; there are no extra bones or rigid world-space decorations.

The blouse and trousers now have separate dark materials. Blouse roughness is 0.68 with restrained glTF sheen; trousers are 0.88. The existing garment normal texture is retained at reduced strength (0.45 blouse, 0.28 trousers) to prevent the former casual/denim texture from dominating the new geometry. No bitmap was generated, retouched, recolored or upscaled.

## Final candidate

- File: `pianist-tailored.glb`
- Size: 16,021,364 bytes, versus 15,237,668 bytes for the previous refined asset.
- SHA256: `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`
- Garment: 11,666 vertices and 20,114 triangles, versus 9,998 and 18,256.
- Whole character: 75,255 vertices and 124,884 triangles.
- Maximum blouse panel displacement: 37.7 mm, spatially tapered to the lower panel/sleeve regions.
- Maximum trouser panel displacement: 16.5 mm.
- Garment render primitives: 7; this adds 6 draw calls. glTF node/rig structure is unchanged, while Three.js expands the garment mesh into primitive children.

The original garment clearance remains baked. Do not reintroduce the old runtime `position += normal * .0035` operation.

## QA evidence

`seated-before.png` / `seated-after.png` and `seated-side-before.png` / `seated-side-after.png` use the same current Pianist animation snapshot at t = 186 seconds, with neutral EGL material lighting. `blouse-detail-before.png` / `blouse-detail-after.png` show the placket and cuff construction. `standing-after.png` checks the garment's rest coverage and overall panels.

`room-before/gl-1440-0.jpg` / `room-after/gl-1440-0.jpg` use the same copied room, piano, camera, animation and QA renderer at t = 186 seconds. The room snapshot was copied to scratch during this subtask; it may differ from later parent edits to the production room/piano. The pair itself holds those variables fixed. Both were visually inspected.

Observed improvement: separate blouse and trouser construction reads clearly in the front view; the side view shows looser blouse drape, distinct cuffs/hem and the trouser side seam. Room lighting reveals the authored shoulder, sleeve and waist folds. The garment retains coverage in these checked poses.

`validation.json` records exact non-garment mesh/rig preservation, valid indices, finite coordinates, normalized skin weights and no zero-area triangles. The final authored panel deformations have zero orientation reversals. The full actor successfully loads and poses through the current Three.js GLTFLoader/Pianist code.

These are authored, skinned cloth shapes for a mostly seated performance, not a cloth simulation. No full-duration collision sweep is claimed. The parent should retain the normal production pose/coverage QA when integrating.

## Reproduction and scope

From this directory, with Python, NumPy and Pillow:

```bash
python tailor_garment.py --input ../pianist-refined.glb --output pianist-tailored.glb
node export-pose.mjs pianist-tailored.glb after-pose.json 186
```

The builder verifies the expected input garment topology. `export-pose.mjs` uses the copied `pose-src` snapshot and score; Three.js is resolved from `node_modules` or the project's installed package. The shared `../render_character.py` renders the resulting posed arrays.

`room-project/` is a scratch copy of the QA code and material textures used for the paired room renders. The only custom change to its pose server is an environment variable that selects the candidate GLB. No Site checkout files were edited by this subtask.

Source/avatar licensing remains the [CC0 MPFB avatar](https://github.com/met4citizen/TalkingHead/blob/main/avatars/mpfb.glb), documented in the [upstream asset license notes](https://github.com/met4citizen/TalkingHead#readme) and `../README.md`.
