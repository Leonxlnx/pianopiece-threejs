import fs from 'node:fs';
import ts from '/workspace/sites/daybreak-piano-film/node_modules/typescript/lib/typescript.js';
let code=ts.transpileModule(fs.readFileSync('pianist-combined-base.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
code=code.replace(/(from\s+|import\s*)(['"])(\.\/[^'"]+)\2/g,(all,lead,q,name)=>lead+q+'/workspace/sites/daybreak-piano-film/production/qa/compiled/'+name.slice(2)+'.mjs'+q);
fs.writeFileSync('pianist-combined-base.mjs',code);
