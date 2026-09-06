The existing ponytail supports a restrained secondary-motion candidate without changing the GLB, any geometry, material, weights, mesh indices or rest matrices. Only the existing `Ponytail1` and `Ponytail2` bone rotations change. `PonytailRoot` stays at its authored rest rotation and follows the existing head pose.

The hair chain is `Head → PonytailRoot → Ponytail1 → Ponytail2 → Ponytail3`. Hair mesh 5 contains 3,902 vertices and 5,352 triangles. Ponytail weights occur only on this mesh; `Ponytail3` has no nonzero skin influence. `topology.json` contains measured component and weight data. The model remains SHA-256 `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`.

Candidate files:

- `ponytail-motion.ts`: 1,106-byte stateless runtime helper.
- `hair-motion-data.ts`: 135,372-byte generated curve, approximately 51 KB gzip. The curve is imported into the bundle, with no extra texture, morph, draw call or network fetch.
- `bake-hair-motion.mjs`: reproducible generator using the project's actual posture, score, model and installed Three dependencies.
- `candidate-report.json`: source hashes and isolation/displacement measurements.
- `verify-runtime.mjs` and `runtime-verification.json`: sequential versus arbitrary seeking, frozen-time idempotence, untouched root/head/hand bones, and matching the rendered candidate angles.

The generator samples the actual world-space head/ponytail-root trajectory at 120 Hz. Two damped angular responses use its acceleration and change in gravity direction. A 30 Hz quantized curve provides small bending lag through the free tail. The helper interpolates that curve directly from score time, so its result does not depend on frame rate, pause duration or seek order. This is a bounded pose response, without strand physics or collision simulation.

| Paired pose | Maximum hair displacement | RMS over hair mesh | Pinned hair vertices | Other meshes |
| --- | ---: | ---: | ---: | --- |
| 179.6 s | 6.122 mm | 1.857 mm | 2,326 unchanged | Exactly unchanged |
| 186 s | 5.823 mm | 1.753 mm | 2,326 unchanged | Exactly unchanged |
| 84.3 s | 5.218 mm | 1.591 mm | 2,326 unchanged | Exactly unchanged |

Maximum individual axis rotations across the generated curve are 0.974°/0.779° at Ponytail1 and 0.648°/0.502° at Ponytail2. Root quaternion and world matrix were exactly unchanged in each paired pose. All exported position/normal/index arrays of non-hair meshes match exactly before and after.

Neutral EGL renders were inspected from side and rear at the three paired poses: `pair-0-*`, `pair-1-*`, and `pair-2-*`. For example, compare `pair-0-side-before.png` with `pair-0-side-after.png`, and `pair-0-back-before.png` with `pair-0-back-after.png`. These are actual skinned-geometry diagnostic stills. They show the small free-tail displacement with a fixed tie/attachment. They do not constitute a production-browser or temporal-video pass.

Suggested integration, for the parent to apply after review:

```ts
import { ponytailMotion } from './ponytail-motion';

// Pianist member:
hairMotion?: ReturnType<typeof ponytailMotion>;

// In load(), after bones/rest have been populated, before the first posture():
this.hairMotion = ponytailMotion(this.bones, this.rest);

// At the end of posture(), after the head and facial pose are established:
this.hairMotion?.(time);
```

Copy both runtime files together. The offline QA compiler also needs to include these two new imports. Regenerate the curve after changing head/torso posture, the score or the head rig:

```bash
node /workspace/scratch/2e8cc8e77f98/character-assets/hair-motion/bake-hair-motion.mjs /workspace/sites/daybreak-piano-film
node /workspace/scratch/2e8cc8e77f98/character-assets/hair-motion/verify-runtime.mjs
```

The separate gaze assessment makes no edits. `LeftEye` and `RightEye` bones exist and remain at rest in the inspected runtime; the current 0.15–0.22 downward morph visibly moves the eye geometry. A geometric proxy from eye pivot to the deformed pupil texture centre points down about 18.8–29.3°. Its angular error to the keyboard centre is 43.4–51.4° across the seven measured poses. At key height, its rays reach the piano interior (`z ≈ -1.04…-0.47`) rather than the keyboard footprint (`z ≈ 0.126…0.295`). This is a geometric orientation measurement, not a biological gaze estimate or a claim that a performer must constantly look at keys.

Direct eye-bone rotation also affects 474 base-face vertices and 1,431 eyelash vertices, as well as the eye mesh. It therefore needs deformation review before a substantial correction. `measure-gaze.mjs` documents the pupil-UV interpolation and writes all readings to `gaze-assessment.json`. No eye, face or body changes were made for this assessment.
