# Remaining LH held-thumb families: bounded review candidate

All 14 requested targets and all 43 reserved notes pass the complete held contact checks. This is a held-note improvement candidate; inactive geometry and motion still need work before whole-hand acceptance. Nothing was edited in the app checkout.

## Frozen input and output

- Base `baseline-score.json`: `53ce470d5e40226eb196552fe25f2eec13a33879d6011e6f53f82eeef4f8ba0e`, the preceding L62 `candidate-eight.json`.
- Candidate `candidate-final.json`: `b7082785aeb9b2a69b321861d0a5d04d3760e6fe1cfa8a60b1d5eb2c10b1cf27`, byte-identical to every final audit's `candidate-pass3.json`.
- Accepted compact5 source: `4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45`.
- This leaf's compiled rig: `6298f5daa435ad5147c5cba46dd33e5f505af4b7c19b009c500db455bb5986b6`; this differs from the original runtime module because imports point into this leaf. The TS rig is unchanged.
- Compiled wrist sampler: `c9f33ac6b0a5064efde8a85fe53a653cc05bf421cee0fe4dc5de39a14e4acf9f`.
- GLB: `77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d`.

`guarded-delta.json` contains exact before/after values for 28 note records and 24 LH wrist knots. Apply that guarded delta to a later combined score, rather than replacing independently updated RH fields. `freeze.mjs` verifies that every musical attack, duration, pitch, velocity, pedal and other musical field is exact; all fields outside the reservation are exact. No release was added. Only one wrist schedule field changed: L436 `moveStart` 184.80747382224567 → the existing p885 release at 184.857197.

`reservation.json` freezes all neighboring notes and knots. Root and active_hand_fit confirmed no ownership conflict; render_recovery retained independent RH ownership. Root p1008, primary p914 and previously fixed p970 stay protected. The rejected second yaw passage was not merged.

## Fit and held evidence

Low descending targets that folded a thumb under the palm were refingered coherently: p63/p1015 use finger 5; p94/p609 use 3; p810 uses 4 with its preceding B2/B3 octave lower voice on 5; p470/p835 use 4 in a 3→4→5 passage. Other targets retain thumb fingering with coherent wrist support and bounded contact fitting. The repeated p687/p1040 recipe raises the wrist 12 mm and uses zero thumb opposition. Exact support rotations, translations and contact fields are in the delta and the three fit reports.

| Held scope | Notes | Samples | Failed states | Max active core | Max palm core | Pad gap range |
|---|---:|---:|---:|---:|---:|---:|
| Requested targets | 14 | 1,627 | 0 | 2.823 mm | 2.769 mm | −1.283 to +2.209 mm |
| All reserved notes | 43 | 4,899 | 0 | 2.853 mm | 2.771 mm | −2.403 to +2.209 mm |

Both sets have zero owned active-finger/palm or active/active triangle intersections. Maximum point error is 0.000217 mm. `candidate-pass3-held-240.json` samples at 240 Hz, named held fractions including both ends, and all wrist time/moveStart/moveEnd boundaries ±1 μs.

Measurements use actual skinned digit/palm vertices with ownership greater than 65%, beveled key cores, actual owned triangles and terminal distal-bone pad vertices over the real key footprint. Mixed ownership boundary vertices are outside this classifier. Inactive geometry is measured and retained separately; passing an active contact does not erase it.

## Complete contexts and finite remaining work

Aligned baseline and candidate reports contain 10,297 equal timestamps across 12 complete incoming/held/departure contexts. Active contact/palm failure frames fall from 2,123 to 523; all-hand geometry failure frames fall from 9,025 to 7,828. There are **1,469 strict regression frames** and **1,052 frames with new triangle-pair identities**. Strict means an all-hand core increase over 0.25 mm or a triangle-pair count increase over 2. Some idle contexts worsen despite improved held endpoints, especially the repeated L57 middle/coda contexts.

No newly failing held frame occurs. Four new failures occur while all LH notes are released, before the black octave: 183.218505667, 183.226839000, 183.235172333 and 183.239339000 seconds. Palm depths are 3.287, 3.601, 3.272 and 4.221 mm. The active failure IDs remaining outside the reservation are p66, p1018, p604, p888, p918 and p927; their held issues existed in the baseline.

`idle-gap-queue.json` provides 111 exact inactive previous→next finger contexts. `residual-queue.json` contains 478 finite geometry-signature intervals, including pre-existing problems and regressions. These queues must remain attached to this candidate. All measured opposing-hand triangle intersections are zero against the frozen RH baseline; rerun against the final merged RH changes, particularly around 173, 184 and 190 seconds. The unchanged L62 late fields retain compatibility with render_recovery's separately measured 613-state 197.1–201.2 second opposing-hand check.

An optional L431 arc-lift screen at 0, 2, 4 and 6 mm did not clear the new released-palm failures and slightly worsened all-hand state counts. `arc-screen.json` records its 153 samples per setting. It was rejected and is absent from the final score.

## Motion, protected support and garment evidence

`motion-candidate-report.json` covers all contexts at 500 Hz plus 320 boundary checks. Seek parity is exact; maximum wrist target error is 0.000130 mm, maximum arm reach fraction 0.850383. Maximum wrist speed is 1.541113 m/s. The maximum ±1 μs boundary tip step is 0.005197 mm and joint step 0.001008980 rad. This joint step slightly exceeds 0.001 rad; it is not reported as a pass at that threshold. `boundary-detail.json` shrinks epsilon from 100 μs to 1 ns at 183.595176 seconds, where steps converge to a roughly 0.00001187 rad / 0.0001741 mm solver floor. There is no large state discontinuity, but sharp inactive articulation remains.

The most consequential motion regressions are the inactive LH index approach into p887 at 184.880839 seconds (7.107534 m/s tip, 102.832521 rad/s MCP) and the LH middle approach into p919 at 189.248363 seconds (4.324443 m/s tip, 70.166 rad/s MCP). L63 tip maximum increases from 3.648238 to 7.107534 m/s; L61 wrist maximum increases from 0.696960 to 1.541113 m/s. `motion-peaks.jsonl` localizes the fingers and was handed to active_hand_fit for its separate motion diagnostic. These are unresolved animation defects, not acceptable motion simply because held contact passes.

`protected-compatibility.json` replays the complete approach and hold for p914, p970 and p1008. p970/p1008 matrices and sampled full skin are exactly unchanged. p914 has only floating-point noise: maximum matrix delta 4.44e−16 and skin component delta 4.44e−13 mm. Note fields are exact for all three.

`candidate-pass3-garment.json` measures 42 target attack/mid/end poses. The maximum exposed upper-arm signed depth against outer torso cloth is 0.783 mm at one vertex, compared with baseline 1.172 mm. Forearm/outer torso cloth triangle crossings are zero. This is a closest-surface signed-normal measurement, excluding skin covered by the sleeve; it is not a watertight volume test. The sub-millimeter contact is retained as a model approximation.

## Inspected actual views

`evidence/index.json` pins 30 inspected actual PNGs: 15 matched baseline/candidate 1280-pixel oblique views of both hands, with source and image hashes. Rendering used the real model, accepted compact5 rig and strict GL guard; reports record no GL errors. Representative times are 17.42, 24.13, 172.997, 173.376, 207.31, 98.135, 151.908, 177.35, 120.43, 132.24, 183.44, 184.734, 189.926, 184.08 and 190.48 seconds. p1040 uses the same support/contact recipe as inspected p687 and was separately tested over its complete hold; no p1040 image is claimed.

Inspection confirms that the refingered active fingers reach their keys without the previous thumb-under-palm pose. The black octave gains palm support, the white B3/A3 neighbors have clearer held chains, and C#4 at 189.926 seconds raises the palm off surrounding black keys. Inactive fingers still fan or curl awkwardly in several views, including 98.135 and 177.35 seconds. Wrist narrowing and lateral deviation remain. Frozen RH defects are also visible and remain outside this leaf. This does not establish final anatomical or full-film acceptance.

## Reproduction and packaging

Run from this directory after the root restores its existing dependencies. Do not install a second dependency tree. `compile.mjs` recreates the local modules from the frozen TS sources. `seed.mjs`, `fit-targets.mjs`, `prepare-neighbors.mjs` and `prepare-third.mjs` preserve the finite fitting sequence and exact stage results. The final score itself is already frozen.

For frozen-score replay: run `held-audit.mjs candidate-pass3.json 240`, `context-screen.mjs` on baseline and candidate at 240 Hz, `align-contexts.mjs`, `motion.mjs` on both scores, `garment.mjs` on both, and `compatibility.mjs`. Script headers/CLI parsers specify output flags. `peak.mjs` and `boundary-detail.mjs` localize the reported motion extremes.

Filesystem-only package verification can run without those dependencies: `node freeze.mjs`, `node summarize.mjs`, `node finalize-summary.mjs`, `node idle-queue.mjs`, then `node check.mjs`. `hashes.json` pins source, data, reports and image evidence. The checked gates certify this bounded candidate and its measured exception queue, not the removal of every hand-motion defect.
