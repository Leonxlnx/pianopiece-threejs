#!/usr/bin/env bash
# Local extraction only. No apt configuration change or system package install.
set -euo pipefail
cd -- "$(dirname -- "$0")"
DAYBREAK_SETUP_ROOT="$PWD"
export DAYBREAK_SETUP_ROOT
mkdir -p python debs egl
python - <<'PY'
import os, pathlib, subprocess, sys
from importlib import metadata
root=pathlib.Path(os.environ['DAYBREAK_SETUP_ROOT'])
sys.path.insert(0,str(root/'python'))
missing=[]
for row in (root/'requirements.txt').read_text().splitlines():
 if not row or row.startswith('#'): continue
 name,required=row.split('==')
 try: installed=metadata.version(name)
 except metadata.PackageNotFoundError: installed=None
 if installed != required: missing.append(row)
if missing:
 subprocess.run([sys.executable,'-m','pip','install','--upgrade','--no-cache-dir','--no-deps','--only-binary=:all:','--target',str(root/'python'),*missing],check=True)
print('Pinned Python requirements present')
PY
# Reuse the installed Ubuntu Mesa driver, avoiding a duplicate driver/LLVM cache.
test "$(dpkg-query -W -f='${Version}' libgl1-mesa-dri)" = '25.2.8-0ubuntu0.24.04.2'
test "$(dpkg-query -W -f='${Version}' libgbm1)" = '25.2.8-0ubuntu0.24.04.2'
if [[ ! -f debs/libegl1_1.7.0-1build1_amd64.deb ]]; then
  curl -fsSL --max-time 120 https://archive.ubuntu.com/ubuntu/pool/main/libg/libglvnd/libegl1_1.7.0-1build1_amd64.deb -o debs/libegl1_1.7.0-1build1_amd64.deb
fi
if [[ ! -f debs/libegl-mesa0_25.2.8-0ubuntu0.24.04.2_amd64.deb ]]; then
  curl -fsSL --max-time 120 https://archive.ubuntu.com/ubuntu/pool/main/m/mesa/libegl-mesa0_25.2.8-0ubuntu0.24.04.2_amd64.deb -o debs/libegl-mesa0_25.2.8-0ubuntu0.24.04.2_amd64.deb
fi
(cd debs && sha256sum -c SHA256SUMS)
for daybreak_deb in debs/*.deb; do dpkg-deb -x "$daybreak_deb" egl; done
./check-runtime.sh
