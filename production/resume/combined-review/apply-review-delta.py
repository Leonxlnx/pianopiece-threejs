import json,sys,hashlib
from pathlib import Path
source,manifest,output=map(Path,sys.argv[1:]);assert source.resolve()!=output.resolve();s=json.loads(source.read_text());d=json.loads(manifest.read_text());notes={n['id']:n for n in s['notes']}
for c in d['noteChanges']:
 n=notes[c['id']]
 for k,v in c['changes'].items():
  assert n.get(k)==v['before'],(c['id'],k,n.get(k),v['before'])
  if v['after'] is None:n.pop(k,None)
  else:n[k]=v['after']
for c in d['knotChanges']:
 ks=next(h['knots'] for h in s['wristMotion']['hands'] if h['side']==c['hand']);assert ks[c['index']]==c['before'],(c['hand'],c['index']);ks[c['index']]=c['after']
output.write_text(json.dumps(s,separators=(',',':')));print(str(output),hashlib.sha256(output.read_bytes()).hexdigest())
