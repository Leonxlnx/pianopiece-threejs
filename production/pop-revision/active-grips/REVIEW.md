# Active grip repair proposal

The exact proposal is `active-grip-patch.json`; root alone applies it to the checkout. It changes physical fingering and contact fields for 22 notes, preserving every pitch, onset, duration, velocity, pedal, and baked wrist sample. `score-candidate.json` is the independently tested complete score snapshot.

## Why the original holds failed

The ring fingers in the C/E and E/G accompaniment grips approached their keys sideways from MCPs almost directly above the contact depth. The right ring at 70.206157 s moved roughly 28 mm inward and only 11 mm forward to its PIP. The tip marker touched accurately while the actual ring mesh crossed its palm and its idle middle neighbor. Strengthening a global hand-pose cost cleared some holds but changed other wrist fits and fell into different local minima. Simple wrist translation, same-finger depth edits, and rotating nonthumb flexion planes traded the palm intersections for other collisions.

The bridge thumb at 174.554875 s penetrated an adjacent C3 key core by 6.825 mm, despite correct tip contact.

## Accepted bounded solution

- Nineteen E-family notes substitute the middle finger for the ring. Right E5 uses contactZ .209, except db00942 at .224; left E3 uses .219. These depths fit the real white-key surfaces between the neighboring black keys. Exact IDs are in the patch; no same-finger held-note overlap is introduced.
- The G5/E5 chord at 190.017–190.391 s uses index/thumb. db00866: finger2, contactZ .254, contactLift .0045. db00867: finger1, contactZ .269, contactLift .0075, thumbOpposition .4.
- Bridge db00786 retains the thumb with contactZ .269, thumbOpposition −.4, and contactLift .0073. The final lift puts its actual pad .309 mm above the assigned key surface.

## Evidence

Run `python verify.py`. It verifies score invariants, same-finger overlap, exact candidate-score SHA, at least five held samples for each changed note, actual skin surface pairs, all-88-key core clearance, actual fingertip pad contact, and marker error. It prints `ACTIVE GRIPS VERIFIED`.

`final-pad-surfaces.json` replays 162 finite contexts: five holds plus entry/exit controls for every E-family note, ten held samples for each G-chord note, and eleven bridge-thumb holds plus controls. All changed digits have zero actual own-palm or neighbor surface intersections and zero key-core penetration over 3 mm during the sampled holds. Maximum marker error is .406 mm. All 360 actual pad samples are present, with gaps −.760 to +1.070 mm. The entire finite replay has zero active key-core hits over 3 mm.

The matched E-family baseline had 620 own-palm and 2,865 neighbor triangle-pair incidences across its 95 changed-note held contexts. Both become zero for the changed digits. Pair counts are evidence of intersection, not physical penetration depth.

`audit-pad-surfaces.mjs` extends the root's exact skin audit. Its pad screen selects original distal fingertip vertices using bind-pose distal-bone weights, then ray-casts their vertical projection against the assigned animated rounded-key mesh. It deliberately has no hard-coded white-key front-only depth window. The all-88-key screen still tests neighboring keys independently, so a clear assigned pad cannot hide a shaft piercing an adjacent black key.

## Remaining scope

This freezes the earlier idle implementation to isolate the active changes. The full report still contains 127 inactive key-core hits and pervasive old idle thumb/palm intersections. They are retained rather than filtered away. Parent/root and the idle-hand agent own that separate repair. These finite active checks do not certify continuous motion, integrated idle changes, pad velocity, or final visual appearance. Root should replay the exact integrated score and render the affected holds before global acceptance.

All sources, model, score and input hashes are preserved in the report. No checkout file was edited by this agent.
