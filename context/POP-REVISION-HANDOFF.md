# Current Daybreak continuation

The original repository was recovered from main `d020ecc`. Current review branch: `codex/daybreak-pop-revision`; draft pull request: https://github.com/Leonxlnx/pianopiece-threejs/pull/1. The first substantial GitHub checkpoint is `7962f728c75292cf156dedff4c064ca82a573b0c`, whose tree matches the local reviewed snapshot exactly. Work continues beyond that checkpoint; this document does not declare a completed release.

## Current source

The app now uses an original 88-bar/1,011-note/96 BPM pop piano composition lasting 227.101587 seconds. A repeated hook returns through verses and choruses, a quieter bridge, a higher final chorus and a resolved coda. The score is newly composed; no prior lost v10 score was recovered or silently relabeled.

Supported two-link arms, a 10 cm seat/bench adjustment, compact thumb rest, physical-release fitting, actual hinged-key contact, ivory concert clothing, a furnished timber/limestone room, corrected piano construction and 24 phrase-directed shots are integrated. The original adult face/body/hand mesh and skinning bind remain unchanged. Updated clothing is authored geometry, not simulation. Root reviewed actual offline scene and garment renders; shading differs from the browser renderer.

The new character is stored losslessly at `production/assets/pianist.glb.br`. `npm run assets:prepare` restores the normal runtime URL `public/assets/pianist.glb` with exact SHA-256 verification; predev/prebuild run preparation automatically. The raw model is intentionally generated/ignored. The garment verifier reconstructs private paired-pose caches when absent and repeats all original pose/image hash checks.

## Hand status

The broad initial current-song screen found 57 deep key-core rows, 53 own-palm rows and 624 neighbor rows across 863 unique note-midpoint/opening/ending times. Earlier 72-context clearance did not establish whole-song clearance. These known failures remain documented in portable numerical reports.

Beyond the first GitHub checkpoint, root has merged 156 left-hand and 203 right-hand held fingering/contact corrections plus local wrist support. The four deltas in `production/pop-revision/held-grips/` exactly reproduce the coherent combined held candidate. All audible fields and held-note timing remain identical, with no same-finger held overlaps. The latest compact thumb arrival is 29 ms. Inactive travel is still being fitted; do not replace the final source with an unverified experiment. A broader 60 Hz diagnostic of an isolated 92-profile candidate found 5,224 of 109,024 nonthumb observations outside the new shape bounds (peak dorsal elevation 89.53°, backward PIP movement 25.29 mm), despite all 5,055 held-pad samples remaining within ±3 mm. This candidate has not replaced the application rig. Closeups confirmed that many short world-space targets drive the released solver toward its 87° PIP bend cap. Independent classification reproduces every observation: all 5,224 violations are in unprofiled travel; active held and settled rest have zero violations. Shared travel interpolation is now the priority while retaining the working endpoints. Local surface-clear waypoints alone are not final visual approval.

Acceptance requires actual assigned-pad/key surfaces, key-core depth, own-palm/neighbor/opposing surfaces, full-interval motion and visible hand shape together. Independently measured key-core depth over 3 mm remains a blocker. Pair counts do not measure penetration depth. Final motion uses 240 Hz, fingertip speed ≤5 m/s, wrist speed ≤1.5 m/s and wrist acceleration ≤25 m/s². Nonthumb dorsal elevation is screened against the actual skinned palm at 60°, and backward PIP displacement at 3 mm; these are conservative project review bounds, not clinical human limits. Strongly curled released silhouettes may still fail visual review below those bounds. Do not weaken those thresholds to pass a candidate.

Camera B has been independently rechecked on the combined held score over 552 aspect/pose cases at 9:16 and 4:5. Both hands remain within frame, head/neck remain outside. Matched affected-arm checks show no exposed forearm/blouse crossings. New internal upper-arm crossings are retained and localized under the actual sleeve; checked camera rays encounter opaque clothing first. The small ending sleeve crescent is geometrically unchanged by the wrist repairs. This is not a full clothing collision-free claim.

## Music and final validation

The public MP3 has already been replaced by the new sampled-grand master: 44.1 kHz, 320 kbps, −19.00 LUFS, −1.63 dBTP, 7.3 LU range. It was rendered after 152 physical release adjustments. Subsequent held finger/contact/wrist changes preserve all audible fields. Once visual-only fields settle, rerender and regenerate the master manifests from the exact final score so the strict film score-hash gate remains meaningful. Never relabel a mismatched old render. The renderer now supports `--no-stems` for a fresh complete render without optional dry bus caches; all signal and source checks remain enabled.

Pinned sample paths now resolve relative to `production/pop-revision/music/`; recorded source URLs/checksums are unchanged. Current mastering reports retain the earlier frozen renderer/sample-manifest hashes as provenance until final remaster. No critical listening has been performed in this environment. Numerical audio checks are not a listening review.

Build, five existing tests, twenty mocked lifecycle checks, deterministic character rebuild, key geometry, camera/reduced-motion and audio-codec checks have passed during integration. Final combined hand source/score still requires the exact all-pad/240Hz audit, finite surface replay and actual visual review. `production/qa/audit-revision.mjs` now defaults to 240 Hz; historical 60 Hz reports are not substituted.

## Delivery access

The existing hosting identity is preserved in its original configuration. Its Sites lookup returned 404 in this workspace. Supported preview timed out twice, exhausting the bounded retry path. Do not create a replacement Site, derive another identity, or use an alternate HTTP/browser route. The public URL still serves the older performance. User authorization for eventual publication already exists; restoring legitimate project access is the missing prerequisite.

The full new native 1920×1080/30 fps film is not rendered. The retained exporter now derives duration from the actual score and uses portable project paths. It preserves immutable input hashing, exact score/master binding for final assembly, GL error checks, chunk integrity, full decode and audio alignment. Prepare a fresh job only after final source/audio freeze. The old 13–20 hour CPU estimate is historical; a new exact-source benchmark is needed before claiming a current duration. Do not claim a render will keep running after the session ends.

Read `production/pop-revision/README.md` and current report input hashes first. Older documents under `production/revision/` and the historical context below remain valuable failure/recovery records, not current blanket acceptance.

## Arm boundary repair after checkpoint 5e00dbc

The supported-elbow solver now smooths the collapsing outward-clearance angle before its clamp. This removes three inherited right-elbow speed failures: full120Hz maximum4.10→2.63m/s, with a separate240Hz neighborhood maximum2.69m/s. Segment lengths, wrist targets, finger transforms and seek behavior remain within their existing bounds. Only the elbow method changed; no score or wrist data changed. `production/pop-revision/arm-boundary/` preserves the patch, portable full/dense metrics, original failures and changed inherited garment counts. Root reviewed six paired exact-source garment images plus the fourth candidate control; no new visible protrusion/hole was found in these specific views. Inherited armhole surface overlaps remain explicit. Final combined source must be reverified.

The natural joint-transport candidate passes the whole-song60Hz shape check with zero observed excessive MCP/backward folds, but remains isolated while actual-surface release-key and neighboring-finger contacts are repaired. Do not substitute its scalar shape pass for complete surface approval.

## Direct application comparison and V7 continuation

The actual b8c30 application already passes the whole-song shape bounds. Its direct comparison with V6 finds severe key frames 731→240 and four fingertip-speed failures→zero, while every one of the 5,055 held-pad samples remains identical. Whole-song pair-positive frames decrease 1,516→1,434, but triangle incidences increase 41,442→94,731, concentrated in moving Middle/resting Ring crossings. These are mixed results, not global acceptance. `production/pop-revision/joint-transport/` preserves complete current/candidate rows, event indexes and source hashes.

V7 adds twelve accepted local distal-timing controls to the earlier twenty-three controls. The additional complete local windows pass at 240 Hz with unchanged held skin; all 249 severe-key rows remain unchanged at full 60 Hz. Five actual V7/E3 views are reviewed with explicit still-image limits. A typed transport candidate is being tested to retain the earlier complete arch in selected gestures where it is demonstrably clearer. A shared 35 ms distal default was rejected because it introduced and worsened severe key events.

The approved composition revision changes db00406/db00922 from C3 to E3 and labels bars 36/80 Fmaj7. The melody, timing, velocities and all other voicings remain exact. The two bars already contain melodic E; the accompaniment now reinforces that major-seventh color while giving the thumb an open route. The composer insertion was verified to change exactly those two pitches and two labels after deterministic performance assignment. The public score and master still represent the previous voicing at this checkpoint; integrate the approved sparse delta with the final hand source, then freshly render and verify the exact final score. Never replace the fitted runtime score by the unfit composer seed.
