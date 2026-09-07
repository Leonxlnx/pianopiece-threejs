import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
const {values:args}=parseArgs({options:{project:{type:'string'},work:{type:'string'},phase:{type:'string',default:'all'}}});
if(!args.project)throw Error('Pass --project with the existing repository root.');
if(!['all','a4','seven','short-gap'].includes(args.phase))throw Error('Unknown phase.');
const qa=path.dirname(fileURLToPath(import.meta.url)),bundle=path.dirname(qa),project=path.resolve(args.project),work=args.work?path.resolve(args.work):fs.mkdtempSync(path.join(os.tmpdir(),'daybreak-animation-check-'));
if(fs.existsSync(work)&&fs.readdirSync(work).length)throw Error('Work folder must be new or empty; existing evidence is never overwritten.');
fs.mkdirSync(work,{recursive:true});
const listFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isSymbolicLink()?[]:entry.isDirectory()?listFiles(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const manifest=JSON.parse(fs.readFileSync(path.join(bundle,'manifest.json'))),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if(!manifest.inputsSHA256||Object.keys(manifest.inputsSHA256).length<20)throw Error('Missing complete support-input manifest');
const bundledFiles=listFiles(bundle).map(file=>path.relative(bundle,file).split(path.sep).join('/')).filter(file=>file!=='manifest.json').sort();
if(JSON.stringify(bundledFiles)!==JSON.stringify(Object.keys(manifest.inputsSHA256).sort()))throw Error('Bundle file inventory differs from manifest');
for(const [file,hash]of Object.entries(manifest.inputsSHA256))if(sha(path.join(bundle,file))!==hash)throw Error(`Bundle support input changed: ${file}`);
const bundleBefore=Object.fromEntries(listFiles(bundle).map(file=>[file,sha(file)]));
for(const [file,hash]of [['pianist.ts',manifest.sourceSHA256],['types.ts',manifest.typesSHA256],['score.json',manifest.scoreSHA256],['baseline/score.json',manifest.baselineScoreSHA256]])if(sha(path.join(bundle,file))!==hash)throw Error(`Bundle input changed: ${file}`);
if(sha(path.join(project,'public/assets/pianist.glb'))!==manifest.modelSHA256)throw Error('Restore the original verified model before reproducing this checkpoint.');
if(sha(path.join(project,'package-lock.json'))!==manifest.packageLockSHA256)throw Error('The project lockfile differs from this checkpoint. Review dependencies before re-certifying.');
if(!fs.existsSync(path.join(project,'node_modules','typescript')))throw Error('Install the project locked dependencies first.');
fs.symlinkSync(path.join(project,'node_modules'),path.join(work,'node_modules'),process.platform==='win32'?'junction':'dir');
for(const file of fs.readdirSync(qa)){const src=path.join(qa,file);if(fs.statSync(src).isFile()&&file!=='run.mjs')fs.copyFileSync(src,path.join(work,file));}
const names=['piano','pianist','stage','direction','math','render-settings','wrist-motion','ponytail-motion','hair-motion-data','types'];
for(const variant of ['v7','candidate']){
 const dir=path.join(work,variant,'app','performance');fs.mkdirSync(dir,{recursive:true});
 for(const name of names)fs.copyFileSync(path.join(project,'app','performance',name+'.ts'),path.join(dir,name+'.ts'));
 const from=variant==='v7'?path.join(bundle,'baseline'):bundle;
 for(const file of ['pianist.ts','types.ts'])fs.copyFileSync(path.join(from,file),path.join(dir,file));
}
const final=JSON.parse(fs.readFileSync(path.join(bundle,'score.json'))),seven=structuredClone(final),a4=structuredClone(final);
const sevenIds=new Set(['db00404','db00094','db00399','db00734','db00915','db00994','db00986']),shortIds=new Set(['db00493','db00757']);
for(const score of [seven,a4])for(const note of score.notes)if(shortIds.has(note.id))delete note.releasePose;
for(const note of a4.notes)if(sevenIds.has(note.id))delete note.releaseWaypoint;
fs.copyFileSync(path.join(bundle,'baseline','score.json'),path.join(work,'v7','score.json'));
fs.writeFileSync(path.join(work,'candidate','score.json'),JSON.stringify(a4,null,2)+'\n');
for(const [variant,score]of [['release-seven',seven],['short-gap',final]]){
 const dir=path.join(work,variant);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'score.json'),JSON.stringify(score,null,2)+'\n');
 for(const file of ['windows.json','times.json'])fs.copyFileSync(path.join(qa,variant,file),path.join(dir,file));
 for(const sub of ['app','compiled'])fs.symlinkSync(path.join(work,'candidate',sub),path.join(dir,sub),process.platform==='win32'?'junction':'dir');
}
const env={...process.env,DAYBREAK_PROJECT:project};
const run=(script,...params)=>execFileSync(process.execPath,[script,...params],{cwd:work,env,stdio:'pipe',maxBuffer:8*1024*1024});
run('compile.cjs','v7');run('compile.cjs','candidate');
run('verify-recovery.mjs');
const immutableFiles=[...listFiles(work),...Object.keys(bundleBefore),path.join(project,'public/assets/pianist.glb'),path.join(project,'package-lock.json')];
const immutableBefore=Object.fromEntries(immutableFiles.map(file=>[file,sha(file)]));
const verifyImmutable=()=>{for(const [file,hash]of Object.entries(immutableBefore))if(sha(file)!==hash)throw Error(`Input changed during reproduction: ${file}`);};
const oracleOutput=run('verify-oracles.mjs').toString();if(!oracleOutput.includes('QA_ORACLE_CONTROLS_PASS'))throw Error('Oracle controls failed');
verifyImmutable();
const checks=[['a4','verify-candidate.mjs','candidate/verification.json','A4_CANDIDATE_PASS'],['seven','verify-seven.mjs','release-seven/verification.json','SEVEN_RELEASES_PASS'],['short-gap','verify-short-gap.mjs','short-gap/verification.json','SHORT_GAP_PASS']];
const reportDir=path.join(work,'portable-reports');fs.mkdirSync(reportDir,{recursive:true});const passed=[];
const portable=value=>typeof value==='string'?value.split(project).join('$PROJECT').split(work).join('$WORK'):Array.isArray(value)?value.map(portable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[portable(k),portable(v)])):value;
for(const [phase,script,report,token]of checks){
 if(args.phase!=='all'&&args.phase!==phase)continue;
 verifyImmutable();const output=run(script).toString();verifyImmutable();if(!output.includes(token))throw Error(`Missing success token for ${phase}.`);
 const result=JSON.parse(fs.readFileSync(path.join(work,report)));if(!result.passed)throw Error(`Failed ${phase}.`);
 fs.writeFileSync(path.join(reportDir,phase+'.json'),JSON.stringify(portable(result),null,2)+'\n');passed.push(phase);console.log(`${token} report=${path.join(reportDir,phase+'.json')}`);
}
fs.writeFileSync(path.join(reportDir,'run.json'),JSON.stringify({passed,project:'$PROJECT',node:process.version,sourceSHA256:manifest.sourceSHA256,scoreSHA256:manifest.scoreSHA256,modelSHA256:manifest.modelSHA256,packageLockSHA256:manifest.packageLockSHA256,inputHashesBefore:portable(immutableBefore),inputHashesUnchangedAfter:true,oracleControlsPassed:true,compilation:'TypeScript transpilation parity only; application typechecking remains a separate production build.',scope:'Finite checkpoint reproduction. Whole-song motion and native visual/film review remain separate.'},null,2)+'\n');
console.log('PORTABLE_ANIMATION_CHECKPOINT_PASS');
