#!/usr/bin/env python3
"""Package the audited scratch candidate; never writes into the checkout."""
import difflib,hashlib,json
from pathlib import Path
r=Path(__file__).resolve().parent;checkout=Path('/workspace/sites/daybreak-piano-film')
score=json.loads((r/'planned-score.json').read_text());raw=json.loads((r/'motion-plan.json').read_text())
motion={'version':1,'hands':[]}
for h in raw:
 knots=[]
 for k in h['plan']:
  row={'time':k['time'],'position':k['pose']['position'],'quaternion':k['pose']['q']}
  for key in ('moveStart','moveEnd'):
   if key in k:row[key]=k[key]
  knots.append(row)
 motion['hands'].append({'side':h['side'],'knots':knots})
(r/'wrist-motion.json').write_text(json.dumps(motion,separators=(',',':'))+'\n')
score['wristMotion']=motion
(r/'score-with-motion.json').write_text(json.dumps(score,separators=(',',':'))+'\n')
patch=[]
for relative in ['app/performance/pianist.ts','app/performance/types.ts']:
 old=(r/('input-source-'+Path(relative).name)).read_text();new=old
 if relative.endswith('/pianist.ts'):
  new=new.replace("import type { Note, Score, Hand, Telemetry } from './types';", "import type { Note, Score, Hand, Telemetry } from './types';\nimport { wristMotionSampler } from './wrist-motion';")
  new=new.replace(' score?:Score;', ' score?:Score;\n wristMotion?:ReturnType<typeof wristMotionSampler>;')
  new=new.replace(' for(const hand of this.hands)this.planHand(hand);', ' if(score.wristMotion)this.wristMotion=wristMotionSampler(score.wristMotion);\n else for(const hand of this.hands)this.planHand(hand);')
  new=new.replace(' plannedPose(hand:HandRig,time:number):HandPose{', ' plannedPose(hand:HandRig,time:number):HandPose{\n if(this.wristMotion)return this.wristMotion(hand.side,time);')
 else:
  new="import type { WristMotionData } from './wrist-motion';\n"+new
  new=new.replace('tempoMap?:{time:number;bpm:number}[]; }','tempoMap?:{time:number;bpm:number}[]; wristMotion?:WristMotionData; }')
 assert new!=old,relative
 patch.extend(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='a/'+relative,tofile='b/'+relative))
new=(r/'wrist-motion.ts').read_text();patch.extend(difflib.unified_diff([],new.splitlines(True),fromfile='/dev/null',tofile='b/app/performance/wrist-motion.ts'))
(r/'integration.patch').write_text(''.join(patch))
files=['planned-score.json','score-with-motion.json','wrist-motion.json','motion-plan.json','wrist-motion.ts','integration.patch','full-rig-audit-calibrated.json','score-gates.json','actual-motion-report.json','skin-calibration.json','finger-release-report.json','audible-comparison.json','runtime-parity.json','full-rig-audit-blended.json']
manifest={'status':'Audited wrist/contact/skin/seek candidate; inactive-finger behavior handled separately.','sourceInputManifest':json.loads((r/'input-manifest.json').read_text()),'files':{name:{'bytes':(r/name).stat().st_size,'sha256':hashlib.sha256((r/name).read_bytes()).hexdigest()} for name in files}}
(r/'candidate-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({name:manifest['files'][name] for name in ['score-with-motion.json','wrist-motion.json']},indent=2))
