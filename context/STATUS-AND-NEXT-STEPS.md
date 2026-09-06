# Status and continuation decisions

This is a reconstruction from the retained project conversation and the recovered Git snapshot, not a claim that scratch-only artifacts survived. The application source remains at the accepted 4079210 checkpoint. Later experiments below are **provisional** unless explicitly identified as integrated.

## Work already done

- Original Daybreak: a 3:49 piano-led cinematic piece, sampled Yamaha grand, visible clothed adult 3D performer, note-driven keys/hands/pedal, camera choreography, minimal transport controls, public release.
- Original video delivery: full desktop rendered adaptation at 1080p/24 fps, 5,497 frames, original music, and a 29-second social cut. Frame-order, decode and audio alignment checks passed. These were rendered exports, not browser screen recordings.
- Major revision: new original solo piano score, 80 bars, 1,068 notes, 233.144228 seconds. More lyrical melody, countervoice, voiced chords, expressive dynamics, sustain and section development. The reference to Yiruma is an aspiration for quality, not permission to copy that piece.
- Performer revision: refined face with curved features and 11 morphs, eyes with clearcoat, graphite blouse with tailored cuffs/neck/hem/placket/six buttons, folded and seamed trousers, improved shoes/pedal geometry, garment clearance. No cloth simulation. Adult fictional character, existing skeleton/bind preserved.
- Body revision: beat/phrase-weighted posture, restrained spine/chest/head/shoulder motion, anchored hips/feet, phrase-following gaze and subtle ponytail lag. A previous 13 mm boundary jump was reduced to approximately 0.000229 mm across ±1 microsecond at 8,704 note boundaries.
- Environment: 15×13 m recital pavilion, timber/limestone/walnut, slatted ceiling, acoustic walls, enclosed entrance, glazing, layered garden, trees/shrubs/grass/stones, refined sun/shadows/room reflections. More believable piano strings/bridges/hardware and 67 dampers.
- Piano batching: 99 static opaque objects merged into 15 batches with geometry preserved. Main-pass submissions in the audited views fell from 83.2 to 25.8; this is a structural count, NOT a browser FPS measurement. Dynamic keys/pedals and audit geometry preserved.
- Camera: 24 phrase-aligned shots, dedicated portrait composition, 144 desktop/portrait stills reviewed, 672 room-framing checks across four ratios. Fixed portrait hand view 6 and previous occluded closeups. New seat position will require targeted rechecks.
- Runtime: audio-output timestamp/latency compensated playback clock already exists. Corrected composer buffer handling, antialiasing, context recovery, asset disposal and paused rendering cost. Twenty mocked lifecycle checks passed. Old public files used revalidating cache headers; do not invent a stale-cache bug without new evidence.
- Offline export: real scene/skin/note/camera timeline pipeline, software EGL renderer, immutable jobs, chunk resume, priority climax rendering, strict GL error guards, direct MP4 assembly to reduce disk needs. Multiple focused exact-frame/decode/guard/scheduler tests passed; full new film not rendered.

## The principal remaining problem

The fingers can still look wrong despite excellent calculated fingertip contact. Actual mesh intersection checks found folded thumbs, thumb-web sheets, inactive fingers inside keys, same-hand fingers intersecting each other/palms, and exaggerated wrist deviation. These are real unresolved defects. Never close the performer gate solely from pad-position or bone-rotation reports.

Use actual held finger/key solids, own-palm and neighboring/opposing hand surfaces, full-interval motion, multiple views and visual silhouette review together. Exact triangle-pair counts are not penetration depth. Distinguish covered underlying skin and crease contacts from visible fingers disappearing through the palm. Independently validated held/key-core penetration over 3 mm remains a blocker even if hidden in one camera; smaller values need explicit visual tolerance judgment.

## Late score work: NOT integrated

The latest scratch-only candidate was `endpoint-fix/candidate-merged-v10-provisional.json`, SHA-256 `ce7d11176ec97cd59ae2ccc23cf0dd1d170f78561be791165820ada4da0a2103`.

Previous versions: v9 `4ed1d2992714faf6cadb75e7d9e113e54f7034d629973027188f4b73eb7240a1`; v8 `a4ad36e36eaa6b88c8a284b43acd2cd0aa024fe69fa0c0016f23e93a85b7e3f9`; v7 `095bcfe7aa41864e3ab11768c5fbc50ba01308a84019f57f6b3fa6687ff7c8b4`; v5 `35542978d6df349cb64ad62cd3eec8cafb9eabdf2901a53e5a53fa1372eb3b39`.

All versions preserve all 1,068 attacks, pitches and velocities and all 40 held soprano entries. Physical releases and fingering/support changed. v9 and v10 had no further audio edits after v7. Relevant v7-v5 release deltas: p00976 −39.323 ms total and p00331 −31 ms. Earlier p00414/p00775 −12 ms each, p00939 −17.638 ms; consult actual manifests if recovered.

Work included 20 initial nonthumb repairs, coherent thumb opposition/contact depth, repeated ring families, coda-open pose, low-MCP support, 56 own-palm thumb refingerings, 31 additional active-nonthumb changes. A 58-note affected-neighbor batch passed 11,532 held skin frames at 500 Hz and 1,234 exact own-palm checks at 50 Hz. That was local evidence, not global acceptance.

Examples worth preserving when reconstructing:

- RH 71.2–73.2 s descending phrase: R5 B5 → R4 A5 → R3 G5 → R2 F#5 over held R1 D5, avoiding p00329 thumb folding.
- p00248 / 55.17–56.70 s: held G5 R5 (full 1.429783 s hold), countervoice B4 → D5 → E5 with R1 → R2 → R3.
- RH 197–201 s thumb notes moved to R5; p00533 R5; p01053 L3; p00810 L3. Similar p00063/p01015 considered but not assumed fixed.
- p00416/p00777 required genuinely higher MCP/proximal support (MCP ≥0.759 m), not moving a point behind the keyboard.
- v10 addressed held L3 D3 departures p00706/p00713/p00980 with ~1 mm depth/lift changes; p00990 L2 G2 and p01018 L2 E2 became forward L3 arches. Targeted high-rate checks passed; whole-held rescreen was still running at last retained checkpoint.

## Finite unresolved queues and rejected approaches

### Inactive nonthumb fingers

Latest v9 inventory: 101 offending inactive digit poses across 86 gaps. An offline full-interval joint fitter was being built with exact active anchors, small MCP flex/spread and distal curvature, smooth absolute-time curves and actual key/palm/neighbor checks. The first R3 gap was 38.307–43.952 s; a later low-rest/endpoint neighbor case remained. No partial curve accepted.

An index-only support patch in `production/revision/supported-index/` is preserved: at most 5° upward whole-index MCP rotation for long rests ≥0.5 s with sufficient base height/depth; smooth 250 ms release and 320 ms approach; active notes unchanged. The old inventory reduced 156 to 104 poses without new pairs at 677 changed midpoints. It is a narrow candidate, not integrated or a whole-hand solution.

Finite failures: p00984/p00533 idle R4 versus active R5; p01053 idle L4 versus active L3; p00106/p00231/p00292/p00100; 56.47 s R3/R4, 72.04 s R4/R5, 173.007 s L3/L4/L5. Previous extra 5° pinky yaw fixed one pair and created another over the full interval, so was rejected. p00170 R3 and p00738 R4 static proposals failed full spans.

### Thumb rest shape and transitions

Raised reference 11 was REJECTED: it produced an angular thin web sheet/deep crease and exaggerated splay in actual overhead views, even when opposing-hand collision counts were zero.

Compact reference 13 was preferred after views at 224.25 s and 11.700326 s: rounded web, curved readable thumb closer to its palm. Thirteen rest poses in six close contexts plus ending had no key-core or same-hand pair intersections; all 5,047 opposing-hand samples on v7 were clear. That still did not establish full idle-gap/own-palm/high-rate acceptance. A compact14 variant was mentioned later; no final hash or acceptance was retained.

Useful transition correction: one continuous arch across 24–50 ms idle gaps instead of two independent release/attack arcs both returning to zero at the gap center; small repeated-note rearticulation lift. Earlier 50 ms authored-rest fade produced 6.276 m/s speed; widening and refinement needed full final recheck. Active mesh parity must remain exact where intended.

### Active supports and own-palm folds

All 31 additional active nonthumb cases had finite active-key solutions, but full-hand problems remained. p00160/p00161/p00163/p00165 shared LH phrase needed refingering/support to separate middle/ring without twists. p00771 held support cleared keys but incoming pinky transition remained. p00420 and p00914 required full support/fingering repair. p00119/p00805 support raised bases but introduced/exposed neighbor/palm crossings.

Three visually confirmed distal-through-palm folds, not harmless crease counts: LRing p00957 at195.262844 s and p00163 at38.75 s (43–53 mm from MCP), RPinky p00741 at162.313344 s (29–31 mm from MCP). Finger emerges below palm after an intervening section disappears. Coordinate with support/fingering repair.

Independent review of 18 remaining grips/24 notes found only p00664 fully clear at the tested pose. Of six earlier promoted families only p00883 was fully clear. p00914 at188.81581799 s had thumb visibly inside black key and low palm/base (~5.7–7.5 mm). Do not upgrade all these families from “held finger fixed” to “hand fixed.” A 27-family visual review of the first53 own-palm refingerings was unfinished.

### Coda and ending

Preferred local coda-open LH G2/D3/G3 held pose used index PIP56.8° rather than rejected87°, outer white contactZ.274, D3.228, thumb opposition8°. Held image approved locally, not arrival/ending automatically.

On provisional combined5/compact14/v7, LH coda arrival sampled at240 Hz was key-core≤3 mm with no LH pairs. One RH2/3 six-triangle-pair event at224.55417 s remained. Previous three release/settle windows were clear but must be repeated on final combined source. Old final resting thumbs had81 opposing pairs; later references cleared those while creating own-hand problems. Do not resurrect a rejected reference just because one ending report passes.

### Arms and seating: important dependency BEFORE final hand fitting

Baseline actual wrist/forearm/palm geometry showed recurring sideways bend: median ~52.6° L /50.5° R, R95th62.94°, max69.47°. Ending R ~65.69°. These are rig-relative geometric measures, not clinical angle limits.

Proposed better pole: closest feasible elbow on shoulder-wrist two-link circle toward wrist minus palm-forward × forearm length, with actual torso/sleeve clearance. The unconstrained ending R improved to39.6° but put the elbow inside the blouse, so was rejected.

Seat/model +0.10 m in Z plus constrained pole was the promising choice; corresponding bench +0.10 m, feet and world hand targets fixed. +0.14 m was rejected because left reach deficit13.664 mm and contacterror4.024 mm occurred around188.8–189.9 s. +0.06/+0.10 had no reach failure.

The +0.10 candidate reduced median bend to22.94° L /21.64° R; after forearm thickness clearance tightening ending R56.93° versus baseline65.69°, L16.97° versus47.21°. Full120 Hz 27,979-pose sweep: no reach deficits/nonfinite, max wrist shift.000072 mm, finger marker shift.003638 mm, contacterror delta.000102 mm, elbow speed1.249 m/s, arm rate6.713 rad/s. Bench5980 vertices translated exactly,170806 unchanged, keys unchanged.

Actual ending render looked more natural, but opening R forearm/body14 triangle pairs and upper-arm/body counts still required localization against outer blouse. Some underlying Human skin is retained beneath clothing: don't reject invisible sleeve-junction/underarm contacts as automatically visible torso penetration.

Crucial: 348 mixed Forearm/Hand skin vertices move by up to39.10 mm under this pole change even with fixed joints; fully hand-weighted3486 vertices moved only.00228 mm. Thus integrate an accepted arm/seat solution BEFORE final hand mesh fits/audits. The patch was still provisional and not committed when scratch was lost.

## Next acceptance sequence

1. Recover/reconstruct finite candidate deltas; compare actual availability against the inventory.
2. Resolve seating/arm outer-surface intersections and accept a minimal patch; retain anchored feet, hair/body continuity and bench alignment.
3. Finish actual held and inactive hand mesh fits. Preserve original score musical intention and all sustained soprano events.
4. Run all audits on ONE exact combined rig/score/character: key contact/core, own-palm, neighboring/opposing hands, full idle intervals, high-rate movement, direct seek, complete coda/ending. Visually inspect true closeups, top and side views.
5. Targeted camera/occlusion/poster/body/hair review after new seating.
6. Remaster exact final score, build and run the five existing tests plus required focused gates.
7. Freeze native1080p30 immutable export, inspect climax-first chunks, finish6995 frames, verify order/decode/audio sync, save full MP4 plus source WAV and short cut.
8. Public Sites update and verified unauthenticated core assets. Actual browser listening/live playback remain required if possible; clearly state capabilities that are genuinely unavailable.

No more broad decorative work is needed before those blockers. No new film, deployment or physical-hand global pass was complete at handoff.
