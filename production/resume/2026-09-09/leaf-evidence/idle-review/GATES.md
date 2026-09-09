# Gates: combined idle-support replay

Scope: frozen baseline without idle helper versus frozen baked candidate with helper, using a port of the preserved integrated-review surface harness. No Site edits, browser, package installation, or subagents. Geometry verification does not certify natural hand appearance.

- [x] G1: Exact source copies, frozen dependencies, baked-data identity, and input hashes are verified.
  CHECK: python verify.py inputs
  EXPECT: INPUTS PASS
  EVIDENCE: INPUTS PASS: 13 frozen hashes; baked data identity; sole helper delta; endpoint bindings

- [x] G2: The local harness port preserves the existing moving-key and triangle-surface implementation; the missing historical audit library is excluded.
  CHECK: python verify.py harness
  EXPECT: HARNESS PASS
  EVIDENCE: HARNESS PASS: exact preserved algorithms; only frozen paths, already-updated switch, snapshot export

- [x] G3: Deterministic support coverage includes 60 Hz and exact note/curve boundaries, with all six patches of every affected hand.
  CHECK: python verify.py coverage
  EXPECT: COVERAGE PASS
  EVIDENCE: COVERAGE PASS: 13441 timestamps; 17019 hand states; 102114 six-patch states; all 120 records

- [x] G4: The full replay completes and separately reports core >3 mm regressions, new own/pair contact types, strict existing pair-count increases, and active-joint parity.
  CHECK: python verify.py results
  EXPECT: RESULTS PASS
  EVIDENCE: RESULTS PASS: 13441 finished timestamps; 1037 recomputed events; active parity exact = True

- [x] G5: Compressed row evidence, a finite regression queue, the runner and hashes are complete and self-consistent.
  CHECK: python verify.py evidence
  EXPECT: EVIDENCE PASS
  EVIDENCE: EVIDENCE PASS: 86 finite queue entries; 1017 regression rows; 19 artifact hashes

- [x] G6: Re-read the completed aggregate adversarially, verify every reported count from evidence, and record limitations without appearance certification.
  EVIDENCE: Independent row recount passed; inspected all four per-key core witnesses and the sole own-palm increase. Patch maxima hide new LIndex/MIDI 58 crossings at 91.474 and 176.083333. FINDINGS.md and README.md retain finite-sampling, owned-surface, moving-key-core and appearance limitations. The truncated first attempt is excluded.
