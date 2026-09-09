# Final climax integration — parent review, 2026-09-09

Accepted for the revised release as a visible improvement, with the finite limitations below. This is not an assertion that every anatomical threshold passes.

## What changed

The G2/G3 octave uses left Pinky/Thumb, and the G4/B4/D5 chord uses right Thumb/Middle/Pinky. Four physical releases are 50 ms earlier under the existing sustain pedal; attacks, pitches, written durations and velocities are unchanged. A fresh soundtrack must therefore be rendered from score `5c7337e63181228c284f4a58c3b9906a9679b597c5e1f810016716ecc5cb5467`.

The integration combines the supported left hand, restored original idle context, ordered right-hand arrival, three bound thumb joint curves, and a relaxed right thumb during its following rest. It avoids the conspicuous crossed/pointed silhouette that stopped the first film export.

## Evidence and limits

The final composition was evaluated at 2,627 times (5,254 hand states), including exact note boundaries, the complete affected gap, a 2 kHz arrival sweep and the longer thumb rest. Across 1,846 held chord contact samples the maximum target error was 0.000170 mm. Held contact gaps did not change. App compilation is byte-identical to the reviewed runtime after import-path normalization.

Compared with the original app, the dense union has 2,383 improved finger-pair rows and 19 increased/new pair rows. The residual Index/Middle crossing peaks at 16 proximity pairs near 159.172 s. The right Middle briefly reaches 3.1221 mm into adjacent A#4 at 159.1595 s. A disclosed existing left-palm/E3 intersection reaches 3.5107 mm during approach. Raw per-key/per-pair witnesses are retained; counts do not establish physical contact on their own.

The parent visually inspected final native 1080p frames at 159.131, 159.172, 159.300 and 159.800 s, including the residual crossing witness, held chord and relaxed rest. The silhouettes are materially improved and the reviewed held chord is coherent. Small mesh intersections remain. The broader anatomical gate and live browser 3D verification are not claimed complete.

Seven final native frames returned GL_NO_ERROR under snapshot 22b5e48d6c4441f7. A subsequent TypeScript annotation fix declares existing bar/beat/writtenDuration metadata; emitted JavaScript is unchanged. Strict typechecking passed. `typefix.json` records the final source hash.

Next: render a fresh exact-score master, start a new immutable full film (never reuse old rig chunks), review the actual encoded climax, publish, finish export, save final media and synchronize GitHub.
