import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read('hashes.json');for(const [p,h]of Object.entries(manifest))assert.equal(sha(p),h,p);
const metrics=read('metrics-report.json');assert.equal(metrics.rows.length,12);assert.equal(metrics.mixedVertices,348);assert.deepEqual(metrics.times,[38.85258,188.70254,233.144228]);
for(const row of metrics.rows){assert.equal(row.maxElbowShiftMm,0);assert.ok(row.maxWristShiftMm<.000033);assert.ok(row.maxHandWorldRotationRad<6.7e-8);assert.ok(row.maxContactDeltaMm<.000024);}
const depths=Object.values(read('upper-depth-report.json').versions);assert.equal(depths.length,4);for(const v of depths){assert.equal(v.rows.length,3);for(const row of v.rows)for(const s of row.surfaces)assert.equal(s.maximumDepthMm,0);}
const evidence=read('evidence-manifest.json');assert.equal(evidence.renders.length,8);let frames=0;
for(const r of evidence.renders){assert.equal(sha(r.report),r.reportSha256);assert.equal(r.frames.length,3);for(const f of r.frames){assert.equal(f.glError,'GL_NO_ERROR');assert.equal(sha(f.image),f.sha256);frames++;}}
assert.equal(frames,24);assert.match(fs.readFileSync('HANDOFF.md','utf8'),/Reject all three/);assert.equal(fs.readdirSync('.').filter(p=>p.endsWith('.patch')).length,0);
console.log('PASS: 3 rejected variants; 12 measured rows; 24 exact rendered frames; zero GL errors; accepted 22e2 preserved.');
