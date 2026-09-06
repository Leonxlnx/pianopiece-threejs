# Piano sources, license, and use

Prepared 2026-09-05 for the Daybreak original piano performance.

## Selection

**Salamander Grand Piano v3**, recorded by **Alexander Holm**, is the chosen instrument. It is a stereo Yamaha C5 recording with minor-third pitch anchors and sixteen original velocity layers. We retained four real recorded layers, v3/v7/v11/v15, over MIDI 33–90. The [maintained source repository](https://github.com/sfzinstruments/SalamanderGrandPiano) supplies lossless 48 kHz / 24-bit FLAC files and its original SFZ map. This subset uses its natural tuning, with no pitch correction or phase alignment.

All downloaded audio is pinned to repository commit `3382bf9496bba2486f5ab0de55a264d1dfc38404`. Each file was compared against its Git blob SHA, and each manifest entry additionally records SHA-256. Exact source URLs are in `source-manifest.json` and `sample-manifest.json`.

## Redistribution and attribution

The downloaded repository explicitly distributes the work under [Creative Commons Attribution 3.0 Unported](https://creativecommons.org/licenses/by/3.0/); the complete upstream license is saved at `sources/LICENSE-CC-BY-3.0.txt`. This license permits redistribution and adaptation, including commercial use, with attribution, a license reference, and indication of modifications. Preserve this credit in the product's credits or audio information panel and in any distributed audio asset package:

> Piano samples: Salamander Grand Piano v3 by Alexander Holm, licensed under CC BY 3.0. Four-layer subset selected from the SFZ Instruments distribution; browser samples converted from lossless FLAC to MP3 with 1.5 dB attenuation. Original music and performance arrangement created for Daybreak.

Link “Salamander Grand Piano v3” to https://rytmenpinne.wordpress.com/sounds-and-such/salamander-grandpiano/ and “CC BY 3.0” to https://creativecommons.org/licenses/by/3.0/ . If the samples are used in a rendered master, replace the conversion sentence with the actual rendering/mixing changes. Do not imply the author endorses this project.

The [original creator's current page](https://rytmenpinne.wordpress.com/sounds-and-such/salamander-grandpiano/) also announces a public-domain dedication dated 4.3.2022. This package retains the explicit CC BY 3.0 terms shipped with the exact source distribution and credits the creator.

## Alternatives considered

- [Slender Salamander by Signal Experiments](https://sig-ex.com/2017/11/11/slender-salmander-grand-piano/) provides three phase-aligned layers with crossfading and retuning under CC BY 3.0. It is useful for continuous layer blending. Here the original separate layers avoid that additional processing and are directly retrievable at a pinned commit.
- [FreePats Upright Piano KW](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) is CC0 with two stereo velocity layers and a smaller footprint; it is an upright rather than the requested cinematic grand-piano character.
- [darosh's browser MP3 distribution](https://github.com/darosh/samples-piano-mp3) supplies convenient existing encodes. We instead encoded from lossless sources for direct control of quality and provenance.

## Playback map

Twenty anchor pitches per layer: MIDI 33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90. These cover A1 through F#6. Choose the nearest anchor; the requested chromatic range then needs at most one semitone of transposition. Playback rate is `2 ** ((noteMidi - anchorMidi) / 12)`.

| Original layer | Original MIDI velocity interval | Representative velocity | Suggested subset interval |
| --- | --- | --- | --- |
| v3 | 35–36 | 35.5 | 1–44 |
| v7 | 51–56 | 53.5 | 45–69 |
| v11 | 81–88 | 84.5 | 70–100 |
| v15 | 113–120 | 116.5 | 101–127 |

Suggested subset intervals are an implementation choice, not original recording metadata. Source dynamics are preserved: do not normalize every individual note or flatten the four layers to the same loudness. Within a layer a modest gain correction relative to its representative velocity can smooth dynamics. Do not blindly add a full velocity-squared curve on top of the already softer recordings. Original layers are not phase-aligned; use discrete layer selection for clean transients instead of broad simultaneous crossfades.

Each entry supplies an optional upstream SFZ onset offset and a conservative `recommendedOffsetSeconds`, three milliseconds earlier, for timing alignment. The audio bytes keep the full original lead-in and decay. If starting partway through a sample, use a 3–5 ms gain attack. Dampened notes need a release envelope when the key/pedal is released; a 0.15–0.35 s release is a useful starting point. The undamped high register should ring longer. Release/pedal/resonance noise assets are intentionally not in this piano subset.

## Browser versus master

`lossless/` contains unmodified FLAC for offline rendering. `web/` contains 256 kbit/s stereo MP3 at 48 kHz, with the full recorded tails and uniform 1.5 dB attenuation for encoder headroom. They are not independently normalized, denoised, pitch corrected, trimmed, or reverberated. URLs in the manifest assume these MP3 files are copied to `/audio/piano/`; adjust the prefix if hosted elsewhere.

For a fixed performance, render once from the lossless sources and serve a compressed stereo master. That greatly reduces decoding memory, polyphony work, and startup transfer versus decoding the entire sample bank. Retain the individual MP3 set only if live playing or rearrangement is needed. [Web Audio decoding](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData) returns PCM AudioBuffers and resamples to the context's rate, so compressed byte size is not its memory footprint. Load only the used anchors/layers with bounded concurrent fetches, keep a progress indicator, and reuse decoded buffers.

## Quality limits and validation

These are real recorded piano attacks and decays, not a synthesizer approximation. Nevertheless four layers offer less timbral resolution than the original sixteen; minor-third sampling requires small pitch shifts; natural tuning and microphone/room coloration are retained; MP3 is lossy; a basic browser sampler does not recreate full sympathetic resonance, pedal behavior, or all mechanical noises. No claim of equivalence to a modern commercial piano library is made.

`validation-summary.json` reports exact sample counts, byte totals, duration range, full-decode checks, and peaks. `sample-manifest.json` includes per-file pitch/velocity/paths/duration, channels/rate, hashes, and near-fundamental analysis. The near-fundamental estimate is a spectral sanity check around the source-mapped pitch, not a complete piano tuning analysis. The source map plus exact upstream hash is the authority for pitch identity.

Measured result: **35.88 MiB** browser bank, **123.51 MiB** lossless sources, **428.81 MiB** approximate decoded sample memory at 48 kHz. Durations range **4.983–23.412 seconds**. MP3 decoded lengths differ by no more than **31 samples / 0.646 ms** due to codec padding. Maximum decoded MP3 sample peak is **0.74676**. All **80 sources and 80 MP3s** passed full decoding and source-hash checks.
