"""Exact-input guards shared by the Daybreak release helpers."""
import hashlib, json, math
from pathlib import Path
from recover_samples import MANIFEST_SHA, load_manifest, sha, verify_sample

RENDERER_SHA = '5a6fc11d10be387e9b229fcaf829304e9769273968791ae46a199688bb2a0cb1'
NOTE_FIELDS = ('id','time','duration','midi','velocity','role')
SR = 44100

def require(condition, message):
    if not condition:
        raise ValueError(message)

def write_json(path, obj):
    Path(path).write_text(json.dumps(obj,indent=2,allow_nan=False)+'\n')

def audio_signature(score):
    payload = {'duration':score['duration'],'pedals':score['pedals'],
               'notes':[{k:n[k] for k in NOTE_FIELDS} for n in score['notes']]}
    canonical = json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=True,allow_nan=False)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()

def validate_score(score):
    require(math.isfinite(score['duration']) and score['duration'] > 0,'Invalid score duration')
    require(score['accompaniment']==[],'Solo-piano release requires empty accompaniment')
    require(score['notes'] and len({n['id'] for n in score['notes']})==len(score['notes']),'Duplicate or empty score notes')
    times=[]
    for n in score['notes']:
        require(all(math.isfinite(n[k]) for k in ['time','duration','midi','velocity']),'Nonfinite score event')
        require(0 <= n['time'] < score['duration'] and 0 < n['duration'] and n['time']+n['duration']<=score['duration'],'Invalid note timing')
        require(32<=n['midi']<=91 and n['midi']==int(n['midi']),'Uncovered sample pitch')
        require(0<n['velocity']<=1 and n['role'] in ['melody','countermelody','harmony','bass'],'Invalid note role/velocity')
        times.append(n['time'])
    require(times==sorted(times),'Score notes must be in time order for same-key restrikes')
    require(all(math.isfinite(p['time']) and math.isfinite(p['value']) and 0<=p['time']<=score['duration'] and 0<=p['value']<=1 for p in score['pedals']),'Invalid pedal timeline')

def preflight(release, current_score, expected_sha, sample_root=None):
    release = Path(release).resolve()
    binding = json.loads((release/'release-input.json').read_text())
    require(binding['scoreSha256']==expected_sha,'Expected score SHA does not match frozen release')
    for p in [Path(current_score),release/'score-final-input.json']:
        require(sha(p)==expected_sha,f'Score bytes changed: {p}')
    score = json.loads((release/'score-final-input.json').read_text())
    validate_score(score)
    require(audio_signature(score)==binding['audioEventSha256'],'Audio-event signature mismatch')
    for name, digest in binding['inputFiles'].items():
        require(sha(release/name)==digest,f'Frozen input changed: {name}')
    require(binding['baseRendererSha256']==RENDERER_SHA,'Wrong renderer lineage')
    manifest = load_manifest(release/'sample-manifest-frozen.json')
    root = Path(sample_root or binding['sampleRoot']).resolve()
    for entry in manifest['samples']:
        verify_sample(entry,root)
    return binding, score, manifest, root
