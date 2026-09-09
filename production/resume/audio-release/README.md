# Daybreak audio recovery and exact-score release helpers

These helpers prepare a new master from an explicitly accepted final score. They do not declare the current score final, revise notes, reuse the stale public MP3, or claim critical listening.

The preserved audio renderer is SHA-256 `5a6fc11d10be387e9b229fcaf829304e9769273968791ae46a199688bb2a0cb1`. Preparation changes only its two portable input-path constants and exact expected score SHA. Its recorded samples, velocity selection, role balance, continuous key/pedal damping, restrike treatment, filtering, reverb, mastering and excerpt processing remain unchanged.

## Recover the source bank

```sh
python recover_samples.py --manifest sample-manifest-frozen.json --root /ABS/legal160 --report source-verification.json --decode --workers 4
```

The immutable manifest SHA is `2507cb40c3ad4fe950d2998c94b40400c118654b0df9394477ab44fb6bf29af3`. All 160 sources must match SHA-256, Git blob SHA-1 and byte count. `--decode` additionally verifies each FLAC's 48 kHz, stereo, 24-bit format, exact native frame count and full FFmpeg decoding. Existing correct files are reused; an existing corrupt file is rejected. `--offline` prohibits downloads. Downloaded files use their manifest-pinned commit URLs and are moved into place only after matching their SHA-256 and length.

`piano-samples-LICENSE-CC-BY-3.0.txt` is the complete upstream LICENSE at commit `3382bf9496bba2486f5ab0de55a264d1dfc38404`, verified against Git blob `1a16e05564d2aaa880bbe9e506a0a0226d8742cc`. `license-verification.json` preserves its URL and SHA-256.

## Prepare, render and verify after the final score is accepted

Use a new output directory for each attempt. Supply the independently accepted full score SHA; do not infer finality from a file or folder name.

```sh
python prepare_release.py --project /ABS/PROJECT --score /ABS/FINAL-score.json --expected-score-sha ACCEPTED_SHA256 --sample-root /ABS/legal160 --output /ABS/MASTER-RELEASE --status accepted-final
python render_release.py --release /ABS/MASTER-RELEASE --score /ABS/FINAL-score.json --expected-score-sha ACCEPTED_SHA256 --sample-root /ABS/legal160
python verify_release.py --release /ABS/MASTER-RELEASE --score /ABS/FINAL-score.json --expected-score-sha ACCEPTED_SHA256 --sample-root /ABS/legal160
```

`--status candidate` allows preparation and `verify_release.py --preflight-only`, but the full-render wrapper rejects it. No accepted final score has been supplied to this recovery task yet.

Preparation copies exact score bytes, the source manifest, upstream license, and the existing project's public credits and software notices. Both whole-file score SHA and a canonical audio-event signature are recorded. The audio signature includes duration, the complete pedal timeline, and note ID/time/duration/MIDI/velocity/role in authored order. Changes to physical key holds therefore change the audio signature. A fingering-only edit may preserve that diagnostic signature, but any change to exact score bytes still fails the release gate.

`render_release.py` permits only a fresh complete render. It rejects candidate freezes, changed current/frozen score bytes, changed renderer/manifest/credits, missing or changed source samples, and a previous rendering attempt or existing WAV/MP3 intermediates. Do not invoke the preserved renderer's `--mix-only` or `--master-only` modes for a final release. The wrapper records tool versions and hashes all master, excerpt, audit and premaster outputs, then calls independent verification.

Verification repeats input integrity and compares every authored note, key-release frame, velocity-layer/source selection, source hash/URL/offset, and pedal event against generated audits. It fully decodes both masters and both review excerpts. The complete WAV and gapless-decoded MP3 must be stereo 44.1 kHz with exactly `round(score.duration * 44100)` frames, finite unclipped samples, zero measured codec lag at five passages, and true peak no higher than −1.2 dBTP. The preserved piano release level is expected within −21 to −16 LUFS. Premaster/master lag must also be zero at the five passages. Excerpts keep their original 35/30-second lengths and are checked at three passages each.

`reproduction-manifest.json` remains compatible with the existing video exporter's exact score binding check. For video preparation, use the new `daybreak-solo-master.wav` and its adjacent verified reports. Do not copy a new score SHA onto old audio reports.

## Focused helper validation

```sh
python validate_helpers.py --project /ABS/PROJECT --sample-root /ABS/legal160
```

This exercises exact-score mismatch, a changed physical hold, a fingering-only score change, changed renderer, stale-directory reuse and candidate-final rejection. It checks the historical event report against its own real input and rejects its use with the current score. A separate six-second nonmusical codec fixture exercises real FFmpeg WAV/MP3 decoding, duration, clipping, level and lag checks, including deliberate failure injection. It does not render a Daybreak master.

## Limits

Input and decoded-signal checks do not establish musical quality or critical listening. The final source-matched review excerpts are generated by the preserved renderer only after the accepted-score release render. No review excerpt or final master is supplied by the preparation task itself.

Do not commit the recovered `legal160` directory, dry stems, premaster or large media into the project. Keep the small scripts, manifests, validation reports and source license together for reproducibility. The source bank is reproducible from the pinned manifest.
