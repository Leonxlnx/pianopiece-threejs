# p00322 bass contact candidate — parent review required

This is one geometrically qualified LH candidate against score v11, not acceptance of the 18-note family or of final film motion. No Site checkout, git, browser, package installation or external application was changed by this leaf.

## Minimal integration

Merge the two fields in `p322-delta.json`, append its four bound curves to the existing idle nonthumb data, and apply `envelope-snippet.ts` at the current previous/next idle-envelope gates. The full `p322-candidate.ts` and `.mjs` are immutable review references. Do not replace the parent's whole rig with them: that would lose its parallel RH work.

- p00322 (G2/MIDI 43, LH Index) retains time 71.178428, physical duration 0.269968, note-off 71.448396, velocity 0.555, finger, written duration and all other score fields. `contactLift` changes from 0.0062824555694730895 to 0.002 m; `contactZ` is explicitly 0.280 m.
- Middle, Ring and Pinky receive the existing bound idle curve format: 20° MCP lift and 20° spread, beginning 70.878428, reaching the support pose at 70.968428, holding until 71.488396, and ending 71.568396. Exact prior/next note IDs and times are embedded in every curve.
- Released Index uses the bound p00322→p00325 gap: 4° MCP lift, −4° spread, 16° PIP lift and 0° DIP change. It fades in from actual release to release +13 ms, holds through +27 ms, and ends at +60 ms.
- The idle-envelope change is restricted to the exact p00322 time, duration and new contact values. It blends the original contact-envelope influence toward the new one with the same contact-phase weight already used by the idle branch. This prevents the changed endpoint from imposing its full envelope guard throughout the entire preceding/following gap. Other notes retain their original code path.
- Every musical event, pedal value and wrist knot is unchanged. No earlier physical release is included in this delivery.

`p322-invariants.json` verifies the exact field delta and event/wrist parity. `source-manifest.json` and `SHA256SUMS` bind the source, evidence and images.

## Finite geometric evidence

`p322-final-comparison.json` compares 4,225 identical times over 66.264950–76.664321 s: full affected finger gaps at 240 Hz, 1 kHz samples around the bass transition, and exact musical/curve boundaries plus ±1 µs. It uses actual moving key geometry, skin vertices, exact finger/palm triangle intersections and distal-pad contact tests.

| Check | Result |
|---|---:|
| Held p00322 samples | 347 |
| Maximum active core depth, before → candidate | 6.518247 → 2.182062 mm |
| Distal-pad surface gap | −0.167683 mm |
| Held own-palm / active-active triangle pairs | 0 / 0 |
| Maximum target-point error | 0.000116 mm |
| New >3 mm key-core rows | 0 |
| Increased or newly appearing triangle-pair rows | 0 |
| New out-of-range active contact rows | 0 |
| RH / LH Thumb quaternion delta | exactly 0 / 0 |
| Other active LH finger samples with exact quaternion parity | 2,837 |
| Quaternion delta outside 70.821600–71.568396 | exactly 0 |

The key-regression comparison uses a 3 mm core threshold and 0.05 mm allowance versus an already deeper baseline key/patch collision. Pair counts receive no positive allowance. These are sampled geometric results; they do not mean that every baseline intersection has been removed. The candidate still has 2.18 mm of measured held core penetration within the existing 3 mm gate.

Raw paired rows are losslessly preserved in `p322-final-baseline.json.gz` and `p322-final-candidate.json.gz`; the uncompressed hashes are in the source manifest. `sample-times.json` and `replay.mjs` recreate the exact time grid using the bundled harness/metrics and the existing project asset/runtime dependencies.

## Motion and native review limitation

In the changed window, maximum measured fingertip speed improves from 3.302226 to 3.009756 m/s. Maximum normalized Index MCP angular speed increases from 71.633906 to 75.191562 rad/s, with the candidate peak at 71.462428–71.463428. This angular-speed increase is a remaining parent motion-review question; do not describe this candidate as fully motion-qualified. See `p322-motion-detail.json`.

Five native 1280×720 oblique frames were rendered before and after at 71.000, 71.150, 71.220, 71.462 and 71.510 s. All candidate frames and the held/release baseline frames were viewed. The lifted neighboring fingers and release pose are visible without a gross disconnect in these views. This is a still-frame review, not a continuous-playback or browser claim. Source/PNG/GL provenance is retained in the two `native-*-report.json` files. The actual native snapshot module reproduces all measured metrics and joint arrays exactly at six poses (`native-parity.json`).

## Still blocked

The other 17 family members remain unqualified: p00038, p00066, p00106, p00120, p00134, p00144, p00172, p00186, p00198, p00240, p00251, p00336, p00344, p00624, p00651, p00990 and p01018.

The closest p00172 unchanged-timing candidate passed the coarser replay but failed the denser replay with eight added rows: three Index–Middle count increases at 40.380900–40.383900 and five >3 mm neighboring-key rows around 40.695199–40.696900. Its strongest fully replayed comparison is `p172-final-comparison.json`; it is rejected. A subsequent −10 ms physical-release trial under the existing pedal (0.73) cleared the earlier key family in its targeted fit but retained seven added pair rows after support tuning. It was never fully qualified or rendered as a final candidate; `p172-short-support-fit.json` preserves that rejected fit. No duration change is accepted.

The wider p00186/p00344 support trials also failed dense replay: 22 and 7 added rows respectively. `three-comparison.json` records these failures and the pre-release-curve p00322 failures that the delivered curve fixes. `rejected-family-summary.json` records finite 60 Hz rejection checks for the other candidates; it is not a full-gap qualification record. Earlier held-only and 60 Hz passes are superseded by the denser evidence.
