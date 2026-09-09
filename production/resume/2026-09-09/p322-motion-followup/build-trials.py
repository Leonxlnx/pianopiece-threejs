import pathlib,json,re
p=pathlib.Path('.').resolve();b=p.parent/'bass-contact'/'delivery-p322';src=(b/'p322-candidate.ts').read_text();score=json.loads((b/'p322-score.json').read_text());curves=json.loads((b/'p322-curves.json').read_text());n=next(n for n in score['notes']if n['id']=='p00322');oldEnd=n['time']+n['duration'];oldGap=curves[-1]['nextTime']-oldEnd;variants=[]
for delta in [0,.01,.02,.03]:
 for mode in (['reference']if delta==0 else ['scaled','fixed']):
  name='reference'if delta==0 else f'early{round(delta*1000):03d}-{mode}';s=json.loads(json.dumps(score));note=next(n for n in s['notes']if n['id']=='p00322');note['duration']-=delta;end=note['time']+note['duration'];cs=json.loads(json.dumps(curves));c=cs[-1];c['previousEnd']=end;scale=(c['nextTime']-end)/oldGap if mode=='scaled'else 1
  c['knots']=[[end+(k[0]-oldEnd)*scale,*k[1:]]for k in c['knots']]
  text=src.replace('"duration":0.269968','"duration":'+repr(note['duration']));text=re.sub(r'idleNonthumbData\.curves\.push\(\.\.\..*\);',lambda _: 'idleNonthumbData.curves.push(...'+json.dumps(cs,separators=(',',':'))+');',text,count=1)
  (p/(name+'.ts')).write_text(text);(p/(name+'-score.json')).write_text(json.dumps(s,separators=(',',':')));variants.append({'name':name,'delta':delta,'mode':mode,'duration':note['duration'],'noteOff':end,'arrival':c['nextTime'],'curve':c})
(p/'trials.json').write_text(json.dumps(variants,indent=2));print([(x['name'],x['noteOff'],x['curve']['knots'][1][0])for x in variants])
