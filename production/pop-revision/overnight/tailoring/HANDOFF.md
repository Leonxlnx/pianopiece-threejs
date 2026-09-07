# Ivory wardrobe refinement candidate

Ready for root integrated visual review. This work did not edit the Site checkout.

Candidate: `pianist-tailored.glb`, 17,776,680 bytes, SHA-256 `3b10d4739ab5d403397991d795146054f18939d10de4dddd858bc6c42e6b8f25`.
Exact accepted input: `be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc`.

## What changes

- Reduces excess exposed sleeve-cap ease with a smooth field, maximum total panel displacement 3.8173 mm.
- Adds two localized 0.7–0.9 mm compression folds near each upper sleeve; keeps most of the garment quiet.
- Adds two actual 1.1 mm-wide shoulder seams, 0.15–0.45 mm raised at rest, with surface-interpolated skin weights.
- Reprojects the existing blouse facings, placket, buttons and thread onto the refined surface.
- Preserves the original short-sleeve cut and ivory palette, exact cuff/neck/hem boundary positions, trouser primitives and materials, body/hair/face geometry and morphs, skeleton, bind matrices, all original embedded texture bytes and blouse-panel weights/UVs.

The inspected Max Mara cuff/front photographs informed thin construction and localized folds. They are fabric references for a different long-sleeve cut; no photo was used as a texture. I compared the actual root 53 s view and exact neutral before/after rest views. The change is a restrained tailoring improvement, not a replacement wardrobe or dynamic fabric simulation.

## Verification completed

`verify_asset.py` checks real GLB buffers, finite geometry, triangle area and orientation, normals, weights, all protected primitives and an unchanged-asset negative control. Minimum changed panel face normal cosine is 0.982385; base panel triangles do not reverse.

`paired-poses.mjs` loads the exact two GLBs into frozen copies of the existing Three.js performance modules and exports actual skinned positions at 0, 53, 95.44, 108.72, 170, 186 and 226.5 seconds. All 9 protected body/trouser primitives have identical actual posed vertex hashes at every pose. The score and every frozen module hash are recorded in `paired-poses.json`.

`check_intersections.py` performs triangle AABB screening and real edge/triangle intersections, including a separate coplanar branch and four analytic controls. All blouse triangles with any vertex moving more than 5 micrometres are checked against the actual body at all seven poses. New pairs: zero. Existing pairs among those selected triangles stay 15/15, 15/15, 8/8, 0/0, 0/0, 9/9 and 0/0. These are selected-triangle counts, not a claim that all pre-existing garment intersections disappeared.

`check_attachment.py` compares the newly authored shoulder seam vertices with the actual posed blouse surface. Maximum measured separation is 0.59942 mm across the seven poses. This is below its 1.2 mm guard.

The neutral rest A/B views (`before-rest.png` and `after-rest.png`) and their asset-bound render manifests are current and inspected. The folded cuff still has readable thickness, the shoulder seam is faint rather than ink-dark, and the sleeve remains loose. These are diagnostic EGL lighting, not browser captures.

## Rejected work and remaining limits

The first cap-shaping candidate moved the covered underarm join. Real triangle comparisons found 5–12 new pairs per sampled pose, so that candidate was rejected. `rejected-underarm-crossings.json` preserves that result. The accepted candidate uses a continuous spatial guard around the underarm join; this is not a collection of pose-specific vertex exceptions.

An earlier signed-nearest-face screen also produced false inside classifications 50–100 mm across open body cutouts. The covered body surface is absent, so a signed nearest-face classifier is not valid there. `rejected-open-body-sign-screen.json` is exploratory and not acceptance evidence; `check_clearance.py` is retained only to explain that discarded approach. Do not run it as an acceptance gate. The real triangle comparison replaced it.

Seven snapshots do not prove the full moving scene clear. Root still must compare actual seated/front/side sleeve views with the latest integrated rig and decide whether the visible improvement merits acceptance. Existing covered intersections remain. This candidate does not solve dynamic cloth, underarm topology, all torso folds, or every clothing collision.

## Durable integration

`public/assets/pianist.glb` is generated and ignored by git. The existing `assets:prepare` restores the accepted archive, so copying a different GLB alone will be overwritten.

Root selected the existing archive/manifest architecture. `pianist.glb.br` and `asset-manifest.json` are the delivery files for `production/assets/pianist.glb.br` and `production/assets/manifest.json`. `pack-asset.mjs` creates the quality-11 archive and verifies its decompression is byte-identical to the frozen candidate. No change to the preparation architecture is required.

Archive: 10,599,213 bytes; SHA-256 `3a7720a628c0b6bbdea5a680915840e44c7a64e4d26b8fc59ba24a88695809ee`.

An optional review-only `garment-refinement.patch.json` is a 606,047-byte lossless geometry patch against the existing accepted GLB. SHA-256: `3ddf37aec3d481ff4eac5bc70dc2b47e18f626cdd0e71c4a461e3dbfcba7a27f`.
It contains the exact new GLB JSON chunk and 648,680 appended garment-buffer bytes compressed with Brotli. It contains no replacement images or textures. The original GLB binary chunk is retained byte for byte.

`apply-garment-patch.mjs` exports `applyGarmentPatch(sourceBuffer, patchJSON)` and verifies input/output SHA-256, binary chunk hashes, lengths and GLB declarations. `pack-garment-patch.mjs` proved reconstruction byte-identical to the candidate and rejection of a wrong result checksum. This optional patch is useful for inspecting exactly what geometry changed; it is not the selected runtime preparation path.

Source reproduction is also possible with `python3 refine_garment.py --input <exact-accepted-GLB> --output <candidate-GLB>`. It imports unchanged helpers from the existing character generator. `build_character.py`, `garment_tools.py` and `glb_tools.py` here are inspection copies of those existing helpers; they do not need duplicating in the repository.

Parent reverify commands, from this folder:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 verify_asset.py
node paired-poses.mjs
PYTHONDONTWRITEBYTECODE=1 python3 check_intersections.py
PYTHONDONTWRITEBYTECODE=1 python3 check_attachment.py
node pack-garment-patch.mjs
```

Run asset-changing operations before these checks, never concurrently with them. All compact evidence is hash bound. Root may omit optional images from GitHub as required by the existing review restriction.

After the candidate froze, I also inspected root's integrated `work/night/tailoring-and-wrist/gl-1280-1.jpg` (53 s) and `gl-1280-2.jpg` (170 s), whose `scene-inputs.json` binds this exact candidate. The visible sleeve and cuff edges stay continuous in those views, with no observed new hole or exposed protrusion. The wide-frame difference is modest; the shoulder seam reads most clearly in the neutral closeup. These two stills do not replace root's own review or prove all moving poses.
