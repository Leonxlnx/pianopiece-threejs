#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
node refinger_actual.mjs
node evaluate_actual.mjs
node calibrate-motion-skin.mjs
python finger_releases.py
python score-gates.py
python compare_audible.py
node audit-motion.mjs "$PWD/full-rig-audit-calibrated.json"
python package_candidate.py
