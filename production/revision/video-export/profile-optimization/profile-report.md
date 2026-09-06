Native 1920×1080 profile, four llvmpipe threads, current frozen source 633cd937d0aa0660 (rig e85f / score b156). Profile uses ctx.finish at stage boundaries; it is for attribution, and its wall times include shared CPU contention during a separate camera sweep.

| Phase | Wide at 6s | Hands at 26.05s | Side at 138s |
|---|---:|---:|---:|
| Pose roundtrip | 1.541s | .398s | .238s |
| JSON decode | .038s | .027s | .008s |
| Deformation decode and upload | .056s | .091s | .013s |
| Two 2048² shadow passes | 1.950s | 1.947s | 2.122s |
| Opaque scene draw | 8.417s | 6.727s | 8.321s |
| Transparent draw | .233s | .002s | .139s |
| Lines and particles | .011s | .003s | .011s |
| Native 4×MSAA resolve | .076s | .028s | .048s |
| Bloom, tone map, sRGB | .554s | .266s | .376s |
| RGB readback | .010s | .006s | .009s |

Scene: 1,175 mesh entries, 842,968 vertices; 75,255 deforming vertices. CPU skin normals dominate pose generation, but main rendering dominates the whole frame. Exact export H.264 encoder test (24 copies of one native frame) averaged .374 s/frame under concurrent load; this includes encoder startup/drain and is not a motion-content throughput estimate.

All performance optimizations are evaluated separately from correcting the existing ModernGL depth-mask API misuse. Baseline is opaque `GL_LESS`, verified from live GL state. A prepass needs `GL_LEQUAL` and may alter coplanar ties, so it is experimental until image comparison.

Candidate screen at the same frozen wide shot:

- branches: {'baseline': 9.50234780000028, 'branches': 9.394971569003246}; changed RGB channels 13, largest difference 1/255.
- shadows: {'shadows': 6.0828563410032075, 'baseline': 7.153920550998009}; changed RGB channels 0, largest difference 0/255.
- prepass: {'baseline': 4.644306927999423, 'prepass': 8.623432317996048}; changed RGB channels 2542, largest difference 42/255.
- all: {'all': 5.402423951003584, 'baseline': 7.392286221001996}; changed RGB channels 2555, largest difference 42/255.

Reject the prepass: changed coplanar-edge coverage and increased cost in its isolated pair. Reject branch-only shader rewrite: negligible measured benefit. Keep static stage shadow caching for repeated confirmation: RGB, HDR and both full depth textures were bit-identical in the initial pair. Absolute time still varied; alternating repeated pairs are required.

Corrected static-shadow cache: ModernGL copy_framebuffer was demonstrated to copy color only. An explicit depth-only nearest GL blit in the same EGL context fixes it; see verify_depth_copy.json. Rejected first implementation is retained separately as rejected-color-only-copy.json.

Six repeated alternating pairs over 6s/26.05s/138s are bit-identical in native RGB, HDR, and both 2048² shadow depths.

| Shot time | Round | Baseline seconds | Cache seconds |
|---|---:|---:|---:|
| 6.0 | 1 | 6.989 | 8.149 |
| 26.05 | 1 | 9.974 | 8.765 |
| 138.0 | 1 | 13.663 | 8.428 |
| 6.0 | 2 | 10.443 | 5.785 |
| 26.05 | 2 | 16.119 | 9.421 |
| 138.0 | 2 | 9.480 | 11.095 |

Aggregate mean 11.111 → 8.607 s; 22.5% less wall time (1.291×). Individual timings vary substantially despite avoiding other team EGL renders, so this is evidence of a useful optimization, not a guaranteed full-film completion estimate. Pose messages were frozen; live pose generation and encode were separately profiled above. No resolution, MSAA, shadow size, material, sampling, camera or animation changes.

Separate fidelity correction: ModernGL 5.12 exposes depth_mask on Framebuffer, not Context. The old ctx.depth_mask assignments had no GL effect. The proposed patch enables depth writes before every opaque/shadow target clear, disables them during glass/particles, and restores them afterward, including environment capture. It is deliberately separate from the bit-identical optimization.

Native before/after views at 6/105/170 seconds were inspected. Corrected room capture changes reflected lighting; mean absolute RGB differences are .976/.145/.141 levels of 255, maxima 12/2/1. All targets restore writable depth after each frame. Detailed images and numbers are in depth-mask-proof/. The rebased patch preserves the integrated static shadow cache, whose own depth targets already explicitly enable writes.

Wrapper hygiene: after initialization, the generated scene.json interchange is no longer referenced by frame(), the Node pose loop, resume checks, or environment-cache checks. New video jobs remove it by default. DAYBREAK_KEEP_SCENE_JSON=1 retains it for diagnostics. Old jobs retain their original pinned wrapper behavior; source snapshots and environment data remain reproducible.

Final integration smoke passed on renderer 627e1c702281de955e56f8e86f7a96aa05b66dd963afe0a160c0483858748f84, rig fedec, score b156, wrapper 14c03508. Two native 1080p24 frames at 170s and 170+1/24s rendered through the actual pinned wrapper. First frame built the stage cache; second reused it. Both ended with writable main/shadow depth and GL_NO_ERROR. Generated scene.json was removed after initialization. H.264 frame count/decode passed; MOV PCM24 exactly matches the selected WAV samples; AAC alignment lag was zero. A repeated render command returned alreadyComplete with zero new frames.

Integration job and two-frame codec smoke outputs: ../work/jobs/bf61155d4ae94ce1/. Full results are copied into integration-summary.json. This is an integration/codec smoke, not a motion-quality clip. Initial interrupted attempt produced no completed chunk; instrumented retry completed. The provisional score/master hash mismatch still prevents final assembly. No full film was started.
