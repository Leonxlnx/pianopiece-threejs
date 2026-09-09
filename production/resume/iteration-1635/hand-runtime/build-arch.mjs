import fs from 'node:fs';import ts from 'typescript';
for(const [name,spread] of [['compact3',.50],['compact4',.65]]){
 let s=fs.readFileSync('pianist-compact.ts','utf8');
 const marker=' finger.bones.forEach((bone,j)=>{bone.quaternion.copy(rotations[j]);bone.updateWorldMatrix(false,true);});';
 const added=` const wave=(u:number)=>Math.pow(Math.sin(clamp(u)*Math.PI),2);
 const arch=previous&&next&&gap<.50?wave((time-end)/gap):Math.max(previous?wave((time-end)/.22):0,next?wave((start-time)/.30):0);
 rotations[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,(hand.side==='L'?1:-1)*${spread}*arch,'XYZ')));
`;
 if(!s.includes(marker))throw Error('marker');s=s.replace(marker,added+marker);fs.writeFileSync(`pianist-${name}.ts`,s);
 let js=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 for(const m of ['math','piano','wrist-motion','ponytail-motion'])js=js.replaceAll(`'./${m}'`,`'/workspace/sites/daybreak-piano-film/production/qa/compiled/${m}.mjs'`);
 fs.writeFileSync(`pianist-${name}.mjs`,js);
}
