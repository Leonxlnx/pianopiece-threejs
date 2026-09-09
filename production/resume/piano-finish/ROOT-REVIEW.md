# Accepted lid and prop refinement

Root directly inspected the original glossy-lacquer test at 0.8/64.6 seconds and the satin frame at 0.8. The original test correctly used its near-black material, but at a grazing angle reflected the warm floor as a broad beige field. It was not a serialization or cache bug. The accepted satin interior uses roughness .48, metalness 0, clearcoat .15 and coat roughness .30; the exterior lacquer is unchanged. It retains restrained warm sheen instead of the crushed-black .82 matte alternative. This is an original finish choice, not a brand-specific replica.

The lid prop now ends at a transformed underside shoe instead of a hard-coded world height. A small support shoe is attached in the lid's local coordinates. Both changes are static; the lid is not animated by this score.

Original app piano 915ae12f and accepted satin 5f6d9e23 were compared across 33 states: every key, damper and pedal matrix plus 14,520 contact queries per variant is exact. The extra shoe changes the expected static mesh count from 115 to 116. The agent's separate finish-only geometry comparison starts at d58f11ba, which already has the new prop, and is not misrepresented as parity against original static geometry.

The native renderer uses a room environment capture with limited spatial parallax; it omits the browser's planar floor reflector. Live WebGL appearance remains an open check. The accepted source change does not certify hand motion, score/audio matching or final film completion.
