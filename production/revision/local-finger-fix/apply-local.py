#!/usr/bin/env python3
"""Apply exactly the three validated fingering/contact-lift edits to an input score."""
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parent
source=Path(sys.argv[1]) if len(sys.argv)>1 else root/'baseline-score.json'
target=Path(sys.argv[2]) if len(sys.argv)>2 else root/'candidate-score.json'
s=json.loads(source.read_text());notes={n['id']:n for n in s['notes']}
for edit in json.loads((root/'exact-changes.json').read_text()):
 n=notes[edit['id']]
 for field,values in edit['changes'].items():
  assert n[field] in [values['before'],values['after']],(edit['id'],field,n[field])
  n[field]=values['after']
target.write_text(json.dumps(s,separators=(',',':')))
