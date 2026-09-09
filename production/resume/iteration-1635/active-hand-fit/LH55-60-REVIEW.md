# LH55 / LH60 frozen active support

Frozen score: `lh55-60-frozen-v1.json`, SHA256 `7c23860dbc1782ad41e4c4392d26daeaa1ec6ee87b991809ea4ffc201060e9b8`. The guarded manifest applies 131 field operations across 24 notes and 24 wrist knots. It was replayed without conflict onto parent combined-v3; `lh55-60-on-combined-v3-review.json` is a scratch merge proof, not an instruction to overwrite the current root score.

All eleven assigned held defects are resolved within the explicit active key/contact/owned-palm gates. This is an active-anchor freeze; inactive geometry remains open. No attacks, pitches, velocities, hand/role assignments or durations changed in this batch. The score still preserves all 1,068 musical events and all 40 held soprano entries. The six earlier authorized-proposal physical bass-release changes are unchanged.

The five G3/thumb folded grips now use L3 with raised shared wrist support. The six C4 contexts retain the thumb and use raised coherent support: isolated C4 leads into the accepted bass octave after its existing release, while C3/C4 octaves start a supported departure after the lower C3 release and maintain the upper C4 contact through its entire hold. Preceding D4 and A3 guard poses were restored after broad support trials broke their held contacts. Existing L191/L251/L423 octave destination positions/quaternions are unchanged; only their moveStart values change. L266, L447 and L464 remain untouched.

| Target | Finger | Held samples | Baseline digit core (mm) | Candidate digit core (mm) | Candidate palm core (mm) | Remaining active/idle frames |
|---|---:|---:|---:|---:|---:|---:|
| p00074 | L3 | 84 | 2.612 | 0.000 | 0.000 | 49 |
| p00261 | L3 | 84 | 2.592 | 0.000 | 0.000 | 47 |
| p00404 | L3 | 83 | 2.609 | 0.000 | 0.000 | 49 |
| p00655 | L3 | 86 | 2.576 | 0.000 | 0.000 | 0 |
| p01053 | L3 | 207 | 3.256 | 0.000 | 0.000 | 12 |
| p00361 | L1 | 237 | 4.536 | 0.000 | 0.000 | 0 |
| p00485 | L1 | 139 | 3.516 | 0.000 | 0.000 | 0 |
| p00522 | L1 | 120 | 7.840 | 0.000 | 2.464 | 0 |
| p00853 | L1 | 145 | 4.536 | 0.000 | 0.000 | 0 |
| p00932 | L1 | 118 | 7.840 | 0.000 | 2.612 | 0 |
| p00949 | L1 | 118 | 7.840 | 0.000 | 2.540 | 0 |

The 1,421 target held poses have zero owned-palm and active/active crossings. Across all 5,476 complete-held and neighboring mesh poses, there are zero new severe held key, IK, or actual pad-contact failures. Maximum reserved active digit core is 2.697 mm and palm core 2.612 mm. The actual checker uses owned skinned surfaces, all 88 animated beveled key cores, and exact triangle intersections; these are not pad-marker-only claims.

Motion at 500 Hz: 9,525 samples, peak tip 4.758 → 3.187 m/s, wrist 1.781 m/s, direct-seek error zero. The remaining 126.160 rad/s maximum is inactive LeftHandPinky2 around 107.250063 s and remains in the curve follow-up scope.

Raw geometry still contains 894 reserved active/idle pair frames, including 161 frames with a newly flagged pair identity; no whole-hand clearance is claimed. The all-surface residual comparison records 778 new key frames and 651 new pair frames, represented by 49 exact inactive gaps. See `lh55-60-v4-all-surface-residuals.json` and `lh55-60-v4-idle-gap-queue.json` for actual patches, surfaces and endpoints.

Reproduction: `lh55-60-contexts.json` with `full-validate.mjs` / `motion-gate.mjs`, using the accepted-arms compact5 arc rig and matching wrist sampler. The last timing pass rechecked 1,392 mesh poses in only the three changed octave contexts and reused 4,084 poses after exact note and wrist-component parity proof; see `lh55-60-v4-incremental-evidence.json` and `merge-lh-final-evidence.mjs`.

Gates: `GATES-lh55-60.md`, 3/3 bounded gates met; `node validate-lh55-60-gates.mjs` passes. Root owns actual visual acceptance and combined inactive-curve closure.
