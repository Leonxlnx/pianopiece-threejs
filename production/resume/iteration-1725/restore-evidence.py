from pathlib import Path
import json,gzip,hashlib
root=Path(__file__).resolve().parent
for r in json.loads((root/"manifest.json").read_text())["files"]:
 data=(root/r["stored"]).read_bytes()
 if r["gzip"]:data=gzip.decompress(data)
 assert len(data)==r["bytes"] and hashlib.sha256(data).hexdigest()==r["sha256"],r["stored"]
 if r["gzip"]:(root/r["source"]).write_bytes(data)
print("Verified and restored all evidence")
