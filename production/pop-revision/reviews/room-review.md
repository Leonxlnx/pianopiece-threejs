# Daybreak room, piano, direction and delivery review

Read-only review of recovered GitHub checkout `/workspace/scratch/882c1c2d8c18/pianopiece-threejs`, 2026-09-06. No production files changed and no Sites, browser, rendering, deployment or audio claim. Root owns implementation. Coordinates are metres; proposed values are design starting points that require comparison images.

## Visual evidence inspected

- `public/assets/stage-poster.webp`: full landscape room; hard sunrise bars, almost black timber walls, empty left wall/floor, simple lid underside, repeated sawtooth floor gaps against the left wall.
- `public/assets/stage-portrait.webp`: same room, with very large upper window/ceiling area and low subject; repeated gaps prominent. The planter garden is sparse but already much improved compared with historical abstract stage.
- `production/revision/video-export/planning-30fps/frame-6.0.jpg`: native wide verifies poster observations against a rendered scene frame.
- `production/revision/video-export/planning-30fps/frame-64.0.jpg`: actual interior angle; attractive broad lacquer outline, coarse gold instrument cavity, parallel pin grid disconnected from string ends, round bridge silhouette and a prop that visibly reaches through the lid.
- `production/revision/video-export/planning-30fps/frame-170.0.jpg`: close face/torso with featureless flat wood panels in background, highly stretched vertical grain and hard opposing shadow boundaries. Clothing findings belong to character agent.
- `production/revision/piano-batching/interior-comparison.jpg`: preserves accepted geometry appearance after static batching; difference inset is essentially black, confirming this batching is valuable accepted work to retain.
- `public/assets/materials/walnut.png` and `limestone.png`: good usable base texture assets; walnut grain runs vertically in source. Poor apparent scale in room comes from UV/repetition/material use, not missing texture resolution.

These are saved offline renders, not new live Three.js inspection. They establish defects in the saved source snapshot, not every frame in browser playback.

## Highest-value implementation order

### 1. Fix actual floor coverage before adding detail

Location `stage.ts` lines 43–51.

The alternating row offset moves the entire first board inward without generating an extra cropped end board. Even rows cover X −7.5985 through 7.5945; odd rows cover −6.6485 through 8.5445. Left inner wall is around −7.225. Thus every odd row has about 0.5765 m of visibly missing walnut inside the wall and its last board extends beyond the room on the right. This produces the jagged floor/wall silhouette seen in both posters. Floor row geometry also extends beyond front/rear architectural boundaries.

Generate staggered courses by nominal start, including col −1, then intersect every board interval with interior bounds (X −7.225…7.225; Z roughly −6.70…5.28). Store center and clipped X/Z scale per board using one unit rounded-box geometry and the existing `instances` helper; avoid one Mesh per plank. Preserve top Y = 0.001 m (current center −0.014, depth 0.030). Narrow exposed joints from current 7 mm longitudinal / 5 mm row spacing to 1.5–2 mm. Roundover should be at most about 0.8–1 mm, otherwise each plank reads like a tile. Verify one row-edge calculation plus a wide render; no broad regression suite needed for this local floor fix.

### 2. Use directional UVs at material scale, not one texture stretched onto every object

Locations `stage.ts` lines 33–35, 51, 79, 88, 92 and 102.

One walnut map at repeat (1,1) currently serves a 1.893×0.265 m floorboard, a 10.6 m wall panel and 13.05 m ceiling batten. They cannot all have correct grain scale. Surface repeat/color is shared. Fix through separately constructed material variants and/or explicit geometry UVs, retaining the existing asset bytes.

- Floor: map grain along the long X axis, not the short Z axis. For top faces assign U from local Z and V from local X, with V proportional to metres. A useful start is one texture width across 0.30–0.45 m and one texture length per 1.8–2.0 m. Generate a small finite set of shifted UV variants (4–6 geometry batches) if per-instance UV offset is inconvenient; color variation alone does not break repeated grain. Keep near-black gaps but shrink them as above. Moderate clearcoat from .20 to .12–.16, roughness .46 to .48–.55.
- Side and entrance joinery: use separate material/UV dimensions, vertical grain along board height. Break 4.8–10.6 m sheets into 0.40–0.60 m panels with 3–5 mm reveals or vertical acoustic ribs. This changes reflected highlight rhythm and close-view depth without clutter.
- Ceiling: use long-axis UVs on 13 m battens; grain must follow each batten length, not its end face. Clone the map/material instead of altering the floor map repeat globally.
- Stone: current 1.5 repetitions spread across the 11.8 m side wall makes source pits many times larger than on piers. Use metre-consistent face UVs (roughly 0.8–1.2 m per source tile), while floor pavers retain separately scaled UVs. Leave geometric rounding restrained.

Material color currently multiplies already dark walnut albedo by warm gray plus per-instance .79–.94 color. Consider raising wall material color toward 0xc7b5a2 and reducing floor instance variation to around .88–1.0 before increasing global exposure. Judge under the new fill; do not whiten the piano.

### 3. Give the pavilion a designed inhabited edge

Locations `stage.ts` side-wall block 76–83 and entrance block 86–98.

The camera-facing room is almost entirely empty, so the same flat panel is visible behind most portraits. A small amount of coherent architectural furnishing will have greater payoff than another thousand garden leaves. Retain clear central orbit around the piano.

Recommended set:

- On one side at X about −6.45, build one low 2.6 m bench centered around Z −3.1, seat height .44, depth .52. Align its long axis with the wall. Make light wool upholstery distinct from black piano bench, with a 4–6 mm seam and a 35 mm timber rail. Short legs plus floor contact supply scale.
- Above that bench, replace continuous lining with one composed acoustic panel group: 24–36 narrow walnut fins at 35–45 mm pitch, 18–24 mm projection, height about 1.6 m. Keep the resulting edge close to the existing wall, outside all camera path bounds.
- At one end add a small limestone side ledge/table, about .38×.46×.38 m, and one ceramic vessel with two or three sparse stems. This is enough. Do not add books with fake text, framed UI-like labels, counters or redundant rows of props.
- Entrance panels can acquire a 10–15 mm shadow reveal and a shared bronze cap rather than more decorations. One functional door pull per leaf is already modeled.

Keep new opaque repeated parts instanced or merged by material. Aim for fewer than 8–12 additional main-pass submissions and about 15–25k added triangles. Those are budgets, not existing measured counts. Window garden already costs about 298k stage triangles on desktop; do not add indiscriminate density.

### 4. Lift ambient window light while retaining dawn direction

Locations `stage.ts` 211–215 and `update` 222–225; `render-settings.ts`.

The saved room is dark enough that walnut reads nearly black against a flat pale window. The face sample is readable, but background shadows are abrupt. Improve fill distribution before raising exposure (currently 1.02).

Conservative starting pass: hemisphere .56→.70; existing cool fill 62→78–85, broaden its angle .85→1.03, target around (0,1.00,.15); set key .75→.86 cone and increase penumbra .86→.94. Keep key intensity around current 108–121. Test sun around 270–350 instead of 300–400 and enlarge penumbra .73→.85 if light pools remain too harsh. These parameters require paired rendered inspection; shader shadow softness depends on actual Three.js filtering and the offline renderer is only an approximation.

Do not add unshadowed point lights near the piano just to flatten the image. New wall/ceiling light strips should cast a subtle local warm wash only if implemented with an intentional, low-cost supported light, rather than emissive strips implying illumination they do not provide.

Current real sun position (−5.5,4.8,−12) is intentionally below the roof obstruction and glazing does not cast shadows. Preserve those accepted fixes. Sky sun hotspot direction is independently hardcoded as normalize(−.63,.25,−.74); deriving it from the actual sun direction would make reflections and the outdoor light source agree.

PMREM is captured only on initialize/context recovery and environment exposure stays at that captured moment while stage energy changes afterward. Current variation is intentionally modest. Avoid a much larger dynamic light-color transformation unless environment refresh behavior is redesigned; do not recapture a 256px environment every frame.

### 5. Finish visible piano construction rather than replace the grand

Locations in `piano.ts` are baseline line numbers.

- **Prop, 177–180:** calculate prop endpoint from a chosen point on the transformed underside using `lidPivot.localToWorld`, including mesh-local offset. At existing world X=.50 the flat underside plane is about Y=1.544844, but hardcoded prop tip is Y=1.56, about 15.16 mm inside the lid plane. Add a tiny socket plate directly to the lid and stop the prop at its underside. Exact outline fit still requires a ray/visual check; the calculation is the underside plane, not an actual triangle ray.
- **String anchors, 112–137:** every visible cylinder runs from `a` to `hitch`, but its tuning pin is at `a + direction*(−.045−j*.015)`. Therefore the pin is separated from the actual modeled string by 45–75 mm. Add non-speaking string tails from each pin to `a`, derived from the same course. Add compact bearing guides where those strings enter the speaking area; keep pin positions physically inside a simple pinblock support, above the soundboard.
- **Bridges, 102–106:** these remain circular `TubeGeometry` despite historical construction recommendations. Replace each with a low flattened wooden rail following the same derived curve, e.g. 36 mm bass / 28 mm treble width and 18–24 mm rise with a 3–4 mm pale hardwood cap. Match the cap top to wire contact Y from `courses`; preserve current strings/dampers. A curve-swept rectangular section with bevels is better than another round tube. Add sparse paired bridge pins using the shared wire paths only where they will actually be visible.
- **Cast plate, 91–93:** retain outer plate but change four round cylinder braces to broad cast webs with softened edges and generous string-field gaps. Existing braces lie below string height. Do not raise them through bass strings for visibility. Add only a few connected bosses where they meet the perimeter, rather than unattached bolts.
- **Interior material, 79–87 and 177–178:** spruce source is light but underside appears uniformly brown. Use a distinct lid veneer material, lower saturation and clear directional grain; a satin wood lid underside is an original design choice, not a claimed reproduction of a real instrument. The exposed soundboard should remain visibly wood, the iron plate bronzed/dull, wound strings copper, and tuning pins nickel/dark steel. Current gold/wood value similarity makes interior read as one gold field.
- **Bench, 190–196:** an accepted hand/seat update requires bench Z translation with the performer. Parent/hand team coordinates this. After static batching, bench source parts are merged; move its construction coordinates or translate identified source ranges before batching, never a whole piano batch.

Preserve `batchStaticPiano` and all protected dynamic-key/pedal roots. Its historical verification proves 36,316 static triangles retained and 992 dynamic snapshots unchanged; mean piano submissions fell 83.2→25.8 across sampled views. Do not undo this by adding hundreds of individual hardware meshes after batching.

### 6. Re-time shots to the new composition, make responsive shot identity explicit

Locations `direction.ts` constructor and update.

The current 24-shot plan assumes bars 1–80. `atBar` uses harmony times when present, otherwise a constant-BPM fallback; a new pop score can have different section/coda times. Root should revise shots after the music author freezes bar/section structure. Prefer `Shot.kind: 'wide'|'performance'|'hands'|'portrait'|'interior'` instead of matching human-readable names with regex. Current portrait safety depends on exact `Across the strings` and words such as `touch` and `home in the light`; a title edit can silently break it.

Dedicated portrait hand and interior framing are accepted prior work. Keep them. For wide portrait images, generic pullback by up to 1.9× makes too much ceiling/window visible and leaves performer low. A prototype portrait-wide camera around (4.1,2.65,4.5), look (0,.85,−.45), FOV 43 offers a useful subject-led comparison, but is unrendered. It must be checked against the final seat and both directions of the orbit, not copied blindly to all wides.

Use the existing 672-sample room-origin/central-sightline audit after architecture or shots change; its historical result was clear with minimum origin clearance .3 m, but it does not detect hand/performer occlusion. Compare opening, revised refrain wide, portrait wide, piano-interior and face background. Poster assets must be refreshed from the final scene, not left showing old cloth/room/music.

## Runtime and deployment observations

- No Vercel log, `vercel.json`, or GitHub Actions workflow is present in this recovered snapshot. An actual GitHub deployment/check log is needed before calling any Vercel failure diagnosed.
- This is Vinext/Cloudflare Worker/Sites, not a stock Next.js output. `vite.config.ts` registers Vinext, the local Sites metadata plugin and Cloudflare Vite plugin; `worker/index.ts` is worker entry; tests load `dist/server/index.js` and call Worker `fetch`. A Vercel project auto-detecting `next` from dependencies is a plausible target mismatch only. Preserve `.openai/hosting.json` original project identity and use intended Sites workflow unless user explicitly requests platform migration.
- Build/install helpers need Linux GNU `timeout`, `flock`, `curl` and Node≥22.13. Runtime metadata fetch is already disabled with `CLOUDFLARE_CF_FETCH_ENABLED=false`; do not resurrect previous fixes unnecessarily.
- `npm test` is build plus five mostly starter utility/SSR contract tests; it says little about graphics, soundtrack or hand quality. The 20 existing lifecycle checks are focused mocked evidence. They can be rerun if scene/material readiness/disposal changes, but are not browser visual quality proof.
- Keep new textures in `pendingTextures`; initialization already gates character, piano and room materials before PMREM. New async assets must follow that contract.
- Existing scene caches unchanged paused poses. New deterministic environment motion should use absolute score time and should not defeat paused rendering. `Stage.update` already uses score time for dust and energy for lights.
- Reflector adds another scene pass, while 4× half-float MSAA and shadow maps add GPU cost. More objects may multiply passes even if main-pass count looks small. Do not add a second room reflection plane without measured benefit.
- Preserve strict GL error checks and the accepted temporary-framebuffer restore before deletion. Offline renderer uses different shading/filtering than Three.js and omits live floor reflection. Final snapshots must be fresh after room/music/rig edits.

## Significant historical blockers root must not lose

The handoff's G5 room pass belongs to the earlier revised scene, not today's edits. Current public MP3 does not match recovered physical-release score. The late v10 hand score, compact idle thumb and +.10 m seating solution were provisional/lost; source has additive fields but not those repairs. Source/current-state JSON is older than handoff. No full new film, critical audible listening, or live browser playback was certified. The unfulfilled old 12-hour minimum is not an elapsed-work credit; overnight interruption did not count.

## Markdown inventory actually read

Read completely, some in repeat smaller chunks when a combined command was truncated:

1. `AGENTS.md`
2. `handoff.md`
3. `TRANSFER.md`
4. `context/USER-PROMPTS.md`
5. `context/STATUS-AND-NEXT-STEPS.md`
6. `context/TECHNICAL-HANDOFF.md`
7. `README.md`
8. `PLAN.md`
9. `GATES.md`
10. `ITERATION-PLAN.md`
11. `ITERATION-GATES.md`
12. `production/README.md`
13. `production/revision/baseline-plan.md`
14. `production/revision/baseline-defects.md`
15. `production/revision/baseline-gates.md`
16. `production/revision/camera-review.md`
17. `production/revision/garden-refinement/README.md`
18. `production/revision/research/piano-construction.md`
19. `production/revision/research/spruce-generation-record.md`
20. `production/revision/piano-batching/README.md`
21. `production/revision/lifecycle-review/README.md`
22. `production/revision/video-export/README.md`
23. `production/revision/video-export/planning-30fps/planning-report.md`
24. `production/revision/video-export/profile-optimization/profile-report.md`
25. `production/revision/video-export/export-space-budget.md`
26. `production/revision/video-export/gl-error-guard/handoff.md`
27. `production/revision/video-export/storage-final/checkpoint-plan.md`
28. `production/revision/video-export/storage-final/space-budget.md`
29. `production/qa/evidence/camera-review.md`
30. `production/qa/evidence/camera-coverage.md`
31. `production/qa/evidence/release-review.md`
32. `production/licenses/piano.md`
33. `production/licenses/support.md`

Reviewed source: `stage.ts`, `piano.ts`, `direction.ts`, `scene.ts`, `render-settings.ts`, package/Vite/hosting metadata, build/install/env scripts, Sites metadata packaging plugin and all five repository tests. Reviewed report summaries: current-state, camera-room-audit, keyboard-geometry-audit, piano-batching verification and final lifecycle report. Hand/anatomy, composition/master, performer license/character-specific MDs and hand-specific QA MDs intentionally belong to sibling agents. `vendor/shadcn-tailwind-4.13.0.LICENSE.md` is legal boilerplate outside this production reading assignment.
