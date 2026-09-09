#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "$0")/env.sh"
exec python "$DAYBREAK_RECOVERY_ROOT/render-single.py" "$@"
