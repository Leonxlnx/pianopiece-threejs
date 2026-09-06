# Exact performance checkpoint

Rig SHA256 e85f297e6bc9d419b567fa30bed99c7e0abef1bc47989c37b8d9a28cfbbf8f66; score SHA256 b1562bfe579eabca2bf6a188268836c3c669050ec3877d92b17d15729a00a773. Embedded wristMotion is authoritative; energy matches production.

The whole233.144228 s piece was sampled at500 Hz on all10 fingers and all30 finger-bone quaternions (normalized before angular differences). 116,574 unique sample times;116,580 including partition overlap.234 candidate windows,12.718 s, were refined on uniform0.5 ms steps (2kHz). No sampled fingertip exceeds5 m/s; max4.83548 m/s. Max active marker error .921013 mm. All1558 nonthumb attack/release boundaries checked at±0.1 microsecond remain continuous to within .000417 mm. This is an engineering numerical gate, not an anatomical certification.

Residual L2 at185.867 s is visibly awkward despite the speed gate: MCP proximal direction is about69° dorsal and index/web is stretched sideways. Its previous/next contacts are separated51 mm across345 ms, so the path can improve without changing music. Related idle fallbacks are being tested separately.

Largest joint angular peak15,971.8°/s is L5 at167.0625 s. At4kHz diagnostic resolution, the chain leaves a near-extension reach clamp: reach loss .030→.472→1.319 mm as PIP angle2.92→11.59→19.42° across2 ms. This is inverse-kinematics conditioning at near-full extension; the inspected mesh remains continuous. We are not changing contacts merely to reduce that arbitrary diagnostic rate.

Baseline/candidate comparison reports retain their own hashes in highrate-analysis and highrate-combined. The current score has fixed previous98mm/24ms finger reuse and active backward-contact cases. No muscle simulation is asserted.
