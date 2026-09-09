import json,hashlib,pathlib
P=pathlib.Path(__file__).parent;B=P.parent/'integrated-review'
read=lambda name:json.loads((P/name).read_text())
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
b=read('audit-baseline-final.json');c=read('audit-candidate-final.json');base=json.loads((B/'score-v11.json').read_text());score=read('candidate-score.json')
keys={};bad=[];families=[]
for before,after in zip(b['rows'],c['rows']):
 assert before['time']==after['time'];time=after['time'];bm={(x['patch'],x['midi']):x['depth']for x in before['keyHits']};cm={(x['patch'],x['midi']):x['depth']for x in after['keyHits']}
 for key in set(bm)|set(cm):
  row=keys.setdefault(key,dict(patch=key[0],midi=key[1],baselineMaxMm=0,candidateMaxMm=0,newStates=0,removedStates=0,newStatePeakMm=0,newStatePeakTime=None,increasedStates=0,increasePeakMm=0))
  old,new=bm.get(key,0),cm.get(key,0);row['baselineMaxMm']=max(row['baselineMaxMm'],old);row['candidateMaxMm']=max(row['candidateMaxMm'],new)
  if key not in bm and key in cm:
   row['newStates']+=1
   if new>row['newStatePeakMm']:row['newStatePeakMm']=new;row['newStatePeakTime']=time
  if key in bm and key not in cm:row['removedStates']+=1
  if new>old+.25:row['increasedStates']+=1;row['increasePeakMm']=max(row['increasePeakMm'],new-old)
  if new>max(3,old+.25):bad.append(dict(time=time,patch=key[0],midi=key[1],beforeMm=old,afterMm=new))
 f=lambda r:{(x['a'],x['b'])for x in r['crossings']}
 for family in f(after)-f(before):families.append(dict(time=time,family=family))
delta=[]
for old,new in zip(base['notes'],score['notes']):
 if old!=new:delta.append(dict(id=old['id'],beforeEnd=old['time']+old['duration'],afterEnd=new['time']+new['duration'],changes={k:dict(before=old.get(k),after=v)for k,v in new.items()if old.get(k)!=v}))
outsideExact=b['summary']['outside']==c['summary']['outside'];lateExact=all(x==y for x,y in zip(b['poses'],c['poses'])if x[0]>=67.016236)
noteFields=['id','time','midi','velocity','hand'];preserved=all(all(x[k]==y[k]for k in noteFields)for x,y in zip(base['notes'],score['notes']));nonnotes={k:base[k]==score[k]for k in base if k!='notes'}
r=dict(status='REJECTED_NOT_FOR_INTEGRATION',reason='The real refingered index interval p285→p302 gains neighboring-key penetration near64.208–64.218 and worsens existing F#5 core near66.964. Main p299 contact improvement does not qualify the full context.',surfaceSamples=len(c['rows']),surfaceSampling='60Hz across64.15–69.15;500Hz across64.15–64.50 and65.90–67.20;all note boundaries from both scores±1microsecond',motionSampling='2kHz across64.15–64.50 and65.90–67.20',baseline=b['summary'],candidate=c['summary'],perPatchKey=list(keys.values()),materialPerKeyRegressions=bad,newTimedFamilies=families,outsideExact=outsideExact,outsideSamples=len(c['summary']['outside']),laterPinkyAndRemainingContextExact=lateExact,nativeParity=read('native-parity.json'),noteDeltas=delta,nonNotesExact=nonnotes,attackPitchVelocityHandExact=preserved,nativeReview='/workspace/scratch/2e8cc8e77f98/render-recovery/reviews/e6caa037449cbcf2/report-960.json',idleCalibrationDelta=dict(patch='RPinky',interval=[68.32,68.448307],before=dict(previous='p00293',previousEnd=65.563664),after=dict(previous='p00299',previousEnd=66.54),next='p00309',nextTime=68.448307,knotsUnchanged=True,status='scratch-only with rejected score'),audioEffect='Rejected score only: p296 key-off97.95ms earlier and p299 key-off103.093ms earlier; written durations retained. Both under existing0.73pedal65.629664→68.395807. No pedal or audio artifact changed.',qualification=dict(heldP299Improved=True,fullContextPassed=False,acceptedDelta=None),passes=dict(implement='P299pinky contactZ.270/lift.003;35mm wrist shift over genuine released gaps.',expertRead='Contact support plausible; removed fingering changes full actual Index/Pinky intervals.',defectHunt='Per-key comparison caught masked new neighboring-key states. Rebound curve bound to real p299.',polish='Finite neutral and small lift/shape variants failed complete context. Last5° index release bump also fails. Final native stills viewed.'))
r['p299Held']={}
for name,data,patch in [('baseline',b,'RIndex'),('candidate',c,'RPinky')]:
 rows=[row for row in data['rows']if any(n['id']=='p00299'for n in row['active'])];r['p299Held'][name]=dict(states=len(rows),activeFingerCoreMm=max([h['depth']for row in rows for h in row['keyHits']if h['patch']==patch]+[0]),padGapMaxMm=max(abs(h['gap'])for row in rows for h in row['contacts']if h['id']=='p00299'))
paths=['candidate.mjs','candidate-native.ts','candidate-score.json','candidate-extension.js','audit-baseline-final.json','audit-candidate-final.json','native-parity.json'];r['sha256']={n:sha(P/n)for n in paths};r['inputSha256']={n:sha(B/n)for n in ['score-v11.json','pianist-candidate-baked.mjs']}
(P/'handoff.json').write_text(json.dumps(r,indent=2));(P/'rejected-score-delta.json').write_text(json.dumps(delta,indent=2));(P/'per-key-final.json').write_text(json.dumps(dict(comparison=r['perPatchKey'],regressions=bad),indent=2))
assert outsideExact and lateExact and r['nativeParity']['exact'] and preserved and all(nonnotes.values()) and len(delta)==2 and bad
print(json.dumps(dict(status=r['status'],samples=r['surfaceSamples'],regressions=bad,sha256=r['sha256']),indent=2))
