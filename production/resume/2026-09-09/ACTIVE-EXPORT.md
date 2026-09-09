> Half-render checkpoint saved:3540 frames in total, with the second archive containing1740 additional frames. Its durable ID is libfile_f4bd0be61ed081919a5dfb4954c5f5b7. Read current.json and the live job progress for the latest state.

# Active export checkpoint

The revised public Site, exact-score master, 34-second preview and GitHub source are delivered. The complete 3:53 film is still rendering. Do not confuse the preview with the full film or restart an already-running render.

Full job: `/workspace/scratch/2e8cc8e77f98/final-film-5c-2026-09-09/jobs/e6d834d83ee1afc6`.
Source snapshot: `eac8bd113e050acf`. Exact manifest: `film-checkpoints/snapshot-manifest.json`.

The original render process is running with LP_NUM_THREADS=8, 1080p/30fps/two temporal samples. The first 158–192s interval is complete; it now renders the remaining piece chronologically. Completed chunks have hash-bound metadata. Read `delivery-progress.json` in the job and the parent `render.log` for actual current state.

`finish-film.py` waits for the real renderer completion report, runs the pinned guarded assembler, compares every decoded frame in order, then saves `/workspace/scratch/2e8cc8e77f98/Daybreak-revised-full-desktop.mp4`. Its receipt/progress files in the job are authoritative; do not claim completion before they succeed. Do not start it again if an output/save receipt already exists.

`checkpoint-film.py` saves nonoverlapping rendered chunks at25/50/75 percent. The first checkpoint contains1800 frames and is saved as libfile_74c57fada72c8191a72d843f71e06a2e. Its receipt and exact hashes are under `film-checkpoints/`. It contains derived chunks and binding metadata, not another copy of the repository source. Restore source from GitHub and the separately saved exact WAV if recovery is required.

Current root tool sessions in this live environment: render20479; finish60171; checkpoints12126. These handles are not portable. Inspect processes/logs before starting duplicate jobs after an interruption.

The final source/publication and critical-listening/live-WebGL limitations are in `context/DELIVERY-2026-09-09.md`. Native encoded camera midpoints reviewed so far are0,1,14,15,16,17,18, plus the dedicated corrected climax witnesses and preview endpoints. The remaining camera coverage and final MP4 delivery still need review. Do not claim every anatomical gate passed.
