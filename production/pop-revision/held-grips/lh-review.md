> Archived finite LH fit review. In this folder the deltas are `l-note-patch.json` and `l-wrist-patch.json`. Original work-directory references below describe the frozen experiment; the final combined travel source is still in progress.

# LH held-grip delta and route work

The held delta contains 156 LH note finger/contact edits and 23 LH wrist position/timing field changes. Parent root independently merged it with the 203 RH changes and confirmed exact equality with `../combined/v4-score.json` and unchanged audible data. The source associated with v4 is `../combined/pianist.ts`: staged nonthumb travel and the compact thumb at 27 ms arrival. The final shared source must use the separately verified 29 ms thumb arrival.

## Portable application

`node apply-held-delta.mjs --score input-score.json --out candidate-score.json`

The applier validates original wrist fields, permits an idempotent application, rejects unexpected wrist input, preserves audible fields, and checks full physical-hold finger overlap. Actual surface replay remains required; this script is not a mesh verifier.

## Held evidence

- `lh-paired-held-surfaces.json`: 5,106 frames at 120 Hz around paired LH grip and wrist changes; 9,182 actual pad samples, all present, −1.106 to +2.647 mm. Zero active key-core violations, zero LH active-involved triangle intersections. Marker maximum 0.808 mm.
- `lh-last-held-surfaces.json`: 831 additional frames for the last six LH repairs, all 1,314 pads present, −0.760 to +1.709 mm. Zero active key-core violations, zero LH active-involved intersections, zero own-palm rows. Remaining two inactive Index key-core samples at 62.466333/132.466333 are 3.015 mm and are part of the travel queue.
- `../combined/v3-motion240.json`: whole-song 240 Hz motion confirmed wrist 1.499 m/s and 24.958 m/s². That provisional run exposed two finger-speed families and is explicitly not an overall pass.

## Current route work, still incomplete

`../profile-v2/accepted-56-patch.json` contains 56 provisional LH visual travel intervals. They passed actual target-digit surfaces across the selected dense 120 Hz spans, plus 240 Hz tip-motion and forward-chain diagnostics. The corresponding evidence is `accepted-56-evidence.json`. Nine other intervals were rejected for backward proximal folding and/or speed; they are excluded from that patch. This is not a whole-score clearance claim.

The current shared experimental source is `../profile-roll/pianist.ts`, copied from hand_fit's coordinated implementation. It supports optional approach/release travel profiles with height, x/z waypoints, liftEnd/landStart, long-gap duration, and a cruise plane roll bounded to ±0.25 rad. Roll is zero at endpoints and preserves phalange lengths and fingertip location. All profile defaults preserve the staged path. Pending LH route candidates and the exact input score are in `../profile-roll/`.

No Sites or tracked repository files were modified by this subagent. Root owns actual visual rendering, final source integration, GitHub, and final acceptance.
