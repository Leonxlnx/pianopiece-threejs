from pathlib import Path
root=Path(__file__).parent
source=(root/'base/piano.ts').read_text()
helper='''
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
'''
source=source.replace('\nexport class GrandPiano {',helper+'\nexport class GrandPiano {')
needle=' for(const x of [-.251,.251])for(const z of [.532,.788]){segment(this.group,v3(x,.045,z),v3(x,.419,z),.019,lacquer,.023,7);box(this.group,.043,.027,.043,x,.019,z,brass,.004);}\n'
assert needle in source
source=source.replace(needle,needle+' batchStaticPiano(this.group,[...this.pedals,...[...this.keys.values()].map(key=>key.pivot)]);\n')
(root/'candidate/piano.ts').write_text(source)
for name in ['math.ts','direction.ts','types.ts']:(root/'candidate'/name).write_bytes((root/'base'/name).read_bytes())
