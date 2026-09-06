All 20 targeted checks passed against the final reviewed source. The checks execute the production scene lifecycle and installed Three 0.183.2 composer APIs with controlled loading, clock, context events and GPU draw substitutes. This is a source-level and mocked lifecycle result; it is not a browser, image-quality or measured GPU-performance result.

Run from any directory with the existing project dependencies installed:

```bash
node /workspace/scratch/2e8cc8e77f98/lifecycle-review/check-scene-lifecycle.mjs \
  --project /workspace/sites/daybreak-piano-film \
  --out /workspace/scratch/2e8cc8e77f98/lifecycle-review/results-final.json
```

The harness only reads the checkout. Its report is written to `--out`; an assertion failure produces exit status 1. Each asynchronous check has a five-second timeout. TypeScript is transpiled unchanged into an isolated VM for each fixture, with `scene.ts`, `math.ts` and `render-settings.ts` coming directly from the checkout. The report records hashes of those files and of the reviewed owner, room and piano source. No browser or network is opened.

The final reviewed `scene.ts` SHA-256 is `9c3ed3f8f8fd07324358b42fa0c0617e2325e719218636885aef9eff907eecc1`. All six source hashes and package versions are recorded in `results-final.json`.

| Coverage | Verified behavior |
| --- | --- |
| Readiness | Character, room and piano readiness each gate initial PMREM generation and the first render. |
| Paused cache | Twenty unchanged frames perform no additional rig, stage, composer or render-counter work; telemetry callbacks continue. |
| Cache invalidation | Playback time, inspector time, camera override and resize each produce the required next render. |
| Target sizing | Real EffectComposer target sizes apply the logical dimensions and pixel ratio once. Desktop/mobile budgets and hardware-limited sample counts hold. |
| Pass order | Real EffectComposer render orchestration uses one scene target across successive frames; the final output pass draws to the screen without swapping buffers. |
| Context loss | Loss stops the RAF chain. Restoration after initialization replaces PMREM and redraws the frozen pose. |
| Context/load races | Finishing loads while lost, or restoring before loads finish, both produce one capture and one RAF chain at the appropriate time. |
| Late completion | Unmount, room failure, character failure and piano failure still release resources attached by a later successful sibling. |
| Recovery failure | Injected PMREM failure restores object visibility, disposes the generator and resumes rendering with no environment map. Initial PMREM failure rejects cleanly for owner disposal. |
| Disposal | Shared geometry, material, textures and ImageBitmap are released once per traversal; instance, skeleton and shadow disposal events fire. Passes, targets, PMREM, renderer, listeners, observer and RAF are released. Repeated scene disposal is inert. |
| Lighting state | Environment capture and visible frame use the same blended section energy. |

Two defects were reproduced and corrected by the parent during this review:

1. `captureEnvironment()` originally used the current section's raw energy while `tick()` blended the transition. At a fixture transition from 0.2 to 0.8, time 10.3 captured 0.8 but rendered 0.2444444444. Both now call the shared `scoreEnergy()` implementation. `results-before.json` retains the failing evidence.
2. The final OutputPass inherited `needsSwap = true`, so EffectComposer alternated its two multisampled scene targets despite the output already going directly to the screen. The actual addon orchestration reproduced two distinct scene targets across three frames. The fixed three-pass pipeline sets `output.needsSwap = false`; the same check now observes one target. `results-reviewed.json` retains the failing evidence. On Three's explicit multisample-renderbuffer path, one avoided 3.2-million-pixel 4x RGBA16F target corresponds to 122.1 MiB of color storage (multisample color plus resolved texture), before depth. This is an allocation estimate from target formats, not a device measurement; extension-backed allocation and driver storage can differ.

The parent's piano-readiness addition is also covered: a pending spruce material delays the first render, a late material completion after unmount is disposed, and material failure propagates while a later character still receives cleanup.

The inspected `Performance.tsx` graphics catch disposes its local scene, clears `stage.current` when it owns that scene, then clears `localScene`. The harness simulates this owner disposal when initialization rejects. It does not mount the React component, exercise React Strict Mode, or claim browser UI validation.

Other limits: PMREM generation, WebGL allocation, shader compilation, real texture decoding, ImageBitmap behavior in a browser, audio devices and raster output are replaced or excluded. Real Three scene trees, materials, textures, target cloning/sizing, disposal events, pass settings and composer buffer swaps execute normally. Room and piano mock loaders may attach resources upon completion to stress late cleanup; the actual room and piano attach their geometry synchronously and resolve texture images later. Repeated finalization can traverse an already disposed resource; exact-once assertions apply within a traversal and to the idempotent public scene disposal call.

No additional confirmed lifecycle blocker remains within this checked scope. The original CPU scene review also confirmed the lowered sun and non-shadow-casting glazing in source; these checks do not substitute for lighting renders.
