import fs from'node:fs';import{pose,performer,applyControls}from'../../idle-nonthumb/audit-lib.mjs';const queue=JSON.parse(fs.readFileSync('chord-plane-proof/proof-idle-gap-queue.json')),curves=[];
function qAt(fi,t,controls){pose(t);if(controls)applyControls(1,fi,controls);return performer.hands[1].fingers[fi].bones.flatMap(b=>b.quaternion.toArray());}
function add(patch,previous,knots){const g=queue.find(g=>g.patch===patch&&g.previous===previous),fi=['Thumb','Index','Middle','Ring','Pinky'].indexOf(patch.slice(1));curves.push({hi:1,fi,previous:g.previous,previousEnd:g.start,next:g.next,nextTime:g.end,mode:'quaternion',knots:knots.map(([t,source=t,controls])=>[t,...qAt(fi,source,controls)])});}
add('RRing','p00937',[[199.40],[199.56,199.60,[12,6.5,0,0]],[199.69368]]);
add('RPinky','p00974',[[198.298852],[198.52],[199.45,198.52],[199.91,199.95,[14,-8,0,0]],[200.029507]]);
add('RRing','p00984',[[199.979507],[200.04,200.04,[20,5,12,0]],[200.22]]);
add('RIndex','p00967',[[198.30],[198.54,198.99,[19.5,38,0,0]],[199.34,198.99,[19.5,38,0,0]],[199.58]]);
add('RMiddle','p00963',[[198.40],[198.673185]]);
add('RMiddle','p00978',[[199.31585199999998],[199.330,199.330,[5.5,-4.5,0,0]],[199.343352]]);
add('RThumb','p00976',[[198.649185],[198.95,198.99],[199.339852]]);
add('RMiddle','p00982',[[200.42],[200.65,199.90],[201.42,199.90],[201.65]]);
fs.writeFileSync('chord-idle/quats-v1.json',JSON.stringify({curves,scoreSha256:'aabde5daad0e2e000a36bac76e996d557a52fee0616872936e8e3435488753e8'},null,2));console.log(curves.length);
