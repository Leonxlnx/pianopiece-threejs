# Daybreak native renderer recovery

Native offline rendering is restored on Ubuntu 24.04 / Python 3.12.13 / Node 24.19.0. The measured context is OpenGL 4.5, Mesa 25.2.8, llvmpipe LLVM 20.1.2. This is a native rendered export, not a browser capture.

## Repeat setup and frame

```bash
cd /workspace/scratch/2e8cc8e77f98/render-recovery
./setup.sh
./run-single.sh --project /workspace/sites/daybreak-piano-film --width 960 --times 26.05
```

`setup.sh` checks exact Python versions in requirements.txt, locally installs only missing packages, verifies the two pinned Ubuntu packages, extracts them under `egl/`, and checks the real EGL context. It reuses the installed Mesa/Gallium/LLVM stack; it does not install system packages. The added Python/EGL/deb footprint is 1,893,360 bytes as measured in resources.json. Existing numpy/Pillow/scipy are reused. Node dependencies are supplied by the project owner.

Sources: [Ubuntu libegl1 package](https://packages.ubuntu.com/noble/amd64/libegl1/download), [official Ubuntu Mesa package](https://archive.ubuntu.com/ubuntu/pool/main/m/mesa/libegl-mesa0_25.2.8-0ubuntu0.24.04.2_amd64.deb). Exact hashes are in debs/SHA256SUMS. This setup requires the matching installed Ubuntu Mesa 25.2.8 driver; it deliberately rejects a different version so a mixed driver stack is not silently accepted.

For the full export wrapper after final score/master freeze, source env.sh before Python and pass `--egl "$DAYBREAK_EGL_ROOT"` to its render command. Preserve the wrapper's `--audio` argument and final master-score match requirement. No final film was prepared or rendered here.

## Source and guard integrity

`run-single.sh` snapshots all current performance TS modules, required assets, the renderer and pose server, compiles inside scratch, and symlinks the project's existing node_modules. It calls the unchanged export wrapper's renderer_module/check_gl/close_renderer. Strict initialization, environment-cache restoration and frame/readback GL checks abort on any error; cache certification remains unchanged.

Original source hashes retained:

- render-revision.py: bacdd838f61c2ef83ee45c879859f53288db633b7d682dcabbd74f488e2a8f71
- export_video.py: a093d7bd64786dde35d2a9dd67e61e7023fc3f0a5e42944cdf8a3994d7cd9bca

Snapshots contain source-manifest.json. Review reports contain exact source/dependency hashes, camera, frame time, GL result, PNG SHA, timings, and sampled process-tree RSS. No checkout source was edited by this leaf.

Optional review changes are applied only before snapshot compilation: `--pianist-source PATH`, `--piano-source PATH`, and `--camera top|oblique|arms-front|arms-side`. Camera overrides patch only the scratch pose server. A report's originalSourceSha256 describes the checkout; sourceSha256 describes what actually rendered. Only pianist.ts differs between the paired compact-thumb and baseline hand snapshots, verified by check-pairs.py.

## Review inventory

Each hand folder below has current-960-11.700326.png and current-960-224.250000.png, plus report-960.json.

| Content | reviews subfolder |
| --- | --- |
| Root baseline authored camera, time 26.05 | 9ab8537c947aefb0 |
| Root baseline top | f7243b797448ce32 |
| Compact idle-thumb candidate top | 5319ccb9528cef71 |
| Root baseline oblique | 4299e4913c07e036 |
| Compact idle-thumb candidate oblique | fd7224cc41c9be11 |

Candidate source: /workspace/scratch/2e8cc8e77f98/hand-runtime/pianist-compact.ts. All images are 960x540. Real scene: 1,091 meshes; 14 deformed meshes including Human with 24,629 vertices. Top images expose thumb web and spacing; oblique images show the keyboard and hand posture. These stills do not certify continuous motion or triangle clearance.

```bash
./run-single.sh --width 960 --times 11.700326,224.25 --camera top
./run-single.sh --width 960 --times 11.700326,224.25 --camera top --pianist-source /workspace/scratch/2e8cc8e77f98/hand-runtime/pianist-compact.ts
python check-evidence.py
python check-pairs.py
```

## Measured resource limits

The first full pavilion initialization took 15.951 seconds and the 26.05 frame took 2.167 seconds including PNG save. The cached repeat took 9.456 seconds to initialize and 1.627 seconds for the frame. Current hand-review frame measurements range from 0.622 to 1.444 seconds; shared CPU load varies. A later cached initialization took 24.873 seconds under concurrent workload. These are 960-pixel timings and do not establish 1080p full-film throughput.

Sampled Python+Node process-tree RSS for the five recorded reports is about 0.807–0.846 GB; process sampling is every 0.1 seconds, so short peaks may be missed. The first attempt to measure memory used namespace PIDs against a host /proc mount and returned zero; it was corrected and the baseline repeated. resources.json contains the corrected measurements. Current storage is recorded separately for only these five snapshots, excluding other agents' concurrent work.

One early baseline-top PNG did not match its recorded checksum during verification. That pair was rerendered using the same immutable source and cache, then all nine current PNG checksums and the eight paired source/camera/time records passed. No mismatched image was accepted.
