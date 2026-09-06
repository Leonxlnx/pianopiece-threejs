# Daybreak — production plan

Visual thesis: a pianist and a black concert grand on a circular reflective stage, surrounded by tall warm architectural lights and dawn haze. Quiet silver-blue opening unfolds to luminous peach and gold. Camera behaves like a performance film. All substance is real-time 3D; no marketing page.

## Contracts and ownership
The Site owner alone edits /workspace/sites/daybreak-performance and performs Sites lifecycle and browser tasks. Asset agents work only in /workspace/scratch/daybreak-assets/<assigned-domain>, do not invoke Sites or spawn agents. Root integrates verified assets.

Music asset: score.json schema title, bpm, duration, sections[{name,start,end,energy}], notes[{id,time,duration,midi,velocity,hand:'L'|'R',finger:1..5}], pedals[{time,value}], accents[{time,energy}], optional accompaniment. Seconds authoritative, key duration distinct from pedal acoustical release. Lowest note MIDI21, highest108. At most 5 simultaneous notes per hand and physically sensible voicing. Fingering thumb1, little5. No random score generation.
Audio assets: legally reusable rich sampled acoustic piano, local downloadable bytes, primary license provenance; efficient representative pitch/velocity coverage suitable for web. No copyrighted compositions.
Character asset: coherent human seated-capable rig, named fingers if available, redistributable license. Research/asset retrieval only.

## Tree
- Music: composition / samples / transport / sound mix / full playback QA.
- Performance: grand piano / human asset / posture / arm & finger IK / contacts / pedal.
- Direction: stage / lighting / camera / effects / interface / mobile.
- Integration: time source / scrubbing / section transitions / deployed verification.

## Verification
Asset gates independently checked by each leaf and rechecked by root. Root integration gates in GATES.md. Keep measurable runtime, note and asset diagnostics. Manual visual and listening claims require actual observed evidence; inability must be explicit.

## Status log
- 2026-09-05T01:39:34.912205+00:00 Started production, setup and asset contracts.
- 2026-09-05: Initial score/master and scene checkpoint pushed to main. Offline Cycles renders exposed idle finger curling; contact solver corrected for arm reach and currently passes sampled contacts. Camera/pose image refinements continue. Cloud browser WebGL is disabled and preview routing is being replaced by concurrent builds, so live visual QA remains blocked.
- 2026-09-05T03:36Z: Completed deterministic wrist/finger trajectories, full-frame finger rotation, actual key surface/footprint checks and per-note skin-pad calibration. Corrected keyboard visible depth and downward hinge sign, authored pedal-preserved physical releases, rerendered/revalidated master. Three motion clips and11 section frames reviewed. Transport race/accessibility/lifecycle fixes pass targeted checks. Loading/unsupported-graphics posters added. Public delivery preparation underway; browser/listening and six-hour gates remain explicitly incomplete.

- 2026-09-05T03:56:38.552031+00:00: First public deployment succeeded. Unauthenticated root and seven core assets return200; asset hashes match the local master/score/model/posters/credits. Follow-up release review reproduced and fixed keyboard autorepeat/modifier handling, early-context-restoration double loops, removable load-error recovery and non-mesh/shadow disposal. Targeted regressions pass. Shared preview remains another project with WebGL2 unavailable.

- 2026-09-05T04:08Z: Full held-skin sweep extends contact evidence beyond midpoint samples; no clearance violation found. Fixed same-key anticipation overriding a held note, smoothed all visual pedal events without changing their scored positions, and aligned coda camera cuts with bars89/92. Expanded24-shot coverage exposed shoulder occlusion in shot02; moved that camera above and toward the keyboard. Camera inspection continues before the next public update.

- 2026-09-05T04:23:13.546652+00:00: Both corrected hand cameras pass25/75/98% framing; all62 coverage renders inspected. Added velocity-dependent17–48ms keytravel and subtle chord-weight elbow motion with fixed constrained wrist poses; final temporal recheck passes. Direct audio-content probe explicitly reports audio input unsupported. Final public update preparation; listening, live browser playback and six-hour gate still incomplete.

- 2026-09-05T04:28:51.765344+00:00: Publicv3 succeeded. All17 public routes pass unauthenticated delivery; complete MP3/GLB/score/style/script bytes match; page dependencies match. Acceptance ledger remains5/9: actual listening, live browser controls/sync and full playthroughs remain blocked, and the requested six-hour minimum is unmet.
