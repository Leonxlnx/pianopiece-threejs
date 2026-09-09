#!/usr/bin/env bash
set -euo pipefail
source "$(dirname -- "$0")/env.sh"
python - <<'PY'
import json, os, moderngl
from pathlib import Path
ctx=moderngl.create_standalone_context(backend='egl',require=330,libegl=str(Path(os.environ['DAYBREAK_EGL_ROOT'])/'usr/lib/x86_64-linux-gnu/libEGL.so.1'),libgl='libGL.so.1')
error=ctx.error
assert error=='GL_NO_ERROR',error
print(json.dumps({'renderer':ctx.info['GL_RENDERER'],'version':ctx.info['GL_VERSION'],'error':error}))
ctx.release()
PY
