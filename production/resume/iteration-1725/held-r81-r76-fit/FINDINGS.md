# RH81/RH76 active-anchor result

Frozen candidate: `candidate-v8.json`, SHA256 `f2901bbd59579278aa9a4503c76cc314a1c5e3826b1912a8cc93de07d1786c73`. Frozen combined-v4 base `efb1e0f482803e20cd862efc2fe66666c44b34c217984b80f1637c577ee82cdc`. Source compact5 TS `4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45`. No app/check-out edits or musical edits.

The seven requested active notes pass complete-held and neighbor-active surface/key/contact gates. This is **not whole-hand acceptance**: the inactive-only regression queue remains open (527 observed rows,45 sampled groups:36 key-core groups and9 surface-pair groups).

## Score delta

`guarded-delta.json` is the exact merge contract with before/after existence/value guards.15 RH notes change only finger/contactZ/contactLift/thumbOpposition.12 RH wrist knots change only position/quaternion/moveStart. Every attack,pitch,velocity,duration,writtenDuration,held soprano, pedal and other musical field is exact. RH89 notes p417/418/420/421/423/425/428/429 and R183–188 are exact. No new same-finger held overlap.

- p409,p440,p574: E5 becomes R3 at z.236/lift.003; wrist unchanged.
- Shared E5/B5/G5/A5 phrase: p490/493 E5R2, p491 B5R5, p495/501 G5R3, p497/499 A5R4, p503 E5R2, p505 G5R5. R212–218 share p[.20219,.77477,.38955], q[-.06254104649644597,-.7015571003008385,.6818608465155221,.19741336963271727]. R219 gradually returns to65% of the prior support delta during E5 hold (moveStart103.620); R220 keeps original pose and uses moveStart104.190→104.220145 (30.145ms, continuous quintic, no instant pose jump).
- p971 B5 and p974/986 A5 become R5 at z.252/lift.003. R420/421/426 add14mmX and25mmZ with rotation/y/timing exact. This resolves the sideways B5 reach seen in rejected v7 review while preserving the A5 pads.

## Evidence and limits

`v7-all-full-hold-validation.json` plus `v8-late-full-hold-validation.json`:3585 actual states,1531 target/guard held frames; zero target blockers, new severe held key hits, new IK failures, new mesh contact failures or new active pair types. V8 changes only the late contexts; those1018 states were fully rerun. All9 shared/return notes are included as targets. `final-surface-summary.json` verifies2009 distal skin pad samples, gap range -0.303873..1.608110mm, missing0, over3mm0.

`extra-gates-v8.json`:613 additional states on each baseline/candidate/candidate+L62, including1kHz windows197.976–198.032 and104.170–104.230 and120Hz197.1–201.2. Opposing-hand triangle crossings0 with arm leaf's frozen53ce470d LH support. Target dense entry/exit surfaces clear.179 remaining candidate held-pair rows are unchanged pre-existing neighbor notes p507/508,p978,p981/982,p988, not hidden as passed.

`v8-all-motion-gate.json`:5581 states/rig at500Hz; deterministic seek0. Candidate tip maximum2.263612m/s vsbaseline2.628278; wrist1.298681 vs.802671; local-joint peak61.938238rad/s, exactly the baseline peak at RIndex2/92.168623s. The short B5→A5 transition is actual MCP flexion/spread, not an axial twist escape: `pinky-transition-v8.json` samples2kHz197.95–198.07,241states, peak43.593612rad/s at MCP197.993, skin1.655420m/s (0.827710mm per0.5ms), tip1.573164m/s. Rejected v7 was83.843994rad/s andskin2.178753m/s. Both were evaluated as native sequences; V8 now moves the pinky continuously inward and down from the B5 pad to A5.

`evidence-v8/index.json` indexes52 matched actual960×540 frames:7 held times plus6 late sequence times, baseline/candidate×top/oblique. Every report retains strictGL_NO_ERROR and accepted4×MSAA. Final native rig body is byte-identical after import path normalization; sampler is exactc9f33ac6. Native score hash equals the frozen candidate. The five early contexts are pixel-identical between V7 andV8 and were inspected; late held and motion sheets were inspected directly. Top and oblique are diagnostic close cameras, not authored film shots. Key sheets: `evidence-v8/paired-102.670000.png`, `paired-197.975000.png`, `paired-198.140000.png`, `pinky-transition-sequence.png`.

`idle-regression-queue.json` records every new inactive-only pair/core row, finger gap previous/next IDs and times, and45 finite groups. Group bounds are sampled observations, not continuous interval proofs. Largest new idle key depth7.979mm. This requires the separate idle-source/curve work before final film acceptance; no additive helper was mixed into this leaf. Root's later RH chord/p981/982 work must replay merged opposing/support windows.

## Reproduction

Run from this directory. `source env.sh`; `python check-delivery.py`; `FULL_CONFIG=all-contexts-v6.json SCORE_OVERRIDE=candidate-v8.json REPORT_PREFIX=recheck- node full-validate-strict.mjs`; `FULL_CONFIG=all-contexts-v6.json SCORE_OVERRIDE=candidate-v8.json REPORT_PREFIX=recheck- node motion-gate.mjs`. `node verify-extra-v8.mjs` includes the frozen L62 delta. `python summarize-final.py` checks saved raw reports and creates the queue. `python render-review-v8.py` uses the recovered native renderer and frozen arc-compatible `render-project`; it should run with no other renderer active. Existing baseline images/reports remain in `evidence/`.

Parent owns integration. Audio/master need no change because all musical fields are exact. No final-film render has started.
