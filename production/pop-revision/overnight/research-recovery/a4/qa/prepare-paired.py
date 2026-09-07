from pathlib import Path
import json,math,itertools
r=Path('paired-approach');r.mkdir(exist_ok=True);base=json.loads(Path('release-twelve/score.json').read_text());s=json.loads(Path('approach-waypoint/midrolln/score.json').read_text());n=next(n for n in s['notes'] if n['id']=='db00518');nxt=next(n for n in s['notes'] if n['id']=='db00523');start=n['time']+n['duration'];end=nxt['time'];windows=[{'id':'db00518-db00523-and-db00522','hand':'R','finger':2,'start':start,'end':end}]
times=[]
a=start-.025;b=end+.025
for i in range(math.ceil((b-a)*240)+1):times.append(min(a+i/240,b))
for n in [x for x in s['notes'] if x['id'] in ['db00518','db00522','db00523']]:times.extend([n['time']-1e-5,n['time'],n['time']+1e-5,n['time']+n['duration']-1e-5,n['time']+n['duration'],n['time']+n['duration']+1e-5])
times=sorted(set(t for t in times if a<=t<=b));quick=sorted(set([min(a+i/120,b) for i in range(math.ceil((b-a)*120)+1)]+[start,end]))
for name,score,compiled in [('baseline',base,'../../inventory/integrated/compiled'),('candidate',s,'../../approach-waypoint/compiled')]:
 p=r/name;p.mkdir(exist_ok=True);(p/'score.json').write_text(json.dumps(score,indent=2)+'\n');(p/'compiled').symlink_to(compiled)
for file,data in [('windows.json',windows),('times.json',times),('quick-times.json',quick)]: (r/file).write_text(json.dumps(data,indent=2)+'\n')
controls=[{'enabled':True,'height':h,'x':x,'z':z,'liftEnd':.2,'landStart':.9,'roll':0,'duration':d} for d,h,x,z in itertools.product([.5,.6],[.78,.79],[-.025,-.04],[-.02,0])]
(r/'grid-controls.json').write_text(json.dumps(controls,indent=2)+'\n')
print('Whole indexgap',start,end,end-start,'full240surface times',len(times),'discovery120times',len(quick),'profiles',len(controls))
