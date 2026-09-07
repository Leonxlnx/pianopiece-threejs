import assert from 'node:assert/strict';
export function assertFiniteMotionRow(row){
 assert.equal(row.fingers.length,4,'Expected four measured nonthumb digits');
 assert.equal(row.bones.length,5,'Expected all five digit chains');
 assert.equal(row.quaternions.length,5,'Expected all five digit rotations');
 assert.ok(row.tipSpeeds.length===0||row.tipSpeeds.length===5,'Expected zero or all five measured digit speeds');
 for(const chain of row.bones){assert.equal(chain.length,4);for(const xyz of chain)assert.equal(xyz.length,3);}
 for(const chain of row.quaternions){assert.equal(chain.length,3);for(const xyzw of chain)assert.equal(xyzw.length,4);}
 const values=[row.time,row.wristSpeed,row.wristAccel,...row.tipSpeeds,...row.fingers.flatMap(f=>[f.dorsal,f.backwardMm,f.pip]),...row.bones.flat(2),...row.quaternions.flat(2)];
 assert.ok(values.every(Number.isFinite),`Nonfinite motion input at ${row.id}, ${row.hand}, ${row.time}`);
}
export function assertFiniteMotionSummary(report){
 for(const key of ['samples','maxTipSpeed','maxWristSpeed','maxWristAcceleration','maxDorsal','maxBackwardMm'])assert.ok(Number.isFinite(report[key]),`Nonfinite motion summary ${key}`);
 assert.ok(report.samples>0,'No motion samples');
}
