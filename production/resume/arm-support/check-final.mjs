import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),read=f=>JSON.parse(fs.readFileSync(path.join(dir,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex'),source=sha('candidate-final/pianist.ts');
for(const f of ['final-motion-report.json','final-continuity-report.json']){const r=read(f);if(!r.passed||r.sourceSha256!==source)throw Error(f);}
const d=read('final-depth-sweep-report.json').versions['candidate-final'];if(d.sourceSha256!==source||d.rows.length!==2196||d.rows.some(r=>r.surfaces.some(s=>s.maximumDepthMm>2)))throw Error('Depth gate');
const c=read('candidate-final-clearance.json');if(c.sourceSha256!==source||c.rows.length!==20||c.rows.some(r=>r.surfaces.some(s=>s.name.includes('forearm')&&s.trianglePairs)))throw Error('Forearm gate');
for(const [f,hash]of Object.entries(read('final-hashes.json').files))if(sha(f)!==hash)throw Error('Hash mismatch '+f);
console.log('PASS final: motion, continuity, exposed-upper depth, forearm surfaces and exact hashes');
