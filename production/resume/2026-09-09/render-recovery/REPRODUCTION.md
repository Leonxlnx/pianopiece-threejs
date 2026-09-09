# Native renderer smoke reproduction

From `/workspace/scratch/2e8cc8e77f98/render-recovery`:

```bash
./setup.sh
./run-single.sh \
  --project /workspace/sites/daybreak-piano-film \
  --width 960 \
  --times 12.53 \
  --camera oblique
python check-evidence.py reviews/7f1ad0395c7f05d4/report-960.json
```

The recovery copied the pinned setup, environment, renderer wrapper, and evidence checker byte-for-byte from `production/resume/renderer`. `setup.sh` locally installed the pinned Python wheels, verified both downloaded Ubuntu package hashes, extracted EGL into this scratch directory, and confirmed `GL_NO_ERROR`. Project Node dependencies came from the root-owned official install and were symlinked only into the content-addressed snapshot by the unchanged wrapper.

The render produced `reviews/7f1ad0395c7f05d4/current-960-12.530000.png` at 960x540 with image SHA-256 `c4c76c3b96ed6c3484aaace9e2565adfc7c4f651bda21fd0199b9346f5b8f28b`. Initialization took 11.242 seconds; frame/readback/PNG save took 2.087 seconds. Sampled process-tree RSS was about 0.841 GB. The image was visually inspected and shows the oblique performer/keyboard view for shot `A window opens`.

Complete source, asset, dependency, compiled-module, camera, geometry, GL, timing, and memory provenance is in `reviews/7f1ad0395c7f05d4/report-960.json` and `snapshots/7f1ad0395c7f05d4/source-manifest.json`. The renderer and strict export wrapper hashes match the accepted originals. No checkout source was edited and no final film was started.
