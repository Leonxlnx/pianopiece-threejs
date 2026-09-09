# Gates: Final arm / seat support with clavicle protraction

Scope: Preserve world wrists, feet, score and limb lengths while resolving exposed upper-arm / torso penetration with fixed +0.10m seat, small spine lean and clavicle rotations.

- [x] S1: Exact final source has full-score reach/contact/foot parity at120Hz.
  EVIDENCE: final-motion-report.json:27979frames120Hz, no reach deficit/nonfinite; source22e2db7b; contact and foot parity pass.
- [x] S2: Exact final source is continuous at6,352 event boundaries and deterministic across374 seeks.
  EVIDENCE: final-continuity-report.json:6352boundaries374seeks, max0.002594485mm, deterministic position0.
- [x] S3: Actual exposed upper-arm signed torso-cloth depth is at most2mm at4Hz plus every note midpoint, declared extremes and20Hz residual windows;20-pose forearm screen has no intersections.
  EVIDENCE: final-depth-sweep-report.json:2196poses, max1.623428mm L/0.892291mm R; candidate-final-clearance.json:20poses0forearm intersections.
- [x] S4: Actual front and side renders preserve coherent garment attachment and arm silhouette at opening, central reach and ending.
  EVIDENCE: final-evidence seven actual EGL frames inspected; source-specific render reports GL_NO_ERROR; side underarm seam recess remains declared.
- [x] S5: Final source, patch, reports, benchmark definition and residual tolerances are bound by exact hashes and handed to parent.
  EVIDENCE: arm-seat-final.patch applies cleanly with git apply --check; FINAL-HANDOFF.md, final-hashes.json and check-final.mjs bind source and evidence.
