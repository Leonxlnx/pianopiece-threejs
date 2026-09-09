import fs from 'node:fs';
const root=new URL('./',import.meta.url),a=JSON.parse(fs.readFileSync(new URL('anchor.json',root)));
const helper=`
// Keep the already reviewed curved release posture during this long thumb rest.
// The wrist carries the hand while all three local joints retain their relation.
const climaxRightThumbRest=${JSON.stringify(a.q)};
function relaxedClimaxThumb(player:OriginalPianist,time:number){
 if(time<=159.5||time>=163.525895)return;
 const hand=player.hands[1],ns=hand.fingerNotes[0];
 const previous=ns.filter(n=>n.time+n.duration<=time).at(-1),next=ns.find(n=>n.time>=time);
 if(previous?.id!=='p00721'||next?.id!=='p00750'||Math.abs(previous.time+previous.duration-159.38365)>1e-7||Math.abs(next.time-163.825895)>1e-7)return;
 const w=smooth((time-159.5)/.16)*(1-smooth((time-163.225895)/.30));
 hand.fingers[0].bones.forEach((b,j)=>{b.quaternion.slerp(new THREE.Quaternion().fromArray(climaxRightThumbRest[j]),w);b.updateWorldMatrix(false,true);});
}
`;
fs.writeFileSync(new URL('helper.ts',root),helper);
const module=`import * as THREE from 'three';import {Pianist as Base} from '../climax-nonthumb-continuity/supported.mjs';const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};${helper.replaceAll(':OriginalPianist','').replaceAll(':number','')}\nexport class Pianist extends Base {update(...args){super.update(...args);relaxedClimaxThumb(this,args[0]);}}`;
fs.writeFileSync(new URL('candidate.mjs',root),module);
