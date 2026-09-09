import json,hashlib,pathlib,math
P=pathlib.Path(__file__).parent
def read(name):return json.loads((P/name).read_text())
def sha(path):return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
b=read('audit-baseline.json');p=read('audit-proposed.json');r={}
r['outsideExact']=b['summary']['outside']==p['summary']['outside'];r['outsideSamples']=len(p['summary']['outside'])
a=read('proposed-poses.json');c=read('native-poses.json');r['nativeParityExact']=a==c;r['nativeParitySamples']=len(a)
br={x['time']:x for x in b['rows']};pairs=[(br[x['time']],x) for x in p['rows'] if x['time'] in br];r['matchedSurfaceSamples']=len(pairs)
for key in ['allPairs','allCore','activeCore','palmCore','point']:r[key]={'baselineMax':max(x[key] for x,y in pairs),'candidateMax':max(y[key] for x,y in pairs)}
r['pairSum']={'baseline':sum(x['allPairs']for x,y in pairs),'candidate':sum(y['allPairs']for x,y in pairs)}
r['families']={'baseline':b['summary']['families'],'candidate':p['summary']['families']};r['peaks']={'baseline':b['summary']['peaks'],'candidate':p['summary']['peaks']}
r['activePadGapMaxMm']=p['summary']['gap'];r['heldViolations']=p['summary']['violations']
r['indexGapCores']=[{'interval':[lo,hi],'max':max([k['depth']for x in p['rows'] if lo<=x['time']<=hi for k in x['keyHits'] if k['patch']=='RIndex']+[0])}for lo,hi in[(106.81,106.923274),(107.18,107.269683)]]
basepath=P.parent/'integrated-review/score-v11.json';base=json.loads(basepath.read_text());score=read('release-score.json');r['noteDeltas']=[]
for x,y in zip(base['notes'],score['notes']):
 if x!=y:r['noteDeltas'].append({'id':x['id'],'changes':{k:{'before':x.get(k),'after':v}for k,v in y.items()if x.get(k)!=v},'beforeEnd':x['time']+x['duration'],'afterEnd':y['time']+y['duration']})
r['nonNotesExact']={k:base[k]==score[k]for k in base if k!='notes'}
r['preservedAttackPitchVelocityHandFinger']=all(all(x[k]==y[k]for k in ['id','time','midi','velocity','hand','finger'])for x,y in zip(base['notes'],score['notes']))
r['audioEffect']={'p00519':'Physical release85.774ms earlier. Existing pedal-up106.870774 makes acoustic damper release25ms earlier than old key-off106.895774, an authorized phrase breath.','p00524':'Physical release61.383ms earlier under pedal0.66; pedal events unchanged. Written duration retained.','remaster':'Required from changed score; no audio rendered by this leaf.'}
r['nativeReview']='/workspace/scratch/2e8cc8e77f98/render-recovery/reviews/d90cb414c0c5d130/report-960.json'
r['typecheck']=read('typecheck-comparison.json')
(P/'proposed-extension.js').write_text('function releaseRepair'+(P/'proposed-rig.mjs').read_text().split('function releaseRepair',1)[1])
paths=['proposed-rig.mjs','proposed-runtime.ts','proposed-native.ts','proposed-extension.js','proposed-extension.ts','release-score.json','audit-proposed.json','audit-baseline.json']
r['sha256']={x:sha(P/x)for x in paths};r['inputSha256']={'score-v11.json':sha(basepath),'pianist-candidate-baked.mjs':sha(P.parent/'integrated-review/pianist-candidate-baked.mjs')}
r['limitations']=['Residual existing RIndex/RMiddle surface intersections remain; this candidate is an improvement, not collision-free.','Wrist speed and acceleration increase locally; exact peaks are recorded.','Existing right-thumb gap core and later pinky approach core remain outside this correction.','No full-film or audio claim.']
(P/'score-delta.json').write_text(json.dumps(r['noteDeltas'],indent=2));(P/'handoff.json').write_text(json.dumps(r,indent=2))
assert r['outsideExact'] and r['nativeParityExact']
assert r['preservedAttackPitchVelocityHandFinger'] and all(r['nonNotesExact'].values()) and len(r['noteDeltas'])==2
assert not r['heldViolations'] and max(x['max'] for x in r['indexGapCores'])<2.8
assert set(r['families']['candidate'])<=set(r['families']['baseline']) and r['pairSum']['candidate']<r['pairSum']['baseline']
assert r['peaks']['candidate']['joint1']['value']<r['peaks']['baseline']['joint1']['value']
assert r['typecheck']['noNewDiagnostics']
print('PASS score identity, held contacts, key gaps, movement improvement, family comparison, native parity, outside identity; residual risks retained in handoff.json')
