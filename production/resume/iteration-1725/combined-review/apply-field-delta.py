"""Apply field-level review deltas without overwriting independently fitted work."""
import copy, hashlib, json, sys
from pathlib import Path

source, manifest, output = map(Path, sys.argv[1:])
assert source.resolve() != output.resolve()
score = json.loads(source.read_text())
before = copy.deepcopy(score)
delta = json.loads(manifest.read_text())
notes = {n['id']: n for n in score['notes']}
pending = []
for kind in ('noteChanges', 'knotChanges'):
    for op in delta[kind]:
        if kind == 'noteChanges':
            obj = notes[op['id']]
        else:
            obj = next(h['knots'] for h in score['wristMotion']['hands'] if h['side'] == op['side'])[op['index']]
            assert obj['time'] == op['time'], op
        key = op['field']
        exists = op.get('beforeExists', op['before'] is not None)
        assert (key in obj) == exists and obj.get(key) == op['before'], (op, obj.get(key))
        pending.append((obj, key, op))
for obj, key, op in pending:
    if op.get('afterExists', op['after'] is not None):
        obj[key] = copy.deepcopy(op['after'])
    else:
        obj.pop(key, None)
visual = {'finger', 'contactLift', 'contactZ', 'thumbOpposition'}
for a, b in zip(before['notes'], score['notes'], strict=True):
    assert {k:v for k,v in a.items() if k not in visual} == {k:v for k,v in b.items() if k not in visual}
for key in before:
    if key not in ('notes', 'wristMotion'):
        assert before[key] == score[key], key
output.write_text(json.dumps(score, separators=(',', ':')))
print(json.dumps({'output':str(output), 'operations':len(pending), 'sha256':hashlib.sha256(output.read_bytes()).hexdigest(), 'audioExact':True}))
