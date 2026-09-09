import fs from 'node:fs';import ts from 'typescript';
let s=fs.readFileSync('pianist-arms-compact5.ts','utf8');
const old="const idlePose=finger.rest.map(q=>q.clone());\n idlePose[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.85,hand.side==='L'?-.30:.30,hand.side==='L'?.30:-.30,'XYZ')));";
const replacement=old+"\n if(hand.side==='R'&&time>=6.0390358363389325&&time<=12.392821){const weight=smooth((time-6.0390358363389325)/.10)*(1-smooth((time-11.85)/.54)),neutral=localPose(wp(hand.wrist),pose.q,v3(keyX(62),.757,.267));idlePose.forEach((q,j)=>q.slerp(neutral[j],weight));}";
if(!s.includes(old))throw Error('neutral marker missing');s=s.replace(old,replacement);fs.writeFileSync('pianist-arms-compact12.ts',s);
let js=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;for(const m of ['math','piano','wrist-motion','ponytail-motion'])js=js.replaceAll(`'./${m}'`,`'/workspace/sites/daybreak-piano-film/production/qa/compiled/${m}.mjs'`);fs.writeFileSync('pianist-arms-compact12.mjs',js);
