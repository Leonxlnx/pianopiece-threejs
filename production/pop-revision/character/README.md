Current integrated wardrobe for the Daybreak pop revision.

# Ivory concert wardrobe

The integrated `public/assets/pianist.glb` keeps the existing adult performer, every bone, bind matrix, skin vertex, hand weight, facial morph, hair card and embedded source texture. Only the garment and its materials change. It is intended to replace `public/assets/pianist.glb` after the parent’s integrated lighting and performance review.

The warm ivory blouse separates the torso and arms from the piano’s black lacquer and the midnight wool trousers. The blouse front has a gentler suspended shape, a flatter lower panel and a softened under-bust ridge. The trousers retain their pressed cut with less pronounced upper-thigh compression. Neither change pretends to be simulated cloth.

The neckline has a 12 mm facing, the sleeves have 27 mm folded cuffs, and the waistband is 26 mm wide. Four rings round each folded edge. These details project back onto the actual garment triangles, with interpolated skin weights, so widening a cuff does not create a floating rigid hoop. Tiny raised thread dashes follow the facings. A narrow placket and six pearl-colored buttons complete the blouse. The former casual blouse normal texture is removed; the source texture remains embedded and the trousers use it at reduced strength.

The garment uses six primitives, down from seven, because related construction details are batched. No new bone, runtime shader, image request, animation curve or draw-time modifier is needed. All material factors are linear glTF values, including restrained cloth sheen and the button clearcoat already supported by the installed loader.

## Reproduce

The accepted baseline is already preserved in the repository at `production/revision/wrist-analysis/input-pianist.glb`, SHA-256 `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`. The generator rejects another input. It can be relocated to `production/pop-revision/character` and run from any working directory:

```sh
python production/pop-revision/character/build_character.py --input production/revision/wrist-analysis/input-pianist.glb --output public/assets/pianist.glb
python production/pop-revision/character/verify.py --input production/revision/wrist-analysis/input-pianist.glb --asset public/assets/pianist.glb
```

Python dependencies are NumPy, SciPy and Pillow. Only diagnostic rendering needs ModernGL and an EGL implementation. `garment_tools.py` and `glb_tools.py` are bundled local helpers adapted from the recovered character pipeline. No network or source-avatar redownload is needed.

`export-pose.mjs` uses the repository’s installed Three.js, GLTFLoader, TypeScript and actual Pianist implementation. Its last argument selects the saved motion/score snapshot, preventing concurrent source changes from contaminating the asset comparison:

```sh
node production/pop-revision/character/export-pose.mjs . production/revision/wrist-analysis/input-pianist.glb production/pop-revision/character/before-pose.json.gz 186 production/pop-revision/character/pose-source
node production/pop-revision/character/export-pose.mjs . public/assets/pianist.glb production/pop-revision/character/after-pose.json.gz 186 production/pop-revision/character/pose-source
```

`render_character.py` accepts `asset.glb output.png --pose pose.json.gz --view front|side|detail|face`. Omit `--pose` for the standing asset. Set `DAYBREAK_EGL_ROOT` to a Mesa library root only when system EGL cannot be loaded. The corresponding library path and Mesa vendor environment variables are environment setup, not application requirements.

## Four completed review passes

1. Built the complete ivory/midnight material and garment candidate, including actual cuffs, seam thread, hems and buttons.
2. Inspected the actual asset. The first widened cuff approximation floated from the sleeve; replaced it with closest-triangle projection and interpolated skinning. Removed the inherited casual normal map from the blouse and eased the pronounced chest ridge.
3. Checked finite buffers, normalized normals/weights, triangle validity and orientation, exact non-garment mesh/morph preservation, exact bind matrices and byte-identical rebuilding. The initial paired-pose check correctly failed because concurrent motion and score files changed; froze those inputs and regenerated both sides.
4. Reviewed the final standing, seated front, seated side and detail views. Added image/asset/pose hash manifests and explicit before/after camera matching. No remaining artifact within this wardrobe scope required another geometry change.

Raw before/after posed-mesh dumps are local diagnostic caches and are not published. If absent, `verify.py` regenerates them from the bundled frozen pose source before running the same mandatory comparisons and image/pose hash checks. Regeneration has been verified byte-for-byte against the reviewed poses.

The final machine evidence is `validation.json`; `verify.py` prints `CHARACTER VERIFIED` only after all invariants, deterministic rebuild, rejection controls and current paired evidence pass. Its negative controls reject an unchanged baseline and an altered inverse bind buffer.

## Visual evidence and limits

`before-seated.png` / `after-seated.png` and `before-side.png` / `after-side.png` use the same exact saved motion source, score, t = 186 seconds, studio lights and cameras. `before-rest.png` / `after-rest.png` compare the rest garment. `after-detail.png` exposes the cuff, neckline, placket and waist construction. Each image has a `.render.json` manifest binding its actual asset, pose, camera and image bytes.

The reviewed neutral views show stronger separation of blouse and trousers, more legible seams/cuffs and smoother front drape. The character still uses the original moderate-detail MPFB face and ponytail. The cloth retains some broad authored folds, and linear skinning approximates compression around the shoulder and seated waist.

These are exact-geometry offline diagnostics with approximate material lighting. They do not establish browser pixel parity, full-duration cloth collision freedom, final-room exposure, new-song hand quality, animation timing or a photoreal character. The parent owns those integrated checks. Hands and other non-garment geometry are exactly unchanged, including in the frozen posed pair.

No runtime material override is recommended. Keep the earlier baked garment clearance and do not add another normal offset. The new score or head posture does require regeneration of the existing ponytail motion table; this asset itself does not alter that trajectory.

Source model and image licensing remains the documented CC0 MPFB avatar by met4citizen / Mika Suominen. Existing license metadata and image bytes are preserved. The new geometry and materials are authored for this project.
