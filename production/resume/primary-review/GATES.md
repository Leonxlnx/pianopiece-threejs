# Gates: Primary held-pose score comparison

Scope: Render four exact held-note midpoint poses with accepted f040 rig, comparing accepted baseline score to frozen primary-v1 score in matched top and oblique cameras.

- [x] P1: Four target note IDs, held midpoint times, exact score and accepted rig hashes are frozen in a manifest.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/primary-review/check-primary.py --manifest-only
  EXPECT: MANIFEST_PASS
  EVIDENCE: MANIFEST_PASS: accepted rig and both exact scores, four held midpoints

- [x] P2: Sixteen actual 960x540 images pass strict GL and paired source/camera/time/image checks, with only score changing within each pair.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/primary-review/check-primary.py
  EXPECT: PRIMARY_RENDER_PASS
  EVIDENCE: PRIMARY_RENDER_PASS: 16 exact 960x540 images, held contacts, matched camera/time, only score differs | DELIVERY_PASS: 16 named review PNG copies match original render bytes

- [x] P3: All four pairs in both camera views are visually inspected and brief silhouette/contact findings plus image paths returned to root.
  EVIDENCE: Viewed all four final native-resolution comparison sheets (16 panels); FINDINGS.md records pose-specific silhouettes and remaining p00914 concerns; delivery-index.json lists 16 named PNG copies with exact SHA and original report paths.
