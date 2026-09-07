# Frozen V7: twelve local hand controls

The isolated V7 candidate passes all twelve renewed 240 Hz route gates against independently captured V6. The full 60 Hz key screen adds no severe key rows. It does not repair the existing global key queue: all 249 severe rows remain unchanged.

## Exact candidate

`candidate-no-e3/` contains V6 plus twelve explicit pose-control fields on nine LH Middle notes and the missing optional approach distal interpolation. No shared 35 ms default was added. All V6 G4 releases, Pinky sweeps, lower arcs, supported-elbow changes, wrists, held contacts, and audible fields remain exact. All nine expected full notes matched the conflict-checkable delta before application. The only changed files are `pianist.ts`, `pianist.mjs`, and `score.json`; all other copied modules retain their exact V6 bytes.

| File | SHA-256 |
|---|---|
| pianist.ts | d7ef64fb4fa5f559a2adc46ec60caff303f9ca5ae5161c428dd4ab1540b609a9 |
| pianist.mjs | 0cf3cb902d572bb0c9a4ea34392933a734557bd294b539abfa1447e4dd83e331 |
| score.json | 0f2d04d87565e25e3b9f89d5d8dc230d17f508ed2daa7fd78d8b06a2287e26ef |

`manifest.json` records every baseline/candidate module hash. `v6-to-v7-source.patch` is the single missing approach hunk; `additional-twelve-delta.json` provides expected full-note hashes and added fields. Root owns application integration.

The new approaches are db00098/db00154/db00178/db00346/db00524/db00563/db00681/db00740/db00862 with root duration100 ms, distal arrival35 ms, zero lift/sweep. The additional releases are db00346/db00681/db00862 with root duration80 ms, early distal duration25 ms, lift5 degrees, zero sweep. Undefined distalDuration retains the prior interpolation exactly. The existing half-gap cap and natural-joint 55-degree rig cap remain unchanged.

## Renewed finite evidence

`paired-window-summary.json` is the portable numerical summary. `paired-v6-v7-windows.json` retains every candidate comparison and failure array. The independent baseline geometry is kept only in local work evidence.

| Check | Result |
|---|---:|
| Strict route passes | 12 / 12 |
| Unique actual-skin times | 375 |
| Paired route/time comparisons | 381 |
| Actual-skin evaluations | 756 |
| Guarded 240 Hz motion samples | 345 |
| Held LH pad samples | 120 |
| Introduced/increased neighbor, own-palm, opposing pair rows | 0 |
| Introduced/increased severe core rows | 0 |
| Maximum all-five tip speed | 2.135858 m/s |
| Maximum actual dorsal-skin proximal elevation | 49.416400 degrees |
| Maximum backward PIP | 0 mm |
| Maximum key-core depth in checked windows | 2.914670 mm |
| Maximum absolute held-pad gap | 0.319342 mm |
| Maximum held-skin displacement / pad-gap change | 0 / 0 mm |
| Nonfinite results | 0 |

The checks cover the entire affected approach/release window, uniform 240 Hz samples and guards, original residual times, and note-held samples. All LH-related actual skin pairs and animated key cores are screened; unrelated unchanged pre-existing failures can remain. The 60-degree dorsal threshold is an engineering silhouette bound, not a clinical limit. This finite evidence is not a continuous-time proof or a full-film neighbor-pair audit.

## Full 60 Hz key comparison

The copied fast scanner first matched its exhaustive implementation on all 240 pilot frames. It then evaluated all 13,628 frames from zero through the exact 227.101587-second score endpoint. V6 baseline source, model, score, scanner, ownership, margins, and unchanged dependencies were matched by hash. All frozen candidate inputs were rechecked after evaluation.

| Metric | V6 | V7 |
|---|---:|---:|
| Severe patch/key rows (>3 mm) | 249 | 249 |
| Severe frames | 240 | 240 |
| Maximum core depth | 7.245505 mm | 7.245505 mm |
| Severe held-digit rows | 0 | 0 |
| Any inner-key-hit frames, including shallow hits | 1,540 | 1,551 |
| Nonfinite results | 0 | 0 |

Introduced0, worsened0, resolved0, improved residual0, unchanged249. Every severe row is preserved with exact before/after values in `key-comparison.json`; the full V7 residual inventory grouped by skin patch and state is `v7-severe-residuals.json`. No tolerance changed.

Shallow contact increases are retained explicitly: LMiddle/MIDI44 hit frames2→12, MIDI46 11→21, MIDI54 76→77, with unchanged maxima and severe counts in each group. These overlaps account for 11 additional film frames containing an inner-key hit. `all-depth-aggregate-differences.json` records the complete all-depth aggregate differences; the incumbent scanner did not save per-frame rows below the severe threshold. The local neighbor fixes therefore pass the existing 3 mm gate but do not establish complete collision freedom.

## Separately authorized E3 variant

`candidate-with-e3-score.json` has SHA-256 `dfd806f3144a0f29ede820e3c21e09020adbeaf8d0e35d49e5479b1e31eff2d2` and uses the same V7 rig. Only db00406/db00922 MIDI48→52 and harmony metadata bars36/80 Fadd9→Fmaj7 differ. Both complete modified notes matched the approved E3 experiment exactly. `e3-variant-manifest.json` preserves full before/after notes and hashes. Master audio must be regenerated for this audible revision.

This option is excluded from the isolated twelve-route and full60 comparisons above. Root reviewed actual native images at26.554166667 and79.5 for the new family and at89.015564/89.137/199.137 for E3. Root reported rounded silhouettes and an open thumb corridor in these sampled stills. The root-rendered E3 score SHA96d39423 differs in serialization only; root confirmed structural equality. These are scoped visual approvals, not a global clearance claim.
