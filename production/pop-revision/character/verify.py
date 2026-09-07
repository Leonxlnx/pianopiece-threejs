"""Fail-closed geometry, rig, determinism and paired-pose wardrobe verifier."""
from pathlib import Path
import argparse, copy, gzip, hashlib, json, subprocess, sys, tempfile
import numpy as np
from glb_tools import GLB
from build_character import BASELINE_SHA, locate_input, panels

HERE=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def validate(source,output):
    assert sha(source)==BASELINE_SHA,'Unrecognized baseline'
    a,b=GLB(source),GLB(output)
    assert a.j['nodes']==b.j['nodes'],'Rig nodes or rest transforms changed'
    assert a.j['skins']==b.j['skins'],'Skin bindings changed'
    assert len(b.j['skins'][0]['joints'])==67,'67 joint interface changed'
    assert len(a.j['meshes'])==len(b.j['meshes'])==8,'Mesh interface changed'
    for skin in a.j['skins']:
        ix=skin['inverseBindMatrices'];assert np.array_equal(a.arr(ix),b.arr(ix)),'Inverse bind buffer changed'
    for mi in range(8):
        if mi==1:continue
        assert a.j['meshes'][mi]==b.j['meshes'][mi],f'Non-garment mesh definition {mi} changed'
        for pa,pb in zip(a.j['meshes'][mi]['primitives'],b.j['meshes'][mi]['primitives']):
            ids=[*pa['attributes'].values(),pa['indices']]
            for target in pa.get('targets',[]):ids.extend(target.values())
            for ix in ids:assert np.array_equal(a.arr(ix),b.arr(ix)),f'Skin, hand, face, hair or morph buffer changed: {mi}/{ix}'
    # All existing embedded image bytes and source material definitions survive.
    assert a.j['images']==b.j['images'] and a.j['textures']==b.j['textures']
    for im in a.j['images']:assert a.view(im['bufferView'])==b.view(im['bufferView']),'Embedded texture was changed'
    assert b.j['materials'][:len(a.j['materials'])]==a.j['materials'],'Source material changed'
    for ix in range(len(b.j['accessors'])):assert np.isfinite(b.arr(ix)).all(),f'Nonfinite accessor {ix}'
    weight_error=0.;total_vertices=total_triangles=0;garment=[]
    for mi,m in enumerate(b.j['meshes']):
        for pi,p in enumerate(m['primitives']):
            at={k:b.arr(v) for k,v in p['attributes'].items()};n=len(at['POSITION']);idx=b.arr(p['indices']).reshape(-1,3)
            assert idx.min()>=0 and idx.max()<n,'Out-of-range triangle'
            assert at['JOINTS_0'].max()<67,'Out-of-range skin joint'
            assert at['WEIGHTS_0'].min()>=-1e-8,'Negative skin weight'
            err=float(abs(at['WEIGHTS_0'].sum(1)-1).max());weight_error=max(weight_error,err)
            assert err<2e-6,'Unnormalized skin weights'
            assert np.max(abs(np.linalg.norm(at['NORMAL'],axis=1)-1))<2e-5,'Invalid normals'
            tr=at['POSITION'][idx];areas=np.linalg.norm(np.cross(tr[:,1]-tr[:,0],tr[:,2]-tr[:,0]),axis=1)
            assert np.min(areas)>1e-12,'Collapsed triangle'
            for target in p.get('targets',[]):
                for key,ix in target.items():assert len(b.arr(ix))==n,'Morph count mismatch'
            total_vertices+=n;total_triangles+=len(idx)
            if mi==1:garment.append({'primitive':pi,'vertices':n,'triangles':len(idx),'minTriangleDoubleAreaM2':float(areas.min()),'material':b.j['materials'][p['material']]['name']})
    assert len(b.j['meshes'][1]['primitives'])==6,'Garment batching changed'
    assert sha(output)!=sha(source),'Garment is unchanged'
    moved=[];cosines=[]
    for (aa,af),(ba,bf) in zip(panels(a),panels(b)):
        assert np.array_equal(af,bf),'Base panel triangle order changed'
        delta=np.linalg.norm(aa['POSITION']-ba['POSITION'],axis=1);assert delta.max()>.001,'No substantive panel change';assert delta.max()<.010,'Unexpected excessive deformation'
        old=aa['POSITION'][af];new=ba['POSITION'][bf]
        n0=np.cross(old[:,1]-old[:,0],old[:,2]-old[:,0]);n1=np.cross(new[:,1]-new[:,0],new[:,2]-new[:,0]);cos=(n0*n1).sum(1)/(np.linalg.norm(n0,axis=1)*np.linalg.norm(n1,axis=1))
        assert cos.min()>0,'Panel triangle orientation reversed'
        moved.append(float(delta.max()*1000));cosines.append(float(cos.min()))
    bm=b.j['materials'][b.j['meshes'][1]['primitives'][0]['material']]
    tm=b.j['materials'][b.j['meshes'][1]['primitives'][1]['material']]
    assert min(bm['pbrMetallicRoughness']['baseColorFactor'][:3])>.5,'Ivory material absent'
    assert max(tm['pbrMetallicRoughness']['baseColorFactor'][:3])<.05,'Midnight material absent'
    return {'baselineSHA256':sha(source),'assetSHA256':sha(output),'nodes':len(b.j['nodes']),'joints':67,'meshes':8,'totalVertices':total_vertices,'totalTriangles':total_triangles,'maxWeightSumError':weight_error,'panelMaxMovementMm':moved,'panelMinimumNormalCosine':cosines,'garment':garment,'nonGarmentGeometryAndMorphsExact':True,'embeddedImagesExact':True,'bindMatricesExact':True}

def verify_poses(asset):
    # These raw mesh snapshots are diagnostic caches, not public source assets.
    # Reconstruct them deterministically from the frozen source when absent;
    # all paired-pose and reviewed-image hash checks below remain mandatory.
    project=HERE.parents[2]
    for name,model in [('before',project/'production/revision/wrist-analysis/input-pianist.glb'),('after',asset.resolve())]:
        output=HERE/f'{name}-pose.json.gz'
        if not output.exists():
            subprocess.run(['node',str(HERE/'export-pose.mjs'),str(project),str(model),str(output),'186',str(HERE/'pose-source')],check=True)
    before=json.loads(gzip.decompress((HERE/'before-pose.json.gz').read_bytes()));after=json.loads(gzip.decompress((HERE/'after-pose.json.gz').read_bytes()))
    assert before['assetSHA256']==BASELINE_SHA and after['assetSHA256']==sha(asset),'Paired pose evidence is stale'
    assert before['sourceHashes']==after['sourceHashes'] and before['scoreSHA256']==after['scoreSHA256'] and before['time']==after['time'],'Paired pose sources differ'
    compared=0
    for key,x in before['meshes'].items():
        if key.startswith('1:'):continue
        y=after['meshes'][key]
        for kind in ['position','normal','indices']:assert x[kind]==y[kind],f'Posed non-garment {key}/{kind} differs'
        compared+=1
    return {'time':after['time'],'nonGarmentPosedMeshesExact':compared,'sourceHashes':after['sourceHashes'],'scoreSHA256':after['scoreSHA256']}

def main():
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path);p.add_argument('--asset',type=Path,default=HERE/'pianist-ivory.glb');a=p.parse_args();source=a.input or locate_input()
    report=validate(source,a.asset)
    # Positive mutation controls establish that the preservation and change
    # predicates fail on an actual changed bind buffer or unchanged garment.
    rejected=[]
    try:validate(source,source)
    except AssertionError:rejected.append('unchanged baseline')
    assert 'unchanged baseline' in rejected,'Unchanged model was accepted'
    with tempfile.TemporaryDirectory(prefix='wardrobe-verify-',dir=HERE) as folder:
        folder=Path(folder);g=GLB(a.asset);ix=g.j['skins'][0]['inverseBindMatrices'];view=g.j['bufferViews'][g.j['accessors'][ix]['bufferView']];offset=view.get('byteOffset',0)+g.j['accessors'][ix].get('byteOffset',0)
        vals=np.frombuffer(g.b,dtype='<f4',count=1,offset=offset);vals[0]+=.02;bad=folder/'bad.glb';g.save(bad)
        try:validate(source,bad)
        except AssertionError:rejected.append('changed inverse bind')
        assert 'changed inverse bind' in rejected,'Changed bind model was accepted'
        generated=folder/'rebuild.glb'
        subprocess.run([sys.executable,str(HERE/'build_character.py'),'--input',str(source),'--output',str(generated)],check=True,capture_output=True,text=True)
        assert sha(generated)==sha(a.asset),'Rebuild is not byte deterministic'
    report.update({'negativeControlsRejected':rejected,'rebuildByteIdentical':True,'pairedPose':verify_poses(a.asset)})
    for file in ['before-seated.png','after-seated.png','before-side.png','after-side.png','after-rest.png','after-detail.png']:
        assert (HERE/file).exists(),f'Missing reviewed render {file}'
        image=HERE/file;manifest=json.loads(image.with_suffix('.render.json').read_text())
        assert manifest['imageSHA256']==sha(image),'Render image changed after its capture'
        assert manifest['assetSHA256']==(BASELINE_SHA if file.startswith('before') else sha(a.asset)),'Render asset is stale'
        if manifest['poseSHA256']:
            assert manifest['poseSHA256']==sha(HERE/('before-pose.json.gz' if file.startswith('before') else 'after-pose.json.gz')),'Render pose is stale'
    for view in ['seated','side']:
        bm=json.loads((HERE/f'before-{view}.render.json').read_text());am=json.loads((HERE/f'after-{view}.render.json').read_text())
        for key in ['eye','target','orthographicHeight','width','height','renderer','poseTime']:assert bm[key]==am[key],'Before/after rendering settings differ'
    (HERE/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print('CHARACTER VERIFIED')

if __name__=='__main__':main()
