import json,pathlib,gzip,hashlib,difflib,shutil,collections
p=pathlib.Path(__file__).parent.resolve();read=lambda n:json.load(open(p/n));gz=lambda n:json.load(gzip.open(p/n));b=read('pose-supported.json');c=read('pose-after.json');n=read('pose-native.json');curves=read('endpoint-data.json')['curves']
r={'states':c['states'],'finiteValuesChecked':c['values'],'nonfinite':c['nonfinite'],'nativeModuleExact':c==n,'outsideStates':0,'outsideExact':0,'allWristExact':True,'allOtherFingersExact':True,'heldAndClean159_3and159_5Exact':True}
for a,z in zip(b['rows'],c['rows']):
 t=a['time']
 for ah,zh in zip(a['hands'],z['hands']):
  inside=any(x['side']==ah['side'] and x['knots'][0]['time']<=t<=x['knots'][-1]['time'] for x in curves)
  if not inside:r['outsideStates']+=1;r['outsideExact']+=ah==zh
  r['allWristExact']&=ah['wrist']==zh['wrist'];r['allOtherFingersExact']&=ah['fingers'][1:]==zh['fingers'][1:]
  if t in [159.3,159.5]:r['heldAndClean159_3and159_5Exact']&=ah==zh
(p/'pose-check-summary.json').write_text(json.dumps(r,indent=2));print(r)
old=read('../../final-motion-review/delivery-score.json');new=read('input.json');deltas=[]
def diff(a,b,path=''):
 if type(a)!=type(b) and not isinstance(a,(float,int)) and not isinstance(b,(float,int)):deltas.append({'path':path,'before':a,'after':b});return
 if isinstance(a,dict) and isinstance(b,dict):
  for k in a.keys()|b.keys():
   if k not in a or k not in b:deltas.append({'path':path+'/'+k,'before':a.get(k),'after':b.get(k)})
   else:diff(a[k],b[k],path+'/'+k)
 elif isinstance(a,list) and isinstance(b,list) and len(a)==len(b):
  for i,(x,y)in enumerate(zip(a,b)):diff(x,y,path+'/'+str(i))
 elif a!=b:deltas.append({'path':path,'before':a,'after':b})
diff(old,new);(p/'score-deltas-vs-original.json').write_text(json.dumps(deltas,indent=2))
(p/'source-vs-supported.patch').write_text(''.join(difflib.unified_diff((p/'input.ts').read_text().splitlines(True),(p/'candidate.ts').read_text().splitlines(True),fromfile='supported.ts',tofile='candidate.ts')))
(p/'source-vs-original.patch').write_text(''.join(difflib.unified_diff((p/'../../final-motion-review/delivery-pianist.ts').read_text().splitlines(True),(p/'candidate.ts').read_text().splitlines(True),fromfile='delivery-pianist.ts',tofile='candidate.ts')))
sha=lambda f:hashlib.sha256((p/f).read_bytes()).hexdigest();names=['input.ts','input-original.mjs','input.json','candidate.ts','candidate.mjs','continuity-helper.ts','endpoint-data.json','source-vs-supported.patch','source-vs-original.patch','score-deltas-vs-original.json'];hashes={f:sha(f)for f in names}
a= gz('audit-after.json.gz');s=gz('audit-supported.json.gz');original=gz('audit-original.json.gz');motion=[]
for side,lo,hi in [('L',159.08,159.13),('R',159.1,159.15),('L',159.42,159.47)]:
 mr={'side':side,'start':lo,'end':hi}
 for label,obj in [('supported',s),('combined',a),('original',original)]:
  rows=[x for x in obj['motionRows'] if x['side']==side and lo<=x['time']<=hi];mr[label]={'jointMaxima':[{'radps':max(rows,key=lambda x:x['joints'][j])['joints'][j],'time':max(rows,key=lambda x:x['joints'][j])['time']}for j in range(3)],'tipMax':max(rows,key=lambda x:x['tip'])}
 motion.append(mr)
summary={'status':'PARENT_REVIEW_PENDING','hashes':hashes,'scoreDeltaFromSupported':[],'wristDeltaFromSupported':[],'curves':curves,'motionWindows':motion,'motionFullLocal':{'supported':s['motion'],'combined':a['motion'],'original':original['motion']},'poseCheck':r,'vsSupported':read('vs-supported-summary.json'),'vsOriginal':read('vs-original-summary.json'),'nativeSnapshot':'0719b3ea9426d2eb'}
(p/'delta.json').write_text(json.dumps(summary,indent=2))
# Preserve exact final native images, independent of shared renderer reports.
nd=p/'native';nd.mkdir(exist_ok=True);times=[159.096,159.104,159.115,159.131,159.3,159.4125,159.42,159.444,159.47,159.5]
for t in times:
 name=f'current-1280-{t:.6f}.png';shutil.copy2(p/'../../render-recovery/reviews/0719b3ea9426d2eb'/name,nd/name)
html=['<!doctype html><meta charset="utf-8"><title>Combined climax review</title><style>body{font:16px system-ui;background:#171717;color:#eee;margin:28px}main{display:grid;grid-template-columns:1fr 1fr;gap:18px}img{width:100%}p{max-width:100ch}</style><h1>Combined climax candidate — parent review pending</h1><p>Supported wrist/nonthumb correction plus three fixed thumb intervals. See README.md and delta.json for measured residual contacts. Original comparison retains75 increased core rows over3mm and148 pair increases; these images are not a claim that every approach collision is resolved.</p><main>']
for t in times:html.append(f'<figure><figcaption>{t:.6f} seconds</figcaption><img src="native/current-1280-{t:.6f}.png"></figure>')
html.append('</main>');(p/'review.html').write_text('\n'.join(html))
print(json.dumps(hashes,indent=2))
