# Combined idle-support replay, 9 September 2026

This folder completes the interrupted combined idle-support comparison by porting the preserved `integrated-review/harness.mjs`. The historical `idle-nonthumb/audit-lib.mjs` was unavailable and was not run. The archived interrupted runner is retained only as provenance.

`baseline.mjs` uses the exact preserved `pianist-combined-thumbs.mjs` implementation. `candidate.mjs` uses the exact preserved `pianist-candidate-baked.mjs` implementation. Only their dependency paths are redirected to frozen local copies. The candidate adds the idle helper call and baked helper/data to the baseline; the input gate verifies there are no other source changes. Both rigs use immutable v11 score bytes, verified against the baked data's source score hash.

The harness uses six owned patches per hand: thumb, index, middle, ring, pinky, and palm. Vertex ownership requires combined weight >0.65 for a patch; triangles must have all three vertices owned by that patch. It evaluates all 15 within-hand patch pairs with the existing noncoplanar triangle-edge intersection algorithm. Key geometry is the existing moving-key solid screen: bounding boxes transformed by each key's actual moving matrix, with the bevel border excluded. This is not an exact arbitrary triangle-solid intersection solver for the rounded keys.

The schedule samples each of the 85 supported index gaps and 35 curves at 60 Hz, at exact support/curve boundaries and knots, and at note starts/releases from either hand within each support. Boundary probes occur at ±1 microsecond. Distinct double-precision times are retained, including near-equal decimal curve knots and binary note-release times. Exterior support boundary probes are also included. Every affected hand has all six patches evaluated. Both hands' active local joint quaternions and world joint matrices are compared at every scheduled timestamp.

Core regressions have separate counts for a threshold crossing (baseline <=3 mm to candidate >3 mm), and a candidate depth >3 mm worsening by >0.25 mm. Each is counted at patch-maximum and patch/key levels. New pair types require baseline zero and candidate positive. Existing pair counts are compared strictly (>0 increase), with the prior >2 triangle-pair tolerance reported separately. Own-palm pairs and other finger pairs are separate. A patch maximum can conceal a new collision with an additional key; the completed replay finds four such per-key states despite no patch-maximum regression. A triangle-pair count increase does not quantify penetration depth. These event counts are not mutually exclusive; a new deep key intersection can appear in several categories.

The regression queue groups by category, target patch/key or pair, and the set of support records present at that sample. It records a finite first/last sampled time range, number of affected sample states, and worst measured change. A range does not imply continuous failure between those samples. Support attribution identifies concurrent records, not proof of which individual record caused an overlapping regression.

To reproduce with the prepared Three.js dependency:

```sh
node coverage.mjs
node replay.mjs > replay.log 2>&1
python verify.py inputs
python verify.py harness
python verify.py coverage
python verify.py results
python verify.py evidence
```

`replay-rows.jsonl.gz` is the complete compact per-timestamp evidence. `replay-regressions.jsonl.gz` retains only regression hand states. Surface counts remain complete; only the first two witness points per surface pair are retained. `replay-summary.json` has completed aggregates and per-record counts. `replay-queue.json` is the finite detailed queue. `inputs.json` records frozen input origins and hashes; `sha256-manifest.json` hashes the final scripts and evidence. `GATES.md` records runnable acceptance checks.

This finite geometry replay does not establish continuous-time clearance, opposing-hand surface clearance, motion speed or twist quality, natural-looking hands, musical quality, browser playback, or audiovisual synchronization. Root is evaluating modular/baked parity and visible motion defects independently. No Site source was edited by this leaf.

The first calculation attempt is explicitly excluded because its asynchronous compressed row file was truncated. The final runner uses synchronous final compression, and the second full replay passed independent decompression and metric recounting. `excluded-first-attempt.json` records that exclusion.
