import fs from 'node:fs';
import crypto from 'node:crypto';
const [scorePath,dataPath,rigPath,manifestPath]=process.argv.slice(2);
if(!scorePath||!dataPath)throw Error('Usage: node verify-idle-binding.mjs SCORE_JSON DATA_JSON [RIG_TS INPUT_MANIFEST_JSON]');
const bytes=fs.readFileSync(scorePath),score=JSON.parse(bytes),data=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(sha(bytes)!==data.sourceScoreSha256)throw Error('Stale idle calibration: exact score SHA-256 mismatch; rerun full affected-gap validation before rebinding.');
if(rigPath||manifestPath){if(!rigPath||!manifestPath)throw Error('Both rig and manifest paths are required');const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));if(sha(fs.readFileSync(rigPath))!==manifest.finalRigSource.sha256)throw Error('Stale idle calibration: exact rig SHA-256 mismatch');}
let checked=0;for(const c of [...data.supportedIndexGaps,...data.curves]){const side=c.hi===0?'L':'R';if(![0,1].includes(c.hi)||![1,2,3,4].includes(c.fi))throw Error('Out-of-scope hand/finger');const previous=c.previous?score.notes.find(n=>n.id===c.previous):undefined,next=c.next?score.notes.find(n=>n.id===c.next):undefined;if(c.previous&&!previous||c.next&&!next)throw Error('Missing gap anchor');for(const n of [previous,next].filter(Boolean))if(n.hand!==side||n.finger!==c.fi+1)throw Error('Anchor hand/finger changed');if(Math.abs((previous?previous.time+previous.duration:0)-c.previousEnd)>1e-7||Math.abs((next?next.time:score.duration)-c.nextTime)>1e-7)throw Error('Anchor timing changed');if(score.notes.some(n=>n.hand===side&&n.finger===c.fi+1&&n.time<c.nextTime-1e-7&&n.time+n.duration>c.previousEnd+1e-7))throw Error('Held note inside calibrated idle gap');if(c.knots){for(let i=0;i<c.knots.length;i++){const k=c.knots[i];if(k.length!==5||k.some(x=>!Number.isFinite(x))||k[0]<c.previousEnd-1e-7||k[0]>c.nextTime+1e-7||i&&k[0]<=c.knots[i-1][0])throw Error('Invalid curve knot');}if(c.knots[0].slice(1).some(Boolean)||c.knots.at(-1).slice(1).some(Boolean))throw Error('Curve changes an endpoint anchor');}checked++;}
for(const c of data.curves){
 if(c.mode&&!['hermite-controls','blend-neutral'].includes(c.mode))throw Error('Unsupported curve mode');
 if(!Array.isArray(c.knots)||c.knots.length<2)throw Error('Missing curve knots');
 if(c.mode==='blend-neutral'){
  if(!Array.isArray(c.neutralQuaternions)||c.neutralQuaternions.length!==3||c.neutralQuaternions.some(q=>!Array.isArray(q)||q.length!==4||q.some(x=>!Number.isFinite(x))||Math.abs(Math.hypot(...q)-1)>1e-6))throw Error('Invalid bound neutral quaternion triple');
  if(c.knots.some(k=>k[1]<0||k[1]>1||k.slice(2).some(Boolean)))throw Error('Invalid neutral blend alpha');
 }
}
console.log(JSON.stringify({scoreSha256:sha(bytes),checkedGapBindings:checked,pass:true}));
