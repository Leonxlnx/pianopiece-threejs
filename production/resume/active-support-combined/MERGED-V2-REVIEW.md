# Finite merged hand candidate, v2

`candidate-merged-v2.json` SHA-256 `3364a8e6ae90582e7bd06d0b0c556574618e64874ebc891bc50838012f016015`; full exact deltas in `merged-v2-manifest.json`. This preserves the accepted primary-v1 fixes and adds eight LH octave-support occurrences and the C6→D6 coda pair. Thirty notes have field changes, twenty-six wrist knots change; five fingering assignments differ from b156. All1068 attacks/pitches/velocities and40 held soprano entries remain unchanged.

Validation uses root's accepted arms plus provisional compact5 thumb source `/workspace/scratch/2e8cc8e77f98/hand-runtime/pianist-arms-compact5.mjs`. Each family has actual full-held / neighboring solid checks at120Hz plus note-boundary and quarter samples. The ten previously flagged low-rest representatives now clear their thumb key-core screen (eight octave contexts, the coda context and the primary p00957 arrival). Eight residual representatives remain in five owned musical grips; `remaining-owned-grips.json` names all40 note IDs. A representative rescreen does not establish that the complete idle gap passes.

## Evidence

- `combined-primary-full-hold-validation.json`:1859 poses,308 primary-held, zero blockers or new severe held/core, IK, pad-gap or active nonthumb pair regressions. `combined-primary-motion-gate.json` contains the500Hz repeat/seek evidence.
- `octaves-v7-full-hold-validation.json`:2457 poses,844 primary-held, zero blockers and zero new severe held/core, IK, pad-gap or active nonthumb pair regressions. Eight octave supports retain L5/L2. A neighboring G3 becomes L2 with coherent support; four outgoing pinky endpoints were recalibrated to their actual skin footprints.
- `octaves-v7-motion-gate.json`:4787 poses at500Hz. Maximum tip2.952861m/s, wrist1.722694m/s, joint134.393921rad/s, direct seek exact. The remaining high local angular rate is an existing inactive transition review issue, not a human-motion certification.
- `coda-r45-slow-full-hold-validation.json`:461 poses,218 primary-held, zero blockers or new neighbor failures. C6 remains R4, D6 remains R5, with one shared supported wrist. Key-core vertices are absent at primary held samples; no own-palm/nonthumb intersections involve the held notes.
- `coda-r45-slow-motion-gate.json`:838 poses at500Hz. Maximum tip2.622031m/s, wrist1.335235m/s. Shared C6→D6 support removes the rejected21ms wrist step; arrival spans103ms. Direct seek exact. The earlier 5→5 coda candidate and the 3→4 shared candidate are rejected for this merge.
- `merged-v2-score-gates.json`:1068 attacks/pitches/velocities retained;40 held soprano entries retained; exactly two physical releases changed as described below.

## Two bounded release corrections

The C3/C4 bass octave p00457/p00458 at95.92s releases20ms earlier per note, retaining each original writtenDuration. This is the sole new audio-affecting change in v2. Both notes are bass; no held-soprano event changes. The original holds allowed only a25ms wrist reposition with a3.0846m/s peak. Beginning the same supported motion early while retaining those holds produced up to9–11mm contact errors and key-core interference. Alternative static support/fingering candidates were tested and rejected on complete hold/neighbor checks. These two finite physical releases permit a45ms motion and bring the worst wrist to1.7227m/s and tip to2.9529m/s. They require the final score's exact remaster; no broad articulation shortening was applied.

## Scope and remaining work

The solid tests cover >65%-owned actual digit/palm vertices against all88 beveled key cores and exact fully-owned noncoplanar triangle crossings. The extra footprint test rejects a pad newly floating more than3mm above its assigned inset key top. These are physical screens, not proof from markers alone. Nonzero sub3mm core contacts require visual tolerance judgment, and mixed web/enclosed/coplanar cases and times between samples are not certified. All raw rows remain available.

Final combined source must retain the exact runtime hash; the low-rest rescreen still has eight representative failures across five complete musical grips. Those are reserved to this leaf. Root's separate held-thumb field batch and the inactive nonthumb curve batch must be merged and revalidated after the wrist/score changes. Root owns final rendered visual review; no global hand or final audiovisual acceptance is claimed here.
