# Gates: Authored camera coverage after accepted arm integration

Scope: Freeze integrated posture and accepted score; review all authored shot boundaries/midpoints plus critical authored portrait shots; propose only finite evidence-backed camera fixes.

- [x] C1: Integrated source and score are frozen; exact authored shot schedule and audit findings are recorded.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/camera-posture-review/check-review.py --source-only
  EXPECT: CAMERA_SOURCE_PASS
  EVIDENCE: CAMERA_SOURCE_PASS: pianist22e2, piano915a, scoreb156; 24 authored shots; 672 room samples passed.

- [x] C2: All authored landscape shots have actual start/mid/end rendering evidence with unchanged GL checks and source provenance.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/camera-posture-review/check-review.py
  EXPECT: CAMERA_FRAMES_PASS
  EVIDENCE: CAMERA_FRAMES_PASS: 108 authored images verified; 72 landscape plus 36 portrait; exact source, time, dimensions, GL and image checks.

- [x] C3: Critical authored portrait wide/hand/face framing is rendered and reviewed separately from diagnostic angles.
  EVIDENCE: All 36 original portrait panels and 18 final candidate portrait panels visually inspected; reviewCamera is None in every report. Two matched previous-posture frames establish inherited partial-face composition. Exact evidence in image-index.json, candidate-image-index.json, previous-posture-index.json, and sheets/.

- [x] C4: Visible head/lid/shoulder crops and obstructed hands are reviewed exhaustively for rendered evidence; finite fixes or no-fix conclusion returned with images.
  CHECK: python /workspace/scratch/2e8cc8e77f98/render-recovery/camera-posture-review/check-candidate.py && node /workspace/scratch/2e8cc8e77f98/render-recovery/camera-posture-review/check-direction.mjs
  EXPECT: CANDIDATE_DIRECTION_PASS
  EVIDENCE: All 108 original and 21 final candidate frames visually reviewed; FINDINGS.md contains 24-shot ledger and two finite camera changes. CANDIDATE_FRAMES_PASS: 21 actual images. CANDIDATE_DIRECTION_PASS: 123 unchanged states, 21 intended states, 7 viewport seeks. Candidate room audit passes 672 samples. Scratch patch SHA2d07 source, no checkout edits or full-film run.
