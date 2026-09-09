#!/usr/bin/env bash
set -euo pipefail
review_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$review_root"
node extract.mjs > extract.log
python build.py
node compile.mjs
node audit.mjs baseline audit-supported.json.gz > audit-supported.log
DAYBREAK_RIG_MODULE="$review_root/candidate.mjs" node audit.mjs candidate audit-after.json.gz > audit-after.log
DAYBREAK_SCORE="$review_root/../../final-motion-review/delivery-score.json" DAYBREAK_RIG_MODULE="$review_root/../../final-motion-review/runtime/pianist.mjs" DAYBREAK_CACHE="$review_root/../../climax-fingering-review/final-baseline.json.gz" node audit.mjs baseline audit-original.json.gz > audit-original.log
python compare-all.py audit-supported.json.gz audit-after.json.gz vs-supported
python compare-all.py audit-original.json.gz audit-after.json.gz vs-original
