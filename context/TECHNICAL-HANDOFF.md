# Technical handoff and reproducibility

## Authoritative recovered source

Original Sites project: `appgprj_6a9b729cbe8081918fada430da2412f0`.
Original remote: `https://git.chatgpt-team.site/a8f4be8e-3b46-4d56-92c3-e575aff25dbc/appgprj_6a9b729cbe8081918fada430da2412f0.git`.
Recovered accepted checkpoint: `4079210`, “Validate full hand surfaces and reduce delivery assembly storage.” Earlier relevant checkpoints: d153b6d strict GL/opposing audit; 90321ba contact fields; f6989a1 framebuffer/30fps planning; f536ab0 arm/storage;745d4e5 batching/priority;4fb1efc camera/body/renderer.

The transfer target is `https://github.com/Leonxlnx/pianopiece-threejs`, main. Preserve `.openai/hosting.json`; existing d1/r2 declarations are null. No new deployment requested during the transfer. The old public Site was commit4c7fee9/version3; all later accepted revisions are still unpublished.

### Hashes at accepted checkpoint

| File | SHA-256 |
| --- | --- |
| public/assets/score.json | b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773 |
| app/performance/pianist.ts | f0407941995f70ecafecebe9559e0289716620f656b51affcfe279aade9c94b8 |
| app/performance/types.ts | dab373a1e5a0eef3cd68272a3865a469de98cccb788c5bafe1931bdff739e9f9 |
| public/assets/pianist.glb | 77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d |
| app/performance/piano.ts | 6e9d1ad46e2fa1e479a47eed9a6bd0eaf80f33f48079ac8c97ff54b3579907ee |
| production/qa/render-revision.py | bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71 |
| production/revision/video-export/export_video.py | a093d7bd64786dde35d2a9dd67e61e7023fc3f0a5e42944cdf8a3994d7cd9bca |

Use the generated file inventory to independently compare the imported bytes. Root rig supports optional per-note `contactZ` (metres) and `thumbOpposition` (radians), propagated through active contacts/cost/cache/anchors. Default absent fields preserve old poses exactly. It does NOT contain the new compact thumb rest, idle fitter or +0.10 m seating/arm patch.

## Application and build

React19.2.6, Three0.183.2, Vinext0.0.50, Vite8.0.13, Node>=22.13.0. Lockfile preserved. Start from `package.json`, `app/page.tsx`, `app/performance/`, `public/assets/`, `production/`.

`npm run install:ci`, `npm run dev`, `npm run build`, `npm test` are the existing scripts. `npm test` includes the build and five tests. No fresh build was done during this credit-limited transfer because source was not changed. Prior five-test/build success predates the latest hair/gaze/batching/contact additions, so final combined validation is still due. Read scripts before running in a new environment; paths and Sites-specific environment assumptions may need adjustment, not wholesale replacement.

The previous preview needed `CLOUDFLARE_CF_FETCH_ENABLED=false` to avoid optional Miniflare metadata fetch trouble. Native preview was `http://terminal.local:4173/`, but browser tab discovery repeatedly timed out. Old test browser lacked WebGL2. Only use the new environment's supported browser access; do not bypass restrictions with alternate CDP/Playwright/headless paths. Recheck if capabilities change, but avoid repeatedly retrying an unchanged failure.

## Score and sound

New revision:233.144228 s/80 bars/1068 notes:419 melody,47 countervoice,104 bass,498 harmony. MIDI40–88. Maximum3 left/4 right simultaneous,12/10-semitone spans. Forty held soprano entries. Original theme D–G–A/G–E–D; no ensemble in the new arrangement.

| Section | Start s | End s |
| --- | ---: | ---: |
| intro | 0 | 12.391821 |
| theme | 12.391821 | 57.318150 |
| ascent | 57.318150 | 79.521464 |
| refrain | 79.521464 | 112.445576 |
| middle | 112.445576 | 147.512753 |
| turn | 147.512753 | 159.156206 |
| final | 159.156206 | 202.073473 |
| coda | 202.073473 | 233.144228 |

Final LH release228.911562, RH229.003228, pedal up230.094228. Held ending from224.55: L G2(f5),D3(f2),G3(f1);R A3(f1),B3(f2),E4(f4),G4(f5). Preserve expressive hold and pedal unless a musical revision is explicitly coordinated with mastering.

Piano: Salamander Grand Piano v3, Alexander Holm, Yamaha C5, CC BY3.0. Previous sample bank160 FLAC files,48kHz/24bit stereo, selected odd velocity layers1/3/5/7/9/11/13/15,254,295,259 bytes. Pinned source and per-file checksums are in saved sample manifests. Source `https://github.com/sfzinstruments/SalamanderGrandPiano`. Do not assume the old local sample bank survived; redownload the pinned files if needed and verify hashes. Credits and software notices are in public/assets. Original older arrangement also used CC0 VSCO2 Community Edition strings and Swirly Drums; preserve historical credits for historical export.

Current public MP3 is still from the earlier physical-release score (5b47 lineage), NOT exact accepted b156 or experimental v10. Final remaster is mandatory. Previously mastered 44.1kHz/24bit stereo WAV233.144217687 s/10,281,660 frames,−18.99 LUFS,−1.65 dBTP,7.7 LU LRA,0.210 dB limiter reduction. No clipping; measured MP3/AAC lag0 at checked points. WAV SHA870afd593936ff20cc3adad5a08a18debc8ab80e1cd890f4035a16defe1a9323; MP3 SHA862c061c9abb36b68a7105f63fbefe6253bf70e963e261d5083b3fec24b2a004.

Saved mastering source/manifests: `production/revision/master/` and `production/revision/music-master-final/`. Scratch release helpers `release-tools/prepare_release.py` and `verify_release.py` were prepared but may be lost; reconstruct from saved renderer if not in inventory. They were intended to bind the exact final score SHA, sample manifest and root, preserve DSP, output a full event/audio signature, and verify decoding/alignment. Do not relabel old audio as matching after a score edit. Audio-only metrics are NOT critical listening.

## Actual geometry and animation QA

- `node production/qa/export-scene.cjs` compiles the real performance modules; all modules are copied/compiled generically by the export wrapper.
- `audit-revision.mjs`: `DAYBREAK_SCORE_PATH` override,5340 pads at five samples/note;60 Hz13989-pose contact/seek/joints.
- `audit-arm-motion.mjs`:120 Hz27979 poses; rerun on accepted final arm/score.
- `verify-keyboard.mjs`:55176 actual key rays passed static batching; rerun bench change.
- `audit-posture.mjs`:8704 event boundaries; verify seat/body/hair after integration.
- `audit-camera-room.mjs`:672 room/framing samples; complement targeted visual occlusion review.
- `audit-cross-hand-surfaces.mjs`: actual Human triangles whose vertices have >65% summed digit weight, and >65% hand weight for palm patches. BVH broad phase and noncoplanar edge/triangle intersections. Opposing mode36 digit/palm pairings; `DAYBREAK_SURFACE_MODE=own-palm` checks same-hand digits against palm. `DAYBREAK_RIG_MODULE` allows a real candidate compiled module, `DAYBREAK_SCORE_PATH` an immutable score, `DAYBREAK_SURFACE_SAMPLE` a JSON `{rows:[{time:...}]}`. Default8 Hz plus attack+.001/mid/release−.001 gives5047 unique times. Output path is a positional argument. Counts are not depth; mixed web, coplanar, entirely enclosed surfaces and unsampled instants are limitations.

Reports to read: `cross-hand-reference-check.json`; `cross-hand-combined2-v4.json` (43/5047 opposing samples, mostly thumb/thumb); `cross-hand-combined5-v4.json` (zero opposing but subsequently rejected own-hand/web issues); `own-palm-combined2-v5.json` (1045 samples); `own-palm-active-note-queue.json`; `own-palm-combined9-v7-midpoints.json` (158/1068 midpoint crossings); `own-palm-active-v7-queue.json` (70 active IDs:56 thumbs14 nonthumbs). Many reports intentionally record failures; filenames containing “final” do not override the latest context.

Old combined b156/e85 whole500 Hz116574 times plus234 windows2 kHz passed a5 m/s fingertip review limit. This is NOT evidence that v10/new idle/new arms passed. Final pose must be deterministic under direct seeks and boundaries, including all sustained chord and release states.

## Offline rendering/export

Use `production/revision/video-export/export_video.py` (a093), not a stale scratch copy (7dad). Renderer is `production/qa/render-revision.py` (bacdd). Temporary-FBO binding bug fixed: restore persistent framebuffer before release. Strict GL error checks at initialization, cached environment restore, every readback/frame and temporal composite abort a bad chunk and preserve already closed chunks. No suppressed GL errors or invalid-cache certification.

Old environment used ModernGL/Mesa25.2.8 llvmpipe EGL4.5 with `LIBGL_ALWAYS_SOFTWARE=1`. It needed local Mesa libraries via LD_LIBRARY_PATH and `__EGL_VENDOR_LIBRARY_FILENAMES`, whose old scratch paths are gone. Use actual installed paths in a new runtime. No need for literal old absolute directory names.

Offline renderer differs from browser: GGX NDF vs Three VNDF/CubeUV, simplified bloom/shadow filtering, no live floor Reflector. Label video as rendered export, not screen recording/pixel-identical browser capture.

Commands after FINAL score/master freeze (replace absolute placeholders):

```sh
python production/revision/video-export/export_video.py prepare --project /ABS/PROJECT --audio /ABS/FINAL.wav --root /ABS/EXPORT_WORK --width 1920 --fps 30 --chunk-frames 60 --samples 1
python production/revision/video-export/export_video.py render --job /ABS/JOB --all --prioritize-start 159.156 --prioritize-end 191.35
python production/revision/video-export/export_video.py assemble --job /ABS/JOB --final --delivery-only
```

Correct argument is `--audio`, not `--master`. Prefer scratch/export storage outside repository for huge work products. Fresh immutable snapshot required; resuming an old job executes its pinned old wrapper/source. `--final` requires exact master-score SHA match. Never waive it. Default CRF17/medium/H264, two encoding threads, AAC320k, native1920×1080 CFR30,6995 frames. One temporal sample chosen;2/4 samples multiply render cost.

`--delivery-only` assembles verified chunks directly to MP4, avoiding duplicate full silent MP4 and optional PCM24 MOV. Keep the original WAV separately. Reports explicitly mark PCM/lossless checks not applicable to delivery-only; no claim AAC is lossless.19 real-media fixture checks passed, including frame-order, AAC equivalence and final-score mismatch rejection. Strict GL guard9 cases84 assertions; priority scheduling24 checks. A prior fixture MOV was unexpectedly empty despite ffmpeg exit0; full rerun passed and final decode gate catches this.

Measured native frame times:6 s wide6.563 s/frame,26.05 hands7.662,64 interior6.609,170 close3.097. Initialization53.8 s. Approx1.36 GB combined steady RSS/1.9 GB peak under shared CPU. Estimated full30fps13–20 hours on that machine; no final job was started. A two-frame old24fps smoke job passed decode/PCM/alignment/resume, but had intentionally stale master-score binding and is not a final validation.

Storage was a32GB shared overlay with volatile0.5–3GB free. Do not use memory-backed tmp for huge caches (near20GB memory cap previously). Completed reproducible scene caches could be truncated safely; ordinary deletions/hardlinks were sometimes restored by workspace maintenance. Do not truncate active/frozen assets, masters, samples or encoded chunks. Persist costly completed chunks and frozen source/master snapshots as they finish. Avoid copying an entire multi-GB render repeatedly. Prefer direct MP4 assembly (~two H264 copies) and actual measured bitrate budgeting.

## Preserved old user deliverables and recovery

Only the old export-source ZIP was materialized for this economical handoff; large media remains in the original account's Library and is not in Git. These items are original-version assets except the WIP new-theme preview:

| Filename | Bytes | Original Library ID |
| --- | ---: | --- |
| Daybreak-full-desktop.mp4 |136778916|libfile_3ff705a34d7481918ab0e8f42e1ab790|
| Daybreak-social-cut.mp4 |19210452|libfile_4d9df9b62c408191afe996d559c8ab0e|
| Daybreak-soundtrack.wav |60603062|libfile_78e31aa1f37c8191986257fbc4ee7165|
| Daybreak-export-source.zip |1430882|libfile_4b1ef704e7b88191b519ef9ed0936019|
| Daybreak-credits.txt |1836|libfile_94955ef617b88191a6e37372411940b9|
| Daybreak-new-theme-preview.mp3 |1402535|libfile_8c85063fbd708191bbb4ef6224102234|

The35-second new theme preview starts at score12.391821 s, container35.030204 s,44.1kHz stereo. It was explicitly WIP. Cross-account Library access may not work: these IDs are recovery references, not public download links. Use the user's supplied files or authorized Library sharing if needed; the imported app and asset source can run without old MP4 files.

All QA claims above are historical and tied to their exact input candidate. No fresh listening, live WebGL playback, public revision deployment or full new film was verified during transfer.
