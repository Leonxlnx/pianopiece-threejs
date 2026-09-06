import * as THREE from '/workspace/sites/daybreak-piano-film/node_modules/three/build/three.module.js';
const mod=await import(process.argv[2]);
globalThis.window={devicePixelRatio:1};
const scene=new THREE.Scene(),stage=new mod.Stage(scene,process.argv[3]==='mobile');
let triangles=0,drawCalls=0,instances=0;const objects=[];
stage.group.traverse(o=>{
if(!o.isMesh||!o.visible)return;
const t=(o.geometry.index?.count??o.geometry.attributes.position?.count??0)/3*(o.count??1),d=Array.isArray(o.material)?o.geometry.groups.length:1;
triangles+=t;drawCalls+=d;instances+=o.count??1;
if(/garden|courtyard|planted|grove|planting|pool|meadow|grass/i.test(o.name))objects.push({name:o.name,triangles:t,drawCalls:d,instances:o.count??1});
});
console.log(JSON.stringify({mobile:process.argv[3]==='mobile',triangles,drawCalls,instances,objects},null,2));
