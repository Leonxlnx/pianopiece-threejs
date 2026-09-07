# Portable animation verification checkpoint

This folder is self-contained apart from the existing project, its locked Node dependencies and its verified restored character model. No scratch paths, old agent IDs, network downloads or private image caches are required.

Copy this whole folder into `production/pop-revision/night-animation/` or another tracked project folder. The three top-level performance files are exact checkpoint replacements; preserve all other current application modules. The baseline folder freezes the exact V7 source and fitted E3 score for comparisons. The manifest binds every bundled source, baseline, support script and window file, plus the model and dependency lockfile. The runner verifies these before execution and rechecks immutable work inputs after every phase.

From the repository root:

```sh
node production/pop-revision/night-animation/qa/run.mjs --project . --work work/night-animation-reproduction
```

The work folder must be new or empty. Omitting `--work` uses a new operating-system temporary folder. The runner never writes to application source or installs dependencies. It compiles baseline and candidate into its work folder, links the existing dependencies, reconstructs the intermediate scores from the final score, then repeats the A4, seven-release and short-gap comparisons. Windows uses directory junctions for the same local dependency access.

The coverage oracle derives the exact note-release windows and all 240Hz samples with 25ms guards from immutable note IDs. Positive controls reject missing samples, narrowed windows and nonfinite motion values. Compilation checks establish transpilation parity; application typechecking remains a separate production build.

Each phase must exit zero and emit its success token. Portable summary reports replace machine-specific paths with `$PROJECT` and `$WORK`; raw diagnostic mesh/surface data stays inside the disposable work folder. `--phase a4`, `--phase seven` or `--phase short-gap` runs one bounded verification phase.

These checks verify entire finite transition intervals, actual skinned surfaces, original thresholds, held endpoints, unaffected joints and unchanged audible fields. They do not replace the separate whole-song240Hz audit or native visual, listening and film-export review. Existing unrelated collisions remain recorded. New shallow contact in the A4/seven batches is retained explicitly below the original3mm blocker threshold.

The final score includes nine explicit release waypoints and two release-only15° arc controls. The original88-bar musical arrangement and fitted V7/E3 note fields remain exact. The runtime code did not change when non-null TypeScript assertions corrected strict type narrowing; the new source compiles to the same measured rig bytes.
