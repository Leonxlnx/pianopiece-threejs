# Frozen R79 / early R76 active-anchor review

**Frozen candidate:** `r79-frozen-v2.json`, SHA256 `09cfc46aceac1527e9f0b4f27bb8fa5110373bb7c889aae740c7258b9a4cbf90`. Accepted for the bounded active-anchor handoff. Whole-hand motion and idle-surface acceptance remain open.

The guarded delta `r79-frozen-v2-manifest.json` applies to the efb1e0f4 combined proof (`r79-base.json`): 287 field operations on 53 notes and 47 RH knots. Exact replay and idempotence pass. All LH fields, earlier RH supports outside the reservation, 1,068 musical events and 40 held soprano entries are preserved. This batch changes no physical durations. The six pre-existing permitted physical release changes remain p410/p411/p771/p772 −25 ms and p457/p458 −20 ms.

Natural shared support puts held G5 soprano p85 on R5 with B4/D5/E5 inner notes on R1/R2/R3. G5 targets p119/p124/p131/p283/p288 use R4, p625/p639 use R5, and p77/p912 use R3. Early E5 targets p90/p91/p107/p117 use R3. The B5 turn uses a supported local wrist excursion. The final C#5/E5/A5 chord retains R2/R3/R4; C#6 p920 uses R5 and R398 begins a gradual roll at 189.227724 during the unchanged held A5, maintaining its actual pad. R397's original pose is preserved.

The final bounded alternative changes only p135 F#5 from R3 to R4 with contactZ .203/contactLift .0033. Its 1,168 actual-surface frames through the complete outgoing p143 hold introduce no active key, IK, pad or pair failures. It removes the p135 active/idle crossing and the 25 ms same-finger jump to p139: peak over 30.2–34.82 drops from 3.357 to 1.507 m/s. Frozen v1 remains immutable and superseded.

Actual geometry evidence is `r79-frozen-v2-full-hold-validation.json` plus raw rows. There are 7,307 sampled poses and 6,201 reserved-held poses: no >3 mm reserved digit/palm core intrusion, no >0.3 mm IK error, no absent/>3 mm actual pad contact, no owned-palm crossing and no active-active crossing. All neighboring active key/IK/pad regression counts are zero. All 13 assigned targets pass those gates over 1,567 held poses; p77/p912 have up to 2.580 mm core depth within the 3 mm gate. This is actual >65%-owned skinned vertices/triangles against all 88 animated beveled key cores, not pad-only evidence.

The combined evidence reuses exact unchanged geometry only after bitwise equality of every body skeleton matrix at 6,180 prior poses; 1,168 fresh poses cover the final changed interval. After duplicate-time removal, the union has 7,307 poses (`r79-frozen-v2-component-parity.json`).

**Explicit residuals:** 248 reserved-held frames still include an active finger crossing an idle finger (39 on the assigned targets, p77/p912). The full surface comparison reports 1,841 new key frames and 495 new pair frames across 55 exact inactive gaps. `r79-frozen-v2-idle-gap-queue.json` supplies previous/next note anchors, start/end, first/last failure and key/pair counts. These are open runtime work; the active-anchor pass does not close them.

500 Hz motion sampled 13,680 poses. Candidate peak fingertip speed is 2.799 m/s at 188.603988 (RightMiddle departure), wrist 1.725 m/s, joint rate 82.948 rad/s at 62.823 (idle RightPinky1), deterministic seek error zero. Baseline peaks are 2.115 m/s, .840 m/s and 56.724 rad/s. Those remaining peaks are reported for runtime/film review, not declared natural because they are finite.

Native render evidence has 38 hash-verified PNGs (baseline/v1/final alternatives). Eighteen candidate top/oblique images at nine distinct times are proven to have bit-exact final-v2 body matrices. Every renderer reports GL_NO_ERROR and binds the rig, score and wrist-sampler hashes. `r79-renders/final-pose-parity.json` identifies the final images; `R79-VISIBLE-REVIEW.md` records direct inspection. The compact5 lifted inactive thumb remains conspicuous and belongs to root's separate runtime review.

Runtime required for these proofs: `pianist-arms-compact5-arc.mjs` SHA256 `911a888ba590e743e58d29de9126ebb80ddfa2fe0d5dee561ae94d6cd8b965ff`; `wrist-motion-arc.ts` SHA256 `792e453eff0a959b970120a8e46f0dcaa1f78872ba87baaa1ab25293996cc256`. Renderer TS uses the accepted arms+compact5 source and exact arc sampler. No checkout source was modified.

Run `node validate-r79-gates.mjs` for the bounded acceptance gate. It explicitly retains the 55-gap idle queue. Root should apply the guarded delta to its current combined score, then qualify the final chosen runtime against these active anchors.
