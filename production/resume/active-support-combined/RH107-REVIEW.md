# RH 107 second phrase — frozen active anchors

`rh107-frozen-v1.json` SHA256 `5f3cb29ebbc218fc6c830ef67f91f89a829c2adcf9c1aaed3bcc3efd2b98a2c6` includes merged-v2. Use `rh107-frozen-v1-manifest.json` to merge its six note and five wrist-knot changes relative to merged-v2.

The coherent G5 R2 / D6 R5 reach preserves the complete D6 soprano hold and proceeds C6 R4, B5 R3, G5 R2. The preceding G5 is also R2, with a smaller supported arrival. All attacks, pitches, velocities, durations and 40 held soprano entries are unchanged from merged-v2.

Validation on accepted arms + compact5: `rh107-pad-full-hold-validation.json` covers 962 exact mesh poses, 632 primary-held poses, every intersecting note's complete hold, and incoming/outgoing neighbors. Key-core, IK, actual pad gap, and new-severe neighbor counters are zero. Nine primary-pair frames remain at 109.595–109.623047, involving active RIndex and inactive RMiddle only. This is a real surface crossing and is not certified clear. Audio-recovery owns the endpoint-bound inactive R3 correction, using this exact frozen score.

`rh107-pad-motion-gate.json`: 1546 poses at 500 Hz, wrist max 0.9985 m/s, tip max 2.5443 m/s, joint max unchanged 51.008 rad/s, deterministic seek error exactly zero. Numerical motion metrics do not replace root's visual review.
