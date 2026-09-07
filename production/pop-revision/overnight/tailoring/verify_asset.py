"""Verify actual candidate buffers and reject bone/panel corruption."""
from pathlib import Path
import argparse, copy, hashlib, json, tempfile
import numpy as np
from glb_tools import GLB, normalize
from build_character import panels
from refine_garment import ACCEPTED_SHA

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def verify(source,candidate):
    assert sha(source)==ACCEPTED_SHA
    a,b=GLB(source),GLB(candidate)
    assert a.j['nodes']==b.j['nodes'] and a.j['skins']==b.j['skins'], 'Rig changed'
    assert a.j['materials']==b.j['materials'], 'Materials changed'
    assert a.j['images']==b.j['images'] and a.j['textures']==b.j['textures'], 'Image interfaces changed'
    for im in a.j['images']: assert a.view(im['bufferView'])==b.view(im['bufferView']), 'Texture bytes changed'
    for skin in a.j['skins']:
        ix=skin['inverseBindMatrices'];assert np.array_equal(a.arr(ix),b.arr(ix)), 'Bind matrices changed'
    protected=0
    for mi,mesh in enumerate(a.j['meshes']):
        for pi,p in enumerate(mesh['primitives']):
            if mi==1 and pi not in (1,3): continue
            q=b.j['meshes'][mi]['primitives'][pi]
            assert p==q, f'Protected mesh definition changed {mi}:{pi}'
            ids=[*p['attributes'].values(),p['indices']]
            for target in p.get('targets',[]):ids.extend(target.values())
            for ix in ids:assert np.array_equal(a.arr(ix),b.arr(ix)), f'Protected mesh data changed {mi}:{pi}:{ix}'
            protected+=1
    valid=[]
    for pi,p in enumerate(b.j['meshes'][1]['primitives']):
        at={k:b.arr(v) for k,v in p['attributes'].items()};f=b.arr(p['indices']).reshape(-1,3)
        assert all(np.isfinite(v).all() for v in at.values()), 'Nonfinite garment'
        assert f.min()>=0 and f.max()<len(at['POSITION']), 'Index outside mesh'
        assert at['JOINTS_0'].min()>=0 and at['JOINTS_0'].max()<67, 'Invalid joint index'
        assert at['WEIGHTS_0'].min()>=0 and abs(at['WEIGHTS_0'].sum(1)-1).max()<2e-6, 'Invalid skin weights'
        assert abs(np.linalg.norm(at['NORMAL'],axis=1)-1).max()<2e-5, 'Invalid normals'
        tri=at['POSITION'][f];area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)
        assert area.min()>1e-12, f'Degenerate garment primitive {pi}'
        valid.append({'primitive':pi,'vertices':len(at['POSITION']),'triangles':len(f),'minDoubleAreaM2':float(area.min())})
    (ap,af),_=panels(a);(bp,bf),_=panels(b)
    for key in ('JOINTS_0','WEIGHTS_0','TEXCOORD_0'): assert np.array_equal(ap[key],bp[key]), f'Base panel {key} changed'
    assert np.array_equal(af,bf), 'Base panel topology changed'
    displacement=np.linalg.norm(bp['POSITION']-ap['POSITION'],axis=1)
    assert .003<displacement.max()<.0041, 'Candidate is unchanged or outside movement budget'
    old=ap['POSITION'][af];new=bp['POSITION'][bf]
    an=normalize(np.cross(old[:,1]-old[:,0],old[:,2]-old[:,0]));bn=normalize(np.cross(new[:,1]-new[:,0],new[:,2]-new[:,0]))
    assert (an*bn).sum(1).min()>.98, 'Candidate reverses or sharply deforms panel faces'
    return {'inputSHA256':sha(source),'candidateSHA256':sha(candidate),'protectedPrimitivesExact':protected,
            'bodyAndRigExact':True,'trousersExact':True,'embeddedImagesExact':True,'garment':valid,
            'panelMaxMoveMm':float(displacement.max()*1000),'panelWeightsAndUVExact':True}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--source',type=Path,default=Path('../pianopiece-threejs/public/assets/pianist.glb'));ap.add_argument('--candidate',type=Path,default=Path('pianist-tailored.glb'));args=ap.parse_args()
    report=verify(args.source,args.candidate)
    try:verify(args.source,args.source)
    except AssertionError:report['unchangedNegativeControlRejected']=True
    else:raise AssertionError('Unchanged negative control accepted')
    Path('asset-verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
