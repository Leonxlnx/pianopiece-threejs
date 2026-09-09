import pathlib,json,hashlib,math
P=pathlib.Path(__file__).parent
read=lambda n:json.loads((P/n).read_text());sha=lambda n:hashlib.sha256((P/n).read_bytes()).hexdigest()
b=read('audit-baseline-final.json');c=read('audit-guard.json');r=read('handoff.json');keys={};bad=[];newdeep=[];families=[]
for before,after in zip(b['rows'],c['rows']):
 assert before['time']==after['time'];time=after['time'];bm={(x['patch'],x['midi']):x['depth']for x in before['keyHits']};cm={(x['patch'],x['midi']):x['depth']for x in after['keyHits']}
 for key in set(bm)|set(cm):
  row=keys.setdefault(key,dict(patch=key[0],midi=key[1],baselineMaxMm=0,candidateMaxMm=0,newStates=0,removedStates=0,newStatePeakMm=0,newStatePeakTime=None,increasedStates=0,increasePeakMm=0))
  old,new=bm.get(key,0),cm.get(key,0);row['baselineMaxMm']=max(row['baselineMaxMm'],old);row['candidateMaxMm']=max(row['candidateMaxMm'],new)
  if key not in bm and key in cm:
   row['newStates']+=1
   if new>row['newStatePeakMm']:row['newStatePeakMm']=new;row['newStatePeakTime']=time
   if new>3:newdeep.append(dict(time=time,patch=key[0],midi=key[1],depthMm=new))
  if key in bm and key not in cm:row['removedStates']+=1
  if new>old+.25:row['increasedStates']+=1;row['increasePeakMm']=max(row['increasePeakMm'],new-old)
  if new>max(3,old+.25):bad.append(dict(time=time,patch=key[0],midi=key[1],beforeMm=old,afterMm=new,increaseMm=new-old))
 f=lambda q:{(v['a'],v['b'])for v in q['crossings']}
 for family in f(after)-f(before):families.append(dict(time=time,family=family))
early=[(x,y)for x,y in zip(b['rows'],c['rows']) if 64.184354<=x['time']<=65.7]
indexMax=max(math.dist(p,q)for x,y in early for p,q in zip(x['chains'][1]['points'],y['chains'][1]['points']))
r.update(status='FROZEN_FOR_PARENT_VISUAL_REVIEW_WITH_DISCLOSED_TRADEOFF',reason='Measured scalar guard restores the original early index chain exactly; existing Index/F#5 contact at66.964 still increases0.2508092854403566mm. Threshold unchanged; parent assesses this disclosed tradeoff.',candidate=c['summary'],perPatchKey=list(keys.values()),materialPerKeyRegressions=bad,newKeyStatesOver3mm=newdeep,newTimedFamilies=families,outsideExact=b['summary']['outside']==c['summary']['outside'],laterPinkyAndRemainingContextExact=all(x==y for x,y in zip(b['poses'],c['poses'])if x[0]>=67.016236),nativeParity=read('guard-parity.json'),nativeReview='/workspace/scratch/2e8cc8e77f98/render-recovery/reviews/2f9060f11e9a7b8f/report-960.json',qualification=dict(heldP299Improved=True,fullContextNewKeyGatePassed=not newdeep,unchangedNumericThresholdFlag=bad,parentVisualReviewPending=True,acceptedByLeaf=False),scalarGuardProof=dict(oldNextEnvelope=.14897594070608658,newNextEnvelope=0,idleRotationPreviousEnvelopeAt64p2=[1,1,1],earlyIndexChainMaxDifferenceM=indexMax,earlyIndexSamples=len(early),traceFiles=['trace-baseline.json','trace-candidate.json']),passes=dict(implement='Same held/support candidate plus authored scalar bound to real p285→p302 gap.',expertRead='Old next-contact scalar alone caused early release difference; exact index-chain restoration demonstrates cause.',defectHunt='Full per-patch/key map; no new contact states over3mm or new timed crossing families. Same-key +0.250809mm flag retained.',polish='One parent-requested scalar followup; no further sweep. Native64.214/66.34/66.964 viewed; source frozen.'))
r['idleCalibrationDelta']['status']='part of frozen parent-review candidate';r['audioEffect']='P296 key-off97.95ms earlier and p299 key-off103.093ms earlier, both under existing0.73pedal65.629664→68.395807. Written durations retained. Pedals unchanged. No audio artifact rendered by this leaf; parent remaster must use accepted score.'
delta=dict(noteDeltas=r['noteDeltas'],wrist=dict(side='R',axis='x',offsetM=-.035,entry=[66.18,66.30195],exit=[66.54,66.668093],easing='quintic smootherstep',scoreWristFieldsUnchanged=True),idleMCP=[dict(finger=2,previous='p00285',next='p00302',degrees=10,entry=[65.9,66.03],arrivalTime=67.016236,arrivalRamp=.27,easing='quintic smootherstep'),dict(finger=4,previous='p00296',next='p00301',degrees=15,releaseRamp=.10,arrivalRamp=.10,easing='quintic smootherstep')],pinkyCurve=r['idleCalibrationDelta'],nextEnvelopeGuard=dict(side='R',fi=1,previous='p00285',previousEnd=64.184354,next='p00302',nextTime=67.016236,authoredScalar=.14897594070608658,holdThrough=65.7,fadeToCurrentBy=65.9,easing='existing cubic smooth',replaces='Only the next-contact envelope before its Math.min with other current guards',fictitiousNoteAnchor=False))
r['typedRuntimeParity']=read('guard-runtime-parity.json')
paths=['guard.mjs','guard-runtime.ts','guard-native.ts','guard-extension.js','guard-extension.ts','candidate-score.json','audit-baseline-final.json','audit-guard.json','guard-parity.json','guard-runtime-parity.json'];r['sha256']={n:sha(n)for n in paths}
(P/'guard-delta.json').write_text(json.dumps(delta,indent=2));(P/'guard-handoff.json').write_text(json.dumps(r,indent=2));(P/'guard-per-key.json').write_text(json.dumps(dict(comparison=r['perPatchKey'],regressions=bad,newKeyStatesOver3mm=newdeep),indent=2))
assert indexMax==0 and r['outsideExact'] and r['laterPinkyAndRemainingContextExact'] and r['nativeParity']['exact'] and not newdeep and not families and len(bad)==1
print(json.dumps(dict(status=r['status'],scalarProof=r['scalarGuardProof'],remaining=bad,hashes=r['sha256']),indent=2))
