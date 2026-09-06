# Quiet supporting samples

These supporting samples are original unmodified WAV files, selected for the Daybreak original arrangement. Source URLs, pinned repository commits, Git blob identifiers, SHA-256, duration, rate, channels, and articulation are recorded in `support-manifest.json`.

## Sources and rights

**VSCO 2 Community Edition** by Versilian Studios supplies the viola/cello ensembles and contrabass. The [creator's page](https://versilian-studios.com/vsco-community/) and [project repository](https://github.com/sgossner/VSCO-2-CE) identify the library as CC0. Recordings are credited to Sam Gossner and Simon Dalzell; sample cutting to Elan Hickler / Soundemote. The exact WAV source commit is `440300901dfe9275fd84e0b7763af1f8443ae62e`. Its license is preserved as `VSCO-LICENSE.txt`.

**Swirly Drums** by Karoryfer Samples supplies the kick, brushed snare, tight hi-hat, and brush crash. The [creator's page](https://shop.karoryfer.com/pages/free-swirly-drums) links directly to the [source repository](https://github.com/sfzinstruments/karoryfer.swirly-drums). That repository ships the CC0 legal code in `license`, preserved as `swirly-license`. All downloaded WAVs are pinned to `c40dafe0011cb2e54c0c220ff0fa308a11fc60f5`.

[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) permits reuse, modification, and redistribution, including commercial uses. Attribution is not required by CC0, but a clear optional credit is: “Supporting instrument samples: VSCO 2 Community Edition by Versilian Studios, and Swirly Drums by Karoryfer Samples (CC0).” No additional source restrictions were found in these distributed licenses.

VCSL was also researched, but no VCSL audio is included in this subset; its downloaded license and tree are research records only.

## Exact mappings

The string pitch identity is taken from the upstream SFZ `pitch_keycenter`, not inferred from filename octave labels. VSCO uses a filename convention where C3 is MIDI 60. The manifest's numeric `midi` field is authoritative. String maps used for verification are saved alongside this document.

- `viola_ensemble`: thirteen quiet sustained-vibrato anchors, MIDI 48–86. Use for the warm chord bed, especially MIDI 55–77. Within the original mapped range, pitch shifts may reach two semitones.
- `cello_ensemble`: six quiet sustained-vibrato anchors, MIDI 36/40/43/47/50/53. Lowest natural cello note is C2/MIDI36. Do not label its transposed lower notes as naturally sampled.
- `bass_plucked`: six contrabass pizzicato anchors MIDI34/36/38/40/42/44, two round robins each. Covers the score's MIDI33–44 bass with at most one semitone transposition.
- `bass_bowed`: the same six anchors as quiet sustained-vibrato contrabass, one take per pitch.
- `kick`: soft 20-inch marching kick, source layers6/10, two round robins, resonance and beater microphone files.
- `snare`: brushed center hit, source layers3/6, two round robins, top and bottom microphone files.
- `hat`: tightly closed brush hi-hat, source layers3/6, two round robins, mono.
- `crash`: soft brush crash, source layer3, two round robins, mono.

For percussion the numeric MIDI assignment is only a conventional trigger key (36/38/42/49), not the sample's pitch. Round robin is a separate recorded strike; alternate takes to reduce repetition. Multiple microphone files with identical instrument/layer/round-robin identify the same hit and should sound simultaneously if mixed. They are not extra notes. The beater/top channels can add definition to the resonance/bottom channels; balance these as a single instrument. Avoid independently normalizing each microphone file because that destroys its relative level.

## Gain and timing

The strings and bass were recorded quietly. `sourceGainDb` records each upstream SFZ region's volume adjustment, not a mandatory master-mix gain. These boosts can be large: applying them to an already normalized note would overload it. Keep the original WAV levels and balance by instrument, with the piano as the reference. Bass SFZ gain differs by pitch, so retain that mapping if using the exact SFZ balance.

The WAVs include natural attacks and full available releases. Bowed strings are finite recordings, not seamless loops. The ensemble recordings are approximately eight to eleven seconds; use shorter musical phrases, overlap natural attacks gently, or make deliberately crossfaded loops only after checking them. A 0.15–0.35 second envelope attack and approximately 0.8–1.2 second release is a useful starting point for background bowed chords. These are arrangement choices, not source metadata. Bass pizzicato should retain its initial pluck. Brush crash can supply the three soft cymbal accents requested for the score; any reversed-swell derivative should be documented as a mix/render modification.

## Honest limits

These are a quiet chamber-string texture and brushed percussion, not a large cinematic orchestra or a heavily processed pop drum kit. Only one quiet recorded string dynamic is included, and the drum subset has two dynamics with two alternate strikes each. Source noise, natural tuning, bow movement, and room character remain. A restrained common reverb can help these separate recording spaces sit together. This set is intended as an offline rendering source; serving the final mixed master is more efficient than loading all support WAVs into a browser.

Verified total: **59 WAV files / 62.77 MiB**. All samples are 44.1 kHz; strings/bass are stereo and percussion is mono. Every file decoded fully, and final SHA-256 and Git blob hashes match their source records. Maximum raw sample peak is 0.25663. Details are in `validation-summary.json`.
