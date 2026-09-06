# Daybreak — final solo piano master

Rendered from the frozen 80-bar, 1,068-note score dated 2026-09-05. The composition, note pitches, velocities, key durations, pedal events and authored timing were preserved.

## Final score binding and comparison

This master uses exact score SHA-256 `5b47b2ba244b70fd2b7a63b47baccc366bdd0c7faaccbf00959c9aa43ae05baa`. The previous master remains unchanged in the adjacent `music-master` directory. Audio event signature `e68bd3b8e52b781c4c141b92d0bed1262684004723f75ae8ce73312931d00a5c` excludes finger and wrist animation fields, which the audio renderer does not use.

All 1,068 attacks, pitches, velocities, roles and hand ownership match the previous composition. The final score shortens 407 physical holds. Of these, 397 retain their former terminal pedal-up event; ten terminal releases advance 7.666–25 ms, totaling 206.732 ms. Every final key-release frame was checked against the audio event audit.

The wrist report's binary pedal endpoint check is not a claim of exactly identical audio envelopes. This established renderer models continuous half-pedal damping after physical key release. The 397 releases with the same terminal endpoint therefore add per-voice attenuation at the former key-release instant: median 0.0084 dB, 95th percentile 0.1171 dB, maximum 0.5339 dB on `p01059` under pedal depth 0.58. The next largest change is 0.1557 dB. No renderer, arrangement or voice-balance change was made to hide that physical consequence.

The final and previous premaster have identical frame counts. Their difference RMS is 46.19 dB below the previous signal RMS; overall premaster RMS changes by approximately −0.00374 dB. These are measurements, not a listening judgment. `final-release-comparison.json` records every changed hold, endpoint and integrated continuous-pedal effect.

## Listening files

| File | Content | Format |
| --- | --- | --- |
| `daybreak-solo-master.wav` | Complete 233.144218-second performance | 44.1 kHz, stereo, 24-bit PCM |
| `daybreak-solo-master.mp3` | Complete performance | 320 kbps stereo MP3 |
| `daybreak-first-theme-excerpt.wav` / `.mp3` | 35 seconds, starting at master time 12.391821 s | 24-bit PCM / 320 kbps MP3 |
| `daybreak-climax-excerpt.wav` / `.mp3` | 30 seconds, starting at master time 169.885523 s | 24-bit PCM / 320 kbps MP3 |

Excerpts retain the master gain and have 12 ms opening and 120 ms closing edge fades. The complete master contains all 10,281,660 frames of the authored duration rounded to the 44.1 kHz sample grid.

## Result and validation

The WAV measures **−18.99 LUFS**, **−1.65 dBTP**, with **7.7 LU loudness range**. The MP3 measures **−18.99 LUFS**, **−1.65 dBTP**, with the same measured loudness range. Both complete masters and all excerpts passed full decoding; every PCM value was finite, and no clipped samples were found.

The mix received a fixed −4.74 dB mastering gain. No compressor was used. A latency-compensated peak limiter catches only approximately 0.21 dB at the loudest possible peak. The full pre-master to master alignment was checked at three passages with zero detected sample lag. The performance's large-scale dynamics and attack crest were retained.

The MP3 container reports a 25.057 ms start timestamp because of encoder delay bookkeeping. FFmpeg's decoded output contains exactly the WAV's frame count, with **zero detected sample lag** at five passages spanning the beginning, middle, climax and final chord. The decoded MP3 error RMS is approximately 59.95 dB below the WAV signal RMS. These checks describe FFmpeg's gapless decoding behavior; a playback implementation should honor encoder delay/padding metadata and use its audio playback clock.

Every frozen note was mapped once to a source recording. Maximum timestamp rounding error is 11.34 microseconds; the retained recorded attack reaches its measured onset approximately 0.27–2.95 ms after the authored key contact. `event-audit.json` records each key release, pedal damping segment, source recording and same-note restrike treatment. `source-mapping.json` records hashes and exact source URLs.

**Critical listening was not performed:** no listening-capable tool was exposed. These are source, timing, signal and codec checks. The listening excerpts are supplied for human review.

## Instrument and mix

The instrument is Alexander Holm's real stereo recording of a Yamaha C5, using the recovered eight-layer Salamander bank. The frozen velocities naturally select seven of the eight available layers; the quietest layer is not forced into the score. The render uses 74 distinct recordings and 134 note/layer playback mappings. Minor-third pitch anchors require at most one semitone of transposition.

Original recorded dynamic levels are retained. Layers are selected discretely because the recordings are not phase-aligned; within-layer adjustment is capped at ±1.5 dB. No note is individually normalized. Main melody gain is 1.0, countervoice 0.94, broken harmony 0.87 and bass 0.85, in addition to the authored velocities. The countervoice sings through the main melody's gaps; across each section the main melody remains the foreground voice.

After physical key release, a continuous pedal-dependent damping envelope dissipates energy according to the exact pedal event frames. Half pedal shortens retained resonance; lifting the pedal damps it promptly, and subsequent pedal movement cannot restore lost amplitude. Repeated strikes of the same key smoothly retire the previous sampled residual over 120–150 ms. This is an acoustic approximation, rather than a full physical model of strings and dampers.

A 25 Hz, second-order high-pass filter removes rumble. A broad 0.7 dB cut around 260 Hz moderates room/body buildup. Natural source stereo width is retained. A restrained stereo room effect uses a 1.24-second decay, 18 ms predelay and a wet RMS 22.5 dB below the dry piano. No drums, accompaniment samples or synthesized musical instrument signals are present.

## Reproduction

`render_solo_master.py` contains the renderer, mix, mastering, excerpt creation and audio validation. It requires Python, NumPy, SciPy, FFmpeg and FFprobe. Exact tool versions and file hashes are recorded in `reproduction-manifest.json`. `score-frozen.json` and `sample-manifest-frozen.json` preserve the render inputs. Source audio remains in the recovered piano bank; `source-mapping.json` includes the selected source URLs and hashes.

Run `python render_solo_master.py` in this directory. Optional `--mix-only` uses the existing dry role stems; `--master-only` uses `premaster.wav`. When moving the package, set these environment variables to the actual locations:

- `DAYBREAK_SCORE_PATH`: path to `score-frozen.json`.
- `DAYBREAK_SAMPLE_MANIFEST_PATH`: path to `sample-manifest-frozen.json`.
- `DAYBREAK_SAMPLE_ROOT`: directory containing the original FLAC filenames, if their original absolute paths have changed.

The renderer verifies the frozen score's SHA-256 and each used source recording. It refuses to render a changed score. Its musical and effect processing is deterministic; small dither, encoder and container differences can occur across tool versions.

`dry-melody.wav`, `dry-countermelody.wav`, `dry-harmony.wav`, `dry-bass.wav` and `premaster.wav` are float intermediates. They are supplied for reproducibility and retain headroom beyond integer PCM. Use the finished master for playback or publication.

## Piano sample credit

Piano samples: [Salamander Grand Piano v3](https://rytmenpinne.wordpress.com/sounds-and-such/salamander-grandpiano/) by Alexander Holm, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Eight-layer subset from the [SFZ Instruments distribution](https://github.com/sfzinstruments/SalamanderGrandPiano), pinned to commit `3382bf9496bba2486f5ab0de55a264d1dfc38404`. Samples were transposed where needed, filtered, given note/pedal envelopes, spatially mixed and mastered. Original music and performance arrangement created for Daybreak. The author does not endorse this project.

The shipped source license is retained as `piano-samples-LICENSE-CC-BY-3.0.txt`.
