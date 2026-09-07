# Daybreak offline video export

The current pop revision lasts 227.101587 seconds and needs 6,814 native frames at 30 fps. Its final export must be prepared after the final hand animation and matching lossless master are verified; no completed new full film is claimed.

`export_video.py` wraps the current production QA renderer and pose server. It does not edit the Site checkout and does not use a browser. Output remains an offline approximation of the Three.js stage.

## Prepare and render a motion sample

```bash
python export_video.py prepare --start 190.20 --duration 1 --width 1920 --fps 30 --chunk-frames 30
python export_video.py render --job /absolute/job/path --max-chunks 1
python export_video.py assemble --job /absolute/job/path
```

`prepare` prints the job path. Each `render` invocation resumes after verified, completed chunks. An interrupted current chunk is rendered again; completed chunks are retained. `render` defaults to one chunk. `--all` explicitly permits all remaining chunks.

The output is `daybreak-preview.mp4` with AAC audio and `daybreak-master.mov` with unchanged PCM24 audio. `validation.json` records decoded frame counts, timing, media hashes, byte-exact master PCM comparison, AAC alignment and source/master correspondence. Listening and video playback review are separate from these technical checks.

For constrained storage, `assemble --final --delivery-only --job /absolute/job/path` muxes the verified chunks directly to the delivery MP4. It avoids the full silent-video intermediate and optional PCM MOV; the original lossless WAV remains available separately. Frame count, frame rate, decoding, source/master score correspondence and AAC alignment checks still run. The validation report explicitly records that no PCM movie was created and makes no lossless claim about AAC.

`validate_delivery_only.py` checks this route against the archival route using two copies of an existing two-frame native test chunk. All 19 checks passed, including identical decoded frame order across the concat boundary, identical AAC samples, preserved original inputs and rejection of final assembly with a mismatched score/master. No new 3D frames were rendered. An initial archival fixture produced an empty MOV; a standalone mux and the complete repeated validation succeeded. Assembly always decodes its outputs and does not accept an empty or corrupt file.

The wrapper skips the unused half-resolution reflection pass by default. Three current-source 1080p poses produced identical pixels with that pass omitted. Guards verify that `floorMirror` remains false and that the reflection texture has no other consumer; if source behavior changes, use `--keep-unused-reflection` when preparing the job until the optimization is reviewed. An already-optimized source is accepted unchanged.

## Prepare the eventual full export

After the rig, score and remastered WAV are ready, run `prepare` again against the live project and the updated WAV. Omitting duration uses the complete WAV duration. This only prepares the job; it does not start rendering.

```bash
python export_video.py prepare --width 1920 --fps 30 --chunk-frames 60 --samples 1
```

Use the returned job with `render --all` when ready to start the full film. Then use `assemble --final`; final assembly verifies that the audio reproduction manifest's score SHA-256 equals the snapshot score hash. Preview assembly remains available while a remaster is pending.

To inspect the climax first, optionally prioritize its overlapping pending chunks:

```bash
python export_video.py render --job /absolute/job/path --prioritize-start 180 --prioritize-end 210 --max-chunks 4
```

Both priority times are seconds from the prepared job's start; for a full film starting at zero they are the score times. The range is `[start, end)`, must fit within the job duration, and selects whole chunks that overlap it. A chunk touching only an excluded endpoint is not selected. Priority chunks run chronologically first, followed by all other pending chunks chronologically. `--max-chunks` applies after this ordering; `--all` processes all pending chunks in that order. Repeat the flags on each invocation while you want this priority. Omit them to resume chronologically.

Priority changes scheduling only. Global frame indices/timestamps, chunk filenames, encoding settings, integrity hashes and final chronological assembly stay unchanged. Completed chunks remain verified and skipped. With 30 fps and 60-frame chunks, the example selects the 15 whole chunks spanning 180–210 seconds. Use a newly prepared job with this wrapper version; older jobs keep their original pinned CLI.

Default inputs:

- Project: the repository containing this wrapper.
- Lossless master: `production/pop-revision/music/daybreak-solo-master.wav` in that repository. Generate it with the pinned music renderer and sample manifest.
- EGL libraries: the directory supplied through `DAYBREAK_EGL_ROOT` or `--egl`, containing the required `usr/lib` and Mesa configuration files.

All paths can be supplied explicitly. Prefer the WAV over gapless-decoded MP3 when creating a master. The renderer and audio reproduction manifest must belong to the exact frozen score, including its physical performance metadata. Do not relabel an older master manifest to bypass the final correspondence check.

## Motion sampling

Each native frame uses absolute score time `start + frame / fps`. No interpolated frames, altered camera easing, frame duplication, or playback speed changes are used.

`--samples 2 --shutter 180` evaluates two complete source poses/cameras within a centered half-frame shutter. It averages linear HDR color before applying the renderer's bloom, ACES and sRGB output. The shutter interval is clipped to the authored shot containing the frame timestamp, including when a camera cut falls within the interval. It never averages two shots. Four samples are also available, at proportional render cost.

Default single-sample rendering is the practical baseline. Native 30fps requires 25% more frames than 24fps. Two-sample blur approximately doubles the render work; use the short samples to judge whether that cost is worthwhile for the hands.

## Snapshot and resume guarantees

Preparation copies renderer, pose server, all performance TypeScript modules, score, character, material textures and lossless audio into an immutable scratch snapshot. It compiles the copied TypeScript, including `wrist-motion.ts`, without touching production compiled files. Authored cut boundaries come from the copied `Direction` implementation.

Source, dependency and wrapper hashes select the snapshot. Dimensions, frame rate, interval, shutter sampling and encoder settings select the job. New source or settings produce a new job rather than mixing cached frames. An original wrapper copy is pinned with each new snapshot so an older job can resume with its original exporter after the main wrapper changes.

Every completed chunk has a frame-count check and SHA-256. Chunk encoding uses closed GOPs; concatenation copies video packets without another lossy encode. Environment filtering is cached only when its hash and source fingerprint validate.

The exporter checks OpenGL errors after renderer initialization, validated environment restoration, every native sample's readback, and any final motion-blur composite readback. It adds no explicit GPU synchronization. Any error aborts immediately with its stage, frame/time where applicable, and GL error name; the encoder stops and the current partial chunk is discarded. Completed chunks and their hashes remain intact. An initialization error prevents a fresh environment cache from being certified. Errors are never cleared for a retry or ignored. Prepare a new job to use these checks; existing jobs retain their pinned wrapper.

The shared installed Three.js/TypeScript dependencies are read through a symlink; their recorded dependency hashes must remain unchanged. Preserve the snapshot and work directory for a long export. Scratch is transient: the root workflow must persist the final package and valuable checkpoints before ending or leaving the workspace idle.

## Timing and color

The master is sampled at 44.1kHz. The wrapper trims audio by integer sample indices, preserves gain and sample rate, and checks that the MOV's decoded PCM24 exactly matches the source interval. Delivery AAC alignment is checked by cross-correlation near the beginning, middle and end.

Video is CFR. A duration that is not an integer number of frames uses `ceil(duration * fps)` frames; the final video hold can extend beyond the audio by less than one frame. The current 227.101587-second master therefore needs 5,451 frames at 24 fps or 6,814 at 30 fps. Music is not stretched or padded to change its performance length.

Encoding uses CRF 17 H.264, the medium preset, and two encoder threads. FFmpeg zscale converts the renderer's full-range sRGB to limited-range BT.709 YUV; the output carries corresponding color tags. GPU-independent software rendering through llvmpipe is substantially slower than real-time playback. Use the measured reports rather than assuming real-time export speed.

The video wrapper truncates regenerated `renderer-cache/scene.json` to an empty placeholder after both processes have loaded it into memory. This prevents recovery maintenance from restoring an unnecessarily large deleted cache. It is not needed by frame rendering, resume validation, or environment-cache validation. Set DAYBREAK_KEEP_SCENE_JSON=1 when invoking render to retain this large interchange for diagnostics. Immutable source snapshots, extracted textures, environment NPZ/metadata, and output evidence remain available. Existing jobs resume their pinned wrapper; prepare a new job to use this cleanup improvement. The placeholder is regenerated before the next renderer initialization and is never used as an immutable source input.
