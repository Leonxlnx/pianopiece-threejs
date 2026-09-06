# Final dynamics regression

**Pass: no new reach failures, frame rotations above 90°, or held skin-contact regression.** The velocity-based key preparation and elbow pressure motion retain the verified wrist/contact behavior.

The offline pass uses the snapped production source and score, actual `GrandPiano.update/contact`, smooth pedal position, exact GLB bone transforms, and the real skinned Human mesh. No renderer/browser or checkout edits were used.

## Motion results

Replayed 13,743 poses at 60 Hz over 229.03635 seconds, with 31,981 held marker observations.

| Metric | temporal-final | Current | Change |
|---|---:|---:|---:|
| Maximum wrist step | 45.6050 mm | 45.6050 mm | 0.0000 mm |
| Maximum world wrist rotation | 9.3125 ° | 9.3125 ° | 0.0000 ° |
| Maximum elbow step | 32.6814 mm | 32.8260 mm | 0.1446 mm |
| Maximum local forearm rotation | 7.8557 ° | 7.8988 ° | 0.0431 ° |
| Maximum world forearm rotation | 7.9359 ° | 7.9190 ° | -0.0169 ° |
| Maximum local finger rotation | 81.6965 ° | 79.2214 ° | -2.4751 ° |
| Maximum world finger rotation | 81.7448 ° | 81.5517 ° | -0.1932 ° |
| Maximum held marker residual | 0.000361115 mm | 0.000361357 mm | 0.000000243 mm |
| Maximum PIP bend magnitude | 106.2081 ° | 108.3669 ° | 2.1588 ° |
| Maximum DIP bend magnitude | 69.0353 ° | 70.4385 ° | 1.4032 ° |
| Local finger changes >45° | 227.0000 count | 203.0000 count | -24.0000 count |

The requested comparison is against `temporal-final`; this includes intervening idle-finger refinements as well as this final dynamics change. It is not a causal attribution of every finger delta to elbow pressure. The immediate pre-dynamics source diff changes only the key preparation interval and elbow pole Y.

- All arm and finger local/world rotation counts above 90° are zero. No wrist or elbow steps exceed 50 mm.
- Of 203 local finger changes above 45°, 188 are proximal and 15 are middle joints. None occurs while that finger remains held across both frames; 10 enter contact.
- Maximum wrist/elbow travel occurs at 190.166667–190.183333 s during right-hand travel with no held notes: 45.605011/32.826007 mm.
- Maximum local finger rotation is the hovering right index proximal joint at 184.783333–184.800000 s: 79.221450°. Maximum world finger rotation is the hovering right pinky distal joint at 190.166667–190.183333 s: 81.551661°.
- Maximum marker residual is 0.000361357 mm at 184.833333 s, right middle finger, MIDI 75. All marker targets remain inside actual key footprints. Minimum flat-top target margins remain 9.95 mm white / 5.25 mm black.

## Actual held skin and key timing

Checked 52,881 held skin samples across all 1,467 notes and 22,052 poses: the full 60 Hz grid, exact onsets, onset/release ±1 µs, and original calibration moments. Each note has 8–266 samples.

- Legacy calibrated pad mask: -1.312721053 to +0.450259128 mm clearance. Actual full key footprint mask: -1.312721053 to +0.162373846 mm. No missing pad coverage and no samples outside ±1.5 mm.
- Largest change from previous calibration-time skin clearance: 0.000005756 mm, note p01158 at 175.269000 s.
- Maximum within-note skin clearance range: 0.000006727 mm, note p00803 (127.224–127.775 s). This is numerical-level variation, with no orientation-dependent penetration increase.
- All 1,467 exact onsets have keyDown exactly 1. Every one of 52,881 held samples also has keyDown 1. The max-per-key envelope preserves repeated-key overlaps despite longer quiet-note preparation.
- The lowest calibrated plane clearance remains right thumb MIDI 68, p01240, at 184.812001 s. That point lies on the previously reviewed rounded-edge region; this regression compares the same calibrated plane metric. It does not replace the earlier actual rounded-mesh ray review.

## Evidence and reproducibility

`audit.json` contains distributions and worst events; `plan-knots.json` preserves the load-time hand plans. `skin-report.json`, `skin-per-note.json`, and `skin-samples.json` contain actual skin results. `comparison.json` records the numerical deltas and snapshot/current hash comparison. The `audit.mjs`, `replay.mjs`, and `skin-regression.mjs` harnesses and snapped modules allow this run to be reproduced.

| Source | SHA-256 | Matches checkout at completion |
|---|---|---|
| pianist.ts | `d7be5a699dbc1d238a62dccfaf1ea040b7f24962e99bce6c5f1660502e68994c` | True |
| piano.ts | `f3450cc93a52f129f609748121d1a64cca36613bbf10350ba15ccd3e35bb98b5` | True |
| math.ts | `d3c255aded15a1df21d64b84c6705194397ba3ca095bc277e7238238f7812468` | True |
| score.json | `0587348ddda6c2fb7c415148ffca11c09c64e844069b0d4426fc6dff89d24f84` | True |
| pianist.glb | `48aa8727f23d2102ec83b6e0ce44baaeb05f3f89c106b656b2094c37cc70f014` | True |

This is a sampled numerical regression and preserves the existing visual-review scope; no changes are recommended from these results.
