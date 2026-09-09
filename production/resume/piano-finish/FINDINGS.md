# Lid underside material diagnosis

The near-black material replacement is effective. The beige appearance is reflected scene light at grazing incidence, not stale material serialization, wrong geometry, hidden wood, or a stale render cache.

Frozen root source `candidate-baseline.ts`: `d58f11ba3db81dd6e17f1eac654e7187254100775c1d2fdc9e6e78b5fb9e3701`. Snapshot `e01845f34906e664` matches that source exactly. Four representative beige pixels first intersect mesh1056/material24 (`Lid interior lacquer`) with linear RGB[.0051815,.0065121,.0085681], no texture/emission, roughness.26, clearcoat.85 and coat roughness.14. The facing normal is[.42594,-.90475,0]; N·V is.1498–.1677. Schlick dielectric reflectance is approximately42–47% at those angles and the reflected directions point down into the warm floor. `serialized-lid.json`, `pixel-geometry.json`, and `pixel-colors.json` preserve the exact values.

An unlit magenta source sentinel colors precisely the beige panel (`sentinel-0.800.png`), proving material identity through the entire scene export and raster pipeline. Fresh source fingerprints retain the strictGL guard. Material groups on the ExtrudeGeometry do not cause a wrong slot: the mesh has a single material and the native renderer correctly uses that one material for all groups.

## Proven source fix

`proven-fix.patch` changes one material declaration; `candidate-matte.ts` is the complete frozen source with that change:

```ts
const lidFinish = new THREE.MeshStandardMaterial({
  name: 'Lid interior satin lacquer',
  color: 0x101317,
  metalness: 0,
  roughness: .82,
});
```

This suppresses the strong glossy/clearcoat reflection on the underside while keeping the same near-black base color. It changes the underside finish to dark satin; the exterior lid lacquer, bevels, rim, prop, soundboard, keyboard, geometry, lighting and camera are unchanged. The three actual1280 frames at0.8,64.6,120.5s were rendered and inspected. At the four tested pixels, baseline sRGB ranges[70–185,52–163,35–130] become[1,0,0]. The existing polished rim remains visibly outlined, while the broad underside reads black. `comparison.png` shows matched wide and close shots.

## Renderer qualification

This is a proven fix in the current offline renderer, not a browser-equivalence claim. The native shader uses a fixed pavilion environment capture and a9-level split-sum prefilter; it excludes the piano and performer from that capture and has no local reflection parallax. Thus a large smooth plane can reflect a nearly uniform warm floor region. The grazing Fresnel mechanism is physically plausible, but the exact flat color is an approximation of that environment setup. If a highly polished interior is required instead, its room reflection is expected and should be designed/reviewed as such; changing only the base color cannot suppress a dielectric clearcoat reflection.

Four test frames have strictGL_NO_ERROR and4×MSAA, with source/image hashes in `image-index.json`, `sentinel-report.json`, `matte-report.json`, and `verification.json`. No production renderer, app or checkout files were changed. No full film started.

## Reproduction

From the workspace root: `python lid-material-audit/capture-scene.py`, then `python lid-material-audit/inspect-pixels.py`, then `python lid-material-audit/render-tests.py` with the shared renderer free. The tests use the frozen e018 snapshot and override only the piano TS source.

## Requested softer sheen follow-up completed

`candidate-satin.ts` uses near-black MeshPhysicalMaterial, metalness0, roughness.48, clearcoat.15, clearcoatRoughness.30. `satin-only.patch` contains that one-line option. The actual0.8s frame is accepted and inspected in `satin-0.800.png` (snapshotc53308fb82970f14). It keeps a restrained, warm reflected sheen: sampled sRGB[35–51,25–39,17–26] against original[70–185,52–163,35–130] and matte[1,0,0]. This requested compromise is the preferred review option: it preserves a readable reflection while avoiding the strongly beige glossy panel and the crushed matte result. `three-finishes-0.800.png` and `three-finish-pixels.json` compare all three.

The first attempted satin run was blocked before initialization by the environment reset. After root restored checkout/dependencies, the same frozen candidate was rendered successfully with strictGL_NO_ERROR and4×MSAA. Only the new successful report is accepted; `satin-report.json` records source and image hashes. No app or production renderer edits.

`source-property-parity.json` proves both matte/satin sources are identical to frozen d58f11ba apart from the lid material declaration. `geometry-parity.json` adds actual runtime equality of baseline/matte/satin:116meshes and205108vertices with exact attributes, indices, groups and world matrices, including prop geometry/transforms;88keys,67dampers,33actual/synthetic states and14520contact queries per variant all exact. States include actual frozen-score poses plus all88key attacks, holds, releases and pedal0/.5/1. Runtime sources and frozen-score hashes are recorded. Reproduce using `node lid-material-audit/geometry-parity.mjs` from workspace root.
