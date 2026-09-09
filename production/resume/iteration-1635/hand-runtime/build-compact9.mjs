import fs from 'node:fs';import ts from 'typescript';
let s=fs.readFileSync('pianist-arms-compact5.ts','utf8');
const old='touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002),z)';
s=s.replace(old,"touch=v3(keyX(note.midi),(hand.side==='R'&&prev?.id==='p00194'&&nxt?.id==='p00197'&&note.id==='p00197'&&time>=45.01123&&time<=45.388676?piano.contact(note.midi,z).y:keySurfaceY(note.midi,z,1))+(note.contactLift??.002),z)");
const marker="rotations[0].premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,(hand.side==='L'?1:-1)*0.5*arch,'XYZ')));";
s=s.replace(marker,marker+"\n if(hand.side==='R'&&previous?.id==='p00194'&&next?.id==='p00197'&&time>45.01123&&time<45.10){const angle=-.20*(time<45.031?smooth((time-45.01123)/(45.031-45.01123)):time<=45.071?1:1-smooth((time-45.071)/(.029)));rotations[0].premultiply(new THREE.Quaternion().setFromAxisAngle(v3(0,0,1),angle));}\n");
fs.writeFileSync('pianist-arms-compact9.ts',s);let js=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;for(const m of ['math','piano','wrist-motion','ponytail-motion'])js=js.replaceAll(`'./${m}'`,`'/workspace/sites/daybreak-piano-film/production/qa/compiled/${m}.mjs'`);fs.writeFileSync('pianist-arms-compact9.mjs',js);
