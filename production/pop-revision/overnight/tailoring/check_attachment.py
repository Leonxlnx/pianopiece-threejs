"""Measure newly authored shoulder trim against the actual posed blouse."""
from pathlib import Path
import gzip,hashlib,json
import numpy as np
from glb_tools import GLB
from garment_tools import normals
from build_character import ClosestSurface

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
candidate=Path('pianist-tailored.glb');g=GLB(candidate)
manifest=json.loads(Path('paired-poses.json').read_text());assert manifest['afterAssetSHA256']==sha(candidate)
source=GLB('../pianopiece-threejs/public/assets/pianist.glb')
old_binding_count=source.j['accessors'][source.j['meshes'][1]['primitives'][2]['attributes']['POSITION']]['count']
faces=g.arr(g.j['meshes'][1]['primitives'][0]['indices']).reshape(-1,3)
rows=[]
for record in manifest['poses']:
    path=Path(record['snapshot']);assert sha(path)==record['snapshotSHA256'];pose=json.loads(gzip.decompress(path.read_bytes()))
    points=np.array(pose['afterBlouse']).reshape(-1,3);count=len(points)
    attrs={'POSITION':points,'NORMAL':normals(points,faces),'TEXCOORD_0':np.zeros((count,2)),
        'JOINTS_0':np.zeros((count,4),dtype='u2'),'WEIGHTS_0':np.tile([1.,0,0,0],(count,1))}
    surface=ClosestSurface(attrs,faces)
    shoulder=np.array(pose['afterBinding']).reshape(-1,3)[old_binding_count:]
    assert len(shoulder)==136,'Shoulder seam vertex interface changed'
    distance=np.array([np.linalg.norm(p-surface.sample(p)['POSITION']) for p in shoulder])
    rows.append({'time':pose['time'],'shoulderVertices':len(shoulder),'minDistanceMm':float(distance.min()*1000),'maxDistanceMm':float(distance.max()*1000)})
    assert distance.max()<.0012,'Shoulder seam detaches over 1.2 mm'
Path('attachment-verification.json').write_text(json.dumps({'candidateSHA256':sha(candidate),'poses':rows,'passed':True},indent=2)+'\n')
print(json.dumps(rows,indent=2))
