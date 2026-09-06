import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),score=JSON.parse(fs.readFileSync(process.argv[2]??root+'/baseline-score.json')),manifest=JSON.parse(fs.readFileSync(root+'/candidate-manifest.json')),notes=new Map(score.notes.map(n=>[n.id,n]));
for(const edit of manifest.noteChanges)for(const [field,change] of Object.entries(edit.changes)){
 const n=notes.get(edit.id);assert.ok((n[field]??null)===(change.before??null)||n[field]===change.after,edit.id+'/'+field);n[field]=change.after;
}
for(const edit of manifest.knotChanges){const hand=score.wristMotion.hands.find(h=>h.side===edit.hand);assert.ok(JSON.stringify(hand.knots[edit.index])===JSON.stringify(edit.before)||JSON.stringify(hand.knots[edit.index])===JSON.stringify(edit.after));hand.knots[edit.index]=edit.after;}
fs.writeFileSync(process.argv[3]??root+'/reproduced-score.json',JSON.stringify(score));
