import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp, segment, v3 } from './math';
import type { Note } from './types';

export interface PianoKey { midi:number; x:number; black:boolean; pivot:THREE.Group; mesh:THREE.Mesh; contact:THREE.Vector3; }
const WHITE_WIDTH=.0235;
export const KEY_TOP=.742;
export const KEY_FRONT=.28;
export function isBlack(midi:number){return [1,3,6,8,10].includes(midi%12);}
export function keyX(midi:number){let count=0;for(let m=21;m<midi;m++)if(!isBlack(m))count++;return -.611+count*WHITE_WIDTH+(isBlack(midi)?-.0015:WHITE_WIDTH*.5);}
// Top surface of the actual hinged key at a requested front/back contact depth.
export function keySurfaceY(midi:number,z:number,down=1){const black=isBlack(midi),angle=down*(black?.028:.033),half=black?.0115:.008,pivotY=KEY_TOP+(black?.012:-.008),localZ=(z+.002-half*Math.sin(angle))/Math.cos(angle);return pivotY+half*Math.cos(angle)-localZ*Math.sin(angle);}
function outline(inset=0){const s=new THREE.Shape();s.moveTo(-.752+inset,-.015+inset);s.lineTo(.752-inset,-.015+inset);s.lineTo(.752-inset,.57);s.bezierCurveTo(.75-inset,.92,.35-inset,1.02,.32-inset,1.57);s.bezierCurveTo(.30-inset,2.13,.07,2.48,-.33,2.48-inset);s.bezierCurveTo(-.58,2.48-inset,-.752+inset,2.32,-.752+inset,2.10);s.closePath();return s;}
function slab(shape:THREE.Shape,depth:number,mat:THREE.Material,y:number,parent:THREE.Object3D){const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.007,bevelThickness:.006,bevelSegments:3,curveSegments:48});geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,mat);mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,r=.005){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function woodTexture(pending:Promise<void>[],name='spruce'){
 const url=`/assets/materials/${name}.png`;
 let texture:THREE.Texture;
 if(typeof Image==='undefined')texture=new THREE.Texture();
 else{let complete!:()=>void,failed!:(error:unknown)=>void;const ready=new Promise<void>((resolve,reject)=>{complete=resolve;failed=reject;});texture=new THREE.TextureLoader().load(url,()=>complete(),undefined,failed);pending.push(ready);}
 texture.userData.sourcePath='public'+url;texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1.8,1.4);texture.anisotropy=8;
 return texture;
}

// Consolidate only the stationary opaque shell. Moving keys, their audit
// meshes, dampers and pedal descendants keep their original objects.
function batchStaticPiano(root:THREE.Group,protectedRoots:THREE.Object3D[]){
 const protectedObjects=new Set<THREE.Object3D>();
 for(const item of protectedRoots)item.traverse(o=>protectedObjects.add(o));
 root.updateMatrixWorld(true);
 const inverseRoot=root.matrixWorld.clone().invert();
 const buckets=new Map<string,THREE.Mesh[]>(),sourceOrder=new Map<THREE.Mesh,number>();
 root.traverseVisible(object=>{
 const mesh=object as THREE.Mesh;
 if(!mesh.isMesh||(mesh as THREE.InstancedMesh).isInstancedMesh||(mesh as THREE.SkinnedMesh).isSkinnedMesh||protectedObjects.has(mesh)||Array.isArray(mesh.material))return;
 const material=mesh.material,geometry=mesh.geometry;
 if(material.transparent||!material.visible||mesh.morphTargetInfluences||geometry.drawRange.start!==0||geometry.drawRange.count!==Infinity||mesh.matrixWorld.determinant()<=0)return;
 const attributes=Object.entries(geometry.attributes).map(([name,a])=>`${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`).sort().join(',');
 const key=[material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask,attributes].join('/');
 sourceOrder.set(mesh,sourceOrder.size);const bucket=buckets.get(key)??[];bucket.push(mesh);buckets.set(key,bucket);
 });
 const removedGeometries=new Set<THREE.BufferGeometry>();
 for(const meshes of buckets.values()){
 if(meshes.length<2)continue;
 const indexed=meshes.some(mesh=>mesh.geometry.index!==null);
 const parts=meshes.map(mesh=>{
 const geometry=mesh.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseRoot,mesh.matrixWorld));
 // Rounded boxes and extruded panels are non-indexed; retain vertices and
 // add an identity index only when sharing a batch with indexed cylinders.
 if(indexed&&!geometry.index)geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i));
 return geometry;
 });
 const geometry=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());
 if(!geometry)continue;
 const first=meshes[0],batch=new THREE.Mesh(geometry,first.material);
 batch.name='Static piano parts';let vertexStart=0,indexStart=0;
 batch.userData.sourceParts=meshes.map(mesh=>{
 const vertexCount=mesh.geometry.attributes.position.count,indexCount=mesh.geometry.index?.count??vertexCount;
 const part={name:mesh.name,geometry:mesh.geometry.type,sourceOrder:sourceOrder.get(mesh),vertexStart,vertexCount,indexStart,indexCount,localMatrix:new THREE.Matrix4().multiplyMatrices(inverseRoot,mesh.matrixWorld).toArray()};
 vertexStart+=vertexCount;indexStart+=indexCount;return part;
 });
 batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;batch.layers.mask=first.layers.mask;
 geometry.computeBoundingBox();geometry.computeBoundingSphere();root.add(batch);
 for(const mesh of meshes){removedGeometries.add(mesh.geometry);mesh.removeFromParent();}
 }
 // A source could share geometry with a protected key or an instance. Keep
 // any such resource alive; disposal later still traverses those originals.
 root.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.geometry)removedGeometries.delete(mesh.geometry);});
 for(const geometry of removedGeometries)geometry.dispose();
}

export class GrandPiano {
 pendingTextures:Promise<void>[]=[];
 group=new THREE.Group(); keys=new Map<number,PianoKey>(); pedals:THREE.Group[]=[]; damperCaps?:THREE.InstancedMesh;damperFelts?:THREE.InstancedMesh;damperStems?:THREE.InstancedMesh;damperRest:{midi:number,p:THREE.Vector3,angle:number}[]=[];damperDummy=new THREE.Object3D(); active:number[]=[];whiteKeyBatch?:THREE.InstancedMesh;blackKeyBatch?:THREE.InstancedMesh;keyMatrix=new THREE.Matrix4();
 constructor(){
 const lacquer=new THREE.MeshPhysicalMaterial({color:0x090c0f,metalness:.025,roughness:.20,clearcoat:1,clearcoatRoughness:.095});
 const edge=new THREE.MeshPhysicalMaterial({color:0x18191b,metalness:.03,roughness:.23,clearcoat:1,clearcoatRoughness:.10});
 const wood=new THREE.MeshStandardMaterial({color:0xd6c5a4,map:woodTexture(this.pendingTextures),roughness:.50});
 const lidVeneer=new THREE.MeshPhysicalMaterial({color:0x9b7954,map:woodTexture(this.pendingTextures,'walnut'),roughness:.42,clearcoat:.18,clearcoatRoughness:.32});
 const brass=new THREE.MeshStandardMaterial({color:0xc49b55,metalness:.90,roughness:.29});
 const gold=new THREE.MeshStandardMaterial({color:0xb2975d,metalness:.58,roughness:.43});
 const felt=new THREE.MeshStandardMaterial({color:0x5a1420,roughness:1});
 const underside=new THREE.MeshStandardMaterial({color:0x18120e,roughness:.8});
 const ivory=new THREE.MeshPhysicalMaterial({color:0xf2eee2,roughness:.23,clearcoat:.4});
 const ebony=new THREE.MeshPhysicalMaterial({color:0x101315,roughness:.19,clearcoat:.8});
 slab(outline(),.09,underside,.635,this.group);
 slab(outline(.04),.034,wood,.78,this.group);
 const rim=outline();const hole=outline(.035);rim.holes.push(new THREE.Path(hole.getPoints(72)));slab(rim,.2,lacquer,.745,this.group);
 // Cast iron plate, bridges and belly braces.
 const plate=outline(.085);const hole2=outline(.20);plate.holes.push(new THREE.Path(hole2.getPoints(72)));slab(plate,.026,gold,.83,this.group);
 // Tapered webs form a connected cast plate below the speaking strings.
 // Their crowns stop at .848: even the lowest treble course stays clear.
 const castWeb=(a:THREE.Vector2,b:THREE.Vector2,startWidth:number,endWidth:number,name:string)=>{
 const axis=b.clone().sub(a).normalize(),normal=new THREE.Vector2(-axis.y,axis.x);
 const points=[a.clone().addScaledVector(normal,startWidth/2),b.clone().addScaledVector(normal,endWidth/2),b.clone().addScaledVector(normal,-endWidth/2),a.clone().addScaledVector(normal,-startWidth/2)];
 const shape=new THREE.Shape(points);shape.closePath();
 const web=slab(shape,.018,gold,.824,this.group);web.name=name;
 };
 for(const [i,a,b] of [
 [0,[-.654,.32],[.626,.36]],
 [1,[-.654,.84],[.300,1.18]],
 [2,[-.654,1.48],[.168,1.91]],
 [3,[-.607,2.10],[-.0547,2.33335]],
 ] as const)castWeb(new THREE.Vector2(...a),new THREE.Vector2(...b),.061,.043,`Tapered cast plate web ${i+1}`);
 // The pinblock supports the tuning pins at the two string-bank heights;
 // the former thin perimeter left the bass tuning pins visibly suspended.
 const bassPinbed=box(this.group,.407,.047,.102,-.440,.8635,-.175,gold,.005);
 bassPinbed.name='Raised bass tuning pin bed';
 const treblePinbed=box(this.group,.918,.021,.108,.198,.8405,-.169,gold,.005);
 treblePinbed.name='Treble tuning pin bed';
 const pinFelt=box(this.group,1.303,.002,.012,-.016,.849,-.223,felt,.001);
 pinFelt.name='Red felt along plate termination';
 // One course layout drives string speaking lengths, both bridges, tuning
 // pins, hitch pins and damper placement. The bass bank crosses above tenor.
 const courses=Array.from({length:88},(_,i)=>{
 const bass=i<27,u=bass?i/26:(i-27)/60;
 const start=v3(-.624+i*.0142,bass?.895:.860,-.235);
 const end=bass?v3(-.39+u*.50,.891,-2.25+u*.98):v3(-.545+u*1.04,.856,-1.76+Math.pow(u,.72)*1.32);
 return {midi:i+21,bass,start,end,copies:i<15?1:i<27?2:3};
 });
 for(const bass of [true,false]){
 const points=courses.filter(c=>c.bass===bass).map(c=>c.end.clone());
 const curve=new THREE.CatmullRomCurve3(points);
 // A solid laminated bridge rises from the soundboard to the strings. The
 // old circular tube floated above the board and looked like a wooden hose.
 const vertices:number[]=[],indices:number[]=[],segments=100,baseY=.820,half=bass?.027:.022;
 for(let i=0;i<=segments;i++){
 const p=curve.getPoint(i/segments),tangent=curve.getTangent(i/segments),side=v3(-tangent.z,0,tangent.x).normalize(),top=p.y-.0015;
 const profile=[[-half+.002,baseY],[-half,baseY+.002],[-half*.69,top-.002],[-half*.69+.002,top],[half*.69-.002,top],[half*.69,top-.002],[half,baseY+.002],[half-.002,baseY]];
 for(const [x,y] of profile)vertices.push(p.x+side.x*x,y,p.z+side.z*x);
 if(i)for(let j=0;j<8;j++){const a=(i-1)*8+j,b=(i-1)*8+(j+1)%8,c=i*8+j,d=i*8+(j+1)%8;indices.push(a,b,c,b,d,c);}
 }
 for(let j=1;j<7;j++){indices.push(0,j+1,j);const k=segments*8;indices.push(k,k+j,k+j+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((_,i)=>i%3===0?[vertices[i]*.8,vertices[i+2]*.8]:[]),2));
 const bridge=new THREE.Mesh(geometry,wood);bridge.name=bass?'Raised laminated bass bridge':'Laminated tenor and treble bridge';bridge.castShadow=true;bridge.receiveShadow=true;this.group.add(bridge);
 }
 const steelParts:THREE.BufferGeometry[]=[],copperParts:THREE.BufferGeometry[]=[],windings:number[]=[],pinPositions:THREE.Vector3[]=[],hitchPositions:THREE.Vector3[]=[];
 const cylinderBetween=(a:THREE.Vector3,b:THREE.Vector3,r:number)=>{
 const d=b.clone().sub(a),g=new THREE.CylinderGeometry(r,r,d.length(),5,1,true);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0,1,0),d.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray() as [number,number,number]);return g;
 };
 for(const c of courses){
 const direction=c.end.clone().sub(c.start).normalize(),lateral=v3(-direction.z,0,direction.x).normalize();
 for(let j=0;j<c.copies;j++){
 const offset=lateral.clone().multiplyScalar((j-(c.copies-1)/2)*.0031);
 const a=c.start.clone().add(offset),b=c.end.clone().add(offset),hitch=b.clone().addScaledVector(direction,.065);
 (c.bass?copperParts:steelParts).push(cylinderBetween(a,hitch,c.bass?.00112:.00036));
 const pin=a.clone().addScaledVector(direction,-.045-j*.015);pinPositions.push(pin);hitchPositions.push(hitch);
 // Non-speaking steel tails visibly connect each course to its tuning pin.
 steelParts.push(cylinderBetween(pin,a,c.bass?.00058:.00036));
 // Wound bass detail is actual small geometry, not a thick luminous line.
 if(c.bass){const length=a.distanceTo(b),count=Math.ceil(length/.0042),up=direction.clone().cross(lateral).normalize();
 for(let k=0;k<count;k++){
 const phase=k*.91,center=a.clone().lerp(b,k/count);
 const p1=center.clone().addScaledVector(lateral,Math.cos(phase)*.00123).addScaledVector(up,Math.sin(phase)*.00123);
 const p2=center.clone().addScaledVector(direction,.0022).addScaledVector(lateral,-Math.cos(phase)*.00123).addScaledVector(up,-Math.sin(phase)*.00123);windings.push(...p1.toArray(),...p2.toArray());
 }
 }
 }
 if(c.midi<=87){const p=c.start.clone().lerp(c.end,.16);this.damperRest.push({midi:c.midi,p,angle:Math.atan2(-direction.x,-direction.z)});}
 }
 for(const [parts,mat,name] of [[steelParts,new THREE.MeshStandardMaterial({color:0xa9b0ac,metalness:.95,roughness:.25}),'Individual steel strings'],[copperParts,new THREE.MeshStandardMaterial({color:0xa8734e,metalness:.93,roughness:.39}),'Copper-wound bass strings']] as const){
 const mesh=new THREE.Mesh(mergeGeometries(parts),mat);mesh.name=name;mesh.castShadow=true;this.group.add(mesh);parts.forEach(g=>g.dispose());
 }
 const windingGeometry=new THREE.BufferGeometry();windingGeometry.setAttribute('position',new THREE.Float32BufferAttribute(windings,3));const windingMesh=new THREE.LineSegments(windingGeometry,new THREE.LineBasicMaterial({color:0x77563c,transparent:true,opacity:.50}));windingMesh.name='Bass winding ridges';this.group.add(windingMesh);
 // The exposed tops stay fixed while longer shafts enter the pin beds.
 const pins=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0024,.0027,.023,8),new THREE.MeshStandardMaterial({color:0x6b7070,metalness:.94,roughness:.30}),pinPositions.length);
 const hitches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0018,.002,.009,7),brass,hitchPositions.length),dummy=new THREE.Object3D();
 for(let i=0;i<pinPositions.length;i++){dummy.position.copy(pinPositions[i]);dummy.updateMatrix();pins.setMatrixAt(i,dummy.matrix);dummy.position.copy(hitchPositions[i]).add(v3(0,-.001,0));dummy.updateMatrix();hitches.setMatrixAt(i,dummy.matrix);}
 pins.name='Tuning pin for each string';hitches.name='Hitch pins beyond each bridge';pins.castShadow=true;this.group.add(pins,hitches);
 // Soft felt meets each damped course. The highest treble rings freely.
 const count=this.damperRest.length,damperWood=new THREE.MeshPhysicalMaterial({color:0x201b16,roughness:.36,clearcoat:.2}),damperFelt=new THREE.MeshStandardMaterial({color:0xd6cbb7,roughness:1});
 this.damperCaps=new THREE.InstancedMesh(new RoundedBoxGeometry(.012,.008,.043,1,.002),damperWood,count);
 this.damperFelts=new THREE.InstancedMesh(new RoundedBoxGeometry(.010,.009,.038,1,.001),damperFelt,count);
 this.damperStems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0009,.0009,.09,5),brass,count);
 this.damperCaps.name='Moving damper heads';this.damperFelts.name='Moving damper felts';this.damperStems.name='Damper wires';
 for(const mesh of [this.damperCaps,this.damperFelts,this.damperStems]){mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.frustumCulled=false;this.group.add(mesh);}
 this.updateDampers(0);
 // Plate fasteners and washer recesses occupy the structural perimeter.
 for(let i=0;i<19;i++){
 const left=i<9,x=left?-.675:.60-(i-9)*.080,z=left?-.28-i*.245:-.32-(i-9)*.174;
 const washer=new THREE.Mesh(new THREE.CylinderGeometry(.010,.010,.0025,16),gold);washer.position.set(x,.862,z);this.group.add(washer);
 const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.005,6),brass);bolt.position.set(x,.866,z);this.group.add(bolt);
 }
 // Keyboard: 52 whites, 36 blacks, separate rear hinges. No compressed or decorative extra keys.
 box(this.group,1.48,.078,.35,0,.675,.105,lacquer,.012);
 box(this.group,1.26,.018,.02,0,.744,.120,felt,.002);
 for(let midi=21;midi<=108;midi++){
 const black=isBlack(midi);const x=keyX(midi);const pivot=new THREE.Group();pivot.position.set(x,KEY_TOP-(black?-.012:.008),-.002);
 const mesh=new THREE.Mesh(new RoundedBoxGeometry(black?.0145:.0227,black?.023:.016,black?.094:.279,2,black?.002:.0014),black?ebony:ivory);
 mesh.position.set(0,0,black?.179:.1395);mesh.visible=false;mesh.castShadow=true;mesh.receiveShadow=true;pivot.add(mesh);this.group.add(pivot);
 this.keys.set(midi,{midi,x,black,pivot,mesh,contact:v3(x,KEY_TOP+(black?.022:0),black?.207:.251)});
 }
 // The hidden per-key mesh remains available for exact geometry audits;
 // the same transforms render in two batches for desktop and phone efficiency.
 const firstWhite=this.keys.get(21)!,firstBlack=this.keys.get(22)!;
 this.whiteKeyBatch=new THREE.InstancedMesh(firstWhite.mesh.geometry,ivory,52);
 this.blackKeyBatch=new THREE.InstancedMesh(firstBlack.mesh.geometry,ebony,36);
 this.whiteKeyBatch.name='52 independently moving white keys';this.blackKeyBatch.name='36 independently moving black keys';
 for(const batch of [this.whiteKeyBatch,this.blackKeyBatch]){batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batch.castShadow=true;batch.receiveShadow=true;batch.frustumCulled=false;this.group.add(batch);}
 this.updateKeyInstances();
 box(this.group,.08,.128,.372,-.694,.728,.10,lacquer,.012);box(this.group,.08,.128,.372,.694,.728,.10,lacquer,.012);
 // Fallboard and polished lip.
 box(this.group,1.30,.133,.055,0,.807,.100,lacquer,.005);
 box(this.group,1.39,.008,.006,0,.686,.292,brass,.002);
 box(this.group,1.34,.012,.205,0,.886,.007,edge,.004);
 // Tiny embossed original maker mark as a texture on a physical plaque.
 const c=document.createElement('canvas');c.width=512;c.height=96;const ct=c.getContext('2d')!;ct.clearRect(0,0,512,96);ct.fillStyle='#bc9e66';ct.font='32px Georgia';ct.textAlign='center';ct.fillText('D A Y B R E A K',256,55);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(.205,.039),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));label.position.set(0,.829,.1292);this.group.add(label);
 // Raised lid rotates around the bass rim; soundboard remains physically open.
 const lidPivot=new THREE.Group();lidPivot.position.set(-.75,.963,0);this.group.add(lidPivot);const lid=slab(outline(),.035,lacquer,0,lidPivot);lid.position.x=.75;lidPivot.rotation.z=.44;
 const lidInside=slab(outline(.034),.009,lidVeneer,-.006,lidPivot);lidInside.position.x=.75;lidInside.name='Satin walnut lid underside';
 // Planar grain coordinates prevent the generic extrusion UVs stretching
 // the veneer across the curved tail and preserve an even timber scale.
 const lidPositions=lidInside.geometry.attributes.position,grainUV=new Float32Array(lidPositions.count*2);
 for(let i=0;i<lidPositions.count;i++){grainUV[i*2]=lidPositions.getX(i)*.65;grainUV[i*2+1]=lidPositions.getZ(i)*.75;}
 lidInside.geometry.setAttribute('uv',new THREE.BufferAttribute(grainUV,2));
 lidPivot.updateMatrix();
 lidInside.geometry.computeBoundingBox();
 const propSeat=v3(1.365,lidInside.position.y+lidInside.geometry.boundingBox!.min.y-.0005,-.79).applyMatrix4(lidPivot.matrix);
 segment(this.group,v3(.55,.94,-.78),propSeat,.010,edge,.011,12);
 for(const z of [-.4,-1.65])box(this.group,.04,.014,.075,-.752,.956,z,brass,.002);
 // Tapered grand legs and brass twin casters.
 for(const [x,z] of [[-.637,.015],[.637,.015],[-.29,-2.05]]){
 const leg=new THREE.Mesh(new THREE.CylinderGeometry(.036,.055,.565,5),lacquer);leg.position.set(x,.36,z);leg.castShadow=true;this.group.add(leg);box(this.group,.108,.071,.112,x,.638,z,lacquer,.01);box(this.group,.06,.061,.055,x,.066,z,brass,.005);
 for(const dx of [-.026,.026]){const caster=new THREE.Mesh(new THREE.CylinderGeometry(.031,.031,.012,20),brass);caster.rotation.z=Math.PI/2;caster.position.set(x+dx,.034,z);this.group.add(caster);}
 }
 // Pedal lyre and three separate hinged pedals, including moving damper rod.
 segment(this.group,v3(-.13,.67,-.09),v3(-.10,.105,.00),.017,lacquer);segment(this.group,v3(.13,.67,-.09),v3(.10,.105,.00),.017,lacquer);
 box(this.group,.292,.055,.095,0,.116,.005,lacquer,.009);
 for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set((i-1)*.072,.070,.025);const p=box(g,.043,.013,.142,0,0,.064,brass,.005);this.pedals.push(g);this.group.add(g);segment(this.group,v3((i-1)*.072,.115,-.01),v3((i-1)*.072,.61,-.05),.004,brass,.004,7);}
 // Upholstered concert bench, welting and restrained buttoning.
 const leather=new THREE.MeshStandardMaterial({color:0x131517,roughness:.64});
 const bench=new THREE.Group();bench.name='Concert bench';bench.position.z=.10;this.group.add(bench);
 box(bench,.6,.075,.335,0,.46,.66,leather,.023);
 for(let i=0;i<3;i++)for(let j=0;j<2;j++){const button=new THREE.Mesh(new THREE.SphereGeometry(.006,10,5),edge);button.scale.y=.22;button.position.set((i-1)*.158,.498,.585+j*.15);bench.add(button);}
 box(bench,.588,.035,.318,0,.413,.66,lacquer,.006);
 for(const x of [-.251,.251])for(const z of [.532,.788]){segment(bench,v3(x,.045,z),v3(x,.419,z),.019,lacquer,.023,7);box(bench,.043,.027,.043,x,.019,z,brass,.004);}
 batchStaticPiano(this.group,[...this.pedals,...[...this.keys.values()].map(key=>key.pivot)]);
 }
 update(time:number,notes:Note[],pedal:number){
 this.active=[];
 for(const key of this.keys.values())key.pivot.rotation.x=0;
 for(const n of notes){const t=time-n.time,travel=.048-.031*clamp((n.velocity-.3)/.6);if(t< -travel||t>n.duration+.10)continue;const key=this.keys.get(n.midi);if(!key)continue;const down=t<0?clamp(1+t/travel):t<n.duration?1:1-clamp((t-n.duration)/.10);key.pivot.rotation.x=Math.max(key.pivot.rotation.x,down*(key.black?.028:.033));if(t>=0&&t<n.duration)this.active.push(n.midi);}
 this.pedals[2].rotation.x=pedal*.16;this.updateDampers(pedal);this.updateKeyInstances();
 }
 updateKeyInstances(){
 if(!this.whiteKeyBatch||!this.blackKeyBatch)return;let white=0,black=0;
 for(const key of this.keys.values()){
 key.pivot.updateMatrix();key.mesh.updateMatrix();this.keyMatrix.multiplyMatrices(key.pivot.matrix,key.mesh.matrix);
 (key.black?this.blackKeyBatch:this.whiteKeyBatch).setMatrixAt(key.black?black++:white++,this.keyMatrix);
 }
 this.whiteKeyBatch.instanceMatrix.needsUpdate=true;this.blackKeyBatch.instanceMatrix.needsUpdate=true;
 }
 updateDampers(pedal:number){
 if(!this.damperCaps||!this.damperFelts||!this.damperStems)return;
 for(let i=0;i<this.damperRest.length;i++){
 const d=this.damperRest[i],key=this.keys.get(d.midi),keyDown=key?key.pivot.rotation.x/(key.black?.028:.033):0,lift=.011*Math.max(pedal,clamp(keyDown));
 const o=this.damperDummy;o.rotation.set(0,d.angle,0);o.position.copy(d.p).add(v3(0,.015+lift,0));o.updateMatrix();this.damperCaps.setMatrixAt(i,o.matrix);
 o.position.y-=.008;o.updateMatrix();this.damperFelts.setMatrixAt(i,o.matrix);
 o.position.copy(d.p).add(v3(0,-.040+lift,.018));o.updateMatrix();this.damperStems.setMatrixAt(i,o.matrix);
 }
 for(const mesh of [this.damperCaps,this.damperFelts,this.damperStems])mesh.instanceMatrix.needsUpdate=true;
 }
 contact(midi:number,depth?:number){const k=this.keys.get(midi)!,z=depth??(k.black?.207:.251),down=k.pivot.rotation.x/(k.black?.028:.033);return v3(k.x,keySurfaceY(midi,z,down),z);}
 whenReady(){return Promise.all(this.pendingTextures);}
}
