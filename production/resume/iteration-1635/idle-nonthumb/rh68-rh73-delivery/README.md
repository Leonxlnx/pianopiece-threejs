# Frozen RH68 / RH73 inactive correction candidate

Append the four curves in `rh68-rh73-additive-curves.json` through the existing `applyIdleNonthumb` API. They use ordinary smoothstep MCP controls and need no new runtime mode. Exact score SHA and all four gap IDs/times are checked by the included validator. This data is bound to frozen RH68 score 205ddb7f, not the final combined score.

RH68: the Pinky p293→p309 gap uses a −6.5° MCP spread pulse. All 171 observed Ring/Pinky collision poses at 68.371–68.405 become zero in a 5 kHz target check. Whole changed window 68.30–68.46 passes at 1 kHz, with unchanged 1.370 m/s peak tip speed.

RH73: released Middle/Ring/Pinky use a coordinated 25° MCP lift and −30° spread pulse, supported only at 73.803–74.003. All 145 observed Index/Middle collision poses at 73.878–73.906699 become zero at 5 kHz. Whole changed window 73.79–74.02 passes at 1 kHz, with unchanged 2.166 m/s peak tip speed. Within the smaller dense target window, speed increases 1.132→1.206 m/s.

Both whole changed-window checks include all five actual finger surfaces against all keys, own palm, and same-hand neighbors. There are zero newly colliding pair types or severe key-core regressions. Exact active tips and deterministic seek pass. Across the full affected gap unions, all joint quaternion components outside the pulse and all active components remain bit-identical at 120 Hz plus note/curve boundaries.

These bounded corrections remove the specified held-neighbor failures. Other preexisting idle collisions/core excursions remain. Finite sample clearance does not establish continuous clearance, and a pair-type gate does not measure penetration depth of already-colliding surfaces. Root owns final combined source/score checks and visual acceptance.
