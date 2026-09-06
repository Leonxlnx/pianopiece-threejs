# Independent integration review — Daybreak pop revision

Read-only review, 2026-09-06. Root owns all checkout changes. This report reviews snapshots of root's working stage.ts, piano.ts, direction.ts and current public score; these are copied into current/*.mjs only for independent inspection. Root's source may continue changing afterward. No browser, Sites, or checkout mutations were used. No final visual or critical-listening claim.

## Fix before acceptance

1. **Camera audit lost most of its geometry coverage after architecture batching.** `Stage.batchArchitecture()` removes named source meshes and replaces them with `Architecture · <material>`. `production/qa/audit-camera-room.mjs` selects obstacles only by `/wall|pier|lintel|door|ceiling|beam|lining|panel|reveal/i` on the mesh name. In the current source that selection falls from 83 real architectural parts to only three meshes. Limestone walls, limestone entrance, timber beams, doors and shadow reveals largely disappear from the test. Preserve source identities / explicit architectural metadata in batches and select using that data, then assert expected architectural categories are present. Do not accept the old script's apparent pass unchanged.

2. **The corrected lid prop is still 5 mm inside the veneer.** `GrandPiano.constructor`, `lidInside`/`propSeat`: `slab` extrudes with bevelThickness .006 and the underside mesh has local Y -.006, so its actual lowest surface is local Y -.012. The chosen point at -.007 is inside that surface. Actual mesh ray enters the veneer at world [0.488514110,1.532804998,-0.789911899], while the rod ends at [0.487967597,1.538074108,-0.790000000]. That is 5.298 mm farther along the rod, corresponding to 5 mm penetration normal to the lid. Derive the target from `lidInside.geometry.boundingBox.min.y + lidInside.position.y`, allow the existing prop radius to meet a compact socket, and verify the actual triangle plane. This is already substantially better than the old ~15 mm error, but it is not fully fixed.

3. **The new lamp underside emitter faces upward.** `Stage.constructor`, `lampInner`: CircleGeometry's front normal is +Z, and rotation.x=-PI/2 turns it to +Y. The default FrontSide material makes the disk disappear when seen from below. Use +PI/2 for a downward-facing underside disk. This does not make the basic material illuminate surrounding geometry; avoid claiming a new real light source.

## Positive independent measurements

Metrics are in `metrics.json`; `review.cjs` snapshots/transpiles only the four modules used here and `metrics.mjs` performs the geometry/camera checks. All outputs are outside the repository.

| Measure | Baseline | Current |
| --- | ---: | ---: |
| Stage geometric triangles including instances | 298,124 | 321,912 |
| Stage Mesh/InstancedMesh objects | 89 | 33 |
| Current scene if static architecture is left unbatched | — | 166 |
| Current camera samples against unbatched architectural geometry | — | 672 |
| Central architectural / furnishing sightline obstructions | — | 0 / 0 |
| Minimum origin clearance to room bounds | — | 0.30 m |

The triangle increase is 23,788 (+8.0%), within the suggested 15–25k added-detail range. Mesh object count is a structural submission estimate before frustum culling, shadow/reflector passes and material groups, not measured browser FPS. The new opaque architecture retains exactly the same triangle count with batching enabled or disabled.

For the independent camera check, I disabled only the new batching method in the external transpiled snapshot so the real current source parts could be tested. I then tested 24 shots × seven positions × four aspect ratios (16:9, 1:1, 9:16 and .45). No old scene geometry was substituted. New chairs, table, lamp and vase were separately included as sightline obstacles. This repairs the evidence gap for the inspected snapshot, but the repository audit itself still needs repair.

The camera plan is contiguous and uses actual harmony/bar times. Chorus wides start at 70 and 140 s, bridge portrait at 160 s, final chorus wide at 180 s, and coda coverage starts at 210 s and runs to the full 227.101587 s. 'The highest note' spans 190–195 s and includes both actual C6 attacks at 190.491896 and 190.963560 s. Explicit `Shot.kind` correctly protects responsive hand and interior shots from title changes.

Floor top remains Y .001 m; each generated row is clipped to X ±7.23 m and adjacent horizontal joints are 1.6 mm. Current covered Z is approximately -7.0002…5.4782 m, so end courses extend beneath the rear/front wall footprints. That overlap is concealed and is not the old exposed left-wall gap. Swapping plank UV axes places the source's vertical wood grain along the plank's long X axis. Four shifted map variants break identical repeated grain. Cropped end boards still scale their grain with their shortened instance width; minor, mostly concealed and not a blocker.

Current limestone block UVs scale in metres, avoiding the old wall-versus-pier texture-size mismatch. Instanced outdoor pavers retain their separate old per-primitive scale. Current stone blocks are not rotated/nested, so the local-position UV projection is correct for these actual uses.

## Finish integration details

- Refresh `public/assets/stage-poster.webp` and `stage-portrait.webp` from the final integrated clothing/room/camera. They are visible while loading and whenever graphics are unavailable, and the landscape file is also the social share image.
- `Performance.tsx` uses `score.duration` for transport and timecode, so 227.101587 s integrates directly. Change its historical 233.144228 fallback for consistency. The main music load path is still `/assets/daybreak.mp3`; replace that exact asset only after physical release/fingering decisions are final, with a manifest connecting the final score and master. `audio.ts` derives actual playback end from decoded buffer duration: verify its final decoded duration remains aligned to score rather than merely checking an MP3 container label.
- Update `public/assets/credits.txt` after garment integration: it still says graphite materials. Keep actual Salamander source/license attribution and original-composition wording.
- Existing `Direction.update` only freezes the main desktop camera position when reduced motion is requested; FOV and the dedicated portrait camera coordinates still use evolving `t`. This is inherited, not caused by root's shot retiming. A single effective motion fraction (`reduce ? .35 : smooth(...)`) shared by position/look/FOV/portrait branches would make the stated reduced-motion behavior consistent. Cuts can remain.
- `Stage.batchArchitecture` currently groups only by material and forces receiveShadow=true / castShadow=any. For these current pieces, the only clear changed cast flag is the lamp disk merged with shadow-casting glow blocks, but preserving castShadow, receiveShadow, renderOrder and layer flags in the grouping key matches the safer already-established `batchStaticPiano` implementation. Preserve relative-to-group transforms if the helper is made reusable; its current world-coordinate baking is correct because Stage.group is identity and never moved.
- The untouched long ceiling battens still share the generic 1×1 walnut map. A dedicated long-axis timber material/UV treatment is a useful later visual refinement, but lower priority than the camera-audit and prop fixes.
- Room props stay well outside the current performance orbit. No need to add more decorative clutter to satisfy detail: careful material scale, the tailored performer, real hardware connections and the existing new acoustic/furniture rhythm produce the useful detail.

## Scope and limitations

Reviewed `work/room-review/REVIEW.md` in full, relevant room/piano/delivery handoff conclusions, full current stage/piano/direction/audio/Performance/scene source, actual score times, current credits and metadata, and the old camera audit. Root's broader handoff review and the other agents own full inherited context, hand surfaces, garments and music. This is not a replacement for their evidence.

The controlled geometry checks do not prove hand/performer occlusion, garment aesthetics, piano shading, poster composition, live mobile performance, WebAudio behavior in a real browser, critical music listening, or publication. Those remain root's integrated validation responsibilities or explicitly disclosed environment limitations.
