# Reproduce the accepted wrist-volume checkpoint

This directory preserves the exact pre-correction rig (`3d09f763…`), its TypeScript source (`03911a26…`), and the complete six-module compiled import closure. Its loader always uses those preserved modules. It refuses an already-corrected rig and never reads the current app's compiled performer, piano, math, or hair modules. The correction is applied exactly once by the numerical and surface verifiers.

From an installed piano checkout, run:

```sh
DAYBREAK_PROJECT=/absolute/pianopiece-threejs DAYBREAK_REPORTS=/absolute/fresh-reports node /absolute/accepted-package/run.mjs
```

The runner verifies every frozen module against `manifest.json`, checks the exact original model and preserved score, creates an isolated temporary runtime, and saves logs/reports in `DAYBREAK_REPORTS` (default `accepted-package/reports`). The reports folder must be new or empty; an existing nonempty folder is rejected before auditing. `DAYBREAK_RUNTIME_ROOT=/dev/shm` may place the temporary runtime on a memory filesystem when ordinary disk space is constrained. Only this generated temporary directory is removed afterward. Frozen source files are never rewritten. Dependencies come from the project's installed `node_modules`; no package install or network is performed.

The manifest pins `package-lock.json`, Three.js 0.183.2 and TypeScript 5.9.3 package files, the actual runtime build and compiler code, GLTF/geometry addons, and the CPU/GPU skinning source files. Package, model, score and dependency hashes are rechecked after every audit and before declaring success. A future dependency update requires reproducing this original installed environment; it cannot silently reuse the old evidence.

`--check` verifies all immutable inputs without executing audits. `--identity`, `--numerical`, and `--surfaces` run one corresponding audit. With no selector all three run. The surface check covers 96 representative poses; the numerical check covers 457 frames. Existing limitations of those oracles remain: coplanar/enclosed surfaces and unrelated finger collisions are not certified.

The baseline GLB is deliberately not duplicated. Its required SHA-256 is `be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc`. If a later wardrobe revision changes the repository asset, set `DAYBREAK_MODEL` to the original asset recovered from Git checkpoint `bad8ed7`. The baseline score is included in this package and used by default; later edits to the app score do not change this reproduction. `DAYBREAK_SCORE` may explicitly identify another copy of that preserved score; its required hash is `53be5f55cae2417b07c21ae546c909c78eb7ed3473dfdb190a2d706af210d35f`. The runner rejects a mismatched model or score rather than silently treating a changed asset as the reviewed baseline.

This reproduction proves the accepted correction on its original evidence inputs. The integrated app still needs its own build, motion, contact and visual checks after later source or asset changes. Do not use the older parent-folder commands with the current integrated rig: they predate this mandatory pinned loader and can apply the correction twice.

Primary skinning references and the full algorithm explanation remain in the parent wrist-research README. No anatomical bound, contact tolerance, skin weight, skeleton, score or protected finger surface is changed by this packaging.
