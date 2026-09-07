The independent shape-only scan reproduces the reference exactly: 109,024 nonthumb samples and 5,224 violations at 60 Hz. Every violation belongs to an unprofiled travel interval; active-held and settled-rest samples have none.

| State | Samples | Shape violations | PIP ≥80° samples |
|---|---:|---:|---:|
| active-held | 20,863 | 0 | 2,375 |
| short-gap-travel | 4,205 | 1,526 | 2,264 |
| long-release | 5,376 | 1,651 | 1,145 |
| long-approach | 6,733 | 2,047 | 1,480 |
| settled-rest | 71,847 | 0 | 0 |

Held violations are 0 / 5,224 (0%). Across all states there are 7,264 samples with PIP ≥80°, including 2,375 held samples. Of the 5,224 shape violations, 5,156 exceed the MCP limit and 757 exceed the backward-PIP limit; 689 exceed both. The PIP observation is separate from those two rejection limits.

| Finger | Left violations | Right violations |
|---|---:|---:|
| Index | 1,594 | 1,236 |
| Middle | 422 | 435 |
| Ring | 88 | 21 |
| Pinky | 898 | 530 |

The worst backward pose is **RH index, db00866 releaseTravel, at 190.433333333 s**: 25.287250189 mm behind MCP, with MCP elevation 12.031400°, PIP 87.089245°, and DIP 41.802831°. It occurs in the default release interval 190.387541–190.547541 s, after MIDI 79 and before next same-finger MIDI 79 (db00873).

The maximum MCP elevation is **89.531583944°**, at 43.033333333 s: LH index, default db00164 approachTravel. The independently reproduced maxima match the reference with no numeric difference.

There are 1,253 distinct violating source intervals. `event-family-inventory.json` groups their IDs and counts by hand, finger and travel type. `backward-contexts.json` preserves the worst 30 distinct backward intervals with exact timestamps, neighboring notes and source bounds. `interval-inventory.json` covers all 2,989 source intervals. Complete per-frame diagnostic arrays remain in the isolated analysis output; this repository keeps the portable classification, complete interval inventory and reconstructible source/score.

This points directly to the default travel construction. Settled-rest endpoints can influence those paths, but the settled-rest samples themselves pass the current shape limits. This diagnostic does not approve a broader source change or replace 240 Hz geometry and silhouette verification.

`../reviews/isolated-92-profile-shape-classification.json` contains the exact counts, category/finger breakdowns, source interval IDs, thresholds, method and input/evidence hashes.
