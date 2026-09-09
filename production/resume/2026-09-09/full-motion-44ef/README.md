# Frozen delivery motion audit

One read-only paired sweep completed: **27,979 samples at 120 Hz**, 0–233.144228 s, 41.964 s wall time. No new speed increases or per-channel peaks occur outside the accepted local windows. The maximum raw outside-window difference across all 115 speed channels is **exactly 0**.

All 99,493,324 checked bone/world-position scalars are finite. Zero invalid speed samples or zero-length quaternions occurred. Quaternions were normalized and adjacent signs aligned before measuring angular speed. The largest raw norm error was 3.129106e-7 in both versions.

| Metric | v11 maximum | Delivery maximum | Delivery interval (s) | Delivery entity |
|---|---:|---:|---|---|
| Local angular speed (rad/s) | 126.988123173 | 103.706729871 | 167.083333333333–167.091666666667 | LeftHandPinky1 |
| World angular speed (rad/s) | 126.959426924 | 100.046848953 | 167.083333333333–167.091666666667 | LeftHandPinky1 |
| Fingertip speed (m/s) | 3.893665530 | 3.893665530 | 42.850000000000–42.858333333333 | LeftRingContact |
| Wrist speed (m/s) | 1.819730259 | 1.819730259 | 169.833333333333–169.841666666667 | LeftHand |

The remaining largest speeds are unchanged baseline motion:

- LH Pinky MCP angular peak: release of p00769 B2 (off 167.031339) toward p00771 C3 (attack 167.126902). Peak sample: 167.08333333333334–167.09166666666667.
- LH Ring fingertip peak: idle after p00182 G3 (off 42.781337), during the p00184 F#4 thumb attack at 42.858164. Peak sample: 42.85–42.858333333333334.
- LH wrist peak: released transfer after p00786 B3 (off 169.796481) toward p00788 A2 (attack 169.885523). Peak sample: 169.83333333333334–169.84166666666667.

The RH Index MCP maximum falls from 126.988123173 rad/s at 106.90833333333333 to 62.748062485 rad/s at 115.38333333333334. RH Index fingertip maximum falls from 3.553693401 to 2.676973799 m/s.

Local speeds can increase within accepted corrections; those changes remain explicit in the raw report and summary JSON. The largest paired local increase is LH Index MCP at 70.975–70.98333333333333, from 4.865970898 to 45.620492397 rad/s, inside the accepted p322 window. The RH Pinky MCP release at 66.575–66.58333333333333 rises from approximately zero to 34.918168516 rad/s inside the p299 window. These do not exceed the respective full-piece channel maxima.

Scope and method: local angular speed for all 67 named bones; world angular speed for 36 arm/wrist/finger bones; actual world-position speeds for ten fingertips and two wrists. All bone position/quaternion/scale/world-matrix fields were checked for finite values. No target positions replace actual tip or wrist positions. One complete 120 Hz grid was sampled, plus its exact duration endpoint; no second sweep, triangle grids, source edits, or parameter searches were performed.

For unit quaternions after sign alignment, angle = 4 atan2(||q1−q0||, ||q1+q0||); speed divides by the actual sample interval. Numerical outside-change counters use 1e-7 rad/s and 1e-9 m/s, but raw outside maxima are retained and equal zero here. Accepted side/finger windows are recorded in accepted-windows.json.

This is a sampled motion-regression audit. It does not establish between-sample maxima, surface clearance, anatomical quality of inherited fast motion, or continuous native-film appearance. Existing high-speed moments above remain visible for parent review.

Reproduce from this directory with `nice -n 15 node audit.mjs > audit.log 2>&1`, then `python summarize.py`. Runtime modules, both scores, original baseline source, and the delivery source are copied locally. The model remains at the immutable film-snapshot path recorded with its hash in input-manifest.json. The script verifies every frozen input before sweeping.

Delivery score: `44ef4cdc314ecd2e926cca116433210c5e8b603b84856c6393fdd1f6aa462c2f`
Delivery rig: `2599ff6f11b668711040cf1e18849bb7bcc765d3667d8505662208852a2b9e9e`
Raw report: `d0aabd87d7c029979df87251a99985d857d7a88196d7b77218683db5a23249ae`
Runnable audit: `a5038f54ac6080f8692ef0dd8d532424956763a95d31851f2e18f7fc3e27b565`
