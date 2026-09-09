# Two left-hand yaw passages: held checkpoint, full passages not accepted

The second passage has a useful held-note candidate with visibly straighter wrist orientation. Neither complete passage is accepted for integration: idle paths still enter keys, and the first passage retains a visible active index/palm fold. No checkout, app code, model, musical event, right-hand note, p00914, or LH knot447 changes were made.

## Frozen inputs and scope

Baseline is combined-review/candidate-v1.json, SHA256 7cc3dbdd44befd4d22793a8ac266a8414480a8486e79167b1552514087f7a1c1, including held71 and the then-current combined support patches. Rig TS is compact5 4ef26cd1df3d9b97f8a6e92378af4582fe2077e0cb5d6cc524cdb157891aea45; original compiled MJS c1926fa883fbc1b7e6be198851a037b5d40c5da79b46319864d62c4e29663cbf. Model 77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d. ownership.json lists exact note/knot inputs.

First reserved context: 104.883302–106.570695, p00511/p00513/p00514/p00516/p00518, LH knots262–265. Second:186.596535–188.265202, p00899/p00903/p00905/p00907/p00909, LH knots442–445. Outgoing knot446 moveStart alone was later delayed to188.180598 to preserve p00909 through its held end; its pose/time and the guarded p00914/knot447 remain unchanged. Active leaf confirmed disjoint ownership. Parent clarified local fingering correction was already authorized; finite variants included original fingering, L3→1→2, L2→1→2 and local middle/ring alternatives in the second phrase.

## Actual held and motion result

Final diagnostic is deliberately split from the useful second-only held delta. Its first-passage fingering changes p00513/p00516 from4 to2, and p00514 contactLift from held71 .01350223 to .01210223; thumbOpposition−.5 stays fixed. These first-passage changes are rejected. Second-only candidate preserves original fingering and every held71 thumb field, including unrelated RH p00906.

| Passage | 240Hz plus exact boundaries | Held result | Full-context result |
|---|---:|---|---|
| p514 |576 samples|Active/neighbor intersections remain; first candidate rejected|310 failing samples, max key core6.742570mm, max76 crossing pairs|
| p905 |570 samples,429 held|All five held notes pass; max key core2.344332mm, zero crossings, pad−2.068689..−0.122213mm, point error≤.000159mm|29 failing idle samples, max key core7.900636mm, max8 crossing pairs|

Full held detail is held-summary.json. Baseline same-context audits have414/172 failing samples respectively; the comparison is diagnostic, not acceptance merely from improvement. residual-intervals.json records every observed failing span. Second passage has seven finite idle spans:187.154868–187.171535,187.184035,187.196535,187.509035,187.538202,187.892368–187.925702,188.209035–188.250702. idle-window-queue.json includes the exact previous/next digit note fields for root’s idle-path work.

Actual palm forward uses wrist→MiddleMCP, with transverse IndexMCP→PinkyMCP. At105.7149985/187.4408685, lateral angle changes38.886640°/57.859435° to12.567889°/8.364833°; actual3D angle becomes16.130632°/14.300184°. These rig metrics are not a clinical range or an anatomical-final claim. The second approach note p00899 remains at its guarded original orientation, up to39.859°; the corrected central group p00903/p00905/p00907 stays≤14.919°/8.380°/4.758° through its holds, and p00909≤15.482°.

Wrist positions remain reachable: maximum target error <.000106mm. Nineteen actual garment poses including held starts, ends and extremes have0 exposed upper-arm signed-depth crossing and0 forearm/outer-torso triangle crossings on both sides. The garment metric excludes sleeve-covered skin and uses closest outer-cloth triangle signed normal; it is not watertight volume containment.

Deterministic seeking returns identical wrist/tip positions; normalized quaternion comparison is at floating-point precision. Exact ±1microsecond boundaries have no large pose jump. However shortening departure motion increases peak wrist speed from.818/.908m/s to1.882/1.465m/s and peak finger-joint rate from118.809/46.505 to410.391/127.262rad/s. These remaining motion defects reinforce rejecting complete-passage acceptance; motion-report.json retains all boundaries and definitions.

## Actual visual review and deliverables

Twelve matching1280px actual top renders were inspected:105.528197,105.7149985,106.020543,187.4408685,187.738975,187.896535, baseline versus diagnostic. render-manifest.json pins every image/report hash. Both wrists look straighter. The first candidate at106.020543 visibly folds its index into the palm; it is rejected despite exact point contact. Second held poses show a useful orientation improvement, while the idle frame still fails actual key geometry.

second-held-delta.json is the minimal guarded candidate: seven contact fields on p00903/p00905/p00907/p00909, four complete LH knot replacements442–445 and only moveStart on446. second-held-candidate.json contains that delta atop the frozen combined score. It is HELD_ONLY, not cleared for full playback. Apply in scratch with `node apply-delta.mjs INPUT OUTPUT second-held-delta.json`; it guards events, prior changed fields and entire knot preconditions, preserving other combined patches.

The two-passage diagnostic has15 note fields and9 knots and is explicitly rejected for integration. check.mjs verifies scope/musical parity, the second held checks, actual garment checks, and twelve inspected image hashes. Reproduction: node audit.mjs diagnostic-candidate.json 240, node garment.mjs diagnostic-candidate.json, node motion.mjs. Parent should use the second held delta as an input to the finite idle fixes, rerun complete passages on the final combined rig, and leave repeat-family propagation blocked until then.
