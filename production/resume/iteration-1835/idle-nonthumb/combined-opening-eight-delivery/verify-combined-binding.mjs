import fs from 'node:fs';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const [score,base,data,helper,manifestPath]=process.argv.slice(2);if(!manifestPath)throw Error('Usage: node verify-combined-binding.mjs SCORE_JSON BASE_TS DATA_JSON HELPER_TS MANIFEST_JSON');
const m=JSON.parse(fs.readFileSync(manifestPath,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const [label,path,want]of [['score',score,m.scoreSha256],['base source',base,m.finalRigSource.sha256],['curve data',data,m.dataSha256],['helper source',helper,m.helperSha256]])if(sha(path)!==want)throw Error('Bound '+label+' SHA-256 mismatch; requalification required.');
const r=spawnSync(process.execPath,[fileURLToPath(new URL('./verify-idle-binding-with-blend.mjs',import.meta.url)),score,data,base,manifestPath],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||r.stdout);process.stdout.write(r.stdout);
