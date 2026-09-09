# Opening RH phrase: no accepted whole-hand solution

The bounded opening experiment is rejected for integration. Raising support clears the active thumb/palm fold at p00020 and p00025, but the existing compact5 idle paths still cross fingers and keys. The six actual oblique render comparisons confirm that the hand is not ready to accept as a complete interval solution.

The smallest diagnostic delta is in `diagnostic-delta.json`, with a complete example in `diagnostic-score.json`. It changes RH wrist knot positions 9–14 by +5 mm X, +27.6 mm Y and −6.8 mm Z, and sets p00022.contactZ to 0.269 m to restore its exact held target. It preserves original fingering, attacks, pitches, velocities, durations and wrist rotations. This is diagnostic evidence, not a merge recommendation.

## Exact finite ownership

`reservation.json` freezes RH notes p00019, p00020, p00022, p00023, p00025 and p00027, including the held B4 soprano p00019. The edited wrist knots are 9–14. The interval starts at incoming moveStart 6.0390358363389325 seconds and follows the final held note p00027 through its release at 9.192821 seconds. The unchanged knot 15 and p00029 attack at 9.216821 seconds provide departure context; neither is edited. Context validation ends at 9.217821 seconds. active_hand_fit confirmed no overlapping intro ownership.

Inputs are score `9db662f1e9d4037cc8c505b9818b7782ac1fb52fe70cff85bf362a00a9fb3b30`, compact5 TS source `4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45`, compiled rig `c1926fa883fbc1b7e6be198851a037b5d40c5da79b46319864d62c4e29663cbf`, and the unchanged model. Exact copied dependency hashes are in `input-hashes.json`.

## Bounded search and outcome

After the initial support seed, the finite comparison covered five fingering sequences × four support offsets, twelve contact-depth/lift options, and two final minimal options. Opposition remained zero. A 4–3–2–1–3–4 sequence reduced some crossings, but did not clear the complete interval; the other sequences and offsets also failed. No search outside this opening phrase was performed.

The diagnostic and baseline each received 870 actual-geometry samples at 240 Hz plus exact note/wrist/move boundaries. Whole-hand key core includes active and idle RH skin; exact owned triangle intersections include RH fingers/palm and opposing-hand pairs. Terminal pad surfaces use vertices owned by each finger's distal bone inside the beveled target-key footprint. Numerical solver contact is reported separately from actual skin.

| Whole validation interval | Baseline | Diagnostic |
| --- | ---: | ---: |
| Maximum whole-hand key-core depth | 7.886145 mm | 7.642714 mm |
| Maximum intersecting triangle pairs per frame | 276 | 219 |
| Lowest active terminal pad gap | −2.486320 mm | −2.486320 mm |
| Highest active terminal pad gap | −0.159588 mm | +1.678278 mm |
| Maximum solver contact error | 0.000128 mm | 0.000123 mm |
| Maximum measured wrist speed | 0.570839 m/s | 0.979133 m/s |
| Maximum measured finger-joint speed | 2.007135 m/s | 2.529860 m/s |

These are finite sampled animation/geometry measurements, not clinical limits or a continuous analytic collision proof. The diagnostic's faster departure and the visible lateral wrist bend remain limitations.

The positive local result is real but insufficient: p00020 and p00025 both have zero active-thumb key-core penetration and zero active-thumb/neighbor or palm intersections throughout their holds. Their pad gaps are approximately +0.304206 mm. p00023's thumb also has zero active crossing pairs. Nevertheless, p00022's active middle finger still intersects an idle finger by up to 173 triangle pairs, and p00027's active index still intersects other fingers by up to 115 pairs during departure. Accurate target contact alone therefore does not pass this phrase.

## Localized remaining work

`residual-intervals.json` contains nine exact contiguous failing intervals with involved patches, depths and representative triangle coordinates. Principal intervals include:

- 6.834869–6.893203: idle thumb enters a key before p00020.
- 7.222369–7.718203: index/middle, thumb/middle and idle key crossings during the E4/D4 transition; active middle crossings remain.
- 8.393202–8.434869: idle thumb passes through keys before p00025.
- 8.618203–9.217821: index/middle and departure thumb/palm/index crossings, including the unchanged next-phrase arrival context.

The hand needs corrected idle/transition paths or another coherent phrase solution before this support delta can be accepted. The bounded search does not prove such a solution impossible. No app-code change was authorized within this leaf.

## Actual views and handoff

`evidence-manifest.json` pins six actual EGL oblique images and two full renderer reports at 7.0057025, 7.472359 and 9.167821 seconds. All images report GL_NO_ERROR and were visually inspected. The 7.472359 diagnostic visibly bunches/crosses the index/middle region; departure also retains crossing/bunched fingers. There is no browser-equivalence claim.

`diagnostic-delta.json` is minimal and event-preserving; `validation-report.json` has all sampled poses, contacts, skin intersections and motion measurements. `bounded-set-report.json`, `contact-set-report.json` and `final-options-report.json` retain the complete finite comparisons. `check.mjs` verifies hashes, counts, authored-event preservation, rejected status and all copied images.

Ledger: O1, O3 and O4 are complete. O2 is explicitly abandoned because no acceptable whole-hand solution was found within the bounded experiment; it is not represented as a passing result. The prior arm solution also retains an obvious lateral wrist kink, particularly in the left-hand 105.715/187.441-second views noted by root, and must not be called anatomically final. Root requested a separate wrist-yaw assessment after this handoff.
