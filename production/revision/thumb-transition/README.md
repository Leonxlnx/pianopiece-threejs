# Inactive thumb transition repair

This candidate changes only released thumbs. The held-note branch, wrist sampler, body motion, source score and audio fields are untouched. Apply `thumb-transition.patch`; the only shared-line conflict with the nonthumb agent is the separate clearance expression on `idle.y`.

The old thumb target lived in keyboard coordinates while the wrist moved. A target could move through the thumb base, degenerating the complete flexion plane; another discontinuity moved the idle clearance by 16 mm at z=.230. The replacement follows the wrist with a complete local three-joint pose, interpolated between the exact release and attack poses and a relaxed pose. Endpoint keys explicitly use full depression, as at the instant of release or attack. The neutral clearance descends continuously from 27 to 11 mm over z=.230–.260.

Short gaps interpolate the two contact poses with a modest neutral contribution. Longer gaps ease to neutral over .22 seconds, and prepare the next touch over .30 seconds. All terms are functions of absolute score time. There is no integration state or random movement.

## Measured evidence

- Four complete 500 Hz partitions cover the 233.144-second score. The earlier L-thumb 14 m/s and 7.67 m/s world-target jumps are absent. No thumb sample exceeds 5 m/s. The remaining 4.788 m/s maximum is a separate 24 ms same-thumb note gap.
- 162 windows covering old defects and new candidate peaks were refined at 2 kHz. Aside from the two 24 ms same-thumb gaps, joint-rate exceptions occur in held notes and are handled by the active-contact agent. These are not marked as a global pass.
- 531,960 comparisons of actual active-thumb skin vertices show **zero position difference**. Contact tip difference is zero; normalized quaternion comparison is within 0.000004 degrees of round-off.
- All 572 thumb attack/release boundaries were sampled ±0.1 microseconds. Maximum tip change is 0.000436 mm. These boundary checks establish position continuity, not a claim that every velocity derivative is smooth.
- At 449 prior defect times, the blended-skin determinant proxy has the same minimum (0.15894); samples below .5 decrease from 12,900 to 12,548 out of 278,380. This is a skin volume-loss proxy, not a collision proof.
- `thumb-shape.json` samples complete thumb geometry at 120 Hz: inactive IP flexion remains below 31.11 degrees, and MCP bend below 88.88 degrees. Endpoint-driven CMC rotations can remain large in the frozen active score; these are not claimed to be clinical anatomical measurements.

`render-baseline` and `render-candidate-2` contain paired actual-scene close-ups at 3.002 and 183.204 seconds. The candidate removes the folded thumb base visible in the baseline. `motion-candidate` contains a reviewed 69-frame slow inspection export and individual review frames; score time is sampled at 100 Hz and played at 25 fps. It is an offline scene export with documented material/shadow approximations, not a browser recording.

## Separate score corrections

`gap-score-edits.json` contains only these finger/pad changes, with no audible timing edits:

| Note | Finger | Contact lift |
|---|---:|---:|
| p00487 | 4 | .003029 m |
| p00693 | 2 | .003511 m |

Both alternatives preserve the frozen wrist path and avoid held-finger conflicts. `gap-search.json` records actual held skin/contact checks for all tested alternatives. `gap-motion-check.json` covers both passages at 2 kHz. Changed ring/index peaks are below 1.94 m/s and 1,894 degrees/s; the unrelated existing left-hand idle defects in that report belong to the nonthumb work. Composer should merge these edits into the final score and the combined audit should then run against that exact result.

## Reproduce

Run in this directory with the project dependency symlink. `node compile.cjs` compiles the isolated snapshot. `scan-thumbs.mjs PART 4 500` performs each full-score partition; `refine-thumbs.mjs PART 4` refines the selected 2 kHz windows. `skin-boundaries.mjs`, `thumb-shape.mjs`, `search-gaps.mjs`, and `check-gap-motions.mjs` generate the other reports. Render scripts use the same EGL environment as production QA and the actual performer GLB from the checkout.

Angular-speed scripts normalize quaternions before comparison. Uniform fine-rate sampling avoids a duplicate final timestamp separated by floating-point epsilon; such duplicate timestamps otherwise produce meaningless huge rate numbers.

The motion sheet was reviewed across both passages: the thumb opens and settles without the earlier folded base or abrupt raised-floor jump. This acceptance applies to the isolated inactive-thumb patch. The complete combined score/rig remains subject to the anatomy agent’s final audit.

The six right-hand gap-correction frames at 101.16/101.32/101.48 and 153.43/153.60/153.76 seconds were reviewed. The changed fingers form continuous curved chains without the former thumb-to-thumb rush; no new obvious mesh collapse is visible in these views. The 69-frame thumb MP4 decodes fully at960×540/25fps, duration2.76 seconds.
