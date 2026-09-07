import fs from 'node:fs';
import crypto from 'node:crypto';
const expected={
 'v7/app/performance/pianist.ts':'d7ef64fb4fa5f559a2adc46ec60caff303f9ca5ae5161c428dd4ab1540b609a9',
 'v7/app/performance/types.ts':'dc7c9ec029ba6ef7d5bd70cded6b887483a99461c4ceafb26fcde26e79485877',
 'v7/score.json':'96d39423a256bb3941ad467bffa6300f781715fa3a2b9ef04f5211d822fe42ac'
};
for(const [file,hash] of Object.entries(expected)){
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(actual!==hash)throw Error(`${file}: ${actual} differs from recovered ${hash}`);
}
console.log('RECOVERY_HASH_PASS');
