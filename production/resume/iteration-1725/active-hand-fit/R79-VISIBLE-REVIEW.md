# Actual visible R79 hand review

The following baseline/candidate images were directly inspected. These are native EGL renders of the actual weighted mesh, not diagrams. The final-pose matrix parity file resolves component renders to frozen v2. All images are in `r79-renders/images`; source/score/PNG hashes and native reports are in `r79-renders/image-index.json`.

| Time (s) | View | Observed result |
| --- | --- | --- |
| 20.225581 | top | p77's former thumb lies hidden in the palm; candidate makes the thumb separate and places G5 on the middle finger. |
| 22.720000 | oblique | Held soprano and inner E5 are separated; the former folded thumb pose opens. |
| 29.017808 | top | G5 ring contact and thumb separation are visible. |
| 32.522588 | oblique | Inspected baseline, v1 and final v2. V1 has a middle/ring overlap; final F#5 R4 separates the fingers and leaves the middle finger available for E5. |
| 136.382118 | oblique | G5 pinky contact is clear; the baseline hidden thumb fold is removed. |
| 188.4363685 | top | G5 middle contact replaces the hidden thumb fold. |
| 188.800000 | oblique | Original R2/R3/R4 chord is retained; contact-depth changes are subtle. Fingers remain close, with zero actual active crossings in the geometry audit. |
| 189.250000 | oblique | Baseline ring folds under the palm during departure; candidate keeps it extended at A5 during the later gradual wrist roll. |
| 189.460000 | oblique | Pinky reaches C#6 with an open hand; baseline used the middle finger. |

The compact5 inactive thumb is visibly held too high in several views. That does not invalidate active contact parity, but it prevents whole-hand visual signoff. These still images also do not close temporal film review; the 500 Hz motion evidence and explicit idle exceptions are separate.
