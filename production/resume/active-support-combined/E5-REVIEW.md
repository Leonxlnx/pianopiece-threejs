# E5 phrase — frozen active support

`e5-frozen-v1.json` SHA256 `45bf401456cb204a4784f5c8d65f12603b845e2ab2d55e3f47b6566b761d4078`, with eight note and eight wrist-knot changes relative to combined-support-v1 in `e5-frozen-v1-manifest.json`.

Held G5 p00187 uses R5 for its complete1.429784s soprano hold. B4 p00189 uses R1, D5 p00191 uses R2, and E5 p00193/p00194 use R3. The phrase descends D5 p00196 R2 and B4 p00197/p00199 R1. Shared R86–93 wrist support is [0.14669,0.77877,0.36155], quaternion[-0.0602513215,-0.7093753832,0.6874342603,0.1434938385]. Arrival begins43.075 during unchanged p00185 E5 thumb hold, which retains actual contact throughout; this avoids a short wrist jump. R85/R94 were not changed.

All1068 attacks/pitches/velocities and durations are unchanged relative to combined-support-v1. All40 held soprano entries remain valid. No new physical release edits. `e5-v1-full-hold-validation.json` covers1177 actual mesh poses,991 primary-held poses, every p00197/p00199 hold, and incoming p00183/p00185 plus outgoing p00201 neighbors: all primary blockers and new active key/IK/pad/pair counters are zero. Existing p00201 held-thumb geometry is a separate inherited exception; root has explicitly assigned its continuation next.

`e5-v1-motion-gate.json`:2139 poses at500Hz, maximum wrist1.3198 m/s, tip2.1526 m/s, joint71.7368 rad/s, deterministic seek0. The highest joint rate occurs on the incoming inactive R5 and requires visual/idle-runtime review.

This is not a complete all-finger pass. `e5-v1-all-surface-residuals.json` records246 new inactive key frames and70 new inactive pair frames on compact5. `e5-idle-gap-queue.json` locates nine finite affected gaps, including R3 p00159→p00193 and p00194→p00220, R2 p00183→p00191/p00191→p00196/p00196→p00210, R4 p00181→p00203, R5 p00177→p00187, and two thumb gaps p00185→p00189/p00199→p00201. Root and audio-recovery received the frozen anchors; root supersedes its earlier E5 experiments and compact9 pulse. Final rendering and idle refitting remain required.
