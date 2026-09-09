import fs from 'node:fs';
import * as T from '/workspace/sites/daybreak-piano-film/node_modules/three/build/three.module.js';
import {GrandPiano} from '/workspace/scratch/2e8cc8e77f98/render-recovery/snapshots/9bd9f3f70702fcb5/production/qa/compiled/piano.mjs';
const ctx=new Proxy({},{get:()=>()=>{}});globalThis.document={createElement:()=>({width:512,height:96,getContext:()=>ctx})};
const piano=new GrandPiano();piano.group.updateMatrixWorld(true);const webs=[],strings=[];
piano.group.traverse(o=>{if(!o.geometry)return;const pos=o.geometry.attributes.position;for(const part of o.userData.sourceParts??[]){if(!part.name.startsWith('Connected cast plate web'))continue;let lo=Infinity,hi=-Infinity;for(let i=part.vertexStart;i<part.vertexStart+part.vertexCount;i++){const v=new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);lo=Math.min(lo,v.y);hi=Math.max(hi,v.y);}webs.push({name:part.name,vertices:part.vertexCount,minY:lo,maxY:hi});}
if(['Individual steel strings','Copper-wound bass strings'].includes(o.name)){let lo=Infinity;for(let i=0;i<pos.count;i++)lo=Math.min(lo,new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).y);strings.push({name:o.name,minY:lo});}});
if(webs.length!==4||strings.length!==2)throw Error('Missing measured parts');
const minimumStringClearanceMm=1000*(Math.min(...strings.map(s=>s.minY))-Math.max(...webs.map(w=>w.maxY))),minimumSoundboardClearanceMm=1000*(Math.min(...webs.map(w=>w.minY))-.820);
if(minimumStringClearanceMm<4||minimumSoundboardClearanceMm<4)throw Error('Vertical collision margin failed');
const report={webs,strings,minimumStringClearanceMm,minimumSoundboardClearanceMm,scope:'Actual extruded web and string vertex height bounds. Linear triangle interiors cannot exceed vertex extrema. Soundboard top includes its6mmbevel. Global vertical separation, not a brand-specific instrument measurement.'};fs.writeFileSync('web-clearance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
