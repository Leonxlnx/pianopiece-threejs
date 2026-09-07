# Fresh V7 E3 audio candidate — September 7, 2026

The complete piano master has been reconstructed from the exact retained V7
fitted performance. The MP3 matches the previously lost master byte for byte.
This establishes audio recovery, not completion of the visual performance.

## Exact inputs and outputs

| Item | SHA-256 |
| --- | --- |
| Frozen V7 E3 score | `96d39423a256bb3941ad467bffa6300f781715fa3a2b9ef04f5211d822fe42ac` |
| Audible-event signature | `ffcd6fc938012bcf1e2b7d1d0025f1c66ff8bb7e3873c397748b46595526c60b` |
| Fresh MP3 | `7a51eff7a95877498e8de5982862b045b15cdf48e1b03c03e805c15b40128ec8` |
| Fresh 24-bit WAV | `e9ae0843c74feefff046cd8a4ddf65f75f355be5e780b6dd67ab450ac2d6a2c1` |

`score-frozen.json` is an immutable copy of the exact render input. The current
candidate `score.json` has the same bytes. Both masters decode to 10,015,180
stereo frames at 44,100 Hz, or 227.1015873 seconds. MP3 container padding and
start-time metadata are not added to the animation clock.

All 59 required Salamander Grand Piano v3 recordings were downloaded again
from pinned repository commit `3382bf9496bba2486f5ab0de55a264d1dfc38404`.
Every source passed original byte-length, SHA-256 and Git blob SHA-1 checks.
Total source size is 100,197,713 bytes. `sample-manifest-upstream.json` retains
every original URL/hash; `sample-recovery.json` lists the selected recordings;
`source-mapping.json` binds each played pitch/layer to its real source.
Credit and the full CC BY 3.0 license remain beside the assets.

## Integration

1. Independently rerun the two checks in `GATES.md` with the unlazy checker
   and `--reverify`. The files are self-contained apart from NumPy/SciPy/FFmpeg.
2. Before using the MP3 with an integrated performance, run
   `python verify.py --score /absolute/path/to/final-score.json` and
   `python check_candidate.py --score /absolute/path/to/final-score.json`.
   These allow animation-only fields but reject changed audible events.
3. Copy the verified MP3 to the application's playback asset and preserve the
   frozen input, manifests, source, credit, license and numerical verification.
   Keep the full WAV for later film export. Optional preview excerpts cover
   70–100 seconds and 180–210 seconds at the actual master level.

V7 differs audibly from the retained runtime score only in notes `db00406`
and `db00922`, which become E3 instead of C3. The corresponding bars are
Fmaj7. No audio should be relabelled as this version without those pitches.

Do not run `compose.py` over the fitted score. Independent reproduction found
**152 different physical note durations** in the raw composer output. The
fitted durations affect pedal damping and must be rendered exactly. This
difference is recorded in `composer-fitting-comparison.json`.

If audible fields change later, make a new render folder and use its actual
final score. The existing reproduction commands are:

```sh
python fetch_samples.py
python render.py --no-stems
python verify.py
```

For this candidate the renderer/composer were copied unchanged from retained
source. No dry stems were created. The reproducible premaster was removed
after full verification to conserve workspace space; a new complete render
recreates it. Do not use `--master-only` without regenerating that premaster.

## Measured results and limits

- WAV and MP3: -19.0 LUFS, 7.3 LU loudness range, zero clipped samples.
- True peak: WAV -1.64 dBTP, MP3 -1.63 dBTP.
- All six decoded WAV/MP3 alignment checks: zero-sample lag.
- Maximum measured natural sample attack after the scheduled key: 3.039 ms.
- Maximum audio timestamp rounding error: 11.338 microseconds.
- The restrained limiter's maximum potential reduction is 0.86 dB.
- `verify.py` rejects a duplicated-key/finger control. `check_candidate.py`
  additionally rejects old voicing, changed release and changed pedal
  bindings while accepting a contact-only amendment.

No critical listening occurred: no listening-capable tool is exposed. The
source, notation, decoded signal, timing and codec checks are real, but they
do not establish perceived musical quality or browser audio-device parity.

## Four passes

1. **Complete asset recovery.** Read retained compose/fetch/render/verify
   source and recovery notes, froze exact V7 E3, recovered the pinned sample
   bank, rendered both complete masters and review excerpts.
2. **Musical review from actual score.** Independently inspected all eleven
   sections, the 88-bar form, three literal two-bar hook returns, register and
   velocity development, accompaniment attack patterns and the final cadence.
   The score has 400 melody notes, 611 support notes, 61 distinct melody bars,
   and twelve left-hand rhythmic/role patterns. The final refrain reaches C6;
   the earlier range tops out at A5. The lead remains above support in every
   section. Preserved this deliberate piano-pop direction without inventing
   a replacement tune or adding another playback humanization layer.
3. **Defect hunt.** Reproduced the raw composer in isolation, exposed its 152
   release differences, verified actual source bytes and decoded audio,
   checked old-master mismatch controls, and established exact recovery of
   the lost master hash through a new render.
4. **Polish.** Added concise integration instructions, an explicit candidate
   identity, independent synchronization controls, complete provenance, and
   storage cleanup. The final pass found no further source/signal defect
   within this bounded audio leaf. Listening and final application parity
   remain separate, explicitly unclaimed checks.
