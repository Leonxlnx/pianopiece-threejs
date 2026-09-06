# Native 1080p30 storage budget

The exact frame/audio arithmetic is known. Final CRF17 video size is variable, so the table states bitrate assumptions explicitly. These are additional bytes required after the current disk baseline, including a new frozen snapshot and its WAV.

- 6,995 frames at 30fps: 233.166667 seconds of CFR video.
- 10,281,660 stereo samples at 44.1kHz: 233.144218 seconds of audio.
- WAV file: 61,690,284 bytes; PCM24 payload in MOV: 61,689,960 bytes.
- The planned 60-frame chunks produce 117 chunks and 351 review JPEGs.
- The wrapper streams RGB to FFmpeg; it does not store the 43514496000 bytes of full-film raw RGB.

| Chunk frames | Video assumption | Steady render | Late initialization | Assembly peak | Peak + 1 GiB margin |
|---|---:|---:|---:|---:|---:|
| 60 | 14.3 Mbps | 0.773 GiB | 1.023 GiB | 2.003 GiB | 3.003 GiB |
| 60 | 20 Mbps | 0.928 GiB | 1.178 GiB | 2.622 GiB | 3.622 GiB |
| 60 | 30 Mbps | 1.199 GiB | 1.449 GiB | 3.708 GiB | 4.708 GiB |
| 24 | 14.3 Mbps | 0.983 GiB | 1.233 GiB | 2.214 GiB | 3.214 GiB |
| 24 | 20 Mbps | 1.138 GiB | 1.388 GiB | 2.833 GiB | 3.833 GiB |
| 24 | 30 Mbps | 1.409 GiB | 1.659 GiB | 3.918 GiB | 4.918 GiB |

The 60-frame, 30 Mbps scenario requires 3981589729 additional bytes before a discretionary 1 GiB reserve. Five GiB free before preparing the full job remains a practical target. The 24-frame option stores 225,750,000 more bytes of review JPEGs under the same image-size assumption.

Assembly retains four copies of the video payload, plus AAC in the delivery MP4 and unchanged PCM24 in the MOV. The model additionally allows 90 MiB for the frozen source/WAV snapshot, 12 MiB for renderer caches, 20 MiB for traces and metadata, 430,000 bytes per review JPEG, and 128 MiB for container/filesystem overhead. A 256 MiB scene interchange allowance is counted only during initialization; it is deleted before assembly.

Current available space at 2026-09-05T21:16:29Z: 2406404096 bytes (2.241 GiB). This is a momentary shared-disk reading, not a reservation. Root is applying a separately enumerated cleanup once because deleted files and hard links were restored after this agent’s cleanup. No durable savings are claimed here.

The final source WAV is already part of the occupied baseline if it exists. If a new original WAV is still to be created, add another 61,690,284 bytes while it coexists with existing originals. The new snapshot WAV is already included in the model. Audio validation decodes into memory, so it adds no full-length audio files on disk.

The direct-upload checkpoint plan stages no duplicate chunk archive. Save frozen inputs once, then existing completed MP4s and small metadata bundles in increments. Preserve local chunks for final assembly; no encoded media deletion is proposed. No uploads, native rendering or new tests were performed.
