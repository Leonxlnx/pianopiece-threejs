# DAYBREAK

Original piano-led pop-cinematic instrumental. **3:49**, 92 measures in 4/4, initially 100 BPM. D major moves through B minor and finally opens into E major. The coda gradually slows to 60 BPM and ends on a sustained E6/9, followed by an audible pedal release and resonance.

## The musical idea

The hook begins **F♯–E–D–F♯–A**, with a dotted-eighth/sixteenth descent, two eighths and a long upward arrival. It is introduced as a quiet fragment in the opening, developed through smaller verse phrases, and first stated in full at 57.6 seconds. Its twelve-bar refrain contains three different sentences: a direct statement and answer, a higher sequential answer over a new progression, and a wider-reaching extension with a secondary dominant and a plagal arrival.

The second verse moves inward to B minor and uses new phrase shapes. The shortened second ascent compresses the harmonic material, and the refrain returns with new melodic endings. The bridge removes the drums and most orchestration. Its bass descends B–A♯–A–G♯ before F♯7–B7 leads into the final E-major refrain. The main hook survives the whole-step lift, now in fuller grips with more orchestral support. Four newly written bars extend the climax: Amaj9, borrowed Am6, E/B, and B7. An E6 high note crowns the passage.

The coda genuinely resolves the piece. It descends in register and intensity, returns to the borrowed minor iv color, lets E resolve to D♯ over a final dominant suspension, and lands on E6/9. It does not return to the opening to form a loop.

## Form

| Time | Measures | Section | Musical role |
|---|---:|---|---|
| 0:00–0:09.6 | 1–4 | First light | Sparse piano, incomplete hook, open space |
| 0:09.6–0:38.4 | 5–16 | A quiet beginning | Twelve-bar verse, bass inversions and secondary dominant |
| 0:38.4–0:57.6 | 17–24 | Toward the horizon | Growing register; Cadd9 broadens the palette |
| 0:57.6–1:26.4 | 25–36 | Daybreak | Full twelve-bar refrain, three distinct melodic sentences |
| 1:26.4–1:36 | 37–40 | Afterglow | Piano interlude and register retreat |
| 1:36–1:55.2 | 41–48 | The road behind | Newly composed B-minor verse |
| 1:55.2–2:04.8 | 49–52 | One more breath | Compressed ascent |
| 2:04.8–2:24 | 53–60 | Daybreak · reprise | Intimate opening, then a stronger return |
| 2:24–2:43.2 | 61–68 | Before the sun | Breakdown, chromatic bass, rebuilding modulation |
| 2:43.2–3:21.6 | 69–84 | Everything opens | E-major lift, fullest piano and ensemble, new climax tag |
| 3:21.6–3:49.04 | 85–92 + tail | Home in the light | Eight-bar written ritardando and completed cadence |

## Performance and playback

`score.json` is the authoritative event timeline. Its seconds already contain the performance timing and final ritardando; do not reapply tempo changes or swing to note timestamps. `tempoMap` exists for labels, beat indicators or exported notation. All piano notes include `hand`, `finger`, and `role` (`melody`, `bass`, or `harmony`). Physical key holds and pedal sustain are independent.

The melody plays slightly behind a leading bass in the full refrains. Offbeats lean gently back. Phrase endings breathe. These variations are composed, deterministic values, with no randomness. A sample piano should use a nonlinear velocity response so the marked melody speaks above its quieter supporting grip; inner chord notes are intentionally 0.16–0.20 below the lead velocity.

Recommended balance: sampled grand at the foreground; strings roughly 10 dB below the piano melody, bass 8–12 dB below it, and restrained percussion. Use the optional `accompaniment` array only for sound. Do not animate those events as extra pianist fingers or keys. Its instrument names are `strings`, `bass`, `kick`, `snare`, `hihat`, and occasional `cymbal`. Pads should attack softly and fade at harmonic changes; drum notes are general-MIDI pitches, but an engine may map the instrument labels directly to synthesis/sample voices.

Percussion follows authored four-bar phrases with displaced kicks, changing hat patterns, accented backbeats, and small snare turnarounds. It withdraws before the interlude and bridge. The final four-bar climax extension broadens to half time. String releases also breathe at phrase endings, with an especially clear ensemble withdrawal before the bridge.

Respect pedal-up events: release held sample voices gently, approximately 100–200 ms depending on register, rather than cutting them abruptly. Repeated strikes of a pedal-sustained pitch should be permitted acoustically even when its earlier physical key hold has ended. Keyboard depression and finger contact must stop at `time + duration` whether the pedal remains down or not.

The last physical key releases at **224.98135 s**, the final pedal rises at **226.18635 s**, and the timeline completes at **229.03635 s**. Playback and rendering need the full tail.

## Assets and reproducibility

- `score.json`: compact, self-contained score and performance timeline.
- `compose_daybreak.py`: all authored pitches, durations, harmony, voicing, orchestration, timing and the independent validation sweep; standard-library Python only.
- `GATES.md`: requirements fixed before composing.
- `validation.json` and `VALIDATION.md`: machine-readable and readable gate results.

Run `python compose_daybreak.py` to reproduce all generated score and validation files. The script exits nonzero on a failing structural or physical-playability gate.

## Verified limits

1,467 piano notes; 744 separate accompaniment events; MIDI 33–88. Exact event-sweep validation passes with a maximum of three physical keys in the left hand and four in the right, one octave span in either hand, no overlapping finger assignments, no duplicate physical keys, and no crossed-finger grips. This is a feasible animated fingering, not a prescribed pedagogical edition for every hand size. Auditory balance remains a playback-engine responsibility.
