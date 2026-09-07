# Ready for parent verification: scoped wrist volume

Use `wrist-volume.ts` plus `integration.patch`, settings `{rollForearm:true,smoothWeights:8}`. The typed source compiles strictly and has identical transpiled JavaScript to the numerical candidate.

Six exact native rendered closeups have been inspected: corrected wrist shelves are continuous; no new visible skin flap or seam. Preserve the known 5/105-second right wrist bend as an explicit secondary posture issue. Parent side/sleeve review and branch integration remain required.

Three leaf gates are recorded in `GATES.md`; the final portable-verifier reverify passed all three gates, and root independently reran the457-frame numerical,96-pose surface and typed-identity checks successfully. Do not treat a status read as a parent re-execution.

Portable checks: `DAYBREAK_PROJECT=/path/to/repo node verify.mjs --roll`, `DAYBREAK_PROJECT=/path/to/repo node surface-final.mjs 8`, and `node verify-typed.mjs`. Keep the verifier modules beside `wrist-volume.mjs`. Optional `DAYBREAK_RIG` selects an existing compiled reference rig, and its exact bytes are hashed.

The current numerical candidate changes 542 of the existing Human vertices. All other vertex attributes/world positions, all skeleton/bind/skin weights/indices and every contact record remained exact. CPU/GPU position error 7.389281222e-08 metres; direct/repeated-seek drift 0 metres. The 96 representative surface poses produced zero affected nonadjacent crossing pairs and no new degenerate faces.

Research assets and render-comparison JSON are optional scratch. Save the production source, integration patch, three portable verification files plus loader, final reports, README and this handoff; do not upload the rejected-comparison screenshots as part of this checkpoint. No source or assets inside the repository were edited by this leaf.

## File SHA-256

```json
{
  "wrist-volume.ts": "f64dac6b277d53f221aa911c2040be6a08b7ca11e1b8f164e2d53238bdd09dff",
  "wrist-volume.mjs": "b57c94f98a845d53947dab52b40a8f83621f866d0104f7a0ac3a2c984f6d3ae8",
  "integration.patch": "4947ddc704bd5f1ce62da75a1c84e9394bf97acda1c2eec950a5aadc7fb0b088",
  "load.mjs": "aa3b4f6eab5fd642225e4bb13cf8a593cdaad9fd433864ea5764f547412f24c7",
  "verify.mjs": "4015e8a6e2b3a50e7f980ae2c8b3d94f8a488b69c3ce1da1a924448ac38496b7",
  "surface-final.mjs": "ce7412627e996a8dff7a14824a77e8de66871e3e27ff6b1ebdb9e1e2e8625dbc",
  "verify-typed.mjs": "d8f006b30e2835967b060bf8f77bd11797497cf292d3aac74e7cd24e22ad485c"
}
```

Secondary alignment research will go under `alignment/`; it will not change these accepted candidate files.
