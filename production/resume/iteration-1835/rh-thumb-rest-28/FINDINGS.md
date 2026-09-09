# RH thumb rest: p00112 → p00142

The finite inactive gap now rests in a curved pose beside the palm. Parent directly reviewed and accepted the paired top/oblique rest silhouette; final combined binding remains the integration gate. This patch changes no score field, held pose, or other bone.

Scope: RH thumb only, p00112 release 27.794411 to p00142 attack 34.166094. Source binds both IDs and exact times (1e-7 tolerance). Base score is combined-v9, SHA 93418f267884f4ea28dec750509d4b6f20b2d73e753d689ae31b743d9ecc5871. Base rig is arms + compact5, source SHA 4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45. Standalone candidate SHA edf40a6b65c21ecb4e35890e784a4e9225d04f68d35fa8e586fe85835003db83.

The wrist-local target is (0.2, 0.45, 0.2) times thumb reach. Existing localPose preserves authored frame offsets/roll. The thumb clears its previous key with a 15 mm lift over 100 ms, curves to rest over 400 ms, approaches the next contact through a lifted waypoint over 400 ms, and lowers over the final 40 ms. All interpolation is smoothstep quaternion interpolation; no score/attack/hold edits. At 32.522588 the actual tip is 12.45 mm below its base, versus 32.81 mm above at baseline. This is a compact curl, with actual chain direction changes 89.38° and 31.28°, rather than an extended thumb.

Validation:

- 1,718 complete hand/opposing states at 240 Hz over 27.45–34.6: zero thumb/palm, finger, or opposing triangle crossings; zero >3 mm thumb key-core frames (maximum 2.283 mm); zero new pair/key regressions. Checks use actual skinned >65%-owned surface triangles and vertices, all 88 key cores, all same-hand fingers/palm, and opposing hand. This is sampled mesh evidence, not a claim of mathematically continuous collision exclusion.
- 7,152 actual-skinned motion states per source at 1 kHz: maximum thumb skin speed 0.72236 m/s candidate vs 0.77747 baseline; tip 0.69947 vs 0.75744 m/s; local joint speed 8.91963 vs 9.84939 rad/s. Candidate maxima occur at the unchanged later release around 34.535–34.537. Maximum 1 ms skin step is 0.722 mm. Seek parity exact.
- Frozen source versus passing probe: all 10,356 skeleton states identical. Baseline versus frozen candidate: every non-thumb bone identical, and every held/outside-gap pose identical. Sampling includes 1 kHz window, all note attacks/midpoints/releases across the full score, plus exact six segment boundaries and ±1 µs. All 18 added boundary surface samples are clear.
- 44 matched native 960 frames, 11 times × baseline/candidate × top/oblique, accepted 4× MSAA and GL_NO_ERROR throughout. Source, score, frame hashes and strict reports copied in evidence/. Endpoints are visually unchanged. The departure no longer rises into a straight upright pose; the rest stays compact and clear when the left hand passes; arrival stays above the moving key until contact. Parent approved the rest views; paired release/arrival sheets remain available for integration review.

Deliverables: pianist-candidate.ts, thumb-rest-only.patch, provenance.json, frozen-parity-report.json, v4-surface-report.json, motion-summary.json, full v4-motion-report.json, and evidence/index.json. Raw comparison rows remain in this scratch leaf. GATES.md records the completed local qualification; combining with unrelated source helpers requires root's final rebind/recheck.

Reproduction from this directory:

```sh
node compile.cjs pianist-candidate.ts rig-candidate.mjs
DAYBREAK_RIG_MODULE=$PWD/rig-waypoint-probe.mjs DAYBREAK_WRIST_MODULE=$PWD/compiled/wrist-motion.mjs THUMB_CONFIG='{"target":[0.2,0.45,0.2],"release":0.4,"arrival":0.4,"ramp":0.1,"arrivalRamp":0.04,"releaseLift":0.015,"arrivalLift":0.015}' REPORT_PREFIX=recheck- node verify-gap.mjs
DAYBREAK_RIG_MODULE=$PWD/rig-waypoint-probe.mjs DAYBREAK_WRIST_MODULE=$PWD/compiled/wrist-motion.mjs THUMB_CONFIG='{"target":[0.2,0.45,0.2],"release":0.4,"arrival":0.4,"ramp":0.1,"arrivalRamp":0.04,"releaseLift":0.015,"arrivalLift":0.015}' REPORT_PREFIX=recheck- node motion-gap.mjs
DAYBREAK_RIG_MODULE=$PWD/rig-candidate.mjs DAYBREAK_WRIST_MODULE=$PWD/compiled/wrist-motion.mjs LABEL=candidate node verify-frozen.mjs
python render-review.py
python check-delivery.py
```

Native rendering uses held-r81-r76-fit/render-project with its accepted arc sampler; no checkout or production renderer changes were made. Piano task is independently complete: lid-material-audit/original-dynamics-parity.json compares original 915ae piano with accepted satin 5f6d9e across 33 states; all 88 keys, 67 dampers, pedals and 14,520 contact queries are exact. Static prop geometry differs as expected.
