import fs from 'node:fs';
import ts from '/workspace/sites/daybreak-piano-film/node_modules/typescript/lib/typescript.js';
for (const name of ['pianist-combined-thumbs','pianist-candidate-baked','pianist-combined-base']) {
 let code=ts.transpileModule(fs.readFileSync(name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replace(/(from\s+|import\s*)(['"])(\.\/[^'"]+)\2/g,(all,lead,q,name)=>lead+q+'/workspace/sites/daybreak-piano-film/production/qa/compiled/'+name.slice(2)+'.mjs'+q);
 fs.writeFileSync(name+'.mjs',code);
}
