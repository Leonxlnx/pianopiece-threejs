# Idle-hand repair continuation

Root owns repository integration. All experiments here use immutable source/score snapshots outside the checkout. The original continuous Human skin and its skeleton are retained; no GLB or wrist/score timing edits were made by this leaf.

## Proposed implementation

`idle-repair.patch` contains the changes against the fitted-score baseline source. `delivery/pianist.ts` is the full proposed source. Preserve root's later independent changes when applying the patch.

The two inactive `contactPose` helpers used a fully depressed key for every approach/release anchor. Real keys already have pre-travel and a 100 ms return. Reading `piano.contact(note.midi,z)` inside the helper keeps the existing anchor wrist frame while following the actual hinged key height. The exact active finger branch is unchanged.

The inactive thumb uses a compact CMC lift/opposition prior composed around its authored rest frames: parent-frame Rx(-.70), mirrored Ry(-.75/+ .75), mirrored Rz(+.20/-.20), then local Thumb2 Rx(-.15). This replaces the rejected lift-only prior, which repeatedly folded actual thumb-owned skin into the palm. The extra opposition keeps the two inactive thumbs separated in the fitted final chord. Its release/approach windows are 80/100 ms so a released thumb is not transported sideways against its old contact for 220 ms.

Released nonthumbs use a supported rest target y >= KEY_TOP + .057, preserving the current continuous three-link solver. Short gaps interpolate exact local contact poses through one rest arch. Release/approach cadence depends on gap length: fast short gaps clear the black-key front; longer gaps allow a slower index/middle descent. Ring arrival stays short because the old longer approach crossed an adjacent black-key front just before its next white-key contact. Long rests retain smooth release and preparation blending. The old envelope fallback is removed because it reinstated the low world-target path during the exact configurations being repaired.

Every pose is reconstructed from absolute score time, current key state, immutable local rest frames, and the existing wrist trajectory. There is no frame-history damping or persistent correction state.

## Evidence and limits

`integrated-baseline-surface.json` is the original 72-context screen on the new fitted wrist path: 19 rows / 22 inactive patch-key hits deeper than 3 mm, maximum 7.097 mm; 5 own-palm rows, 58 neighbor rows, 3 opposing-hand rows. `active-combined-score.json` applies the active-grip agent's final 22 physical note-field changes, including the bridge thumb lift .0073; audible timing/pitch/velocity and wrist trajectory remain as supplied.

Input hashes are in `inputs.json`; individual actual-surface reports also identify model, score and compiled rig hashes.

| Check | Samples | Key rows >3 mm | Max core depth | Own-palm rows | Neighbor rows | Opposing rows |
|---|---:|---:|---:|---:|---:|---:|
| Original fitted-score baseline, old idle | 72 | 19 | 7.097 mm | 5 | 58 | 3 |
| Same 22 active repairs, old idle (paired control) | 72 | 19 | 7.097 mm | 0 | 57 | 3 |
| Proposed idle + 22 active note-field repairs | 72 | 0 | 2.815 mm | 1 | 50 | 0 |
| Dense repaired approach/release intervals, same proposed inputs | 167 | 0 | 2.815 mm | 0 | 129 | 0 |

The single remaining own-palm context in the 72 screen is active R ring db00108 at 28.652625, assigned separately to the active-grip agent. It is absent with the old idle rule: moving an inactive neighbor changes mixed palm-weight vertices, so this small new contact must be repaired in the integrated result rather than dismissed because the active joint branch is unchanged. Dense selection is seven repaired windows at approximately 120 Hz plus final-chord/opposing-thumb controls; exact times are in `focused-idle-times.json`. These rows are not independent random samples and their neighbor counts should not be compared as a percentage with the 72-note-index screen.

`ready-idle-motion.json` measures all fingers over 13,627 frames at 60 Hz and passes the existing thresholds: maximum tip speed 4.934 m/s, wrist speed 1.489 m/s, wrist acceleration 24.337 m/s², contact-marker maximum .518 mm, nonfinite 0, seek difference 0. The final source changes only inactive ring arrival from that motion-tested source; `delivery-ring-motion.json` replays both ring fingers over the full 60 Hz timeline and passes with maximum 4.578 m/s. Other finger local rotations are identical to the all-finger run. These motion-only scripts intentionally omit active skin-pad samples and must not be used as a pad-contact gate. Root retains the full active-pad audit for final integrated inputs.

The finite surface harness uses the actual deformed Human vertices and all 88 animated key inner solids. It detects digit/palm and digit/digit noncoplanar triangle intersections in >65%-owned patches, with mixed-web vertices included for key-core checks. It excludes mixed-web/coplanar/enclosed pair collisions. Triangle counts are not penetration depths. Zero samples deeper than 3 mm does not mean zero shallow contact, globally perfect anatomy, or a continuous-time proof.

The inspected 1400px renderer images are `render-thumb/gl-1400-{0,1,2}.jpg` and `render-clearance/gl-1400-{0,1,2}.jpg`; they document the underlying compact prior/rest changes before the final cadence-only refinements. They show a continuous thumb web and a more compact silhouette, with a remaining sharp dorsal thenar highlight/pinch. They also show residual neighboring-finger crowding. They are offline renders, not browser screenshots. Root's final exact-scene view remains necessary.

## Rejected approaches

- Raw authored nonthumb rest with uniform extra flexion increased severe key rows to 70/72. Wrist-local rest cannot be assumed safe at every supported hand pitch.
- Outward-thumb yaw alone eliminated thumb/palm crossings but created final-chord thumb/thumb intersections. The accepted candidate adds a compact mirrored Y rotation instead.
- A static nonthumb rest diagnosed the transition problem but is not an animation solution.
- Smooth capsule-driven inactive MCP lift barely reduced neighbor rows (51 to 50) and added a palm crossing. The intersecting active shafts often approach the fixed inactive MCP roots; lifting distal digits cannot relocate those bases.
- Contact-to-contact world flight cleared the dense key samples but increased neighbor rows from 122 to 159/167, so it was rejected.
- A fixed 20 ms descent for every nonthumb gap cleared the sampled keys but caused 6.30 m/s index motion. Cadence-dependent descent retains quick clearance while giving the longer index/middle excursions more time.

Residual neighbor geometry is a separate real limitation being reviewed by the root and hand-planning agent. This leaf does not certify a globally collision-free hand.
