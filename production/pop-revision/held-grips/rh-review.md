> Archived finite RH fit review. In this folder the note and wrist deltas are `r-note-patch.json` and `r-wrist-patch.json`; the numerical reports are `rh-midpoint-surfaces.json` and `rh-dense-held-surfaces.json`. Original work-directory references below describe the frozen experiment. Reconstruct its rig using `held-evidence-rig.patch`; root final combined acceptance is a separate report.

# RH physical grip repair

The mergeable delta is `complete-patch.json` (203 note fingering/contact records) plus `complete-wrist-patch.json` (14 wrist support positions and eight move-start records). Apply these over the root checkpoint containing the earlier 22-note repair and db00108 depth/lift repair. `verify-complete.py` proves that applying these deltas to `score-baseline.json` reproduces `complete-score.json` exactly.

All pitch, onset, duration, velocity, written duration, pedal, structure, and other audible fields remain identical. No RH finger is assigned overlapping held notes. The original body/hand mesh and skin weights remain unchanged. All changes were made in the agent work directory; no checkout edits were made.

The active repair uses physical fingering/contact depth first. Difficult ring grips receive modest local wrist support rather than a global solver penalty that distorts every pose. Four initial difficult grips required 30–40 mm lateral support; the later nine hard grip positions use 5–22 mm support, and one exact repeated C5 ring grip receives the initial support again. Outgoing motion may begin up to 9.001 ms within a held tail; fingertips remain contact-constrained. The existing quintic C2 wrist sampler is retained and its affected move durations respect the 1.5 m/s and 25 m/s² analytical limits.

## Frozen validation source

`final-source/pianist.ts` combines the shared staged nonthumb flight from hand_planning with hand_fit's approved compact-final thumb block. It does not change active solving. The compiled rig SHA-256 is `709697a8442a016d13b99a82d05ff31edb31e22eed580f4340e2bebfb04707b8`; coherent RH203 score SHA-256 is `0256b255215f5157d03471e4a69be54a08373e863bf19ccf9e3477eb98e23c8f`. These snapshots must remain immutable while flight refinements are validated separately.

## Evidence

`complete-midpoint-surfaces.json` samples all 863 unique note midpoint/opening/ending contexts from all 1,011 notes. It uses actual deformed Human skin against all 88 animated key cores and actual triangles for all owned finger/palm, neighboring finger, and opposing-hand surface pairs. Distal pad skin vertices are raycast against the assigned real key mesh, including valid white-key contact between black keys; this does not use the old hardcoded white-key z cutoff.

- RH active key-core penetrations deeper than 3 mm: **0**.
- RH active fingers involved in any owned-triangle intersection: **0**.
- RH own-palm collision rows: **0** (baseline 26).
- RH neighbor collision rows: **55**, all involving inactive fingers (baseline 456); the shared travel repair owns these remaining cases.
- RH inactive key-core rows deeper than 3 mm: **4**, maximum 3.302 mm; these are also travel cases.
- All 1,909 assigned actual pad samples exist, from −1.846 to +1.921 mm; maximum marker error 0.815 mm.
- No opposing-hand intersections and no nonfinite coordinates.

`complete-motion.json` replays the whole 227.102-second piece at 60 Hz. Peak fingertip speed is 3.844 m/s, wrist speed 1.489 m/s, wrist acceleration 24.337 m/s², and deterministic seek error zero. This is the motion gate; pad/surface evidence is the separate mesh report.

`complete-held-times.json` defines 2,176 additional contexts: five held fractions for every changed RH note and 120 Hz approach/hold/release windows around all 14 supported wrist grips. `complete-held-surfaces.json` is the dense validation report. It confirms zero RH active key-core hits and zero RH own-palm intersections, with all 3,891 assigned pad samples present (−1.846 to +1.921 mm). The supported held grips are clear. Shared travel still causes 33 inactive RH key-core rows (maximum 6.105 mm), 291 RH neighbor rows, and 16 early-hold intersections between an active middle finger and the departing inactive index finger across eight repeated notes. These are explicitly handed to hand_fit/hand_planning in `complete-held-summary.json` and `complete-dense-rh-core.json`; this delivery does not claim that the current travel source is globally collision-free. Do not infer continuous collision freedom from finite samples. Later shared flight changes must repeat the midpoint and relevant dense gates against the same active score.

`python work/active-grips/rh-families/verify-complete.py` verifies exact score reconstruction, audible invariance, same-finger exclusion, frozen report input hashes, active RH all-midpoint skin/pad clearance, and the stricter 1.5/25/5 motion gates. It explicitly leaves the remaining inactive travel and dense screen as separate gates.
