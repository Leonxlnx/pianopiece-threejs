# Music integration handoff

The new composition is complete. The supplied audio is the exact master of the
**composition baseline**. It is suitable for previewing that baseline and is
not automatically the final Site master after rig-specific release corrections.

Primary files:

- `score.json`: current music-leaf score, 1,011 notes, 227.101587 seconds.
- `score-baseline.json`: preserved reproducible composition before rig fitting.
- `daybreak-solo-master.mp3`: complete stereo 320 kbps web playback asset.
- `daybreak-solo-master.wav`: complete 44.1 kHz, stereo, 24-bit source master.
- `daybreak-first-theme-excerpt.mp3`: 70–100 seconds, the first full refrain.
- `daybreak-climax-excerpt.mp3`: 180–210 seconds, the final refrain.
- `compose.py`, `fetch_samples.py`, `render.py`, `verify.py`: reproducible source.
- `COMPOSITION.md`, `REVIEW.md`: form, rationale, exact context read, limitations.
- `credits.txt`, `piano-samples-LICENSE.txt`, manifests: legal sample provenance.
- `verification.json`: generated only after the real full verification passes.

## Required integration boundary

The hand owner is still fitting the current rig and checking note releases.
The source score deliberately contains no prior `wristMotion`. Finger/contact
or newly baked wrist data alone do not change sound. A change to `duration`,
`time`, `midi`, `velocity`, hand/role assignment or any pedal event requires the
audible-event binding to be checked and, when it changes, a new render.

After the physical-release score is frozen, copy that final score into this
folder as `score.json` (keep `score-baseline.json`), then run:

```sh
python fetch_samples.py
python render.py
python verify.py
```

These commands operate inside the music folder. The renderer writes an exact
immutable input to `score-frozen.json`; cached mix/master options refuse a
different score. The verifier allows animation-only differences but rejects
any audible mismatch. Root should rerun the verification itself before copying
the resulting MP3 into Site assets. Do not copy a historical Daybreak master
or trajectory into the new performance.

## Remaining limitation

Critical listening was not possible with the exposed capabilities. Source,
notation, real decoded PCM, measured loudness, sample provenance and timing were
reviewed; no listening approval is claimed. The full master and the two refrain
excerpts are available for that review.

## Portable source paths

Pinned sample locations now resolve relative to this music directory, so a fresh checkout does not depend on an earlier agent workspace. Recorded source SHA-256 values and URLs are unchanged. Current mastering manifests describe the prior frozen render exactly; their original renderer/sample-manifest hashes remain provenance, and final integration will regenerate them from the final source and score.
