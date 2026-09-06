The accepted candidate uses the existing downward-eye morph at `0.55 + 0.08 * release`, replacing `0.15 + 0.07 * release`. It adds roughly eight degrees of downward gaze while preserving the adult character and neutral expression. No head, eye-bone, body-posture or rig change is proposed; the hair trajectory does not need rebaking for this edit.

Apply the small hunk in `candidate.patch`. `candidate-pianist.ts` is only a review snapshot and should not replace concurrent source work wholesale.

The range was chosen after actual skinned-face EGL renders at baseline, 0.45, 0.65, 0.85 and 1.0. Values near 0.85–1.0 increasingly obscure the irises and read heavy-lidded in the front and three-quarter views. The recommended 0.55–0.63 range keeps the irises visible and retains the authored eyelid movement. It improves the downward focus without trying to force the gaze ray onto a key.

Before/after pairs were rendered from both front and three-quarter views at 0, 2.67, 84.3, 179.6 and 186 seconds. The 2.67-second pair is a full blink; it remains closed and coherent with the stronger look-down morph. Representative files:

- `pair-0-before-threequarter.png` and `pair-0-after-threequarter.png`
- `pair-179.6-before-threequarter.png` and `pair-179.6-after-threequarter.png`
- `pair-186-before-threequarter.png` and `pair-186-after-threequarter.png`
- `pair-2.67-before-threequarter.png` and `pair-2.67-after-threequarter.png`

Measured isolation:

- Every bone world matrix is exactly unchanged in the five paired poses, including head, eyes, hands and the ponytail chain.
- Body and hand positions below the head are exactly unchanged. Tiny body/hand normal differences are at most 2.53e-8 per component, from pre-existing floating-point residuals in the authored normal morph; these are recorded in `body-hand-parity.json`.
- Clothing, hair, teeth and tongue position/normal/index arrays are exactly unchanged.
- Material, texture, geometry topology, rig and GLB files are unchanged.
- Significant base-face displacement stays in the eye area (rest bounds x ±0.0675 m, y 1.6147–1.6694 m, z 0.1151–0.1567 m). It reaches about 1.78 mm. Eye and eyelash displacement reaches about 2.32 mm. Existing source morph residuals outside this eye region are below 0.0000075 mm at full influence.

The geometric gaze proxy now points down about 26.8–37.7° in the paired poses. Its angular error to keyboard centre remains about 35.0–43.5°. This is a restrained improvement, not exact keyboard tracking. No further head turn or tilt is included, and there is no new facial movement beyond the existing phrase variation and blink.

`candidate-report.json` contains source hashes, every gaze reading and affected-mesh measurements. `prepare-candidate.mjs` reads the checkout, loads the actual GLB and production pose code, creates the unchanged-pose comparisons and enforces isolation to the head/eye area. `render-candidate.py` renders those posed arrays with the neutral EGL asset renderer. No browser, production-frame-rate or temporal-video claim is made.
