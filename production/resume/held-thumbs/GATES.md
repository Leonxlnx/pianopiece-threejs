# Gates: Held thumb endpoints

Scope: Audit all thumb notes on frozen 9db score + compact5 rig. Fit only contactZ, contactLift and thumbOpposition outside root/active-hand-fit reserved IDs. No app code, wrist, audio, fingering, model, Site or checkout edits.

- [x] T1: Exact frozen score, rig, model and reserved note ownership are hashed and recorded.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: input-hashes.json pins score 9db662f1, source 4ef26cd1, compiled c1926fa8, model and local dependency copies; reservations.json records 72 disjoint reserved IDs.
- [x] T2: Every thumb note is audited through held fractions using actual owned thumb/key geometry, true pad gap, own palm and neighboring fingers; finite bad-note queue recorded.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: baseline-audit.json contains all 289 thumb notes at 13 declared fractions (3757 actual geometry samples); bad-note-queue.json contains 153 notes, 13 reserved and 140 unreserved after ownership transfers.
- [x] T3: Every unreserved bad thumb receives a bounded fit or explicit finite whole-grip exception; retained candidates meet key core <=3 mm and pad gap approximately +/-2.5 mm without own palm/neighbor crossings.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: 71 changes pass held/boundary validation; whole-grip-exceptions.json contains the 69 other unreserved notes and was sent to active_hand_fit. Maximum accepted core 2.774557 mm; pad gap -2.305104 to +2.068933 mm; owned crossings zero.
- [x] T4: Changed notes preserve all unauthorized fields; whole held interval validation and exact changes/evidence are packaged, paired timing and new idle transitions are queued for root.
  CHECK: node check.mjs
  EXPECT: PASS
  EVIDENCE: validation-report.json checks all 289 thumbs with 8857 samples, 4900 covering the 71 changed holds at 120 Hz plus explicit event boundaries; changes.json has only authorized fields; root-transition-queue.json records 119 unique idle transitions and 71 paired-event entries; six actual EGL frames inspected and hashed.
