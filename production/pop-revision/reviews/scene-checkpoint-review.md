# Daybreak asset and scene checkpoint review

Independent read-only review of checkpoint `eaffbe6` and the supplied room/portrait coverage renders. All test fixtures and proposal files are outside the checkout. This filename is a requested deliverable name, not a declaration that hand performance or publication is final.

## Asset pipeline

No blocking flaw found in the new lossless character pipeline. `production/assets/pianist.glb.br` is tracked; generated `public/assets/pianist.glb` is ignored. The manifest contains both archive and decoded sizes/hashes. `scripts/prepare-assets.mjs` resolves paths from its own module URL, validates the compressed input before decompression, validates the exact decoded bytes, and writes via a temporary sibling plus atomic rename. It needs only Node built-ins, so it works before dependency installation.

Independent external-fixture checks passed:

- A fresh fixture with no `public/assets` restores the complete 17,123,372-byte model.
- The restored SHA-256 is `be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc`, identical to the manifest and validated runtime asset.
- Running from unrelated cwd `/` works.
- A second call is idempotent and preserves the generated file's mtime.
- Replacing the generated file with deliberately incomplete content triggers exact restoration.

Evidence: `asset-independent-verification.json`; harness `verify-assets.mjs`. These checks exercised the real copied script and archive rather than a reimplemented decoder. Root already separately tested damaged-archive rejection; I did not repeat that covered case.

`prebuild` and `predev` invoke preparation. The installed Sites build helper calls the package manager's `run build`, so npm executes `prebuild`. The documented fresh workflow (`install:ci`, `build`, `start`) reaches preparation before the public directory is copied into the build. Direct `vinext build` or the shell build helper bypass npm's lifecycle, but the README correctly documents the npm command and explicit `assets:prepare` for standalone diagnostics. No browser decoder or extra runtime request was introduced.

Current README and revision report clearly identify this as an unfinished branch, preserve the inaccessible original Site, explain generated assets, and distinguish historical reports from current evidence. The new handoff preface correctly supersedes the historical transfer-only stop. The older technical handoff still contains older hashes and durations, but is explicitly historical and linked after the current report. Keep the exact character hash/manifest updated together if root later changes model bytes.

## Visual review actually performed

Viewed all 24 landscape files `work/root/room-coverage/gl-960-0.jpg` through `-23.jpg` at their supplied resolution, and all eight portrait files `work/root/portrait-coverage/gl-720-0.jpg` through `-7.jpg`. Read both benchmark manifests to distinguish scene frames from active-note evidence. These are offline actual-geometry renders with approximate shading, not browser screenshots.

The revised ivory garment is clearly legible against the piano and timber; shoulder, sleeve edge, placket and trouser contours survive the wider shots. The continuous floor removes the old sawtooth gaps. Board grain now runs lengthwise with narrower joints. Acoustic panels and restrained edge furniture make the room readable without competing with the performer. Piano silhouette and visible string field remain coherent, and the interior shot exposes actual pins/string/bridge detail. The prop no longer visibly pokes through the lid in these images. None of the 32 images shows a gross missing-mesh or broken-transform regression.

Two concrete room issues were sent to root immediately and root is fixing them:

1. **Lounge seats face the wall.** Their local back is at Z +.30. Rotation Y -PI/2 puts the back at the inward side and the sitter faces world +X, away from the piano. Rotation +PI/2 places the back toward the right wall and faces the piano. Visible in landscape 3, 7, 12 and 14.
2. **An entrance corner is open by 425 mm.** Side walls end at Z 4.88; the entrance inner face starts at Z 5.305. The exposed sky appears as a bright full-height white slit behind the performer in landscape 9/16 and portrait 5. A side return depth of 12.4 at center Z -.72 preserves the rear edge and overlaps the entrance. This gap is inherited source geometry, not a defect introduced by Brotli or the renderer.

The portrait hand frames also retain partial faces at frame edges (portrait 1, 4, 6). Root independently found this and requested the framing proposal below. The current portrait wide establishes the room well but leaves considerable ceiling/upper-window space; that is a composition choice, not geometry failure. The interior portrait uses the instrument's long axis effectively. Facial realism and the hairline remain moderate-detail inherited assets; no photorealistic-character claim is justified.

The sunlight still creates sharp, high-contrast shadow wedges in this renderer. They retain the dawn direction and do not hide the new blouse, but softer browser shadow appearance cannot be established from this adaptation. Do not compensate by indiscriminately raising every material or flattening the piano lacquer.

## Performance scope

Most supplied times are exact bar-boundary rests. They are suitable for room, clothing, camera and artifact review; they do not establish active fingering, actual hand collisions, note-to-key accuracy, arm motion through transitions or critical audible quality. Root and hand agents continue that work. Visible rested-hand shapes in these frames are not approved here.

The old camera-audit metadata issue, prop-plane offset and lamp-facing issue were already fixed by root after the prior review. The new corner gap demonstrates why origin clearance and a central subject ray are insufficient to prove the room is closed; a small explicit corner-continuity check is more relevant than rerunning an unrelated broad test suite.

## Portrait hand framing proposal

Root requested a projection-backed proposal that excludes the entire head while retaining both hands at 9:16 and 4:5. Isolated `portrait-source/` modules and score were frozen from `eaffbe6`; the model is the manifest-verified generated GLB. No source was edited.

`portrait-fit.mjs` evaluates actual skinned Human vertices weighted more than 50% to head/neck versus hand bones over seven fractions in all seven hand-kind shots, yielding 49 poses and 98 aspect/pose combinations. World-space AABB corners provide conservative bounds, so passing retains all measured hand skin and excludes the entire measured head/neck box; it is stricter than testing only centers. Whole-88-key fit is reported separately, because a close detail shot need not show every unused key.

The first safe proposal is camera `(look.x + side*1.10, 1.25, .25)`, target `(look.x, .754, .25)`, FOV 30°, with side -1 for left-hand shots and +1 otherwise. It excludes the head/neck in all 98 combinations (minimum 0.111 NDC clearance beyond the frame) and keeps all hand bounds within absolute NDC .9557 (at least 2.2% image-edge margin). It intentionally shows the played keyboard region instead of all 88 keys. It remains safely inside the room. This is a geometry-backed candidate requiring root's render review, not yet an aesthetic or piano-occlusion acceptance.

The earlier high overhead camera cannot exclude the face with a small target-Z adjustment while preserving comparable full-keyboard framing at both requested aspect ratios; the lower viewpoint moves the face completely above the frame. Additional conservative refinements and final suggested parameters will be appended after their finite projection check.

### Full active-note refinement — supersedes the initial 49-pose candidate

The 863-time root queue was verified to contain every exact midpoint of the frozen score's 1,011 notes. Restricting it to all seven hand shots yields **276 poses, 552 aspect/pose combinations**, including both C6 midpoints (190.6770525 and 191.083992 s). This broader, relevant check found the initial camera's hand bounds within only .99446 NDC at 174.554875 / 174.645422 s. It is rejected for inadequate edge margin.

Two refined candidates pass all 552 cases:

| Candidate | Camera (relative to shot look.x) | Target | FOV | Maximum absolute hand NDC | Minimum head/neck outside NDC |
| --- | --- | --- | ---: | ---: | ---: |
| A | `(look.x + side*1.25, 1.20, .20)` | `(look.x, .754, .25)` | 30° | .931443 | 1.027452 |
| **B, stronger margins** | `(look.x + side*1.40, 1.25, .25)` | `(look.x, .754, .25)` | 26° | .902577 | 1.043094 |

Candidate B keeps the full measured hand skin at least 4.87% of image width/height from the nearest edge and excludes the conservative head/neck bounds by at least 2.15% of image width/height. Candidate A retains 3.43% hand margin and 1.37% head exclusion margin. These are minima over the entire checked set, not averages. Both are comfortably inside the room; B's minimum origin clearance under the existing audit bounds is 3.20 m. Keep the camera static within each detail shot unless a further motion interval is explicitly verified.

An independent ray check to ten actual fingertip markers at each pose gives **zero static-piano obstructions** for either proposal (20 static obstacle meshes, 2,760 rays per camera family). This includes shell, lid, fallboard, prop and bridges. Dynamic keys, hidden key audit proxies and dampers were intentionally excluded from this camera-obstruction check; they require their own time-matched contact validation. The first raw diagnostic included keys frozen at the last pose, producing invalid contact self-hits. That diagnostic is retained as `portrait-active-initial-frozen-key-diagnostic.json` and is explicitly superseded by the corrected static-obstacle check.

Final projection evidence is `portrait-active-verification.json`; concise result is `portrait-static-output.json`. The projection/pose data binds eaffbe6 source and score plus the validated character. Root should render candidate A or B using active-note times, then rerun the projection against any final rig/body-posture changes. Finger-only local repairs of a few millimetres are accommodated by B's current margins, but this is not a substitute for checking final inputs. Ratios checked here are exactly 9:16 and 4:5, as requested; extremely narrow viewports are not implicitly certified.

Root reports the lounge orientation and solid corner gap are now repaired and has identified/closed additional entrance leaf meeting, jamb and header gaps. Those newer corrected renders were not included in the original 32-image review above; root is directly inspecting their replacements.
