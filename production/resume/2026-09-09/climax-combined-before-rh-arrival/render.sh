#!/usr/bin/env bash
set -euo pipefail
review_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$review_root/../../render-recovery/run-single.sh" --project "$review_root/../../climax-nonthumb-continuity/render-project" --times 159.096,159.104,159.115,159.131,159.3,159.4125,159.42,159.444,159.47,159.5 --width 1280 --camera oblique --pianist-source "$review_root/candidate.ts"
