#!/usr/bin/env python3
"""Recover only used recordings from the documented, pinned Salamander bank."""
from pathlib import Path
import concurrent.futures, hashlib, json, shutil, urllib.request

HERE=Path(__file__).resolve().parent
SOURCE=HERE/'sample-manifest-upstream.json'
SCORE=HERE/'score.json'

def sha(data):return hashlib.sha256(data).hexdigest()
def download(sample):
    dest=HERE/'samples'/sample['sourceFilename']
    if dest.exists() and sha(dest.read_bytes())==sample['sourceSha256']:return sample
    with urllib.request.urlopen(sample['sourceUrl'],timeout=45) as r:data=r.read()
    assert len(data)==sample['sourceBytes']
    assert sha(data)==sample['sourceSha256'],sample['sourceFilename']
    blob=hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()
    assert blob==sample['sourceGitBlobSha1'],sample['sourceFilename']
    dest.write_bytes(data)
    return sample

if __name__=='__main__':
    (HERE/'samples').mkdir(exist_ok=True)
    m=json.loads(SOURCE.read_text());score=json.loads(SCORE.read_text())
    chosen={}
    for n in score['notes']:
        velocity=n['velocity']*127
        layers=m['velocityLayers']
        layer=next((a for a in layers if a['recommendedMidiRange'][0]<=velocity<=a['recommendedMidiRange'][1]),min(layers,key=lambda a:abs(a['midiVelocity']-velocity)))
        s=min((s for s in m['samples'] if s['velocityLayer']==layer['layer']),key=lambda s:abs(s['midi']-n['midi']))
        assert abs(s['midi']-n['midi'])<=1
        chosen[s['sourceFilename']]=s
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for i,s in enumerate(pool.map(download,chosen.values())):
            if i%10==0:print('Fetched / verified',i+1,'of',len(chosen),flush=True)
    for s in m['samples']:s['sourceLocalPath']=str(Path('samples')/s['sourceFilename'])
    (HERE/'sample-manifest.json').write_text(json.dumps(m,indent=2)+'\n')
    report={'repository':m['repository'],'commit':m['repositoryCommit'],
            'usedRecordings':len(chosen),'bytes':sum(s['sourceBytes'] for s in chosen.values()),
            'allPinnedHashesVerified':True,'files':[{'filename':s['sourceFilename'],'sha256':s['sourceSha256'],'bytes':s['sourceBytes']} for s in chosen.values()]}
    (HERE/'sample-recovery.json').write_text(json.dumps(report,indent=2)+'\n')
    print('SAMPLES VERIFIED',len(chosen),report['bytes'],flush=True)
