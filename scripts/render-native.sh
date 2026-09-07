#!/usr/bin/env bash
set -euo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_directory="$(dirname "$script_directory")"
cd "$project_directory"

# Accept the same DAYBREAK_ prefix as the other render options. Never silently
# render the default poses when a caller supplied an explicit prefixed value.
for render_option in WIDTH TIMES; do
  render_prefixed="DAYBREAK_$render_option"
  if [[ -v "$render_prefixed" ]]; then
    if [[ -v "$render_option" && "${!render_option}" != "${!render_prefixed}" ]]; then
      echo "Conflicting $render_option and $render_prefixed values" >&2
      exit 2
    fi
    export "$render_option=${!render_prefixed}"
  fi
done
node scripts/compile-performance.mjs --verify

# System EGL is sufficient on a normal workstation. A separately prepared
# local Mesa runtime may be selected without changing system libraries.
render_runtime="${DAYBREAK_EGL_ROOT:-$project_directory/work/native-runtime}"
if [[ -f "$render_runtime/usr/lib/x86_64-linux-gnu/libEGL.so.1" ]]; then
  export DAYBREAK_EGL_ROOT="$render_runtime"
  export LD_LIBRARY_PATH="$render_runtime/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  export __EGL_VENDOR_LIBRARY_FILENAMES="$render_runtime/usr/share/glvnd/egl_vendor.d/50_mesa.json"
fi
export LIBGL_ALWAYS_SOFTWARE="${LIBGL_ALWAYS_SOFTWARE:-1}"
exec python3 production/qa/render-revision.py "$@"
