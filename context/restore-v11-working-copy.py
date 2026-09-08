#!/usr/bin/env python3
"""Reconstruct the last local v11 app after recovering Sites checkpoint 7294e54.

This helper was written from retained source/edit records during an environment
outage. It has NOT been executed. Review it before use, then run without --apply
to inspect the plan. It does not install, commit, push, render or deploy anything.
"""
from pathlib import Path
import argparse
import gzip
import hashlib
import json
import re
import subprocess

PROJECT_ID = "appgprj_6a9b729cbe8081918fada430da2412f0"
BASE_RIG = "22e2db7b7da490b83d7aaa9111a069f3b1ce3043f61f7c9df6fcba0f68731075"
BASE_SCORE = "9db662f1e9d4037cc8c505b9818b7782ac1fb52fe70cff85bf362a00a9fb3b30"
V11_SCORE = "ab41e7f6999a82b364a1d4117bdf4618a6f3e9e5209f18b327da7c12a4a8bdb0"
PIANO = "e24324b417de257df8760006f0b30954dba8e87d84ca5f6b0b2f8e2afed6797f"

def sha(data):
    return hashlib.sha256(data).hexdigest()

def preserved(project, source):
    for iteration in ("iteration-1835", "iteration-1725", "iteration-1635"):
        folder = project / "production/resume" / iteration
        manifest = folder / "manifest.json"
        if not manifest.exists():
            continue
        matches = [row for row in json.loads(manifest.read_text())["files"]
                   if row["source"] == source]
        if not matches:
            continue
        if len(matches) != 1:
            raise RuntimeError("Ambiguous preserved source: " + source)
        row = matches[0]
        path = (folder / row["stored"]).resolve()
        if folder.resolve() not in path.parents:
            raise RuntimeError("Stored path escapes checkpoint")
        data = path.read_bytes()
        if row["gzip"]:
            data = gzip.decompress(data)
        if sha(data) != row["sha256"] or len(data) != row["bytes"]:
            raise RuntimeError("Preserved source integrity mismatch: " + source)
        return data
    raise RuntimeError("Missing preserved source: " + source)

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError("Expected one source anchor: " + old[:100])
    return text.replace(old, new, 1)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--apply", action="store_true",
                        help="Write the four guarded working-copy files")
    args = parser.parse_args()
    project = args.project.resolve()
    hosting = json.loads((project / ".openai/hosting.json").read_text())
    if hosting.get("project_id") != PROJECT_ID:
        raise RuntimeError("Wrong Sites project")
    subprocess.run(["git", "cat-file", "-e", "7294e54^{commit}"],
                   cwd=project, check=True)
    if sha((project / "app/performance/piano.ts").read_bytes()) != PIANO:
        raise RuntimeError("Piano source differs from the recovered checkpoint")

    source = preserved(project, "integrated-review/pianist-candidate.ts").decode("utf-8")
    type_text = (
        "type ThumbRestControl={name?:string;previous:string;next:string;"
        "end:number;start:number;target:[number,number,number];release?:number;"
        "arrival?:number;ramp?:number;arrivalRamp?:number;releaseLift?:number;"
        "arrivalLift?:number;opposition?:number};\n\n"
    )
    source = replace_once(source, "const FINGERS=", type_text + "const FINGERS=")
    source, count = re.subn(r"const controls=(\[[^\n]+\])\.find",
                           r"const controls=(\1 as ThumbRestControl[]).find",
                           source)
    if count != 1:
        raise RuntimeError("Expected exactly one g95 control declaration")
    source = replace_once(
        source,
        "if(controls&&hand.side==='R'&&time>end&&time<start)",
        "if(controls&&previous&&next&&hand.side==='R'&&time>end&&time<start)"
    )
    source = replace_once(
        source,
        "if(m.name==='Human'&&m.geometry.index){m.geometry=m.geometry.clone();"
        "const pos=m.geometry.attributes.position,old=m.geometry.index.array,kept:number[]=[];",
        "if(m.name==='Human'&&m.geometry.index){const old=m.geometry.index.array;"
        "m.geometry=m.geometry.clone();const pos=m.geometry.attributes.position,kept:number[]=[];"
    )
    if "__thumbRestCandidates" in source:
        raise RuntimeError("Diagnostic global control unexpectedly present")
    score = preserved(project, "integrated-review/score-v11.json")
    if sha(score) != V11_SCORE:
        raise RuntimeError("Wrong v11 score bytes")
    writes = {
        "app/performance/pianist.ts": source.encode("utf-8"),
        "app/performance/idle-nonthumb.ts":
            preserved(project, "integrated-review/idle-nonthumb.ts"),
        "app/performance/idle-nonthumb-data.ts":
            preserved(project, "integrated-review/idle-nonthumb-data.ts"),
        "public/assets/score.json": score,
    }
    # Validate every destination before writing anything. Preserve newer work.
    for rel, data in writes.items():
        path = project / rel
        allowed = {sha(data)}
        if rel.endswith("/pianist.ts"):
            allowed.add(BASE_RIG)
        elif rel.endswith("/score.json"):
            allowed.add(BASE_SCORE)
        if path.exists() and sha(path.read_bytes()) not in allowed:
            raise RuntimeError("Destination has other work; do not overwrite: " + rel)
    print(json.dumps({
        "status": "apply" if args.apply else "dry-run",
        "helperExecutionPreviouslyVerified": False,
        "sourceCheckpoint": "7294e54",
        "files": {rel: {"bytes": len(data), "sha256": sha(data)}
                  for rel, data in writes.items()},
        "remaining": [
            "Exact modular/baked pose parity",
            "Complete interrupted idle-support replay",
            "Remaining visible finger and joint-motion defects",
            "Final score/master freeze, full film, public revision and GitHub source sync"
        ],
    }, indent=2))
    if args.apply:
        for rel, data in writes.items():
            path = project / rel
            if path.exists() and path.read_bytes() == data:
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_name(path.name + ".v11-recovery.tmp")
            if temporary.exists():
                raise RuntimeError("Recovery temporary file already exists: " + str(temporary))
            temporary.write_bytes(data)
            temporary.replace(path)

if __name__ == "__main__":
    main()
