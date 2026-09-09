# RH 68–74 phrase — frozen active anchors

`rh68-frozen-v5.json` SHA256 `205ddb7f5819d55d137f1363c142ac6c8e9606fb85af21bf5c695a83e92575d3`; thirteen note and eleven wrist changes relative to merged-v2 are in the matching manifest. No additional music or duration changes. Both A5/B5 sustained soprano holds are preserved.

The first D5/A5 sixth uses R2/R5, with raised shared support through F#5 R4 and E5 R3. The next D5/B5 reach uses R1/R5 and descends A5 R4, G5 R3, F#5 R3, D5 R2. Ending with index lets the thumb prepare the following G4 while D5 remains held. A thumb ending passed static contact but caused6.41 m/s gap motion and was rejected. F#5 R2→D5 R2 caused4.76 m/s and was also rejected; the accepted sequence peaks3.39 m/s.

`rh68-v5-full-hold-validation.json`:1812 actual mesh samples, including the unchanged incoming p00306 G5 and its preceding neighbor, all thirteen complete changed-note holds and outgoing p00337/p00338 holds. All key-core, IK and pad-gap failure counters are zero. The report flags88 active-surface pair frames:79 in the unchanged p00306 G5/R4 with inactive R5, nine in the new p00334 D5/R2 with inactive R3. Eighteen pair frames are new versus baseline, across these two idle intervals. Root's inactive nonthumb leaf has the exact frozen anchors; these are real residual crossings, not closed gates.

R5 gap: p00293 release65.563664 → p00309 attack68.448307; new crossing68.371–68.405.
R3 gap: new p00331 release73.224882 → p00347 attack75.663838; new crossing73.878–73.906699.

`rh68-v5-motion-gate.json`:3291 samples at500Hz, maximum tip3.3905 m/s (baseline4.3710), wrist1.1870 m/s, joint59.0486 rad/s (baseline103.4512), deterministic seekexact0. Root visual review remains required.
