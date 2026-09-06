import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),project=path.resolve(process.argv[2]??path.join(root,'../../..'));
const req=createRequire(path.join(project,'package.json')),ts=req('typescript');
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const scoreText=fs.readFileSync(path.join(project,'public/assets/score.json'),'utf8'),score=JSON.parse(scoreText);
function scoreInputs(s){return {duration:s.duration,bpm:s.bpm,sections:s.sections.map(({start,end,energy})=>({start,end,energy})),harmony:s.harmony.map(({time,duration})=>({time,duration})),notes:s.notes.map(({time,midi,velocity,role,hand})=>({time,midi,velocity,role,hand}))};}
function headBody(source){
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,removeComments:true}}).outputText;
 const file=ts.createSourceFile('pianist.js',compiled,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 const cls=file.statements.find(node=>ts.isClassDeclaration(node)&&node.name?.text==='Pianist');
 const method=cls.members.find(node=>node.name?.getText(file)==='posture');
 const statements=[];for(const statement of method.body.statements){statements.push(statement);if(statement.getText(file).replace(/\s/g,'')==='this.model.updateMatrixWorld(true);')break;}
 if(statements.length===method.body.statements.length)throw Error('Could not isolate the head-transform portion of posture');
 return ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,ts.factory.createBlock(statements,true),file);
}
const source=fs.readFileSync(path.join(project,'app/performance/pianist.ts'),'utf8');
const bakeSource=fs.readFileSync(path.join(root,'compiled/pianist.mjs'),'utf8');
const signature={scoreInputs:hash(scoreInputs(score)),headTransformSource:hash(headBody(source))};
const baselinePath=path.join(root,'posture-input-signature.json');
if(!fs.existsSync(baselinePath)){
 const bakeReport=JSON.parse(fs.readFileSync(path.join(root,'candidate-report.json'),'utf8'));
 assert.equal(hash(scoreText),bakeReport.scoreSha256,'Record the signature while the original baked score is still available');
 assert.equal(signature.headTransformSource,hash(headBody(bakeSource)),'Current head-transform code differs from the baked code');
 fs.writeFileSync(baselinePath,JSON.stringify({signature,bakedFullScoreSha256:bakeReport.scoreSha256,fields:'score duration/bpm; sections start/end/energy; harmony time/duration; notes time/midi/velocity/role/hand; head-transform source through its first world-matrix update',excluded:'fingers, lift/release, wrist curves, pedal events, eye morph values and hair-helper calls do not drive the sampled head/root transform'},null,2));
}
const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
const changed=structuredClone(score);changed.notes[0].finger=5;changed.notes[0].release=99;changed.notes[0].lift=1;changed.wristMotion={unrelated:true};
assert.equal(hash(scoreInputs(changed)),signature.scoreInputs);
changed.notes[0].time+=.01;assert.notEqual(hash(scoreInputs(changed)),signature.scoreInputs);
const result={matchesBakedFunctionalInputs:signature.scoreInputs===baseline.signature.scoreInputs&&signature.headTransformSource===baseline.signature.headTransformSource,currentFullScoreSha256:hash(scoreText),fullScoreChanged:hash(scoreText)!==baseline.bakedFullScoreSha256,signature,scope:'This check covers score fields and posture code driving head transforms. Recheck separately if the model placement, keyX mapping, shared math helpers or head/neck rig change.'};
fs.writeFileSync(path.join(root,'posture-input-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.matchesBakedFunctionalInputs)process.exitCode=1;
