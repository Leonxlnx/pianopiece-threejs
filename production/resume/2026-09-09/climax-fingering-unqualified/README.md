# Climax fingering candidate — review only

The prescribed refingering produces a substantially cleaner held chord at 159.3 s, but this complete candidate is **not qualified for integration**. Full-gap tests still find new collisions and rapid thumb joint rotations. Parent review and the separate thumb-continuity followup are required.

The original encoded baseline is pianist `2599ff6f11b668711040cf1e18849bb7bcc765d3667d8505662208852a2b9e9e`, score `44ef4cdc314ecd2e926cca116433210c5e8b603b84856c6393fdd1f6aa462c2f`. The rejected neutral-preset experiment was excluded.

## Concrete changes

- p00720 changes from LH Index to Thumb, making the G2/G3 octave Pinky/Thumb. Its supported wrist and thumb/pinky contact calibration come from the existing C3/C4 octave p00410/p00411, translated along the keyboard.
- p00721/p00722 change from RH Index/Ring to Thumb/Middle; p00723 remains Pinky, giving G4/B4/D5 a 1/3/5 fingering. A local `handPose` fit supplies the initial wrist, followed by measured support and pad calibration.
- Free fingers use ordered virtual lanes inside the played span: LH D3/B2/A2; RH A4/C5, extended to the released played digits during departure. Virtual lanes do not sound notes.
- Local arrival/release paths use actual moving key surfaces, maintaining calibrated phalanx frames and interpolating whole local joint poses. They operate only on inactive fingers.
- Four physical releases move 50 ms earlier under existing pedal position 0.66. The LH following wrist transition begins at the new thumb release. Attacks, pitches, velocities, written durations and pedal data remain unchanged.

| Note | Finger before → after | Physical duration before → after (s) | Physical release before → after (s) | Written duration (s) |
|---|---|---:|---:|---:|
| p00720 | L2 → L1 | 0.264901 → 0.214901 | 159.424607 → 159.374607 | 0.313833 |
| p00721 | R2 → R1 | 0.252444 → 0.202444 | 159.433650 → 159.383650 | 0.306866 |
| p00722 | R4 → R3 | 0.243389 → 0.193389 | 159.428095 → 159.378095 | 0.303366 |
| p00723 | R5 → R5 | 0.251000 → 0.201000 | 159.439206 → 159.389206 | 0.299866 |

The physical release change allows travelling fingers to move with the wrist instead of lagging behind its idle-finger lanes. Pedal is 0.66 at every old and new release. The acoustic implication must be assessed in the planned remaster; no waveform-equivalence claim is made. p00719 keeps its duration and receives the prior octave's contact calibration. Exact score and wrist-field changes are in `delta.json`.

## What the evidence supports

At 159.3 s, both hands have zero triangle-pair crossings and zero held-finger key-core penetration. The baseline had LMiddle/LRing 12 pairs, RMiddle/RRing 85, and RRing/RPinky 7. The candidate retains a 2.682124472 mm idle LRing key-core witness and two palm witnesses below 3 mm. Held mesh contact gaps are approximately −1.294/+1.230 mm for LH Thumb/Pinky and +0.111/−1.017/+1.222 mm for RH Thumb/Middle/Pinky.

The chronological native images at 159.15, 159.3, 159.4, 159.5 and 159.8 s were viewed. At 159.5 s both hands have zero recorded key-core hits and zero triangle-pair crossings. These frames are evidence for those specific times, not a continuous pass.

Full validation uses 1,277 shared sample times and 2,554 hand states per version, spanning 153.403546–163.825895 s. It includes full affected gaps, 240 Hz samples around the local transition, attack/release/fade boundaries, actual moving key surfaces and exact individually owned mesh triangle pairs. The 397 sampled held chord contacts have maximum point error 0.000169847305449102 mm. No active point error exceeds 0.15 mm, and no changed active mesh gap newly worsens beyond 2.5 mm. The held interval 159.18–159.36 has zero worsened key rows above 3 mm or pair-count increases.

Native-compiled and local-candidate evaluation match exactly in six hand states at 158.9, 159.3 and 159.5 s (`parity.json`).

## Remaining blockers — do not hide with aggregates

The full affected gaps contain **119 worse per-key rows above 3 mm** and **238 pair-count increases**, including **75 newly crossing rows**. The detailed before/after data preserve every individual key and pair. The figures below are sampled extrema.

| Witness | Before | Candidate | Time (s) |
|---|---:|---:|---:|
| LMiddle → MIDI49, vertex7880, 21 affected vertices | 0 | 5.2910806011118305 mm | 159.087500 |
| LPalm → MIDI52, vertex8928, 3 affected vertices | 0 | 4.370208939570519 mm | 159.412500 |
| RIndex → MIDI73, vertex1836 | 5.373672594698786 mm / 9 vertices | 6.1016143942650425 mm / 12 vertices | 153.820212667 |
| RIndex–RMiddle | 0 pairs | 101 pairs | 159.025000 |
| RRing–RPinky | 40 pairs | 131 pairs | 159.036879333 |
| LIndex–LRing | 0 pairs | 64 pairs | 159.795833333 |

A separate 1 kHz motion check from 158.9–160.0 finds RH Thumb MCP speed 115.12594469755544 rad/s at 159.131 s and LH Thumb 79.52435142527015 rad/s at 159.444 s. These rapid rotations remain despite improved linear travel. LH wrist peak speed drops from 1.681657628 to 1.237654395 m/s; RH wrist rises from 0.753285582 to 1.034510583 m/s. The complete motion tables are inside both `final-*.json.gz` artifacts. The thumb flexion-plane construction is the next bounded diagnosis; changing pitch/attack or shortening more holds is not supported by this evidence.

## Files and provenance

`delta.json` and `source.patch` are the minimal reviewable changes. Full source/module/score copies are reference artifacts, not a request to overwrite the current app. `final-summary.json`, `final-details.json.gz` and the two raw full-state archives retain exact validation evidence. `native/coordinated-release/` contains actual rendered images and provenance. All files are hashed in `SHA256SUMS.json`.

- Candidate source SHA256: `b79c196938d4b33a34b26eaaca7b60cbcaba543e8b16428ec16dee7fe8d00d2a`
- Candidate module SHA256: `8103c53aeed3af8602200bb343827735a9b6f0d499b27ce2a15c30b38bff59eb`
- Candidate score SHA256: `5c7337e63181228c284f4a58c3b9906a9679b597c5e1f810016716ecc5cb5467`
- Native snapshot: `472a2924abcefcd9`

Reproduction entry points remain in the parent scratch directory: `audit-final.mjs`, `harness.mjs`, `final-times.json`, `compare-final.py`. Set `DAYBREAK_RIG_MODULE` to that directory's `coordinated-release.mjs`; pass `coordinated-release-score.json` and an output gzip path to `audit-final.mjs`. The harness imports the frozen baseline dependencies in its `render-project` directory.

No Site source, git state, deployment, audio master or full-film export was changed by this leaf.
