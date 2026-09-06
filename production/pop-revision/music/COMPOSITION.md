# Daybreak

An original **3:47.102** solo-piano pop song: 88 bars, C major, 96 BPM, and a
written slowing ending. This replaces both previous Daybreak compositions.
The melody and its arrangement were authored for this project. The reference
direction supplies broad piano-pop qualities—an accessible sung contour,
rhythmic pulse and a large return—without quoting an existing song.

The main refrain opens **E–G–G, E–D**, then answers **D–E–D, B–G**.
Its short repeated high note and displaced three-quarter-beat attacks give it a
recognizable vocal rhythm. The second four-bar sentence reaches A5; the twelve-
bar refrain then turns through D minor, C/E, F and G rather than looping its
opening four chords. The same two-bar identity returns at bars 29, 57 and 73.

The verse sits lower and leaves measured rests. Its second half develops the
initial statement, rather than playing sixteen unchanged bars. A higher
prechorus introduces anticipation and leads into the refrain. A short piano
interlude lowers the register; the second verse moves through A minor and an
E-minor inversion. The bridge pares the texture back to two left-hand gestures
per bar, then darkens F major to F minor before G prepares the returning C.

The final refrain keeps its recognizable opening, then reaches the piece's
highest C6 in a new melodic continuation. Its last sentence descends, so the
climax has somewhere to go. The coda recalls the hook, reduces register and
touch, returns to the borrowed F-minor color, and resolves to a plain C-major
voicing. That simple final landing is deliberate. The pedal releases before a
complete resonance tail; the piece does not loop or fade out mid-phrase.

| Time (seconds) | Bars | Section |
| --- | --- | --- |
| 0–10 | 1–4 | First light |
| 10–50 | 5–20 | A window opens |
| 50–70 | 21–28 | Closer to the morning |
| 70–100 | 29–40 | Daybreak |
| 100–110 | 41–44 | The room breathes |
| 110–130 | 45–52 | A light left on |
| 130–140 | 53–56 | A little nearer |
| 140–160 | 57–64 | Daybreak returns |
| 160–180 | 65–72 | Before the sun |
| 180–210 | 73–84 | Everything opens |
| 210–227.101587 | 85–88 and tail | Home in the light |

## Performance and the visible hands

The piano supplies every sound. There are no hidden accompaniment instruments.
Left-hand figures alternate syncopated dyads, measured broken chords and rests;
only one of the four busy figure families has a continuous eighth-note opening.
The melody is marked substantially above its support and is about 13 ms behind
the bass. Small deterministic phrase offsets are already in the seconds.
Do not add another tempo or humanization pass at playback.

The baseline composition has 1,011 notes. Maximum physical polyphony is two per
hand and maximum simultaneously held span is seven semitones in either hand.
Both hands use all five fingers; no black-key note uses a thumb. The baseline
uses at least 60 ms of release time before a new whole-hand grip, increased for
larger shifts. Pedal sustain is separate from visible key holds. These are
transparent score-level constraints, not proof that the actual model's skin,
finger lengths, elbow pose or wrist trajectory is correct. The integration
owner must fit and inspect the real rig, then provide the final note releases
for the final master.

No trajectory from a prior Daybreak score is included. Any wrist bake must be
made against the new score and the current character. `writtenDuration` records
the baseline authored physical hold; `duration` is the performed key hold that
both the visible contact and audio damping must use.

## Reproduction

1. `python compose.py` recreates the baseline score. Do this before rig fitting;
   it would replace later rig-specific finger/contact/release additions.
2. `python fetch_samples.py` retrieves exactly the needed pinned recordings and
   verifies both their SHA-256 and Git blob hashes.
3. `DAYBREAK_SCORE_PATH=/absolute/path/to/final-score.json python render.py`
   renders that exact performance. The default is the adjacent `score.json`.
4. `python verify.py --score /absolute/path/to/final-score.json` checks the
   complete result. `--score-only` omits audio checks while the rig is in work.

The renderer retains the established sample-based piano instrument and careful
pedal/reverb DSP, with portable paths and stronger score freezing. It uses the
original recorded velocity layers, a restrained 1.24-second room, 18 ms predelay,
and no per-note normalization. The sources are Alexander Holm's Salamander
Grand Piano v3 (Yamaha C5), under CC BY 3.0, from repository commit
`3382bf9496bba2486f5ab0de55a264d1dfc38404`. Exact per-recording URLs and hashes are
retained in the sample manifests; the original license is included.

The verification checks actual decoded WAV and MP3 samples, duration, clipping,
loudness/true peak, complete source hashes, onset/release frame mapping and
WAV/MP3 alignment at six passages. It rejects a deliberately corrupted overlap
fixture before trusting the score oracle. A master may remain valid after an
animation-only change, but every audible note field and pedal event must match
the frozen score exactly.

## Review limits

No tool capable of critical audio listening is available in this execution.
The musical review is from authored notation, voice/harmony inspection and
event analysis; the sound review is from source provenance and measured signal
behavior. Neither is presented as a listening pass. Full-length masters and
two uninterrupted 30-second excerpts are provided for actual listening.
