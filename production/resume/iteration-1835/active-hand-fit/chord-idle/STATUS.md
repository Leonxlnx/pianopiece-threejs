# Current bounded continuation

Root authorizes finishing the eight exact idle paths from the 199 s chord proof while preserving all proof note/wrist/held fields and the scoped wrist plane. No root repo, opening source, or score edits.

Input score is ../chord-plane-proof/proof-candidate.json (aabde5da); source ../chord-plane-proof/pianist-scoped-plane.mjs. Tools use the audio leaf's audit-lib/runtime read-only. Root recovered the repository/dependencies after the prior reset.

Completed baseline: baseline-gaps30.json scans all eight endpoint spans at30 Hz+events, including inherited remote failures at192–205 s. Root informed that new curves will remain local to the chord changed supports and require exact outside parity; older remote failures are not silently included.

Rejected prototypes: curves-v1.json scalar controls; quats-v1.json and outer-q1/q2.json fixed local quaternion routes. Static controls can be clear but still cross animated keys between poses. Full held quaternion parity remained exact, but these candidates have regressions.

Current trial: outer-keyaware-v1.json uses dynamic local poses with temporary hover targets evaluated at CURRENT piano.contact key height, then exact held contact at the boundary; this is bounded, not a global live-endpoint change. audit file outer-ka1-check120.json is in progress. Audio leaf confirms root's earlier compact7/8 global live-endpoint attempts were rejected; opening compact21 qualifies it only locally. Our flight poses still need own/neighbor geometry and dense boundaries.

Tool scripts: curves.mjs handles local controls, fixed quaternion routes, neutral blends and key-hover pose overrides; check-window.mjs evaluates all five right digit skins before/after, exact held quaternions, keys/own palm/neighbor triangles; search-knot/static/hover produce finite safe intermediate poses. Final acceptance must ALSO use the main full mesh harness after exact source baking to cover palm key cores, mixed-skin actual active pads and opposing-hand surfaces; audio digit checks alone are insufficient.
