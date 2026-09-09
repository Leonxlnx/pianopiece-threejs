#!/usr/bin/env bash
# Source this file before launching Python; all additions remain in this directory.
DAYBREAK_RECOVERY_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export DAYBREAK_RECOVERY_ROOT
export PYTHONPATH="$DAYBREAK_RECOVERY_ROOT/python${PYTHONPATH:+:$PYTHONPATH}"
export DAYBREAK_EGL_ROOT="$DAYBREAK_RECOVERY_ROOT/egl"
export LD_LIBRARY_PATH="$DAYBREAK_EGL_ROOT/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export __EGL_VENDOR_LIBRARY_FILENAMES="$DAYBREAK_EGL_ROOT/usr/share/glvnd/egl_vendor.d/50_mesa.json"
export LIBGL_ALWAYS_SOFTWARE=1
