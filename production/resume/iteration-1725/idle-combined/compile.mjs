import fs from 'node:fs';
import ts from '/workspace/sites/daybreak-piano-film/node_modules/typescript/lib/typescript.js';
const source=fs.readFileSync('../idle-nonthumb/e5-neutral-local-delivery/idle-nonthumb-with-blend.ts','utf8');
const data=JSON.parse(fs.readFileSync('candidate-data.json'));
fs.writeFileSync('idle-nonthumb-data.mjs','export const idleNonthumbData='+JSON.stringify(data)+';\n');
let result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
result=result.replace("'./piano'","'/workspace/sites/daybreak-piano-film/production/qa/compiled/piano.mjs'").replace("'./idle-nonthumb-data'","'./idle-nonthumb-data.mjs'");
fs.writeFileSync('idle-nonthumb.mjs',result);
