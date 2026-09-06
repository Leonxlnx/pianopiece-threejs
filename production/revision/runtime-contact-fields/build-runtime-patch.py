from pathlib import Path
import difflib,json,hashlib
r=Path(__file__).resolve().parent;root=Path('/workspace/sites/daybreak-piano-film/app/performance')
s=(root/'pianist.ts').read_text();p=s
replacements=[
 ('${(n.contactLift??.002).toFixed(4)}`','${(n.contactLift??.002).toFixed(4)}/${n.contactZ??""}/${n.thumbOpposition??0}`'),
('palmQ?:THREE.Quaternion){','palmQ?:THREE.Quaternion,opposition=0){'),
('const up=normal.clone().cross(e).normalize();','if(fi===0&&opposition!==0)normal.applyAxisAngle(e,opposition);\n const up=normal.clone().cross(e).normalize();'),
('const z=this.contactDepth(base.z,black,fi),target','const z=n.contactZ??this.contactDepth(base.z,black,fi),target'),
('this.fingerPoints(base,target,f,fi,q);','this.fingerPoints(base,target,f,fi,q,n.thumbOpposition??0);'),
('piano.contact(note.midi,this.contactDepth(base.z,isBlack(note.midi),fi))','piano.contact(note.midi,note.contactZ??this.contactDepth(base.z,isBlack(note.midi),fi))'),
('const localPose=(wristPosition:THREE.Vector3,wristQ:THREE.Quaternion,touch:THREE.Vector3)=>{','const localPose=(wristPosition:THREE.Vector3,wristQ:THREE.Quaternion,touch:THREE.Vector3,opposition=0)=>{'),
('this.fingerPoints(origin,touch,finger,fi,wristQ),','this.fingerPoints(origin,touch,finger,fi,wristQ,opposition),'),
('z=this.contactDepth(origin.z,isBlack(note.midi),fi),touch','z=note.contactZ??this.contactDepth(origin.z,isBlack(note.midi),fi),touch'),
('return localPose(anchor.position,anchor.q,touch);','return localPose(anchor.position,anchor.q,touch,note.thumbOpposition??0);'),
('this.fingerPoints(base,target,finger,fi);','this.fingerPoints(base,target,finger,fi,undefined,n?.thumbOpposition??0);')]
for a,b in replacements:
 if a not in p: raise RuntimeError('Missing runtime insertion '+a)
 p=p.replace(a,b)
t=(root/'types.ts').read_text();u=t.replace('contactLift?: number;','contactLift?: number; contactZ?: number; thumbOpposition?: number;')
(r/'pianist-opposition-depth.ts').write_text(p);(r/'types-opposition-depth.ts').write_text(u)
patch=''.join(difflib.unified_diff(s.splitlines(True),p.splitlines(True),fromfile='a/app/performance/pianist.ts',tofile='b/app/performance/pianist.ts'))+''.join(difflib.unified_diff(t.splitlines(True),u.splitlines(True),fromfile='a/app/performance/types.ts',tofile='b/app/performance/types.ts'))
(r/'opposition-depth.patch').write_text(patch)
(r/'runtime-patch-hashes.json').write_text(json.dumps({k:hashlib.sha256(v.encode()).hexdigest() for k,v in [('source',s),('candidate',p),('types',u),('patch',patch)]},indent=2))
