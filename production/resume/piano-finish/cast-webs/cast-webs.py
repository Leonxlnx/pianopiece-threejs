from pathlib import Path
source=Path('/workspace/sites/daybreak-piano-film/app/performance/piano.ts').read_text()
old=" for(let i=0;i<4;i++){const z=-.42-i*.43;segment(this.group,v3(-.66,.815,z),v3(.42-i*.12,.816,z-.12),.021,gold,.020,10);}"
new=""" // Cast webs connect to the inner plate border and remain below the wires.
 const plateOpening=outline(.20).getPoints(160);
 const openingEdges=(z:number)=>{
 const y=-z,hits:number[]=[];
 for(let j=0;j<plateOpening.length;j++){const a=plateOpening[j],b=plateOpening[(j+1)%plateOpening.length];if((a.y<=y&&b.y>y)||(b.y<=y&&a.y>y))hits.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));}
 return [Math.min(...hits),Math.max(...hits)];
 };
 for(let i=0;i<4;i++){
 const z=-.47-i*.43,a=new THREE.Vector2(openingEdges(z)[0]-.028,z),b=new THREE.Vector2(openingEdges(z-.085)[1]+.028,z-.085),axis=b.clone().sub(a).normalize(),normal=new THREE.Vector2(-axis.y,axis.x),points:THREE.Vector2[]=[];
 for(const sign of [-1,1]){const row=[a.clone().addScaledVector(normal,sign*.047),a.clone().addScaledVector(axis,.080).addScaledVector(normal,sign*.026),b.clone().addScaledVector(axis,-.080).addScaledVector(normal,sign*.026),b.clone().addScaledVector(normal,sign*.047)];points.push(...(sign===1?row.reverse():row));}
 const shape=new THREE.Shape();points.forEach((p,j)=>j?shape.lineTo(p.x,-p.y):shape.moveTo(p.x,-p.y));shape.closePath();
 const g=new THREE.ExtrudeGeometry(shape,{depth:.0175,steps:1,bevelEnabled:true,bevelSize:.0035,bevelThickness:.004,bevelSegments:3});g.rotateX(-Math.PI/2);
 const web=new THREE.Mesh(g,gold);web.name='Connected cast plate web '+i;web.position.y=.829;web.castShadow=true;web.receiveShadow=true;this.group.add(web);
 }"""
assert source.count(old)==1
Path(__file__).with_name('candidate-cast-webs.ts').write_text(source.replace(old,new))
