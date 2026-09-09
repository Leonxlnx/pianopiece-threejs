# Combined climax candidate — parent review pending

The three fixed thumb curves are composed onto bass_contact's exact `supported.ts`. The LH departure endpoints were re-extracted against its +5 mm planned-wrist arch. Both incoming endpoint pairs remained bit-exact. No parameter search or additional score changes occurred.

Use `candidate.ts` / `candidate.mjs` with `input.json`. The complete source is native-renderable; `continuity-helper.ts` and `source-vs-supported.patch` isolate this leaf's changes. `source-vs-original.patch` and `score-deltas-vs-original.json` record the complete difference from the accepted44ef/2599ff6 baseline, including inherited physical releases. `delta.json` contains exact hashes, endpoint provenance, motion, and both comparison summaries.

## Motion and contact

1349 times /2698 hand states over153.402546–164.072413 seconds cover the supplied full-gap grid plus500 Hz samples and ±1 microsecond boundary samples around all three thumb intervals. Motion is measured at2 kHz over158.9–159.9 with sign-normalized quaternions.

| Thumb interval | MCP before→after | PIP before→after | DIP before→after |
|---|---:|---:|---:|
| LH159.08–159.13 |100.150148→31.045594|125.159912→31.492837|43.805969→11.022493|
| RH159.10–159.15 |119.046187→29.940929|153.938599→34.730022|53.878510→12.155508|
| LH159.42–159.47 |118.605992→30.707490|151.867676→31.780190|53.153687→11.123066|

Values are rad/s, comparing supported input to combined. Exact extrema times and original baseline motion are preserved in `delta.json`. The remaining local LH thumb maximum is MCP37.749010 / PIP50.106811 at159.0075 during p717 release; no curve changes that held note. RH tip maximum remains1.277057 m/s; LH tip maximum rises1.462636→1.510484 m/s at159.4415. All nonthumb and wrist speeds remain exact to supported input.

All397 held chord samples preserve contact, with worst target error0.000169847 mm. There are no held contact-gap changes or target errors above0.15 mm. At159.3 both hands have zero active-finger key cores and zero pair crossings; LH retains small inactive Ring/Palm core contacts up to2.682124 mm. At159.5 both hands have zero key cores and zero pair crossings. These complete hand poses are exact to supported input.

The independent world-pose audit checks366928 finite numeric values, zero nonfinite. All2551 hand states outside the corresponding thumb intervals are exact to supported input; all wrist matrices and nonthumb joints/points are exact. Native compiled snapshot and scratch module match exactly for2698 hand states. See `pose-check-summary.json`.

## Residuals against supported input

Every per-key depth/count increase is retained with a1e−6 mm tolerance; no patch maximum masks a neighboring key.

- No new or increased triangle-pair rows. The prior two join-pair increases disappear with the re-extracted supported departure endpoints.
- Seven new RThumb/G4 (MIDI67) core samples, maximum2.200773 mm at159.136879333.
- One newly present LPalm/E3 (MIDI52) sample,1.707291 mm at159.126.
- Existing LPalm/E3 peak3.491061→3.510662 mm at159.094. The largest same-key increment is1.492703→1.708209 mm at159.125.
- One tiny existing LPalm/F3 (MIDI53) increase3.021800→3.022175 mm at159.082.
- Total44 increased key-depth/count rows;27 have increased depth above3 mm. These are existing palm contacts, and are explicitly retained in `vs-supported-details.json.gz`. Five key rows improve.

## Complete comparison against original44ef

The whole supported-plus-thumb proposal is still a local improvement with unresolved approach contacts:75 increased core rows above3 mm;148 triangle-pair increase rows, including62 newly crossing rows.912 key rows and716 pair rows improve. All exact rows, contact changes, active-note IDs, triangles, and vertices remain in `vs-original-details.json.gz`; summary lists each patch/key and pair.

The largest inherited pair increases are RH Index/Middle101 new triangle pairs at159.025 and RH Ring/Pinky40→131 at159.036879333. The largest increased key depth is existing RH Pinky/A5 5.819299→5.844743 mm at159.820212667. These findings are not removed by the thumb helper and prevent an unqualified claim that the entire phrase is collision-free.

Outside158.5–160.5, the combined original-baseline comparison differs only by numerical noise: maximum joint angle5.12e−16 rad and joint/tip position5.59e−7 mm (`outside-original-summary.json`). The meaningful inherited LH approach changes begin158.774836; RH approach changes are inside the broader local context. No claim of bit-exact original context is made where this numerical noise exists.

## Native review and reproducibility

`review.html` displays ten chronological native frames covering the three peaks, held159.3, wrist departure159.4125, and clean159.5. All ten images were viewed. The thumb curves retain the supported silhouette without adding high idle poses. Existing approach intersections remain visible/quantified and are not cleared by these stills. Native snapshot0719b3ea9426d2eb, all frames GL_NO_ERROR.

`render.sh` uses the immutable candidate and shared renderer without editing it. `extract.mjs` / `build.py` / `compile.mjs` reproduce the fixed composition. `audit.mjs` selects runtime/score/cache through DAYBREAK_RIG_MODULE, DAYBREAK_SCORE, DAYBREAK_CACHE; its three exact calls are recorded in `reproduce.sh`. `compare-all.py` compares supported and original independently. `finalize.py` packages exact source/score deltas and native evidence.

No app, Site, Git, shared renderer, or dependency installation edits were made by this leaf. Parent review remains required before integration.
