# Gates: Offline renderer recovery

Scope: Restore native software EGL and produce one 960-pixel current-scene frame without editing the checkout or weakening GL checks.

- [x] G1: Reproducible Python/EGL setup creates a GL 3.3+ context and reports GL_NO_ERROR.
  CHECK: /workspace/scratch/2e8cc8e77f98/render-recovery/check-runtime.sh
  EXPECT: GL_NO_ERROR
  EVIDENCE: {"renderer": "llvmpipe (LLVM 20.1.2, 256 bits)", "version": "4.5 (Core Profile) Mesa 25.2.8-0ubuntu0.24.04.2", "error": "GL_NO_ERROR"}

- [x] G2: The real current scene renders a 960-pixel frame with the skinned performer and strict GL checks.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/check-evidence.py
  EXPECT: FRAME_PASS
  EVIDENCE: FRAME_PASS: 960x540, skinned Human, GL_NO_ERROR, source/guard hashes recorded

- [x] G3: Timings, memory/disk footprint, pinned requirements, environment and repeat command are recorded.
  EVIDENCE: README.md records pinned setup and repeat commands; requirements.txt pins five packages; resources.json records corrected per-report timings and RSS plus setup and snapshot/review disk bytes. setup.sh rerun passed with no download.

- [x] G4: Generated image is visually inspected and returned to root for hand/arm review; checkout renderer and export GL guards remain unchanged.
  EVIDENCE: Visually inspected authored26.05, paired224.25top and11.700326oblique; sent root exact image paths. Checkout renderer SHA bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71 and wrapper SHA a093d7bd64786dde35d2a9dd67e61e7023fc3f0a5e42944cdf8a3994d7cd9bca equal accepted originals.

- [x] G5: Root baseline and isolated compact-thumb candidate have matched top and oblique hand views at 11.700326 and 224.25 seconds, with full source/camera provenance and GL_NO_ERROR.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/check-pairs.py
  EXPECT: PAIRS_PASS
  EVIDENCE: oblique paired source/camera/time/GL/image provenance passed | PAIRS_PASS: 8 images, 2 exact cameras, 2 score times, only pianist.ts differs
