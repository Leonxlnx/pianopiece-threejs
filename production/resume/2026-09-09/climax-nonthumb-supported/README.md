# Non-thumb continuity proposal — frozen for parent review

This is a useful local improvement over the frozen coordinated-release candidate, not a whole-film acceptance. No score bytes, pitches, attacks, velocities, written durations, physical durations, or pedal events changed in this followup. Thumb continuity remains separately owned.

The proposal clears the requested LMiddle approach witness, LPalm departure witness, and new LIndex–LRing late-gap crossing. It restores the original earlier RIndex idle context. The complete held/departure meshes at159.3 and159.5 are byte-identical to the frozen clean candidate.

| Witness | Frozen coordinated release | Supported proposal |
|---|---:|---:|
| LMiddle→MIDI49,159.0875 |5.2910806011118305mm /21vertices|No key-core hit|
| LPalm→MIDI52,159.4125 |4.370208939570519mm /3vertices|No key-core hit|
| LIndex–LRing,159.795833333 |64triangle pairs|0|
| RIndex→MIDI73,153.820212667 |6.1016143942650425mm /12vertices|Original5.373672594698786mm /9vertices|

The LMiddle, LIndex and LRing use a shared smooth approach phase158.99→159.153206 between immutable complete local joint postures, with a0.10rad MCP clearance arc about measured fixed local axes. This replaces unstable inverse-bend interpolation inside this short transition. The held poses remain untouched.

A5mm sin² wrist-Y arc operates only inside the fully released LH gap159.374607→159.498539. The arm solver follows that wrist support normally. It clears the palm without changing bone lengths. **This shared wrist change requires the thumb owner to re-extract the LH departure curve endpoints159.42/159.47.** No thumb helper was changed here. Incoming thumb endpoints are unaffected.

For the changed inactive digits, the original fingering/contact/wrist endpoints are retained as idle context outside the local chord envelope. The old context fades out158.90→159.00 and returns159.50→159.65, restricted to each actually affected gap. These context notes cannot sound or override active contacts. They only generate an alternative inactive complete joint pose. This removes distant refingering side effects caused by the old whole-gap envelope minimum.

Validation used1277times /2554hand states across the same full interval as the frozen candidate, including60Hz complete gaps,240Hz local motion, exact moving key surfaces, neighbor held notes, and strict triangle-pair witnesses. Raw results and individual changed keys/pairs are included; totals are not used as acceptance.

Against the frozen coordinated-release source:

- 695key-depth rows improve,136pair-count rows improve.
- 57key rows worsen by depth and/or witness count. Only one worsened depth row exceeds3mm: **LPalm→52 at159.091666667,3.132434415322183→3.1402024179226498mm,5vertices in both, maximum vertex8928**. This is explicitly not a passing3mm gate.
- 15existing pair-count rows increase; zero new pair-crossing rows. Every increase equals the original encoded baseline count restored by the original idle context. RIndex–RMiddle has13rows, maximum107→133 at160.370212667; LIndex–LMiddle has2rows, maximum112→114 at159.986879333. Exact original/frozen/proposal counts and witnesses are in all-key-pair-changes.json.gz.
- 8948active joint points compared, maximum change0mm; active pad gaps unchanged; no point error above0.15mm.
- Thumb chains outside the LH wrist arc are exact, maximum point change0mm.
- Native compiled parity is exact for32hand states and16complete skinned meshes. The159.3 and159.5 complete skins exactly equal the frozen reference.

At1kHz, LIndex/Middle/Ring MCP peaks fall49.643731/53.645529/44.662127→7.365847/8.973532/9.665186rad/s. The unchanged LPinky approach retains a92.806872rad/s MCP peak at159.105 and125.754395rad/s PIP peak. The thumb owner is addressing thumb cusps separately.

Remaining original-baseline differences are disclosed in supported-vs-original-summary/details. The proposal leaves46worsened >3mm key rows and102pair increases versus the original encoded source. Relevant residuals include LPalm approach max3.441628402693797mm at159.095833333; LIndex departure max3.624591605028704mm at159.399; RIndex departure max3.489040257352749mm at159.43265. The RH approach still has45new RIndex–RMiddle crossing rows (maximum101at159.025) and7new RRing–RPinky crossing rows; this followup does not claim those fixed. Four one-triangle LThumb–LPalm rows remain within the shared released gap. No unrelated baseline defects were pursued.

Seven actual chronological1920native frames are in native/:159.04,159.0875,159.12,159.3,159.4125,159.5,159.795833333. The approach has a steadier curved free-finger silhouette; the159.3/159.5 images retain the clean reference geometry. The remaining RH approach silhouette is visible for parent judgment. Renderer reported GL_NO_ERROR for every image.

Authoritative files:

- supported.ts SHA256 bff30b61f34ef3d4e522509fdb3f2b47d7aef806f191da928376639fb13be9ee
- supported.mjs SHA256 bf18ccdd6bed5e75f9ddf146b098a42efe4d51e7df23f432d6e0366060617ee4
- coordinated-release-score.json SHA2565c7337e63181228c284f4a58c3b9906a9679b597c5e1f810016716ecc5cb5467
- Native snapshot fingerprint83dd6d53df39399e.
- source.patch is the exact delta from coordinated-release.ts SHA256b79c196938d4b33a34b26eaaca7b60cbcaba543e8b16428ec16dee7fe8d00d2a.

No Site or source promotion occurred. Parent review and combined thumb/wrist validation remain necessary.
