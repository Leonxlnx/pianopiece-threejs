# Daybreak — sampled motion review

**Result:** All 33 requested motion samples rendered successfully. Across the inspected frame sequences, I found no gross skinned-mesh collapse, missing finger/limb, obvious fingertip passing deeply through a key, or confirmed finger-through-finger intersection. The remaining visible issue is a somewhat mechanical, splayed right-hand chord shape near 138.05 s. This review does not establish collision-free motion between samples or full-film/browser playback quality.

## Scope and precision

The current QA bake script, five compiled Three.js modules, performer GLB and score were copied into this directory before rendering. `snapshot-sha256.json` identifies the exact snapshot. Imports resolve through a read-only link to the repository's `node_modules`; no checkout files were written.

Actual skinned mesh vertices were baked at each sample. Rendering used the copied Cycles script at **960×540, 4 samples**, with denoising. All MP4s use **15 fps** and contain the rendered stills without audio. I inspected every frame in labeled contact grids, plus full-resolution frames at the travel/chord/crossing moments. The MP4 encoding was validated separately; I am not claiming interactive video playback inspection.

Each sequence samples `start + n/15` seconds. The final frame is the first sample at or after the requested end, ensuring complete interval coverage. Timestamps are retained to 12 decimal places in metadata; strip labels show six decimals.

| Clip | Requested time span | Actual samples | Frames | Camera override |
| --- | --- | --- | ---: | --- |
| Left jump | 53.95–54.85 s | 53.950000–54.883333 s | 15 | Shot 11, Left hand |
| Hover to chord | 137.72–138.30 s | 137.720000–138.320000 s | 10 | Shot 14, Reprise · hands |
| Hand crossing | 195.40–195.85 s | 195.400000–195.866667 s | 8 | Shot 18, The lift |

These are the requested **fixed midpoint camera overrides**, not the automatic film cameras that would be selected at those animation times. End extensions are respectively 33.333, 20.000 and 16.667 ms. The interval between frames is 66.667 ms.

## Findings by sequence

### Left jump

The left hand visibly moves through intermediate positions before settling into the new register. Wrist, forearm and finger geometry stay connected and retain their forms in the 15 reviewed frames. The target hand remains inside the camera frame throughout.

The fastest sampled segment is **54.483333 → 54.550000 s**: the left wrist moves approximately **99.1 mm**, and the largest fingertip displacement is **142.6 mm**. This is a quick musical leap and it covers substantial screen distance at 15 fps. The samples show travel across consecutive positions; they cannot prove the absence of an abrupt change between those positions. No additional rig correction is justified solely by the displacement value.

At **54.550000** and **54.883333 s**, the hand retains an arched shape over the keys. A sharply bent wrist contour and high inactive fingers remain somewhat stylized, but there is no visible collapse or gross contact defect.

### Hover to chord

The right hand changes register and settles into the thumb/middle/pinky chord. Active contact does not visibly detach or bury the fingertips deeply in the keytops in the reviewed frames.

At **138.053333 s**, the right hand has the least natural-looking shape in this review: the inactive index and ring fingers are held noticeably above the active fingers, and the thumb region forms a sharp raised silhouette. The palm/wrist also turns inward. This resembles a constrained chord shape more than a relaxed pianist's hand. It is a **pose-polish concern**, not confirmed mesh collapse or penetration. The unusual shape remains through **138.320000 s**.

The metadata projects the index and ring endpoints above the active middle/pinky endpoints in this view, supporting the finger identification; no finger-through-finger crossing can be confirmed from this angle.

### Hand crossing

Both hands remain separate and legible in all eight samples. The wrist and fingers reconfigure while the left hand changes position late in the window. No obvious mesh inversion or finger-through-finger intersection is apparent, including the full-resolution view at **195.600000 s**.

The largest sampled left-wrist movement is **81.9 mm from 195.733333 → 195.800000 s**. As with the left jump, this is useful for finding the fastest passage, not evidence of a discontinuity by itself. Some fingertip silhouettes overlap with black keys and reflections, so small intersections cannot be ruled out visually.

## Contact evidence and limits

The 33 exported samples contain **95 active contact records**. The largest exported fingertip-marker target error is approximately **0.000265 mm**. This measures the solver's marker-to-target error; it does **not** independently measure the deformed skin surface against the key. The supplied broader skin-contact audit was not rerun here.

The shorter visible keyboard and downward key movement are consistent with the revised geometry in these renders. Pale skin and the reflective fallboard make sub-millimetre gaps impossible to judge reliably at 960 px. Fallboard hand images are reflections, not duplicate geometry.

Four-sample denoising, approximate offline lighting, and reconstructed material normals can soften finger contours. The clips are silent QA artifacts, not a substitute for the real-time film. This sample set does not review audio synchronization, automatic camera cuts, UI overlays, portrait framing, frame-rate stability, or unsampled portions of the performance.

## Outputs

- `left-jump/left-jump.mp4` and `left-jump/contact-strip.png`
- `hover-to-chord/hover-to-chord.mp4` and `hover-to-chord/contact-strip.png`
- `hand-crossing/hand-crossing.mp4` and `hand-crossing/contact-strip.png`
- `motion-manifest.json`: exact sample times, render settings and file paths
- `sample-motion-metrics.json`: sampled wrist/fingertip displacements and marker errors
- Per-frame `frame-NNNN.png` and `frame-NNNN.metadata.json`
- `snapshot-sha256.json`: frozen implementation/asset hashes

All 33 PNGs and metadata files are retained. Bulky raw geometry JSON was removed only after successful rendering and metadata capture. The frozen scripts and assets can reproduce each frame.
