# DAYBREAK — lyrical piano revision

An original **3:53.144** solo-piano composition: 80 measures in 4/4, G major, an E-minor middle, and a developed G-major return. It replaces the earlier 92-measure D-to-E-major piano/ensemble score. No melody or arrangement from the user's reference work was used.

The identity is an upward **D–G–A** call answered by **G–E–D**, followed by a lower second sentence. The opening plants it in the middle register; measure 5 gives the complete two-bar theme. Measures 29, 57 and 73 preserve that two-bar identity. Measure 13 instead reharmonizes the answer with B7/D♯, turning toward E minor. Recognition comes from a short theme returning with purpose.

Fourteen accompaniment figures vary the order, density and endings of the broken-harmony flow. Longer soprano notes make room for 47 written countervoice notes, including inner motion under an actually held outer finger. The minor middle removes the busy eighth-note motion for a more spacious conversation. Cmaj9 to Cm6 before the return introduces a darkened E♭. The final section develops the second half of the theme, reaches its sole E6 in measure 67, and broadens through A7/C♯, Cmaj9 and Cm6. The lift comes from melodic development and texture within G major.

The coda returns the original two-bar sentence, descends in register, slows from 84 to 54 BPM, resolves the final dominant's G–F♯ suspension, and lands on G6/9. Its last physical release is **229.003228 s**; the pedal rises at **230.094228 s**; the complete resonance tail ends at **233.144228 s**. It has a written ending and does not loop.

## Form

| Measures | Section | Start seconds | End seconds | Energy |
|---|---|---:|---:|---:|
| 1–4 | First light | 0.000000 | 12.391821 | 0.28 |
| 5–20 | A window opens | 12.391821 | 57.318150 | 0.56 |
| 21–28 | A little farther | 57.318150 | 79.521464 | 0.69 |
| 29–40 | Daybreak | 79.521464 | 112.445576 | 0.82 |
| 41–52 | What the night kept | 112.445576 | 147.512753 | 0.44 |
| 53–56 | The light returns | 147.512753 | 159.156206 | 0.62 |
| 57–72 | Everything opens | 159.156206 | 202.073473 | 0.98 |
| 73–80 + tail | Home in the light | 202.073473 | 233.144228 | 0.38 |

## Useful close-ups

| Passage | Seconds | Visible performance |
|---|---:|---|
| Measure 5 | 12.391821–15.182519 | First complete theme over flowing left hand |
| Measure 8 | 20.731837–23.623403 | Held soprano G5 with B4–D5–E5 response beneath |
| Measures 29–32 | 79.521464–90.496168 | Voiced return, bass octave openings, held-soprano response |
| Measures 43–44 | 118.263972–124.228776 | Sparse middle and physically retained melody |
| Measure 60 | 167.126902–169.885523 | Full return with moving inner fingers |
| Measure 67 | 185.918869–188.585536 | Sole E6 climax with quieter G5 and B5 beneath |
| Measure 76 | 210.857445–213.974328 | Last inner response as the performance slows |
| Measures 79–80 and tail | 220.740260–233.144228 | Dominant resolution, seven-key final voicing, independent releases |

## Playback

`score.json` contains performed seconds. Do not reapply tempo changes, quantization, swing or randomized timing. `tempoMap` is for displays and notation. Per-note `bar` and `beat` are metadata; `time` is authoritative.

The piano is the complete arrangement. `accompaniment` is empty. Melody, bass, harmony and countermelody are all piano notes belonging to the visible two hands. Mean marked velocity is 0.7425 for melody and 0.5130 for harmony. Retain that hierarchy when choosing sample layers and amplitude; normalize the whole performance, not individual voices or sections. Countermelody sits between soprano and accompaniment in level.

Physical key holds and pedal sustain are separate. Keep the audio ringing when a finger releases under the pedal; stop visible contact and key depression at `time + duration`. Permit new attacks on pedal-sustained pitches. Pedal clears every harmony, with extra half-bar clears in fuller writing. Coda measure 79 clears the suspension before the leading tone. Use a smooth release after pedal-up and render the complete tail.

The melody is roughly 25–34 ms behind the beat, with bass downbeats leading it. Inner responses speak a further 9 ms behind their beat. Chords roll by 3.5 ms per key. These offsets and phrase-shaped measure tempos are deterministic and should survive rendering without another humanization layer.

## Verification

1,068 notes: 419 melody, 47 countervoice, 104 bass and 498 harmony; MIDI 40–88. Exact hold sweep: maximum **3 left / 4 right** simultaneous keys, maximum **12 / 10 semitones**. No duplicate held keys, simultaneous reused fingers or unordered grips. Forty inner-voice entries under written sustained melody also pass a check that the soprano physically stays down.

965 successive whole-hand attack transitions pass an airborne-gap rule: 24 ms up to seven semitones of grip-center motion, plus 8.6 ms per additional semitone. The widest shift is 20 semitones with 135.8 ms available. Twenty-eight shifts exceed an octave. This is a transparent animation constraint, not a biomechanical proof or prescribed fingering edition.

## Reproduction

- `compose_revision.py`: all authored music, performance planning and primary checks; Python 3, no dependencies.
- `score.json`: authoritative timeline.
- `validation.json` / `VALIDATION.md`: generated structural results and wide-shift evidence.
- `audit_revision.py` / `independent_audit.json`: independent consumer-side JSON audit.
- `GATES.md`: requirements fixed before composing.
- `REVISION_REVIEW.md`: four-pass critique and corrections.
- `freeze.json`: deterministic score hash.
- `compose_daybreak.py`: previous composition retained for comparison.

No auditory pass is claimed by this composition task. The notation, voicing hierarchy, event structure and physical timeline were inspected. Sample behavior and the final audible result must be assessed in the playback/render environment.
