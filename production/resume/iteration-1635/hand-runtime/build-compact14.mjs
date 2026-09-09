import fs from 'node:fs';import ts from 'typescript';let s=fs.readFileSync('pianist-arms-compact12.ts','utf8');
const old='touch=v3(keyX(note.midi),keySurfaceY(note.midi,z,1)+(note.contactLift??.002),z)';
if(!s.includes(old))throw Error('contact marker missing');
s=s.replace(old,"touch=v3(keyX(note.midi),(hand.side==='R'&&time>=6.0390358363389325&&time<=12.392821?piano.contact(note.midi,z).y:keySurfaceY(note.midi,z,1))+(note.contactLift??.002),z)");
fs.writeFileSync('pianist-arms-compact14.ts',s);let js=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;for(const m of ['math','piano','wrist-motion','ponytail-motion'])js=js.replaceAll(`'./${m}'`,`'/workspace/sites/daybreak-piano-film/production/qa/compiled/${m}.mjs'`);fs.writeFileSync('pianist-arms-compact14.mjs',js);
