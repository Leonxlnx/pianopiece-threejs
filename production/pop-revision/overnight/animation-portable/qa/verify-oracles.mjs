import fs from 'node:fs';
import assert from 'node:assert/strict';
import {assertFiniteMotionRow,assertFiniteMotionSummary} from './motion-validity.mjs';
import {expectedReleaseWindows,expectedShortGapWindows,assertCoverage} from './coverage.mjs';
const score=JSON.parse(fs.readFileSync('release-seven/score.json'));
const sevenWindows=JSON.parse(fs.readFileSync('release-seven/windows.json')),sevenTimes=JSON.parse(fs.readFileSync('release-seven/times.json'));
const shortWindows=JSON.parse(fs.readFileSync('short-gap/windows.json')),shortTimes=JSON.parse(fs.readFileSync('short-gap/times.json'));
const seven=expectedReleaseWindows(score,['db00404','db00094','db00399','db00734','db00915','db00994','db00986']);
const short=expectedShortGapWindows(score,[['db00493','db00494'],['db00757','db00760']]);
assertCoverage(seven,sevenWindows,sevenTimes);assertCoverage(short,shortWindows,shortTimes);
let rejected=0;
for(const [windows,times,expected]of [[sevenWindows,sevenTimes,seven],[shortWindows,shortTimes,short]]){
 for(const altered of [times.slice(1),[...times.slice(0,-1),NaN],[...times.slice(0,-1),Infinity],times.toReversed()]){assert.throws(()=>assertCoverage(expected,windows,altered));rejected++;}
 const shifted=structuredClone(windows);shifted[0].start+=1/240;assert.throws(()=>assertCoverage(expected,shifted,times));rejected++;
 const narrowed=structuredClone(windows);narrowed[0].end-=1/240;assert.throws(()=>assertCoverage(expected,narrowed,times));rejected++;
}
const row={id:'finite-control',hand:'R',time:0,wristSpeed:0,wristAccel:0,tipSpeeds:[0,0,0,0,0],fingers:Array.from({length:4},()=>({dorsal:0,backwardMm:0,pip:0})),bones:Array.from({length:5},()=>Array.from({length:4},()=>[0,0,0])),quaternions:Array.from({length:5},()=>Array.from({length:3},()=>[0,0,0,1]))};
assertFiniteMotionRow(row);
for(const value of [NaN,Infinity,-Infinity]){
 for(const key of ['time','wristSpeed','wristAccel']){const altered=structuredClone(row);altered[key]=value;assert.throws(()=>assertFiniteMotionRow(altered));rejected++;}
 for(const alter of [r=>r.tipSpeeds[0]=value,r=>r.fingers[0].dorsal=value,r=>r.fingers[0].backwardMm=value,r=>r.fingers[0].pip=value,r=>r.bones[0][0][0]=value,r=>r.quaternions[0][0][0]=value]){const altered=structuredClone(row);alter(altered);assert.throws(()=>assertFiniteMotionRow(altered));rejected++;}
 const summary={samples:1,maxTipSpeed:0,maxWristSpeed:0,maxWristAcceleration:0,maxDorsal:0,maxBackwardMm:0};
 for(const key of Object.keys(summary)){const altered={...summary,[key]:value};assert.throws(()=>assertFiniteMotionSummary(altered));rejected++;}
}
console.log(JSON.stringify({passed:true,rejected,sevenCoverage:assertCoverage(seven,sevenWindows,sevenTimes),shortCoverage:assertCoverage(short,shortWindows,shortTimes)}));
console.log('QA_ORACLE_CONTROLS_PASS');
