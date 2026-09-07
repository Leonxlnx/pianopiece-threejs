import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const dir='fingering-research',variants=process.argv.slice(2).length?process.argv.slice(2):['lift35','lift50','long35','long50'];
const base=JSON.parse(fs.readFileSync(`${dir}/baseline/surfaces.json`)),baseRows=new Map(base.rows.map(r=>[r.time,r]));
const results=fs.existsSync(`${dir}/screen.json`)?JSON.parse(fs.readFileSync(`${dir}/screen.json`)):[];
for(const name of variants){
 const variant=`${dir}/${name}`;
 execFileSync(process.execPath,['inventory-hand-surfaces.mjs','--project','../pianopiece-threejs','--model','/dev/shm/daybreak-a4-882c1c2d8c18/original-pianist.glb','--rig',`${variant}/compiled/pianist.mjs`,'--piano',`${variant}/compiled/piano.mjs`,'--score',`${variant}/score.json`,'--times',`${variant}/times.json`,'--out',`${variant}/surfaces.json`],{stdio:'pipe'});
 execFileSync(process.execPath,['compact-motion-batch.mjs',variant,`${variant}/windows.json`,`${variant}/motion.json`],{stdio:'pipe'});
 const after=JSON.parse(fs.readFileSync(`${variant}/surfaces.json`)),motion=JSON.parse(fs.readFileSync(`${variant}/motion.json`));let severeRegressions=0,pairRegressions=0;const shallowIncreases=[];
 for(const row of after.rows){const before=baseRows.get(row.time),keys=new Map((before?.keyHits??[]).map(h=>[h.patch+':'+h.key,h.maxDepthMm])),pairs=new Map((before?.surfaceHits??[]).map(h=>[h.a+':'+h.b+':'+h.kind,h.trianglePairs]));for(const h of row.keyHits){const old=keys.get(h.patch+':'+h.key)??0;if(h.maxDepthMm>old+1e-8){if(h.maxDepthMm>3)severeRegressions++;else shallowIncreases.push({time:row.time,patch:h.patch,key:h.key,beforeMm:old,afterMm:h.maxDepthMm});}}for(const h of row.surfaceHits)if(h.trianglePairs>(pairs.get(h.a+':'+h.b+':'+h.kind)??0))pairRegressions++;}
 const record={name,before:base.summary,after:after.summary,severeRegressions,pairRegressions,shallowIncreases,motion:{...motion,rows:undefined,failures:motion.failures.map(({bones,quaternions,...rest})=>rest)}};results.push(record);fs.writeFileSync(`${dir}/screen.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({...record,motion:{maxTipSpeed:motion.maxTipSpeed,maxWristAcceleration:motion.maxWristAcceleration,maxDorsal:motion.maxDorsal,failures:motion.failures.length},shallowIncreases:shallowIncreases.length}));
}
