# Four-pass music review

## 1. Complete implementation

Authored a new C-major melody and all 88 bars of harmony/structure. Added
intro, two differing verses, ascending prechoruses, three recognizable refrain
entries, a quiet minor bridge, a developed final refrain and a four-bar coda.
The pulse comes entirely from piano. Literal melodic tables are retained in
`compose.py`; there is no pitch randomizer or copied tune.

## 2. Musical expert reread

Checked every melody/harmony row, register progression, repeated-hook identity,
voice hierarchy, coda preparation and rests. Kept the refrain opening intact
at its three main entrances. The bridge's F-minor inflection is brief and
prepared by F major; the final C-major cadence resolves that color. The final
C6 appears in the developed return, giving the climax a register ceiling that
earlier sections have not spent. Rejected dense four-note right-hand grips:
small dyads support the vocal line without an unnecessarily busy upper texture.

The musical tradeoff is deliberate: the harmony is more direct and the rhythms
more repeatable than the previous lyrical revision. The twelve-bar refrain,
inverted bass movement, contrasting bridge and newly written final continuation
keep that accessibility from becoming a repeated four-bar backing track.

## 3. Correctness and integration defect hunt

The first construction caught an over-short final left-hand roll; the ending
now uses one simultaneous, comfortable bass/third grip. The shortest melodic
sixteenths retain a real release window. Independent JSON verification checks
same-key and same-finger overlap, grip ordering, held spans, bounded timings,
pedal release, a complete tail and note/codec alignment. A deliberately duplicated
key/finger control must fail. Baseline result: L2/R2 notes, L7/R7-semitone spans,
all fingers used, and no black-key thumbs. The previous wrist trajectory is
absent and must not be attached to this new musical timeline.

The master's immutable score snapshot and full rerender path replace old absolute
scratch paths. Cached mix/master modes reject an input score hash different
from their frozen source. Audio-event equality also checks physical releases,
because an earlier release under partial pedal changes sound. No old master can
be relabeled as the new performance.

## 4. Polish

Corrected the final chord label from C6 to C: the actual final keys are C–E–G.
This metadata correction does not change the sound. Kept phrase-end dynamic
relaxation, lower accompaniment velocities and all coda tempo steps. Added
concise composition/production notes, original source credit, pinned source
license, complete verification and listening excerpts. Final signal figures
belong in the generated `mastering-analysis.json` and `verification.json`,
where they remain tied to the exact rendered input.

These passes are score/source/signal review. No auditory listening or claim of
matching the artistic quality of a reference recording is made.

## Context inspected

- Root `handoff.md`, `README.md`, `ITERATION-GATES.md`.
- `context/TECHNICAL-HANDOFF.md`, music requirements in
  `context/USER-PROMPTS.md`, relevant remaining work in
  `context/STATUS-AND-NEXT-STEPS.md`.
- `production/README.md` and `production/licenses/piano.md`.
- `production/score/COMPOSITION.md`, `CREATIVE-REVIEW.md`, `QA.md`, and complete
  `compose_daybreak.py`.
- `production/revision/score/COMPOSITION.md`, `REVISION_REVIEW.md`, and complete
  `compose_revision.py`.
- `production/revision/music-review/REVIEW.md` and complete `review_score.py`.
- `production/revision/master/README.md` and `music-master-final/README.md`;
  complete final `render_solo_master.py` and its two-line diff from the prior
  renderer, frozen sample manifest, old source/master manifests.
- `production/revision/wrist-analysis/HANDOFF.md`, `RECOMMENDATION.md`,
  `active-finger-fix/HANDOFF.md`, and `thumb-transition/README.md` for physical
  release and old-motion integration risks.
- `production/qa/evidence/audio-quality.md` as historical evidence only.
- The assigned leaf gate and the full unlazy skill.
