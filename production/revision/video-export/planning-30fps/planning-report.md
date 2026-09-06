Plan roughly 13–20 hours for the 6,995-frame native 1080p30 export under the measured shared CPU conditions. The four-frame sample projects 12.4–13.6 hours using its mean/median plus a prior 0.4-second encoding allowance; the wider planning range allows load and shot variation. This is not a full-film benchmark.

| Score time | View | Frame time | Python RSS | Shared CPU cores used |
|---|---|---:|---:|---:|
| 6.00s | First light | 6.563s | 0.928 GiB | 7.98 / 8 |
| 26.05s | Hands · the theme | 7.662s | 0.936 GiB | 7.99 / 8 |
| 64.00s | Across the strings | 6.609s | 0.936 GiB | 7.95 / 8 |
| 170.00s | A new breath | 3.097s | 0.944 GiB | 7.15 / 8 |

The first frame built the static shadow cache; the other three reused it. Initialization took 53.8 seconds on the measured cached-environment run. Every useful measured frame reported GL_NO_ERROR. The source has 1,091 mesh entries and 842,968 vertices after piano batching. Measurements pin renderer 627e1c70, piano 6e9d1ad4, pianist fedec and score b156. There were no audio copies or audio renders, and no full export was prepared or launched.

Python RSS was 0.93–0.94 GiB. A separate run of the exact frozen Node pose server reported 0.41–0.42 GiB during the four poses, with a 0.954 GiB startup peak. Estimated steady combined memory is about 1.36 GiB; the sum of separate process peaks is about 1.90 GiB. These are separate process measurements because child /proc memory is unavailable here. Shared cgroup memory and CPU usage also include other tasks; CPU quota throttling was frequent.

The first fresh-start attempt exposed a concrete GL lifecycle bug. Environment capture/filter completed without errors, then the first static-shadow depth framebuffer allocation raised GL_INVALID_OPERATION. The capture code had deleted the framebuffer still tracked as bound. When a new framebuffer reused a different freed ID, ModernGL attempted to restore the deleted binding. A 4×4 reproduction demonstrates both the failing and repaired sequences.

The minimal fix binds the persistent main framebuffer with fbo.use() before deleting the temporary capture targets. Per-call GL checks on a fresh full-resolution initialization, first shadow build and second cache reuse now all pass. Repeated shadow depth values are bit-identical, and the prefiltered environment atlas is bit-identical before/after the fix. No error flags were ignored; no additional native camera frames were used for this verification. The original failed attempt is excluded from timing results.

For 30 fps, the current assembly workflow needs about 2.95 GiB at a 20 Mbps video planning rate, or 4.03 GiB at 30 Mbps. This includes retained chunks, video-only concatenation, final MP4, PCM MOV, original/frozen WAV copies, runtime inputs, transient scene data and up to 876 JPEG review frames with 24-frame chunks. Keep about 5 GiB free for margin. Free space at this report: 3.91 GiB; other tasks continue to change it.

Evidence: measurement-911870882ae92597/measurement.json and its four frame JPEGs; node-memory.json; space-budget-30fps.json; released-framebuffer-repro.json; fresh-gl-diagnostic/gl-error.json; fresh-gl-fixed-diagnostic/passed.json; fresh-environment-binding-fix.patch. The visual-only source snapshot shares only verified immutable inputs and contains no audio. Reproducible scene interchange files were removed; cleanup is recorded in interchange-cleanup.json.

The verified fix is integrated as renderer SHA-256 bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71. Completed renderer-cache directories were removed after retaining immutable visual inputs, all four native images, and the identical before/after environment proof archives. No measurement or diagnostic renderer is still running.
