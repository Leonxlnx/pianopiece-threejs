# RH arrival — frozen finite proposal

The requested large approach crossing witnesses are cleared. This is a bounded improvement over supported.ts, with two dense residuals disclosed below; it is not a claim that the complete passage passes every contact/crossing gate.

The added helper only changes inactive RH non-thumb joint rotations from 158.90 to 159.23. It preserves the Ring-held D5 through its actual release at 159.157206. The waiting Pinky first occupies an elevated E5-side lane, then adopts the incoming note's complete curved joint shape while elevated. After Ring releases, Pinky approaches D5 over the unchanged 31 ms interval. Ring's released curve moves into its resting lane. Index and Middle follow coordinated complete local joint controls with staged hover poses. All three local joint rotations are interpolated together; no moving-target inverse reach is evaluated by the helper.

| Requested witness | Supported baseline | Proposal |
|---|---:|---:|
| RIndex–RMiddle at 159.025 |101 triangle pairs|0|
| RRing–RPinky at 159.036879333 |131 triangle pairs|0|

Score bytes, pitches, attacks, velocities, written durations, physical durations, pedal events, and wrist motion are unchanged in this followup. All 8,948 active joint points sampled in the full comparison are identical. Both thumb chains, all LH joint points, and all joint points outside the arrival interval are identical. Full skinned meshes at 159.3 and 159.5 are identical to the clean supported reference. The helper can compose with the three-thumb and later thumb-rest helpers without re-extracting their endpoints.

Validation includes the existing 1,277 full-gap times / 2,554 hand states and an additional 684 RH states sampled at 2 kHz over the complete arrival, including exact control and attack/release boundaries with ±1 µs checks. Every key and triangle pair is compared separately against supported and original score44ef/source2599ff6. Actual moving key surfaces and held neighbors are included.

Against supported, the full-gap comparison has 150 improved pair rows and zero pair-count increases. Seventeen key-depth rows improve; seven new key rows appear, all below 3 mm at those sample times. Dense sampling is decisive: it detects 27 new key rows and **one above 3 mm**. The exact worst is **RMiddle→MIDI70 (A#4), 3.1220614598774232 mm at 159.1595, seven vertices, maximum vertex2926**, versus no key-core hit in supported or original. This is explicitly a failed 3 mm gate, not rounded down. The additional Pinky→MIDI76 contact peaks at 2.680926922728255 mm, one vertex2511 at 159.175. Dense comparison has zero pair-count increases against supported.

Against original44ef, dense comparison still has **nine RIndex–RMiddle crossing rows around 159.17**, with maximum **16 triangle pairs at 159.172**, versus zero in original. Supported already has at least these counts, so they are improvements/preservations relative to the input candidate, but they remain real original-baseline regressions. The maximum witness geometry is preserved in dense-review-vs-original-details.json.gz and an actual native frame at 159.172 is included for judgment.

The full-gap original comparison reports 38 worsened key-depth rows over 3 mm and eight pair-count increases. These include prior supported-source differences outside this arrival; the extra dense evidence above must also be considered. There is no whole-piece acceptance claim.

At 2 kHz, the final Pinky transfer peaks at **33.71102783810958 rad/s MCP and 1.6883267424052095 m/s fingertip**, improved from the first separated-lane proposal's 78.4161400328139 rad/s and 2.2628917141191502 m/s. Ring's release peaks at 34.77174611648268 rad/s and 1.8216390327671423 m/s; Middle at 23.81902739655124 rad/s and 1.6581228231714837 m/s; Index at 9.878861525587222 rad/s and 0.8588625456528819 m/s. The shared D5 transfer remains constrained by the unchanged 31 ms Ring-off→Pinky-on interval.

The finite rejected alternatives are preserved in scratch: direct held-endpoint interpolation lowered Middle through the key; a closer D#5 inverse-kinematics waiting pose reintroduced Ring–Pinky crossings and faster motion; pure whole-shape waiting from the earliest anchor crossed the front keys; extra Middle lift increased its late side contact; a contact-depth-aligned Middle hover cleared that key but reintroduced Index–Middle crossings. The frozen proposal retains the best measured ordering/motion tradeoff without more searching or shortened holds.

Actual 1920 native frames were reviewed at 158.98, 159.025, 159.1, 159.16, and 159.3; the additional 159.172 witness is supplied. Requested-frame manifest is requested-native-report.json. Every frame reports GL_NO_ERROR. Native compiled parity is exact for 30 hand states and 15 full skins.

Integration: append helper.ts before the exported Pianist class and call `rhOrderedArrival(this,time)` after the existing local non-thumb helper. source.patch is the exact delta from supported.ts. It has no overlap with thumb-only helpers or the later RH thumb-rest scope.

Authoritative hashes:

- review.ts: e14ccfff6c1b028622fd58ee39cda3d31709a949850e1a0e9fc1d003c8725789
- review.mjs: 47620e6c8e45feca2ad1e0d8ffcc86d769ce70ef63d0e37cab29f468d5a08c60
- unchanged score: 5c7337e63181228c284f4a58c3b9906a9679b597c5e1f810016716ecc5cb5467
- native snapshot: c509a655ea1f7e69

No Site edits, source promotion, merge, or lifecycle actions occurred. Parent review decides whether the disclosed residuals are acceptable in the combined result.
