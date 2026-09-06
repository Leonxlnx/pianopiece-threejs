The 233.144-second 1080p24 export needs 5,596 frames. A 20 Mbps planning video rate yields approximately 2.9 GiB peak scratch usage for the current workflow; reserve at least 4 GiB, preferably 5 GiB.

| Item | Budget at 20 Mbps |
|---|---:|
| Final WAV | 62 MB |
| Frozen WAV copy | 62 MB |
| Retained H.264 chunks | 583 MB |
| Concatenated video-only MP4 | 583 MB |
| Delivery MP4 with AAC | 592 MB |
| MOV with unchanged PCM audio | 645 MB |
| Native JPEG review frames | 302 MB |
| Visual snapshot and runtime files | 60 MB |
| Transient scene interchange allowance | 200 MB |

Total: 2.88 GiB. At 30 Mbps: 3.96 GiB. Free space when measured: 4.26 GiB.

Completed 0.4–0.5-second native chunks measured 12.4–12.8 Mbps; the two-frame smoke measured 14.3 Mbps. These short chunks have frequent I-frames and are not a guaranteed full-film bitrate. The 20 Mbps allowance is conservative against those samples; CRF 17 remains content-dependent.

The budget includes every retained copy created by assembly: chunks, video-only concatenation, final MP4 and PCM MOV. It also allows 702 native JPEG review frames, one regenerated scene interchange and an independent frozen WAV. Existing original masters are never linked to mutable inputs. No full-film raw image sequence is planned.

Cleanup preserved all frozen snapshot paths and content hashes. 65 byte-identical copies now share storage only with other immutable snapshot copies; 248 paths reverified. Three abandoned scene-export temporaries were removed, with piano batching owner authorization for its cache. See storage-cleanup.json for exact paths and allocated-byte accounting. Concurrent diagnostic writes mean net filesystem free-space change differs from bytes reclaimed.
