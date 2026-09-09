import fs from 'node:fs';
import {performer,update} from '../climax-nonthumb-continuity/harness.mjs';
update(159.5);
const h=performer.hands[1];
fs.writeFileSync(new URL('anchor.json',import.meta.url),JSON.stringify({at:159.5,q:h.fingers[0].bones.map(b=>b.quaternion.toArray())},null,2));
