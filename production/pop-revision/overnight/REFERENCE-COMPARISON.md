# Daybreak photo comparison — 2026-09-07

Prepared for root review of leaf-1.1:G1. This is reference research and design guidance; no Site source was changed. The project remains an original adult performer and original piano in its existing timber/limestone pavilion.

## Evidence boundary

The decisive comparison frames are fresh renders of the current recovered branch, supplied by root:

| Frame | Absolute local path | What was inspected |
|---|---|---|
| 0 s | `/workspace/scratch/882c1c2d8c18/pianopiece-threejs/work/night/baseline/gl-1280-0.jpg` | Wide room, garment back, lid underside, floor and window lighting |
| 53 s | `/workspace/scratch/882c1c2d8c18/pianopiece-threejs/work/night/baseline/gl-1280-1.jpg` | Piano belly, cast plate, strings, lacquer and blouse silhouette |
| 170 s | `/workspace/scratch/882c1c2d8c18/pianopiece-threejs/work/night/baseline/gl-1280-2.jpg` | Both wrists/hands, short sleeves, trousers, keyboard and damper bank |

These 1280×720 frames use the existing independent EGL renderer. Its environment filtering and shadow implementation differ from Three.js. They are strong geometry evidence and useful directional material evidence; they are not proof of browser appearance, motion continuity, or whole-song clearance. `manifest.json` records the exact image and read-source SHA-256 values. HEAD when this research started was `66253da40dbf9090036b52c92b560918fb0e0b51`.

Historical `production/pop-revision/visual-review/portrait-hands-2.jpg`, `character/after-detail.png`, and isolated `joint-transport/v7/pose-{00,02}.jpg` were also inspected. They help expose failure modes but do not supersede these fresh frames. The floorboard edge-coverage repair, raised bridges, per-wire pins, damper bank, furniture and arm improvements are already implemented: do not redo them from an older handoff.

## Inspected photo set

All files below were downloaded and their actual pixels inspected, not just search descriptions. Exact image URLs, dimensions and hashes are in `manifest.json`.

| Local photo beneath `/workspace/scratch/882c1c2d8c18/reference-research/photos/` | Source and provenance | Useful visible evidence |
|---|---|---|
| `hisasue-hands.jpg` | [Wataru Hisasue official media page](https://www.wataruhisasue.com/media) | Side/oblique adult pianist hands: continuous wrist volume, asymmetric knuckle chain, separate finger arches, narrow tendon highlights, short nails, small fingertip shadows. |
| `shelly-hands-overhead.jpg` | [Shelly Sings artist booking profile](https://www.alivenetwork.com/bandpage.asp?bandname=Shelly+Sings) | Overhead adult pianist hands: broad chord span can coexist with coherent palm volume; thumb webbing is a curved volume, and finger roots do not become one flat sheet. |
| `maxmara-ivory-cuff.jpg` | [Max Mara silk crêpe de Chine shirt](https://us.maxmara.com/p-1111016806005-mxpvoliera-ivory) | Thin doubled edges, small overlap shadows, seam stitching, fabric-covered buttons, shallow directional weave and cream/cool-white shading. |
| `maxmara-ivory-front.jpg` | Same manufacturer page | Large quiet cloth areas plus localized elbow/hem folds; cloth hangs from shoulder and placket rather than uniformly tracing the body. This is a different long-sleeve cut, used for fabric behavior only. |
| `bachmann-room-01.jpg` | [Lorenz Bachmann Music Pavilion, Winterthur](https://lorenzbachmann.com/projects/music-pavilion-winterthur), photography Lukas Murer | Real piano pavilion: bright window bounce, satin timber, readable joints, black lacquer containing recognizable room reflections and a dark lid underside. |
| `barrie-timber-hall.jpg` | [Andrew Barrie Lab work gallery](https://www.andrewbarrielab.com/work) | Timber performance interior: visible broad grain scale, deep beam/panel joints, directional daylight while shaded timber remains readable. Exact project mapping within the gallery was not established, so no project title is asserted. |
| `ssg-limestone-interior.jpg` | [SSG Jura Limestone Prestige](https://ssg-solnhofen.de/en/products/maxberg-jura-limestone/maxberg-jura-limestone-prestige), Fürst & Friedrich, Düsseldorf, honed C60 | Pale honed stone retains low-frequency mineral variation and tight panel seams; strong relief is an installation design choice, not necessary for our pavilion. |
| `steinway-b211-interior.jpg` | [Juhl Sørensen B-211 listing](https://piano.dk/steinway-sons-b-211-flygel-5/) | Real piano belly: broad cast webs, rounded holes/bosses, satin bronze coating, silvery pins, copper/steel separation, red under-string felt and wood beneath. Listing-page fetch failed; the search-provenanced 1920×2560 product photo itself downloaded and was inspected. |

Auxiliary inspected photographs: `fuller-hands-overhead.jpg` from [Larry Fuller event listing](https://thejerseysound.com/events/larry-fuller-trio-march-10-cunningham-piano-company) demonstrates a more compact hand span; its image filename credits Marzena Manganaro. `bachmann-room-05.jpg` and `bachmann-room-09.jpg` show the pavilion garden/glazing and are secondary only.

No third-party photo has been approved as a runtime texture or redistribution asset. Keep source links and authored findings; use the images locally for inspection. Two attempted short-sleeve garment downloads returned 403 and are not counted as inspected. The synthetic-looking koala.sh and generic Rawpixel results were excluded rather than treated as real anatomy/architecture.

## Prioritized implementation recommendations

The numerical values below are A/B starting points for this scene, not measurements of the photos or universal human/material limits.

### P0 — Preserve wrist and thumb-root volume before increasing skin detail

Fresh 170 s shows a narrow shelf where the left wrist meets the palm. The right thumb base has a bright triangular pinch; the hand reads as joined surfaces rather than one continuous volume. The historical V7 closeups retain a particularly sharp patch at that thumb root. Hisasue's side photo and Shelly's overhead photo show a rounded transition and a curved first web space even with fingers spread.

First inspect skinning through the forearm→hand boundary and thumb metacarpal root at the actual troublesome poses. Review an untextured clay pass to separate deformation from normal-map/color seams. Keep the original adult hand anatomy and note-contact targets. Correct excessive twist or badly concentrated weights locally; verify the actual mesh throughout the transition. Do not flatten the wrist globally or force every digit into the same textbook arch: the three real pianist photos show substantially different valid-looking spans.

After that, the existing hand can benefit from restrained knuckle/tendon shading and softer nail-bed transitions. Surface detail must follow the original UVs/anatomy. A still photo does not establish that a given finger is rising rather than arriving, nor supply a motion trajectory; the animation agent's dense geometric checks remain necessary.

### P1 — Build the visible cast plate as a connected structure

Fresh 53 s shows a broad flat gold/wood field with thin isolated bars. `piano.ts` confirms a perimeter ring plus four narrow cylindrical braces. The B-211 photo shows large, connected cast webs and rounded transitions above a distinct wooden soundboard. This is a much larger visual gap than adding more string windings.

Replace the four rod-like braces with a small number of tapered cast webs, approximately 35–65 mm wide with 5–9 mm edge rounding as initial proportions, joined to the perimeter/front plate. Add a few 22–40 mm circular openings and raised fixing bosses where solid plate exists. Preserve open string fields and keep explicit string/plate clearance: the bass courses sit above the treble bank, so simply extruding every new rib across both planes will cause a new defect. Keep the existing shared course layout and stationary batching.

Use the B-211 as construction evidence, not a model-specific blueprint or branding request. [Steinway's own Model D specification](https://www.steinway.com/pianos/steinway/grand/model-d) confirms a bronzed/lacquered iron plate, copper-wound bass, steel treble, spruce soundboard and solid brass pedals. The existing `gold` roughness .43 is a reasonable starting point; a glossy yellow-metal change alone cannot reproduce the photo.

### P1 — Separate lid veneer from soundboard material

Fresh 0 s has a nearly uniform orange-brown lid underside. Source uses the same spruce material for soundboard, bridges and lid lining. That shared assignment prevents independent control of the largest warm surface in the frame.

Create a separate lid-lining material/UV mapping using the existing wood assets: test muted dark amber/walnut with roughness .38–.46 and subtle clearcoat .12–.22. Orient grain along the lid length and preserve a small dark perimeter reveal. Keep the soundboard lighter and less saturated. The reference pavilion's dark lid underside offers the right large-scale tonal relationship, while the exact finish remains our original design. Recheck the existing prop seat after any thickness or geometry change.

### P1 — Lift shadow information and preserve the dawn composition

Fresh 0 s has very dark wall walnut, a bright ivory garment and hard rectangular floor patches. Bachmann's pavilion and the timber hall show much more material information inside shadowed architecture. Their exposure/time of day differ, so copying photo pixel colors would be misleading.

Try an isolated lighting candidate with hemisphere intensity .76→.95, fill 80→92, key animation range 108–121→88–100, and sun animation range 300–400→240–320. Hold exposure 1.02 initially so ivory highlights do not merely clip harder. Compare 0/53/170 s and the finale before deciding. Keep the directional sun/shadow composition; do not fill everything equally.

The piano still needs broad reflected architecture: current lacquer is predominantly black with thin white edges. Source already captures the actual room into an environment map, so inspect that capture and the new room balance before adding arbitrary extra lights or a generic HDR environment. If needed, test environment intensity .78→.90 as a separate candidate. Native EGL uses a different roughness atlas from Three.js PMREM; exact reflection sharpness requires a browser comparison when available.

### P2 — Make the blouse read as a thin woven garment

The ivory palette already improves separation from the piano and trousers. Fresh 53/170 s still shows smooth broad inflated forms near the chest/upper sleeve. The accepted design has short sleeves; the Max Mara long sleeve is a seam/material reference, not a reason to change the outfit cut.

Existing cuff construction is already only .7–1.35 mm raised and has real thread dashes. Do not claim missing cuffs or solve perceived thickness by blindly reducing them. Inspect surface normals and cuff/armhole volume first. Add a few narrow, shallow directional compression folds beneath the raised armhole, and small hanging folds that terminate at seams, rather than uniform sinusoidal wrinkles. Initial added displacement should stay around .7–1.5 mm and fade before the skin boundary, with paired checks in the most bent poses.

The existing pearl buttons are 5.4 mm across and the placket is 12 mm wide. An optional 7–8 mm button candidate could improve closeup readability, but the more useful change is a thin overlap shadow along the placket, backed by actual small geometry. Fabric microstructure should remain subtle enough to disappear at wide framing. Avoid coarse noise or shiny satin highlights; the manufacturer reference is fine crepe, not a thick knit.

### P2 — Give the stone and joinery finite panel scale

Fresh 0 s shows large uninterrupted neutral wall planes and very broad dark joinery sheets. The SSG photo provides panel-scale mineral variation and tight seams; Andrew Barrie's hall makes construction joins visually explicit.

Retain the continuous architectural shell for camera obstruction and add restrained finish panels or seams. Try stone courses around .55–.75 m high, 1–2 mm joints and only ±3–4% panel tint variation. Keep the existing matte roughness near .81. Do not copy the SSG installation's strongly projecting stone pattern: that would change the design and compete with the player. Joinery can gain narrow 3–4 mm vertical reveals without increasing clutter. Check the existing UV density before authoring a new material; current texture files themselves are serviceable.

### P3 — Quiet the dust and distant garden

Fresh 0 s has visible points across dark wall areas where the photos read as clean air. Test dust alpha from `.10 + .12 * variation` to `.025 + .045 * variation`, preferably concentrated where the sun crosses the room. Keep this separate from the lighting test.

The garden is a very even dark horizon with repeated sparse trunks. If the near subject is already improved, add a few broad, low overlapping shrub masses beyond the glazing and vary existing tree depth/height. Use Bachmann's exterior only to guide layering and reflection density; no need to import a new landscape or fill every window with foliage.

## Repeatable review order

For each accepted root iteration: keep camera/time/output dimensions fixed; compare current and candidate 0/53/170 s beside the relevant real photo; list the largest remaining silhouette/lighting/material mismatch; reject any candidate that improves a still but introduces temporal geometry failures. Use an additional side/top hand closeup during the known release windows for hand changes. Do not assign an unsupported percentage of realism or call the whole piece verified from three frames.

## Four-pass self-review

1. Complete research: real-source hand, cloth, architecture, stone and piano photos downloaded and pixels inspected; current-source baseline compared.
2. Expert reread: preserved valid broad hand spans, accepted short-sleeve garment, current floor/bridge/damper repairs; distinguished crepe behavior from a different garment cut.
3. Evidence defect hunt: separated current branch frames from old V7 candidates, acknowledged independent-renderer differences, rejected failed/synthetic references, removed unsupported physical measurements and motion inferences.
4. Polish: prioritized geometric silhouette and material separation before microdetail; supplied bounded A/B values and exact evidence paths/hashes. No further issue found in this research pass. Root manual review remains the acceptance gate.
