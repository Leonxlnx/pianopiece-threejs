from pathlib import Path
P=Path(__file__).parent
for kind in ['mjs','ts']:
 if kind=='mjs':s=(P/'ring15.mjs').read_text()
 else:
  s=(P/'candidate-native.ts').read_text().replace('if(time<=64.184354||time>=67.016236)return;','if(time<=65.9||time>=67.016236)return;')
  old="if(fi===1&&previous.id==='p00285'&&next.id==='p00302'){const since=time-previous.time-previous.duration;amount=10*p299Ease((time-65.9)/.13)*p299Ease((next.time-time)/.30)+5*p299Ease(since/.025)*(1-p299Ease((since-.05)/.10));}"
  new="if(fi===1&&previous.id==='p00285'&&next.id==='p00302')amount=10*p299Ease((time-65.9)/.13)*p299Ease((next.time-time)/.27);"
  assert s.count(old)==1;s=s.replace(old,new)
 if kind=='mjs':
  old='if (next)\n                        weight = Math.min(weight, envelope(contactPose(next, start)));'
 else:old='if(next)weight=Math.min(weight,envelope(contactPose(next,start)));'
 # The scalar is the measured original next-contact envelope. It is an authored
 # guard for the actual new p285→p302 interval, never a fictional note anchor.
 new='''if(next){let nextEnvelope=envelope(contactPose(next,start));
 if(hand.side==='R'&&fi===1&&previous?.id==='p00285'&&next.id==='p00302'&&Math.abs(end-64.184354)<1e-7&&Math.abs(start-67.016236)<1e-7){nextEnvelope=mix(.14897594070608658,nextEnvelope,smooth((time-65.7)/.2));}
 weight=Math.min(weight,nextEnvelope);}'''
 assert s.count(old)==1;s=s.replace(old,new)
 (P/('guard.mjs'if kind=='mjs'else'guard-native.ts')).write_text(s)
