# Resumable export checkpoints

Use one frozen input checkpoint, then upload newly completed MP4 chunks directly from their existing paths. Do not repeatedly archive the whole work directory. This avoids another local copy of the video and omits regenerated scene, texture, environment, and raw pixel buffers. No upload or checkpoint package has been created by this audit.

## One input checkpoint after the final job is prepared

Preserve the job's exact `job.json`, the entire immutable source snapshot including its `snapshot.json`, original pinned `export-wrapper.py`, source and compiled modules, score, character and texture assets, `cuts.json`, and audio reproduction manifest. Include the final WAV once, or reference an already saved exact WAV by its Library identity and SHA-256. Never include the WAV again in incremental chunk checkpoints. The representative existing snapshot is 86,708,607 logical bytes, including its 61,690,284-byte WAV; the final snapshot may differ slightly.

Preserve a small recovery document with the original absolute job/snapshot paths, source fingerprint, wrapper hash, renderer hash, dimensions, frame rate, chunk size, sampling settings, dependency hashes, Python/ModernGL/Node versions, and EGL environment. The current wrapper embeds absolute snapshot and dependency paths. Its supported recovery is to recreate those recorded paths and the `node_modules` link, then run its normal integrity checks. Relocation to different paths would require a separately reviewed migration; do not edit hashed manifests to make them pass.

The installed Three.js and TypeScript packages are external to the snapshot. Root should retain their exact package copies once if equivalent runtime persistence is not already available. Preserve the extracted EGL runtime or its original package assets once, plus Python dependency/version information. Do not duplicate the entire checkout or Python environment with every checkpoint. Source files and compiled modules alone do not make a lost runtime executable.

If a small input archive is convenient, create it once with relative archive names and an explicit file list; exclude the `node_modules` symlink and record its intended destination in recovery instructions. Remove only that temporary archive after the save succeeds; keep the immutable source paths intact. This requires roughly 83 MiB transient storage with the WAV included, or roughly 24 MiB when the exact WAV is already saved separately.

## Incremental completed chunks

Choose chunks only after both their final `.mp4` and success `.json` exist and the existing `good_chunk` hash/count/source checks pass. A `.partial.mp4`, or a final MP4 without success metadata, is not a resumable checkpoint. Whole chunk indices remain their global frame indices, even when climax chunks are rendered first.

For each increment, upload the existing final MP4 files directly. Add one small immutable JSON bundle containing the corresponding full chunk metadata and frame traces, original relative paths, file sizes and SHA-256 values, job/source fingerprint, wrapper hash, and the exact completed frame ranges. Include selected JPEG review images only when they add useful evidence. Encoding logs can be included as text; do not include regenerated renderer caches.

An increment of up to 19 MP4s plus one metadata bundle fits one prepared batch of 20 files. With 60-frame chunks at 30fps, 19 chunks cover 38 seconds and approximately 95 MB at 20 Mbps or 142.5 MB at 30 Mbps. Those video bytes already exist locally; direct uploads add only the small metadata bundle. Smaller increments of 4–8 chunks protect progress sooner during a long render without re-uploading earlier chunks. Rendering may continue on another partial chunk while these completed files remain immutable.

For the planned 117 chunks, there are seven increments at the 19-chunk maximum. A prepared upload helper can accept the ordered task batch and split its own calls into groups of at most 20 files. Inspect every per-file result. Retain each returned Library identity, version and local source path. Advance a small checkpoint index only for confirmed successful saves; do not mark an uncertain transfer durable or automatically repeat it. Root owns Library folder creation, uploads and checkpoint index updates.

## Recovery

Restore the frozen inputs and exact runtime dependencies to the recorded paths. Download the completed chunks into their original `chunks/` filenames and expand their metadata/trace bundle back to matching `.json` and `.frames.jsonl` files. The existing wrapper `status` / integrity checks then identify valid completed chunks, and `render` processes only missing ones. Source fingerprint, global timestamps, filenames and final assembly order remain unchanged. Optional priority flags may be repeated without changing the job.

Retain local completed chunks for normal final assembly. No local media deletion is proposed by this audit. If space later requires offloading already saved chunks, the current wrapper will treat absent chunks as pending and final assembly requires them back locally, so any offload policy must explicitly account for that behavior.

## Final deliverables

Save the final H.264/AAC MP4, H.264/PCM24 MOV, exact WAV, reproduction/validation reports, and a final checkpoint index. Upload those existing media paths directly. The retained chunks are the resumable render record. `video-only.mp4` is an intermediate duplicate created by assembly; this audit retains it as requested and includes it in the peak space budget.
