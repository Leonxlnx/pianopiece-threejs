This bounded check covers 169.885523–175.189552 seconds of the integrated performance: two complete bars, Am9 then G/B, leading into C6. The score's actual section energy and pedal-position function drive the poses. No source, character, rig or score edit was made.

The captured performer source is SHA-256 `fedec1a81e52ccfc87527b3522100d8a6facd2674b6ed2a7b145e50f48cdc184`, with score `b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773` and the accepted tailored GLB. Full dependency hashes are recorded in `report.json`.

The numerical pass contains 638 samples at 120 Hz. It checks stable torso/head/hair/leg motion and 1,611 garment probes without arm/hand weights. The twelve visual poses use the complete production update from that captured source; hand endpoints are present only for context and are outside this review.

| Measurement | Result |
| --- | ---: |
| Head vertical range over the phrase | 6.54 mm |
| Head maximum displacement between 120 Hz samples | 0.943 mm |
| Head maximum rotation between adjacent samples | 0.149° |
| Head orientation change from phrase start | At most 7.70° |
| Head maximum shift across a 20 μs window at authored boundaries | 0.00230 mm |
| Hip vertical and forward displacement | Exactly zero |
| Hip lateral range | 6.26 mm |
| Seated garment probes | 94 |
| Largest vertical range of one seated garment probe | 1.063 mm |
| Largest garment-probe displacement between 120 Hz samples | 1.123 mm |
| Ponytail-root local rotation change | Exactly zero |
| Left heel geometry movement | Exactly zero |
| Right heel bottom vertical range during pedal action | 0.139 mm |

These measurements show continuous, restrained motion through the phrase rather than a timed torso or garment jump. The head's larger change is a gradual lean/turn; its vertical movement is small. The existing hair helper bends the free chain while its root remains attached. The fixed hip height and low seated-cloth variation maintain the seat contact.

Absolute contact geometry has the existing approximations of the current model: the left heel bottom is at y ≈ 0.001 m, the right heel bottom is at y ≈ -0.00154…-0.00167 m, and the lowest selected garment point within the cushion footprint is at y ≈ 0.46995 m while the cushion top is at 0.4975 m. These are small sole overlap and seated cushion overlap, not simulated compression. Their stability should not be described as exact collision or cloth-physics validation.

`phrase-strip.jpg` places twelve successive poses in chronological reading order, with exact score times. The neutral diagnostic view includes the bench, shoes and a limited instrument context. It uses the actual skinned character, materials and generated concert shoes, with a simple floor and neutral lighting. It is not a product-room lighting match, real-browser check, frame-rate measurement or listening pass.

Visual inspection of the completed twelve-frame strip supports the numerical result: the torso moves through a mild gradual lean, the head stays restrained, the ponytail remains attached, and the garment silhouette remains coherent around the waist, sleeve and knees. The seated contact and heels appear stable across these sampled poses. No additional character change is proposed. The strip samples the phrase at approximately 0.482-second intervals; the denser numerical trajectory supplies the continuity evidence between those stills.

`check-phrase.mjs` snapshots and transpiles the relevant production modules outside the checkout, performs the numerical pass, and exports compressed frame geometry. `trajectory.json.gz` contains the compact numerical path. `render-strip.py` renders from compressed pose data in memory and assembles the strip; it uses `../render_character.py`. Intermediate posed-geometry archives can be regenerated and removed after rendering to conserve space. Scripts, reports, compiled source snapshots and rendered evidence should be retained.

Reproduce with the existing project dependencies:

```bash
node /workspace/scratch/2e8cc8e77f98/character-assets/phrase-check/check-phrase.mjs
env LD_LIBRARY_PATH=/workspace/scratch/2e8cc8e77f98/render-libs/root/usr/lib/x86_64-linux-gnu \
  __EGL_VENDOR_LIBRARY_FILENAMES=/workspace/scratch/2e8cc8e77f98/render-libs/root/usr/share/glvnd/egl_vendor.d/50_mesa.json \
  LIBGL_ALWAYS_SOFTWARE=1 \
  python /workspace/scratch/2e8cc8e77f98/character-assets/phrase-check/render-strip.py
```
