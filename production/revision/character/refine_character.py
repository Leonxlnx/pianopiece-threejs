"""Refine face interpolation, restore source controls, turn garment hems.

Original body vertices, hand skinning, skeleton and bind matrices remain exact.
No bitmap is edited. Source artwork and graphite material are preserved.
"""
import argparse, copy, hashlib, json
from pathlib import Path
import numpy as np
from glb_tools import GLB, normalize

FACIAL=['eyeBlinkLeft','eyeBlinkRight','browDownLeft','browDownRight','browInnerUp',
        'mouthSmileLeft','mouthSmileRight','eyeLookDownLeft',
        'eyeLookDownRight','eyeSquintLeft','eyeSquintRight']

def pnmid(p,n,pairs):
    a,b=pairs.T;e=p[b]-p[a]
    correction=(-np.sum(e*n[a],1)[:,None]*n[a]+np.sum(e*n[b],1)[:,None]*n[b])/8
    # Protect unusually coarse joins: the interpolation only rounds the source.
    length=np.linalg.norm(correction,axis=1);correction*=np.minimum(1,.0015/np.maximum(length,1e-20))[:,None]
    return (p[a]+p[b])/2+correction

def interpolate_skin(j,w,pairs):
    newj=[];neww=[]
    for a,b in pairs:
        weights={}
        for vi in (a,b):
            for bone,weight in zip(j[vi],w[vi]):weights[int(bone)]=weights.get(int(bone),0)+float(weight)*.5
        active=sorted(weights.items(),key=lambda x:x[1],reverse=True)[:4]
        while len(active)<4:active.append((0,0.))
        jj,ww=zip(*active);ww=np.array(ww);newj.append(jj);neww.append(ww/ww.sum())
    return np.array(newj,dtype=j.dtype),np.array(neww,dtype=w.dtype)

def refine_face(attrs,indices,targets,threshold=1.51):
    p=attrs['POSITION'];n=attrs['NORMAL'];faces=indices.reshape(-1,3);edges=set()
    for tri in faces:
        for a,b in zip(tri,np.roll(tri,-1)):
            if min(p[a,1],p[b,1])>threshold:edges.add(tuple(sorted((int(a),int(b)))))
    pairs=np.array(sorted(edges));edgeids={tuple(e):i+len(p)for i,e in enumerate(pairs)};out=[]
    for tri in faces:
        a,b,c=map(int,tri);vs=[a,b,c];ms=[edgeids.get(tuple(sorted((vs[k],vs[(k+1)%3]))))for k in range(3)];count=sum(m is not None for m in ms)
        if count==0:out.append((a,b,c))
        elif count==3:
            ab,bc,ca=ms;out.extend([(a,ab,ca),(ab,b,bc),(ca,bc,c),(ab,bc,ca)])
        elif count==1:
            k=next(i for i,m in enumerate(ms)if m is not None);a,b,c=[vs[(k+j)%3]for j in range(3)];m=ms[k];out.extend([(a,m,c),(m,b,c)])
        else:
            k=next(i for i,m in enumerate(ms)if m is None);a,b,c=[vs[(k+j)%3]for j in range(3)];bc=ms[(k+1)%3];ca=ms[(k+2)%3];out.extend([(c,ca,bc),(a,b,ca),(b,bc,ca)])
    refined=copy.deepcopy(attrs);refined['POSITION']=np.concatenate([p,pnmid(p,n,pairs)]);refined['NORMAL']=np.concatenate([n,normalize(n[pairs[:,0]]+n[pairs[:,1]])])
    refined['TEXCOORD_0']=np.concatenate([attrs['TEXCOORD_0'],attrs['TEXCOORD_0'][pairs].mean(1)])
    jj,ww=interpolate_skin(attrs['JOINTS_0'],attrs['WEIGHTS_0'],pairs);refined['JOINTS_0']=np.concatenate([attrs['JOINTS_0'],jj]);refined['WEIGHTS_0']=np.concatenate([attrs['WEIGHTS_0'],ww])
    refined_targets=[]
    for t in targets:
        tp=p+t['POSITION'];tn=normalize(n+t.get('NORMAL',0));newpos=pnmid(tp,tn,pairs)-refined['POSITION'][len(p):];newnorm=normalize(tn[pairs[:,0]]+tn[pairs[:,1]])-refined['NORMAL'][len(p):]
        untouched=np.all(t['POSITION'][pairs]==0,axis=(1,2)) & np.all(t.get('NORMAL',np.zeros_like(n))[pairs]==0,axis=(1,2))
        newpos[untouched]=0;newnorm[untouched]=0
        refined_targets.append({'POSITION':np.concatenate([t['POSITION'],newpos]),'NORMAL':np.concatenate([t.get('NORMAL',np.zeros_like(n)),newnorm])})
    return refined,np.array(out).reshape(-1,1),refined_targets,len(pairs)

def turn_hems(attrs,indices):
    p=attrs['POSITION'];n=attrs['NORMAL'];tris=indices.reshape(-1,3)
    _,first,ids=np.unique(np.round(p,6),axis=0,return_index=True,return_inverse=True);edgeuses={};neighbors={}
    for tri in tris:
        for a,b in zip(tri,np.roll(tri,-1)):
            key=tuple(sorted((int(ids[a]),int(ids[b]))));edgeuses.setdefault(key,[]).append((int(a),int(b)))
            neighbors.setdefault(int(ids[a]),set()).add(int(ids[b]));neighbors.setdefault(int(ids[b]),set()).add(int(ids[a]))
    boundaries=[use[0]for use in edgeuses.values()if len(use)==1];boundary_ids=set(int(ids[v])for e in boundaries for v in e);vids=sorted(set(v for e in boundaries for v in e));loc={v:i for i,v in enumerate(vids)}
    normals=n[vids];toward=[]
    for v in vids:
        inner=[first[x]for x in neighbors[int(ids[v])]if x not in boundary_ids]
        if not inner:inner=[first[x]for x in neighbors[int(ids[v])]]
        d=p[inner].mean(0)-p[v];d-=np.dot(d,n[v])*n[v];toward.append(normalize(d))
    toward=np.array(toward);num=len(vids);count=len(p)
    # Three duplicated rings: edge-facing fold, inward edge, inner turned strip.
    extra_p=np.concatenate([p[vids],p[vids]-normals*.0014,p[vids]-normals*.0014+toward*.004])
    extra_n=np.concatenate([-toward,normalize(-toward-normals),-normals])
    out=copy.deepcopy(attrs);out['POSITION']=np.concatenate([p,extra_p]);out['NORMAL']=np.concatenate([n,extra_n])
    for key in ['TEXCOORD_0','JOINTS_0','WEIGHTS_0']:out[key]=np.concatenate([attrs[key]]+[attrs[key][vids]]*3)
    faces=tris.tolist()
    for a,b in boundaries:
        aa=count+loc[a];bb=count+loc[b]
        # Reverse the source boundary edge so new faces face outward.
        faces.extend([(bb,aa,aa+num),(bb,aa+num,bb+num),(bb+num,aa+num,aa+num*2),(bb+num,aa+num*2,bb+num*2)])
    return out,np.array(faces).reshape(-1,1),{'boundaryEdges':len(boundaries),'extraVertices':len(extra_p),'extraTriangles':len(boundaries)*4,'thicknessMm':1.4,'turnWidthMm':4}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--current');ap.add_argument('--source',required=True);ap.add_argument('--output',required=True);a=ap.parse_args();old=GLB(a.current or a.source);src=GLB(a.source)
    if not a.current:
        old.j['materials']=json.loads(Path(__file__).with_name('baseline-materials.json').read_text())
    g=copy.deepcopy(old)
    assert old.j['nodes']==src.j['nodes'],'source skeleton/nodes changed'
    g.b=bytearray();g.j['accessors']=[];g.j['bufferViews']=[];stats={'preservedOriginalBodyVertices':True,'fingerSkinningChanged':False,'meshes':[]}
    for mi,(m,sm) in enumerate(zip(g.j['meshes'],src.j['meshes'])):
        op=old.j['meshes'][mi]['primitives'][0];sp=sm['primitives'][0];attrs={key:old.arr(idx)for key,idx in op['attributes'].items()};indices=old.arr(op['indices']);original=len(attrs['POSITION']);old_faces=len(indices)//3
        assert np.array_equal(attrs['POSITION'],src.arr(sp['attributes']['POSITION']))
        names=[name for name in FACIAL if name in sm.get('extras',{}).get('targetNames',[])];targets=[]
        for name in names:
            t=sp['targets'][sm['extras']['targetNames'].index(name)];targets.append({key:src.arr(idx)for key,idx in t.items()})
        if mi==0:attrs,indices,targets,added=refine_face(attrs,indices,targets);stats['faceInsertedVertices']=added
        if mi==1:
            # Preserve the source app's existing cloth clearance, now applied
            # before turned-hem normals differ from outer fabric normals.
            attrs['POSITION']=attrs['POSITION']+attrs['NORMAL']*.0035
            attrs,indices,_,added=refine_face(attrs,indices,[],threshold=-100)
            stats['garmentInsertedVertices']=added
            attrs,indices,stats['hems']=turn_hems(attrs,indices)
            stats['garmentClearanceMm']=3.5
        prim={'attributes':{},'material':op['material']}
        for key,arr in attrs.items():
            typ='VEC2' if key=='TEXCOORD_0' else 'VEC4' if key in ('JOINTS_0','WEIGHTS_0') else 'VEC3';component=5123 if key=='JOINTS_0' else 5126
            prim['attributes'][key]=g.addarr(arr,typ,component,target=34962)
        prim['indices']=g.addarr(indices,'SCALAR',5123 if len(attrs['POSITION'])<65536 else 5125,target=34963)
        if targets:
            prim['targets']=[{key:g.addarr(arr,'VEC3',sparse=True)for key,arr in t.items()}for t in targets];m['extras']={'targetNames':names};m['weights']=[0.]*len(names)
        else:m.pop('extras',None);m.pop('weights',None)
        m['primitives']=[prim];stats['meshes'].append({'name':m['name'],'verticesBefore':original,'verticesAfter':len(attrs['POSITION']),'trianglesBefore':old_faces,'trianglesAfter':len(indices)//3,'morphs':names})
    for si,skin in enumerate(g.j['skins']):skin['inverseBindMatrices']=g.addarr(old.arr(old.j['skins'][si]['inverseBindMatrices']),'MAT4')
    # Preserve images verbatim; discard the unused orange/blue garment diffuse.
    image_map={};newimages=[];texture_map={};newtextures=[]
    baseline_dir=Path(__file__).with_name('baseline-textures')
    baseline_images=json.loads((baseline_dir/'manifest.json').read_text()) if not a.current else {}
    used_tex=set()
    for mat in g.j['materials']:
        for container in [mat,mat.get('pbrMetallicRoughness',{})]:
            for key,value in container.items():
                if key.endswith('Texture')and isinstance(value,dict):used_tex.add(value['index'])
    for ti in sorted(used_tex):
        tx=copy.deepcopy(old.j['textures'][ti]);ii=tx['source']
        if ii not in image_map:
            im=copy.deepcopy(old.j['images'][ii]);image_bytes=old.view(im['bufferView'])
            if im['name'] in baseline_images:
                recipe=baseline_images[im['name']];image_bytes=(baseline_dir/recipe['filename']).read_bytes();im['mimeType']=recipe['mimeType']
            im['bufferView']=g.addview(image_bytes);image_map[ii]=len(newimages);newimages.append(im)
        tx['source']=image_map[ii];texture_map[ti]=len(newtextures);newtextures.append(tx)
    for mat in g.j['materials']:
        for container in [mat,mat.get('pbrMetallicRoughness',{})]:
            for key,value in container.items():
                if key.endswith('Texture')and isinstance(value,dict):value['index']=texture_map[value['index']]
    g.j['textures']=newtextures;g.j['images']=newimages
    eye=g.j['materials'][2];eye['pbrMetallicRoughness']['roughnessFactor']=.36;eye['extensions']={'KHR_materials_clearcoat':{'clearcoatFactor':.8,'clearcoatRoughnessFactor':.1}}
    g.j['extensionsUsed']=list(dict.fromkeys(g.j.get('extensionsUsed',[])+['KHR_materials_clearcoat']))
    g.j['asset']['generator']='Daybreak character refinement pipeline (glTF 2.0, CC0 MPFB source)'
    g.j['asset']['copyright']='CC0; MPFB avatar created with Blender by met4citizen. Source: https://github.com/met4citizen/TalkingHead'
    g.j.setdefault('extras',{})['daybreakRefinement']={'bodyOriginalVertexCount':11779,'faceInterpolation':'one PN edge refinement above y=1.51 m','garmentClearanceMeters':.0035,'garmentInterpolation':'one PN edge refinement','hemThicknessMeters':.0014,'fingerWeightsChanged':False}
    g.save(a.output);stats['bytesBefore']=Path(a.current or a.source).stat().st_size;stats['bytesAfter']=Path(a.output).stat().st_size;stats['sourceSHA256']=hashlib.sha256(Path(a.source).read_bytes()).hexdigest();stats['outputSHA256']=hashlib.sha256(Path(a.output).read_bytes()).hexdigest()
    Path(a.output).with_suffix('.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats,indent=2))

if __name__=='__main__':main()
