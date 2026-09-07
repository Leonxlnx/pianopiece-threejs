import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { v3, rand, mix, smooth } from './math';
import { DUST_LOOK } from './render-settings';

function surfaceMap(url:string,x:number,y:number,pending:Promise<void>[]){
 let texture:THREE.Texture;
 if(typeof Image==='undefined')texture=new THREE.Texture();
 else{
 let complete!:()=>void,failed!:(error:unknown)=>void;
 const ready=new Promise<void>((resolve,reject)=>{complete=resolve;failed=reject;});
 texture=new THREE.TextureLoader().load(url,()=>complete(),undefined,failed);pending.push(ready);
 }
 texture.userData.sourcePath='public'+url;texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(x,y);texture.anisotropy=8;
 return texture;
}
function block(parent:THREE.Object3D,name:string,size:number[],position:number[],mat:THREE.Material,r=.008){
 const mesh=new THREE.Mesh(new RoundedBoxGeometry(size[0],size[1],size[2],2,r),mat);
 if(mat.name==='Honed limestone'){
 const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){
 const x=p.getX(i)+position[0],y=p.getY(i)+position[1],z=p.getZ(i)+position[2];
 if(Math.abs(n.getX(i))>.5)uv.setXY(i,z,y);
 else if(Math.abs(n.getY(i))>.5)uv.setXY(i,x,z);
 else uv.setXY(i,x,y);
 }
 }
 mesh.name=name;mesh.position.set(position[0],position[1],position[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function instances(parent:THREE.Object3D,name:string,geometry:THREE.BufferGeometry,material:THREE.Material,poses:{p:number[],s?:number[],r?:number,q?:number[],c?:THREE.Color}[]){
 const mesh=new THREE.InstancedMesh(geometry,material,poses.length),dummy=new THREE.Object3D();mesh.name=name;
 poses.forEach((pose,i)=>{dummy.position.set(...pose.p as [number,number,number]);dummy.scale.set(...(pose.s??[1,1,1]) as [number,number,number]);dummy.rotation.set(0,pose.r??0,0);if(pose.q)dummy.quaternion.fromArray(pose.q);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(pose.c)mesh.setColorAt(i,pose.c);});mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export class Stage {
 pendingTextures:Promise<void>[]=[];
 group=new THREE.Group();reflector:Reflector;dust:THREE.Points;beams:THREE.Mesh[]=[];lights:THREE.SpotLight[]=[];sky:THREE.ShaderMaterial;ribs:THREE.Mesh[]=[];accent:THREE.PointLight;
 constructor(scene:THREE.Scene,mobile:boolean){
 const map=(url:string,x:number,y:number)=>surfaceMap(url,x,y,this.pendingTextures);
 this.group.name='Daybreak recital pavilion';scene.add(this.group);
 const walnut=map('/assets/materials/walnut.png',1,1),limestone=map('/assets/materials/limestone.png',1.5,1.5);
 const wood=new THREE.MeshPhysicalMaterial({name:'Satin walnut',color:0xc2b39e,map:walnut,roughness:.50,metalness:0,clearcoat:.16,clearcoatRoughness:.43});
 const wallGrain=map('/assets/materials/walnut.png',4,.8);
 const wallWood=new THREE.MeshPhysicalMaterial({name:'Quarter-sawn wall joinery',color:0xd0c1ad,map:wallGrain,roughness:.58,clearcoat:.10});
 const stone=new THREE.MeshStandardMaterial({name:'Honed limestone',color:0xb7b6af,map:limestone,roughness:.81});
 const stoneJoint=new THREE.MeshStandardMaterial({name:'Recessed limestone joints',color:0x85867e,roughness:.96});
 const dark=new THREE.MeshStandardMaterial({name:'Shadow joints',color:0x242529,roughness:.87});
 const bronze=new THREE.MeshStandardMaterial({name:'Brushed bronze frames',color:0x4d4539,metalness:.80,roughness:.35});
 const plaster=new THREE.MeshStandardMaterial({name:'Acoustic plaster',color:0xc8c5bb,roughness:.92});
 const glazing=new THREE.MeshPhysicalMaterial({name:'Window glass',color:0xc2d3d1,roughness:.07,metalness:0,transparent:true,opacity:.10,depthWrite:false,clearcoat:1,side:THREE.DoubleSide});
 const glow=new THREE.MeshBasicMaterial({name:'Warm concealed lighting',color:new THREE.Color(1.3,.95,.61),toneMapped:true});

 // Grounded room geometry and a continuous walking surface: no floating stage.
 block(this.group,'Floor structure',[15.5,.24,13.5],[0,-.142,-1.2],dark,.008);
 // Clip staggered boards at BOTH walls. The former odd courses left half a
 // metre of bare foundation beside one wall and protruded through the other.
 for(let variant=0;variant<4;variant++){
 const boards:{p:number[],s:number[],c:THREE.Color}[]=[];
 for(let row=0;row<48;row++)for(let col=-1;col<9;col++){
 if(((row*7+col+12)%4)!==variant)continue;
 const z=-7.0+row*.26,start=-7.23+col*1.85+(row%3)*.617;
 const left=Math.max(-7.23,start),right=Math.min(7.23,start+1.85);
 if(right-left<.003)continue;
 const tone=.88+rand(row*39+col+330)*.10;
 boards.push({p:[(left+right)/2,-.014,z+.129],s:[right-left-.0016,1,1],c:new THREE.Color(tone,tone*.98,tone*.94)});
 }
 const grain=map('/assets/materials/walnut.png',.28,1.6);grain.offset.set(variant*.219,variant*.137);
 const finish=new THREE.MeshPhysicalMaterial({name:'Oiled walnut floor '+variant,color:0xcbbb9f,map:grain,roughness:.54,clearcoat:.12,clearcoatRoughness:.48});
 const plank=new RoundedBoxGeometry(1,.030,.2584,1,.0008),uv=plank.attributes.uv;
 for(let i=0;i<uv.count;i++){const u=uv.getX(i);uv.setXY(i,uv.getY(i),1-u);}
 instances(this.group,'Fitted walnut floorboards '+variant,plank,finish,boards);
 }
 // The broad reflection stays very weak: varnished wood is not a polished mirror.
 this.reflector=new Reflector(new THREE.PlaneGeometry(5.4,5.4),{textureWidth:mobile?512:1024,textureHeight:mobile?512:1024,color:0x1d1711,clipBias:.006,multisample:0});
 this.reflector.name='Subtle floor sheen';this.reflector.rotation.x=-Math.PI/2;this.reflector.position.set(0,.001,-.55);
 const rm=this.reflector.material as THREE.ShaderMaterial;rm.transparent=true;rm.depthWrite=false;
 rm.fragmentShader=rm.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec4 base=texture2DProj(tDiffuse,vUv);vec2 d=vec2(.003,.003)*vUv.w;base+=texture2DProj(tDiffuse,vUv+vec4(d,0.,0.));base+=texture2DProj(tDiffuse,vUv-vec4(d,0.,0.));base/=3.;`);
 rm.fragmentShader=rm.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4( blendOverlay( base.rgb, color ), 0.085 );');
 this.group.add(this.reflector);

 // Limestone piers support the rear window wall; every opening has a sill,
 // jamb, bronze frame, glazing gasket and an overhead structure.
 block(this.group,'Rear foundation',[15.4,.40,.65],[0,.12,-7.05],stone,.012);
 block(this.group,'Rear lintel',[15.4,.60,.68],[0,4.65,-7.05],stone,.02);
 for(let i=0;i<7;i++){
 const x=-7.2+i*2.4;
 block(this.group,'Window pier '+i,[.31,4.3,.70],[x,2.2,-7.02],stone,.018);
 for(let course=1;course<6;course++)block(this.group,'Pier stone bed joint',[.275,.0025,.003],[x,.05+course*.71,-6.668],stoneJoint,.0003);
 if(i<6){
 const center=x+1.2;
 block(this.group,'Window sill '+i,[2.12,.055,.82],[center,.335,-7.02],stone,.01);
 block(this.group,'Window head '+i,[2.08,.035,.10],[center,4.32,-6.98],bronze,.003);
 const pane=block(this.group,'Glazing '+i,[2.04,3.95,.014],[center,2.33,-7.00],glazing,.001);pane.castShadow=false;
 for(const sx of [-1.027,1.027])block(this.group,'Bronze jamb '+i,[.035,3.96,.10],[center+sx,2.33,-6.98],bronze,.003);
 block(this.group,'Window transom '+i,[2.06,.024,.08],[center,3.35,-6.96],bronze,.002);
 }
 }
 // Side walls stay outside the intimate camera orbit and ground the room.
 for(const side of [-1,1]){
 // Overlap the entrance wall at z=5.305; the former 4.88 m end left an
 // open corner that appeared as a bright vertical slit in portrait shots.
 block(this.group,'Limestone side return',[.45,4.75,12.4],[side*7.47,2.23,-.72],stone,.016);
 block(this.group,'Low walnut acoustic lining',[.048,1.10,10.6],[side*7.225,.65,-1.35],wallWood,.006);
 // Narrow board and masonry joints establish construction scale. The wall
 // behind them stays continuous, including the previously repaired corners.
 for(let panel=1;panel<14;panel++)block(this.group,'Walnut lining panel joint',[.004,1.084,.0032],[side*7.198,.65,-6.65+panel*(10.6/14)],dark,.0003);
 for(let course=0;course<5;course++)block(this.group,'Side wall stone bed joint',[.004,.0025,12.32],[side*7.243,1.25+course*.71,-.72],stoneJoint,.0003);
 for(let course=0;course<4;course++)for(let joint=0;joint<8;joint++){
 const z=-6.85+joint*1.55+(course%2)*.775;
 if(z>5.4)continue;
 block(this.group,'Side wall stone head joint',[.004,.707,.0025],[side*7.243,1.605+course*.71,z],stoneJoint,.0003);
 }
 block(this.group,'Bronze baseboard',[.035,.055,12.4],[side*7.22,.063,-.72],bronze,.003);
 block(this.group,'Upper wall reveal',[.12,.08,12.4],[side*7.20,4.18,-.72],dark,.002);
 block(this.group,'Concealed wall light',[.014,.018,12.25],[side*7.13,4.17,-.72],glow,.001);
 }
 // The camera-facing end of the pavilion is an actual enclosed entrance,
 // so portrait views look into architecture rather than an unbounded sky.
 for(const side of [-1,1]){
 block(this.group,'Entrance wall',[6.06,4.72,.35],[side*4.54,2.24,5.48],stone,.014);
 for(const y of [2.52,3.23,3.94])block(this.group,'Entrance wall stone bed joint',[6.02,.0025,.004],[side*4.54,y,5.303],stoneJoint,.0003);
 block(this.group,'Entrance acoustic panel',[4.80,2.18,.045],[side*4.43,1.38,5.283],wood,.006);
 block(this.group,'Entrance panel lower reveal',[4.80,.020,.025],[side*4.43,.281,5.25],bronze,.002);
 }
 block(this.group,'Door lintel',[3.02,1.86,.35],[0,3.67,5.48],stone,.013);
 const doorMap=map('/assets/materials/walnut.png',.65,1.65),doorWood=new THREE.MeshStandardMaterial({name:'Walnut entrance joinery',color:0x92806b,map:doorMap,roughness:.54});
 for(const side of [-1,1]){
 block(this.group,'Solid entrance door',[1.42,2.60,.065],[side*.728,1.337,5.43],doorWood,.004);
 block(this.group,'Entrance door frame jamb',[.085,2.68,.10],[side*1.468,1.337,5.44],doorWood,.004);
 block(this.group,'Entrance door stile',[.026,2.61,.09],[side*1.464,1.337,5.38],bronze,.002);
 block(this.group,'Bronze door pull',[.013,.35,.045],[side*.122,1.18,5.361],bronze,.004);
 }
 // Real jamb/header rebates and a meeting strip close the clearances around
 // the leaves. Those clearances previously exposed the exterior sky.
 block(this.group,'Entrance door frame header',[3.02,.13,.10],[0,2.69,5.44],doorWood,.004);
 block(this.group,'Entrance door meeting rebate',[.040,2.61,.022],[0,1.337,5.465],dark,.002);
 block(this.group,'Entrance threshold',[2.95,.026,.30],[0,.004,5.36],stone,.004);
 // A recital room has acoustic treatment and places to sit. These pieces
 // remain beyond the performance camera orbit and leave the piano uncluttered.
 const linen=new THREE.MeshStandardMaterial({name:'Warm woven acoustic linen',color:0xbab3a4,roughness:.96});
 const wool=new THREE.MeshStandardMaterial({name:'Olive wool upholstery',color:0x596454,roughness:.94});
 const ceramic=new THREE.MeshPhysicalMaterial({name:'Matte chalk ceramic',color:0xd9d3c6,roughness:.71,clearcoat:.05});
 for(const side of [-1,1])for(let panel=0;panel<6;panel++){
 const z=-5.65+panel*1.54;
 block(this.group,'Acoustic panel shadow gap',[.055,2.17,1.27],[side*7.188,2.63,z],dark,.007);
 block(this.group,'Linen acoustic wall panel',[.059,2.11,1.21],[side*7.149,2.63,z],linen,.010);
 for(const dz of [-.63,.63])block(this.group,'Panel walnut stile',[.071,2.19,.025],[side*7.106,2.63,z+dz],wallWood,.003);
 }
 for(const z of [-3.8,.3]){
 const seat=new THREE.Group();seat.name='Window-side lounge seat';seat.position.set(5.72,0,z);seat.rotation.y=Math.PI/2;this.group.add(seat);
 block(seat,'Chair upholstered seat',[.76,.14,.70],[0,.48,0],wool,.065);
 const back=block(seat,'Chair upholstered back',[.76,.70,.13],[0,.82,.30],wool,.055);back.rotation.x=-.10;
 for(const x of [-.38,.38]){
 block(seat,'Chair walnut arm',[.055,.055,.77],[x,.70,.0],wood,.022);
 for(const zz of [-.27,.29])block(seat,'Chair solid leg',[.043,.68,.043],[x,.34,zz],wood,.007);
 }
 }
 // A low side table with a turned stoneware vessel gives the architecture
 // a readable human scale without an ornamental object on every surface.
 block(this.group,'Side table top',[.80,.055,.80],[5.64,.47,-1.76],stone,.020);
 for(const x of [5.33,5.95])for(const z of [-2.07,-1.45])block(this.group,'Side table bronze leg',[.022,.44,.022],[x,.22,z],bronze,.003);
 const profile=[[0,0],[.092,0],[.117,.045],[.122,.17],[.081,.265],[.054,.29],[.054,.315],[.044,.318],[.043,.294]].map(([x,y])=>new THREE.Vector2(x,y));
 const vase=new THREE.Mesh(new THREE.LatheGeometry(profile,40),ceramic);vase.name='Hand-thrown stoneware';vase.position.set(5.62,.50,-1.73);vase.castShadow=true;vase.receiveShadow=true;this.group.add(vase);
 const lamp=new THREE.Group();lamp.name='Reading light';lamp.position.set(6.12,0,-4.57);this.group.add(lamp);
 block(lamp,'Lamp base',[.29,.025,.29],[0,.028,0],bronze,.04);
 block(lamp,'Lamp stem',[.016,1.62,.016],[0,.84,0],bronze,.006);
 const shade=new THREE.Mesh(new THREE.CylinderGeometry(.16,.235,.30,40,1,true),linen);shade.name='Linen lamp shade';shade.material=linen.clone();shade.material.side=THREE.DoubleSide;shade.position.y=1.56;shade.castShadow=true;lamp.add(shade);
 const lampInner=new THREE.Mesh(new THREE.CircleGeometry(.205,40),glow);lampInner.rotation.x=Math.PI/2;lampInner.position.y=1.42;lamp.add(lampInner);
 block(this.group,'Ceiling slab',[15.45,.25,13.35],[0,4.98,-1.17],plaster,.02);
 const slats:{p:number[]}[]=[];
 for(let i=0;i<42;i++)slats.push({p:[-7.21+i*.351,4.69,-1.17]});
 instances(this.group,'Timber acoustic ceiling battens',new RoundedBoxGeometry(.13,.22,13.05,1,.004),wood,slats);
 for(const z of [-5.8,-2.3,1.2,4.25])block(this.group,'Ceiling cross beam',[14.7,.20,.18],[0,4.50,z],wood,.008);
 for(const x of [-4.8,4.8])block(this.group,'Ceiling slot light',[.035,.008,10.9],[x,4.563,-1.45],glow,.001);

 // Outside the windows: a shallow court, a limestone walk and a layered
 // grove. Planting covers the terrain rather than stopping at a flat edge.
 const gardenHeight=(x:number,z:number)=>-.165+smooth((-z-12.8)/8)*(.18*Math.sin(x*.13+z*.11)+.11*Math.cos(x*.29-z*.10))+smooth((-z-26)/24)*1.8;
 const earth=new THREE.MeshStandardMaterial({name:'Planted garden terrain',color:0x89916e,roughness:1,vertexColors:true});
 const groundGeometry=new THREE.PlaneGeometry(90,77,mobile?38:70,mobile?34:60);groundGeometry.rotateX(-Math.PI/2);groundGeometry.translate(0,0,-43.5);
 const groundPos=groundGeometry.attributes.position,groundColors=new Float32Array(groundPos.count*3);
 for(let i=0;i<groundPos.count;i++){
 const x=groundPos.getX(i),z=groundPos.getZ(i);groundPos.setY(i,gardenHeight(x,z));
 const shade=.78+.12*Math.sin(x*.61+z*.38)+.09*Math.sin(x*1.62-z*.43)+rand(i+401)*.07;
 groundColors.set([shade*.96,shade,shade*.83],i*3);
 }
 groundGeometry.setAttribute('color',new THREE.BufferAttribute(groundColors,3));groundGeometry.computeVertexNormals();
 const ground=new THREE.Mesh(groundGeometry,earth);ground.name='Continuous planted garden';ground.receiveShadow=true;this.group.add(ground);
 const pool=new THREE.Mesh(new THREE.PlaneGeometry(24,3.5),new THREE.MeshPhysicalMaterial({name:'Courtyard water',color:0x607572,metalness:.18,roughness:.19,clearcoat:1}));pool.name='Shallow reflecting pool';pool.rotation.x=-Math.PI/2;pool.position.set(0,-.115,-9.8);this.group.add(pool);
 const paving:{p:number[],s:number[],c:THREE.Color}[]=[],curbs:{p:number[],s:number[]}[]=[];
 // The pavers run behind the water and return at each end, leaving the
 // central view quiet. Small joints and low edging give the court a scale.
 for(let row=0;row<2;row++)for(let col=0;col<42;col++){
 const shade=.80+rand(row*89+col+806)*.17;
 paving.push({p:[-12.3+col*.60,-.095,-12.02-row*.60],s:[.592,.10,.592],c:new THREE.Color(shade,shade*.99,shade*.96)});
 }
 for(const side of [-1,1])for(let row=0;row<9;row++)for(let col=0;col<2;col++){
 const shade=.83+rand(row*39+col+side+880)*.13;
 paving.push({p:[side*(12.64+col*.60),-.095,-7.62-row*.60],s:[.592,.10,.592],c:new THREE.Color(shade,shade*.99,shade*.97)});
 }
 for(let col=0;col<42;col++)paving.push({p:[-12.3+col*.60,-.095,-7.62],s:[.592,.10,.592],c:new THREE.Color(.88,.87,.84)});
 for(const z of [-8,-11.6])curbs.push({p:[0,-.08,z],s:[24.9,.16,.24]});
 for(const side of [-1,1])curbs.push({p:[side*12.34,-.08,-9.8],s:[.24,.16,3.72]});
 curbs.push({p:[0,-.08,-12.99],s:[25.25,.16,.11]});
 instances(this.group,'Limestone garden paving',new THREE.BoxGeometry(1,1,1),stone,paving);
 instances(this.group,'Low pool and planting curbs',new RoundedBoxGeometry(1,1,1,1,.015),stone,curbs);
 const branches:{p:number[],s:number[],q:number[]}[]=[],leaves:{p:number[],s:number[],q:number[],c:THREE.Color}[]=[];
 const up=v3(0,1,0);
 const branch=(a:THREE.Vector3,b:THREE.Vector3,r:number)=>{const d=b.clone().sub(a);branches.push({p:a.clone().add(b).multiplyScalar(.5).toArray(),s:[r,d.length(),r],q:new THREE.Quaternion().setFromUnitVectors(up,d.normalize()).toArray()});};
 const leafCloud=(center:THREE.Vector3,seed:number,count:number,radius:number,height:number,size:number,shade:number)=>{
 for(let k=0;k<count;k++){
 const j=seed+k*11,a=rand(j)*Math.PI*2,r=Math.sqrt(rand(j+1))*radius,yy=(rand(j+2)-.5)*height;
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler((rand(j+3)-.5)*2.8,rand(j+4)*Math.PI*2,(rand(j+5)-.5)*2.2));
 const scale=size*(.72+rand(j+6)*.68),tone=shade*(.74+rand(j+7)*.38);
 leaves.push({p:center.clone().add(v3(Math.cos(a)*r,yy,Math.sin(a)*r)).toArray(),s:[scale,scale,scale],q:q.toArray(),c:new THREE.Color().setRGB(.67*tone,.78*tone,.45*tone)});
 }
 };
 for(let i=0;i<18;i++){
 const x=-22.5+i*2.65+(rand(i+906)-.5)*2.25,z=-15-rand(i+933)*17,h=4.1+rand(i+918)*4.0;
 const base=v3(x,gardenHeight(x,z)-.035,z),bend=v3((rand(i+210)-.5)*1.2,0,(rand(i+212)-.5)*.85),joints:THREE.Vector3[]=[base];
 for(let j=1;j<=4;j++){
 const t=j/4,p=base.clone().add(v3(bend.x*t*t,h*t,bend.z*t*t));
 branch(joints[j-1],p,(.115+rand(i+920)*.055)*(1-t*.65));joints.push(p);
 }
 const limbCount=11+Math.floor(rand(i+960)*5);
 for(let n=0;n<limbCount;n++){
 const t=.30+n/limbCount*.62,angle=n*2.399+i*.71+(rand(i*55+n)-.5)*.8;
 const height=h*t,start=base.clone().add(v3(bend.x*t*t,height,bend.z*t*t));
 const spread=(.9+rand(i*33+n)*1.55)*(1.30-t*.56);
 const end=start.clone().add(v3(Math.cos(angle)*spread,.45+rand(i*17+n)*.95,Math.sin(angle)*spread));
 const elbow=start.clone().lerp(end,.53).add(v3(0,-.08-rand(i*31+n)*.21,0));
 branch(start,elbow,.028+rand(i*29+n)*.018);branch(elbow,end,.016+rand(i*49+n)*.008);
 for(let twig=0;twig<3;twig++){
 const end2=end.clone().add(v3((rand(i*137+n*5+twig)-.5)*1.15,.08+rand(n*8+twig)*.53,(rand(i*97+n*7+twig)-.5)*1.15));
 branch(end.clone().lerp(elbow,.18),end2,.0055);
 leafCloud(end2,i*9001+n*311+twig*71,mobile?32:72,.50,.56,1,.88+rand(i+71)*.25);
 }
 }
 }
 // Loose drifts of low shrubs interrupt the trunks; their leaves and
 // stems share the tree batches rather than adding a draw call per plant.
 for(let i=0;i<44;i++){
 const x=-18+rand(i*13+3301)*36,z=-13.65-rand(i*19+3302)*10.5,base=v3(x,gardenHeight(x,z)-.025,z),h=.36+rand(i*7+3303)*.62;
 for(let stem=0;stem<5;stem++){
 const a=stem*2.399+rand(i+58),r=.18+rand(i*51+stem)*.40,end=base.clone().add(v3(Math.cos(a)*r,h*(.60+rand(i*29+stem)*.40),Math.sin(a)*r));
 branch(base,end,.0048);
 leafCloud(end,i*5003+stem*631+73001,mobile?30:48,.34,.38,.80,.91+rand(i+441)*.12);
 }
 }
 // Overlapping leaf clouds give low planting a ragged silhouette, while
 // retaining real gaps and the same individual-leaf material as the grove.
 for(let drift=0;drift<18;drift++){
 const x=-20+drift*2.35+(rand(drift+91001)-.5)*2.1,z=-15.2-rand(drift+91002)*12.4;
 const height=.42+rand(drift+91003)*.60,width=.75+rand(drift+91004)*.78;
 for(let lobe=0;lobe<3;lobe++){
 const xx=x+(lobe-1)*width*.58,zz=z+(rand(drift*9+lobe+91005)-.5)*.65;
 const base=v3(xx,gardenHeight(xx,zz)-.02,zz),center=base.clone().add(v3(0,height*.65,0));
 branch(base,center,.008);
 leafCloud(center,drift*701+lobe*97+95001,mobile?180:480,width*.65,height*1.25,.9,.84+rand(drift+91006)*.15);
 }
 }
 const bark=new THREE.MeshStandardMaterial({name:'Garden bark',color:0x7a7260,roughness:1});
 instances(this.group,'Branched courtyard trees and shrubs',new THREE.CylinderGeometry(.62,1,1,7),bark,branches);
 const leafGeometry=new THREE.BufferGeometry();leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.029,.064,0,0,.15,-.003,.029,.064,0,0,.062,.012],3));leafGeometry.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leafGeometry.computeVertexNormals();
 const foliage=new THREE.MeshStandardMaterial({name:'Individual garden leaves',color:0x8a9a65,roughness:.94,side:THREE.DoubleSide});
 instances(this.group,'Individual courtyard leaves',leafGeometry,foliage,leaves);
 const grassPos:number[]=[],grassIndices:number[]=[];
 for(let b=0;b<5;b++){
 const a=b*2.399,c=Math.cos(a),s=Math.sin(a),lean=.09+rand(b+620)*.09,h=.27+rand(b+621)*.24,k=grassPos.length/3;
 grassPos.push(-s*.014,0,c*.014,s*.014,0,-c*.014,c*lean*.35-s*.008,h*.52,s*lean*.35+c*.008,c*lean*.35+s*.008,h*.52,s*lean*.35-c*.008,c*lean,h,s*lean);
 grassIndices.push(k,k+1,k+2,k+1,k+3,k+2,k+2,k+3,k+4);
 }
 const grassGeometry=new THREE.BufferGeometry();grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute(grassPos,3));grassGeometry.setIndex(grassIndices);grassGeometry.computeVertexNormals();
 const grass:{p:number[],s:number[],r:number,c:THREE.Color}[]=[];
 for(let i=0;i<(mobile?550:1100);i++){
 const x=-25+rand(i*7+12401)*50,z=-13.25-rand(i*11+12402)*27;
 const scale=.48+rand(i*13+12403)*.80,tone=.71+rand(i*17+12404)*.34;
 grass.push({p:[x,gardenHeight(x,z)-.018,z],s:[scale,scale,scale],r:rand(i+12405)*Math.PI*2,c:new THREE.Color(tone*.84,tone,tone*.66)});
 }
 instances(this.group,'Meadow grass drifts',grassGeometry,new THREE.MeshStandardMaterial({name:'Fine garden grasses',color:0x859166,roughness:1,side:THREE.DoubleSide}),grass);
 const rocks:{p:number[],s:number[],r:number,c:THREE.Color}[]=[];
 for(let i=0;i<26;i++){
 const x=-18+rand(i*31+14501)*36,z=-13.7-rand(i*23+14502)*11,scale=.12+rand(i*17+14503)*.26,tone=.66+rand(i*43+14504)*.24;
 rocks.push({p:[x,gardenHeight(x,z)+scale*.12,z],s:[scale*(1+rand(i+14505)),scale*.56,scale*(.75+rand(i+14506)*.60)],r:rand(i+14507)*6.28,c:new THREE.Color(tone,tone*.99,tone*.92)});
 }
 instances(this.group,'Weathered planting stones',new THREE.IcosahedronGeometry(1,1),stone,rocks);

 this.sky=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uLift:{value:0},uTime:{value:0}},vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec3 vPosition;uniform float uLift;void main(){vec3 p=normalize(vPosition);float h=smoothstep(-.06,.75,p.y);vec3 horizon=mix(vec3(.38,.46,.50),vec3(.66,.64,.57),uLift);vec3 zenith=mix(vec3(.13,.25,.37),vec3(.24,.39,.51),uLift);vec3 c=mix(horizon,zenith,h);float sun=pow(max(0.,dot(p,normalize(vec3(-.63,.25,-.74)))),52.);c+=vec3(.25,.18,.09)*sun;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 this.group.add(new THREE.Mesh(new THREE.SphereGeometry(90,32,20),this.sky));
 scene.add(new THREE.HemisphereLight(0xd7e0e7,0x79634d,.95));
 const key=new THREE.SpotLight(0xffead4,94,25,.75,.86,2);key.position.set(-3.4,4.25,-2.2);key.target.position.set(0,.92,.42);key.castShadow=true;key.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);key.shadow.bias=-.00018;key.shadow.normalBias=.004;key.shadow.radius=4;scene.add(key,key.target);this.lights.push(key);
 const fill=new THREE.SpotLight(0xc6dcf1,92,24,.85,.95,2);fill.position.set(4.3,3.5,1.3);fill.target.position.set(0,.85,.2);scene.add(fill,fill.target);this.lights.push(fill);
 const sun=new THREE.SpotLight(0xffdbad,265,40,.64,.73,2);sun.position.set(-5.5,4.8,-12);sun.target.position.set(0,.5,.4);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);sun.shadow.bias=-.0002;sun.shadow.normalBias=.006;sun.shadow.radius=3;scene.add(sun,sun.target);this.lights.push(sun);
 this.accent=new THREE.PointLight(0xffe1bd,.20,4,2);this.accent.position.set(0,1.6,1.7);scene.add(this.accent);
 const count=mobile?90:190,positions=new Float32Array(count*3),seeds=new Float32Array(count),sizes=new Float32Array(count);
 for(let i=0;i<count;i++){positions.set([(rand(i+4)-.5)*9,.2+rand(i+21)*4,(rand(i+66)-.5)*8-1],i*3);seeds[i]=rand(i+55)*6.28;sizes[i]=.8+rand(i+43)*1.3;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPixel:{value:1},uDrift:{value:new THREE.Vector4(...DUST_LOOK.drift)},uSize:{value:new THREE.Vector3(...DUST_LOOK.size)},uAlpha:{value:new THREE.Vector3(...DUST_LOOK.alpha)},uColor:{value:new THREE.Vector3(...DUST_LOOK.color)},uEdge:{value:DUST_LOOK.edge}},vertexShader:`attribute float aSize;attribute float aSeed;uniform float uTime;uniform float uPixel;uniform vec4 uDrift;uniform vec3 uSize;uniform vec3 uAlpha;varying float alpha;void main(){vec3 p=position;p.x+=sin(uTime*uDrift.x+aSeed)*uDrift.y;p.y+=sin(uTime*uDrift.z+aSeed*2.)*uDrift.w;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uPixel*clamp(aSize*uSize.x/(-mv.z),uSize.y,uSize.z);float pulse=sin(aSeed+uTime*uAlpha.x);alpha=uAlpha.y+uAlpha.z*pulse*pulse;}`,fragmentShader:`varying float alpha;uniform vec3 uColor;uniform float uEdge;void main(){float a=(1.-smoothstep(uEdge,.5,length(gl_PointCoord-.5)))*alpha;gl_FragColor=vec4(uColor,a);}`});
 this.dust=new THREE.Points(geometry,material);this.group.add(this.dust);
 this.batchArchitecture();
 }
 batchArchitecture(){
 // Static opaque joinery shares a draw call per material. Keep instancing,
 // glazing, light sources, the sky and the live reflector independent.
 this.group.updateMatrixWorld(true);
 const groups=new Map<string,THREE.Mesh[]>();
 this.group.traverse(o=>{
 const m=o as THREE.Mesh;if(!m.isMesh||(m as THREE.InstancedMesh).isInstancedMesh||Array.isArray(m.material))return;
 const mat=m.material;if(mat.transparent||(mat as THREE.ShaderMaterial).isShaderMaterial)return;
 const architecture=/wall|side return|pier|lintel|door|ceiling|beam|lining|panel|reveal/i.test(m.name);
 m.userData.architecture=architecture;
 const key=[mat.uuid,m.castShadow,m.receiveShadow,m.renderOrder,m.layers.mask,architecture].join('/');
 const list=groups.get(key)??[];list.push(m);groups.set(key,list);
 });
 const removed=new Set<THREE.BufferGeometry>();
 for(const meshes of groups.values()){
 if(meshes.length<2)continue;
 const geometries=meshes.map(m=>{const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);g.clearGroups();if(!g.index)return g;const flat=g.toNonIndexed();g.dispose();return flat;});
 const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;
 const first=meshes[0],batch=new THREE.Mesh(merged,first.material);batch.name='Pavilion · '+(first.material as THREE.Material).name;
 batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;batch.layers.mask=first.layers.mask;
 batch.userData.architecture=first.userData.architecture;let vertexStart=0;
 batch.userData.sourceParts=meshes.map(m=>{const vertexCount=m.geometry.index?.count??m.geometry.attributes.position.count;const part={name:m.name,vertexStart,vertexCount};vertexStart+=vertexCount;return part;});
 for(const m of meshes){m.removeFromParent();removed.add(m.geometry);}this.group.add(batch);
 }
 this.group.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)removed.delete(m.geometry);});
 removed.forEach(g=>g.dispose());
 }
 update(time:number,energy:number,pulse:number){
 const lift=smooth((energy-.2)/.72);this.sky.uniforms.uLift.value=lift;this.sky.uniforms.uTime.value=time;
 const m=this.dust.material as THREE.ShaderMaterial;m.uniforms.uTime.value=time;
 this.lights[0].intensity=mix(88,100,lift);this.lights[2].intensity=mix(240,320,lift);this.accent.intensity=.16+pulse*.07;
 }
 whenReady(){return Promise.all(this.pendingTextures);}
 dispose(){this.reflector.dispose();}
}
