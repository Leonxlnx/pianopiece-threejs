# llvmpipe thread-count experiment

The bounded test favors `LP_NUM_THREADS=8` for one native renderer under the current eight-CPU quota. It averaged 2.194 seconds per 1920x1080 frame with the final-film settings of 30 fps, two temporal samples, and 180-degree shutter. Four threads averaged 3.186 seconds and one thread averaged 10.066 seconds. The measured run is CPU-bound, but it still scales materially through eight llvmpipe threads, so no wider thread sweep or multi-process test was run.

| LP threads | Mean wall/frame | Median wall/frame | Mean tree CPU/frame | Mean CPU/wall | 6,995-frame estimate |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 10.066 s | 9.561 s | 9.913 s | 0.98x | 19.56 h |
| 4 | 3.186 s | 3.211 s | 10.605 s | 3.31x | 6.19 h |
| 8 | 2.194 s | 2.052 s | 11.650 s | 5.26x | 4.26 h |

Each setting initialized a fresh native EGL renderer, rendered one warmup frame at 0.8 seconds, then rendered the same three presentation times twice: 159.3, 170.0, and 0.8 seconds. Timing covers both native HDR samples, temporal accumulation, post-processing, and RGB readback; PNG encoding was outside the timed section. CPU time is the sampled Python-and-Node process tree, corrected to use the host-visible PID. The cgroup quota was `800000 100000`.

All 18 measured frames passed the unchanged per-sample and composite GL guards with `GL_NO_ERROR`. Decoded RGB SHA-256 values matched exactly across all thread counts and both repeats for each presentation time:

- 159.3: `40c8738501ea60b1bcd6ca695d6e199304ca2cf93fd5e367353b143869bb61ec`
- 170.0: `9647ebfdd8239f3c0a86425a9599586e02bca48c8b9eaa30f553d81bff4c8f64`
- 0.8: `0b38150a608999ce7c552a299f7254115a63fb58f67c1b6c953d94e3a19b6822`

The source was the existing immutable snapshot `dc1a0bfe8fa61c9ad36be8f82b2fd402cc2c076ad407a3c540c4328b8a4e82b0`; its sources, compiled modules, dependencies, and pinned wrapper were hash-checked before each run. The experiment wrote only to `render-recovery/throughput`. It made no quality or source reductions, did not edit the checkout or snapshot, and did not start another film render.

Raw per-frame records and PNG hashes are in `lp1.json`, `lp4.json`, and `lp8.json`. `SUMMARY.json` contains the aggregate result.

After the run, `lp8-t170.000-r2.png` was found truncated even though its synchronous-save hash had already been recorded. Its recorded decoded RGB hash matched all five other 170.0-second results. The redundant file was restored byte-for-byte from `lp8-t170.000-r1.png`, whose decoded pixels and expected PNG hash were identical, and all 18 PNGs were then fully decoded and rechecked against both recorded hashes. This did not change any timing or renderer result.
