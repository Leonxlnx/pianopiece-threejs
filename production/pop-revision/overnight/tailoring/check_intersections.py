"""Exact edge/triangle crossing comparison for the actual open body mesh.

The covered shoulder/body regions are absent from this performer; nearest-face
signed distance across those open cut edges is not a valid inside predicate.
This test screens AABBs, then intersects every edge of each triangle against the
other triangle. Coplanar overlaps are counted with a separate 2-D predicate.
"""
from pathlib import Path
import gzip,hashlib,json
import numpy as np
from scipy.spatial import cKDTree
from glb_tools import GLB

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dot(a,b):return np.sum(a*b,axis=-1)

def segment_triangle(start,end,tri):
    direction=end-start;edge1=tri[:,1]-tri[:,0];edge2=tri[:,2]-tri[:,0]
    h=np.cross(direction,edge2);det=dot(edge1,h);valid=abs(det)>1e-14
    inv=np.divide(1.,det,out=np.zeros_like(det),where=valid)
    s=start-tri[:,0];u=inv*dot(s,h);q=np.cross(s,edge1);v=inv*dot(direction,q);t=inv*dot(edge2,q)
    return valid&(u>=-1e-8)&(v>=-1e-8)&(u+v<=1+1e-8)&(t>=-1e-8)&(t<=1+1e-8)

def coplanar_overlap(a,b):
    n=np.cross(a[1]-a[0],a[2]-a[0]);axis=int(np.argmax(abs(n)));keep=[i for i in range(3) if i!=axis]
    aa=a[:,keep];bb=b[:,keep]
    # Separating-axis test for two coplanar convex triangles in 2-D.
    for polygon in (aa,bb):
        for i in range(3):
            d=polygon[(i+1)%3]-polygon[i];normal=np.array([-d[1],d[0]])
            pa=aa@normal;pb=bb@normal
            if pa.max()<pb.min()-1e-12 or pb.max()<pa.min()-1e-12:return False
    return True

def pairs(cloth,cloth_faces,body,body_faces,selected):
    bt=body[body_faces];bc=bt.mean(1);br=np.linalg.norm(bt-bc[:,None],axis=2).max(1);tree=cKDTree(bc)
    blo,bhi=bt.min(1),bt.max(1);result=set()
    for ci in selected:
        ct=cloth[cloth_faces[ci]];center=ct.mean(0);radius=np.linalg.norm(ct-center,axis=1).max()
        choices=np.array(tree.query_ball_point(center,radius+br.max()),dtype=int)
        if not len(choices):continue
        lo,hi=ct.min(0),ct.max(0);choices=choices[((bhi[choices]>=lo-1e-9)&(blo[choices]<=hi+1e-9)).all(1)]
        if not len(choices):continue
        candidates=bt[choices];hit=np.zeros(len(choices),bool)
        for i in range(3):
            hit|=segment_triangle(ct[i],ct[(i+1)%3],candidates)
            hit|=segment_triangle(candidates[:,i],candidates[:,(i+1)%3],np.broadcast_to(ct,candidates.shape))
        # Near-zero parallel planes require the coplanar 2-D branch.
        cn=np.cross(ct[1]-ct[0],ct[2]-ct[0]);cn/=max(np.linalg.norm(cn),1e-15)
        parallel=(abs((candidates-ct[0])@cn).max(1)<1e-8)&~hit
        for row in np.flatnonzero(parallel):hit[row]=coplanar_overlap(ct,candidates[row])
        result.update((int(ci),int(bi)) for bi in choices[hit])
    return result

# Analytic controls exercise both true intersections and disjoint triangles.
control=np.array([[0.,0.,0.],[1.,0.,0.],[0.,1.,0.]])
assert segment_triangle(np.array([[.2,.2,-1.]]),np.array([[.2,.2,1.]]),control[None])[0]
assert not segment_triangle(np.array([[2.,2.,-1.]]),np.array([[2.,2.,1.]]),control[None])[0]
assert coplanar_overlap(control,control+np.array([.1,.1,0.]))
assert not coplanar_overlap(control,control+np.array([2.,2.,0.]))

source=Path('../pianopiece-threejs/public/assets/pianist.glb');candidate=Path('pianist-tailored.glb')
source_hash,candidate_hash=sha(source),sha(candidate)
g=GLB(source);body_faces=g.arr(g.j['meshes'][0]['primitives'][0]['indices']).reshape(-1,3);cloth_faces=g.arr(g.j['meshes'][1]['primitives'][0]['indices']).reshape(-1,3)
manifest=json.loads(Path('paired-poses.json').read_text());assert manifest['beforeAssetSHA256']==source_hash and manifest['afterAssetSHA256']==candidate_hash,'Stale pose assets'
results=[]
for pose in manifest['poses']:
    path=Path(pose['snapshot']);assert sha(path)==pose['snapshotSHA256'];data=json.loads(gzip.decompress(path.read_bytes()))
    body=np.array(data['body']).reshape(-1,3);before=np.array(data['beforeBlouse']).reshape(-1,3);after=np.array(data['afterBlouse']).reshape(-1,3)
    changed=np.linalg.norm(after-before,axis=1)>.000005;selected=np.flatnonzero(changed[cloth_faces].any(1))
    a=pairs(before,cloth_faces,body,body_faces,selected);b=pairs(after,cloth_faces,body,body_faces,selected)
    new=sorted(b-a);cleared=sorted(a-b)
    results.append({'time':data['time'],'alteredTriangles':len(selected),'baselineIntersectingPairs':len(a),'candidateIntersectingPairs':len(b),'newPairs':new,'clearedPairs':cleared})
    print('Checked real triangle crossings',data['time'],len(a),len(b),'new',len(new),flush=True)
assert sha(source)==source_hash and sha(candidate)==candidate_hash,'Asset changed during verification'
report={'inputSHA256':source_hash,'candidateSHA256':candidate_hash,'scope':'All blouse triangles with a vertex moving over 5 micrometres against actual rendered body triangles, 7 exact poses; manual moving visual review remains necessary','analyticControlsPassed':4,'poses':results,'passed':all(not row['newPairs'] for row in results)}
Path('intersection-verification.json').write_text(json.dumps(report,indent=2)+'\n')
if not report['passed']:raise SystemExit(1)
