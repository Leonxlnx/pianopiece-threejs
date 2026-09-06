# Static piano geometry batching candidate

Candidate only; no checkout changes or publication. The root agent owns integration.

`static-piano-batching.patch` applies to `app/performance/piano.ts` baseline SHA256 `26d8a7d24ce647a4dd0333d55e8eb5bd002b528443e83f3b8ed0e17c775a77fb`. Candidate source SHA256: `6e9d1ad46e2fa1e479a47eed9a6bd0eaf80f33f48079ac8c97ff54b3579907ee`.

The stationary opaque piano shell, lid, plate hardware, legs and bench are consolidated by material identity, cast/receive-shadow flags, render order, layer mask and vertex attribute layout. Original transforms are applied to cloned geometry in piano-root coordinates. Indexed and non-indexed sources retain their vertices; mixed buckets gain identity indices. Only buckets with at least two meshes are replaced.

All seven InstancedMeshes remain untouched, including the two key batches and three damper batches. All three pedal roots and their descendants remain untouched. The 88 hidden original key meshes and their Map/pivot references remain available for exact geometry audits. Lines and transparent maker lettering are excluded. Current runtime has no other animated or externally retained stationary piano meshes.

Every merged batch has `userData.sourceParts`: original name, geometry type, source traversal order, vertex/index starts and counts, and original local matrix. This keeps interior diagnostics possible without storing duplicate geometry. Source geometries are disposed only after checking that no surviving/protected mesh shares them. Materials and textures remain owned by surviving meshes and the existing scene disposal path.

## Measured geometry and runtime state

See `verification.json` and `draw-views.json`.

- Static meshes: **99 → 15**; static triangle count remains **36,316**.
- All 36,316 transformed triangles matched one-to-one, including materials, shadow flags, winding and UV coordinates.
- Maximum transformed position component difference: **0.000115 mm**, due to float32 baking; normalized normal component difference ≤ **3.58e-8**; UV difference **zero**.
- **992 score snapshots**: key instance matrices, hidden key world matrices, key contact values, damper matrices, pedal matrices and active-note lists are exactly unchanged.
- No live geometry was disposed during consolidation.
- Standalone TypeScript check passes using the complete copied performance module directory.

## Main-pass submission count and memory tradeoff

Counts follow the installed Three r183 `WebGLRenderer.projectObject` visibility, camera layer, frustum and material/group rules. Every InstancedMesh is counted as one draw submission regardless of instance count; offline exported instance expansion is not used. These are **structural main-pass counts**, not measured browser `renderer.info`, browser FPS, or a full multi-pass GPU profile.

Across 24 authored shots × 3 times × 2 aspect ratios (144 views):

| Piano submissions | Baseline | Candidate |
| --- | ---: | ---: |
| Minimum | 23 | 19 |
| Maximum | 111 | 27 |
| Mean | 83.22 | 25.82 |

Every sampled view has fewer submissions. Consolidated bounding spheres keep some otherwise-culled triangles submitted: +2,394 triangles per view on average; worst +7,744 in the portrait inner-voice angle (77,500 → 85,244 piano triangles). Triangle content itself is unchanged.

Persistent typed-array storage, including hidden audits and instance matrices, rises **120,360 bytes**: 6,027,692 → 6,148,052 bytes (+2.0%). The provenance metadata serializes to **20,154 bytes**. JavaScript object memory and transient constructor cloning were not measured; old source geometry and temporary clones are released before construction returns. There are 84 fewer retained Mesh/geometry objects.

## Render review

Paired 960×540 EGL frames use the same copied scene, score, model, lighting, material textures and current offline renderer. `render-source-hashes.json` records inputs. The copied renderer adds lossless PNG output solely for pixel measurement before JPEG encoding. The source renderer remains an approximation of Three's live WebGL pipeline, so this is not browser playback QA.

`pixel-comparison.json` and `wide-comparison.jpg` / `interior-comparison.jpg` contain the exact metrics and side-by-side/difference views. Floating-point transform baking can alter isolated edge pixels; geometric parity does not imply byte-identical rasterization.

## Reproduction

Run from this directory, with its `node_modules` symlink pointing at the installed project dependencies:

```sh
python make-candidate.py
node compile.cjs
node verify.mjs
python render-pairs.py
python compare-pixels.py
```

`prepare-render.py` copies all current performance source and the three QA renderer files into scratch before replacing only `piano.ts`. Public assets are linked to the checkout and should be frozen while paired frames run. The render job uses software EGL and is finite: opening wide and one piano-interior frame, baseline and candidate. No full film is started.

Render result: opening changed 15/518,400 pixels (80.24 dB PSNR); interior changed 20/518,400 pixels (75.91 dB). Side-by-side and amplified differences were inspected; changes are isolated raster edge samples. Captured and filtered environment arrays matched exactly, and score/model hashes stayed unchanged. Reproducible mesh/texture/environment intermediates were removed after verification; see `cleanup.json`.
