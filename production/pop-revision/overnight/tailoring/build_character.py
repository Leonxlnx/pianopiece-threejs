"""Rebuild the concert wardrobe, preserving the exact performer rig and skin.

Run from any directory. --input selects the accepted 77423a38 baseline GLB.
No source texture is retouched; garment shape and glTF materials are authored.
"""
from pathlib import Path
import argparse, copy, hashlib, json
import numpy as np
from scipy.spatial import cKDTree
from glb_tools import GLB, normalize
from garment_tools import (smooth, gauss, normals, boundaries, turn_hems,
                           primitive, placket_and_buttons, side_seams)

BASELINE_SHA='77423a38d36b0365f5f81a145418327cd84be960b860cbb98079dec7b67c433d'

def locate_input():
    here=Path(__file__).resolve()
    for ancestor in here.parents:
        for candidate in [ancestor/'production/revision/wrist-analysis/input-pianist.glb',ancestor/'public/assets/pianist.glb',ancestor/'pianopiece-threejs/public/assets/pianist.glb']:
            if candidate.exists() and hashlib.sha256(candidate.read_bytes()).hexdigest()==BASELINE_SHA:
                return candidate
    raise FileNotFoundError('Supply --input with the accepted 77423a38 baseline GLB.')

def panels(g):
    result=[]
    for pi,count in [(0,5374),(1,3610)]:
        p=g.j['meshes'][1]['primitives'][pi]
        a={k:g.arr(v)[:count].copy() for k,v in p['attributes'].items()}
        f=g.arr(p['indices']).reshape(-1,3)
        f=f[(f<count).all(1)].copy()
        result.append((a,f))
    return result

def shaped_panels(shirt,pants,sf,pf):
    # Existing eased coverage is retained. Reduce the broad lower-front dome
    # and gather the remaining ease gently above a defined hem.
    p=shirt['POSITION'].copy();original=p.copy();n=shirt['NORMAL'];x,y,z=p.T
    front=smooth(.1,.8,n[:,2]);back=smooth(.1,.8,-n[:,2])
    torso=(1-smooth(.145,.218,abs(x)))*smooth(1.01,1.05,y)*(1-smooth(1.285,1.36,y))
    p[:,2]-=.0045*front*torso*gauss(y-1.12,.13)
    # The old cloth hugged a sharp under-bust ridge. Bridge that valley while
    # easing its high point into a broad continuous suspended front panel.
    chest=gauss(abs(x)-.105,.053)*smooth(.08,.70,n[:,2])
    p[:,2]+=chest*(.0060*gauss(y-1.224,.037)-.0065*gauss(y-1.269,.032))
    # Flat placket and two discreet folds suspend from the upper panel; the
    # opposite sign valley prevents the broad inflated roll of the old waist.
    fold=np.zeros(len(p))
    for side in (-1,1):
        line=side*(.078+.13*(y-1.04))
        fold+=(.00165*gauss(x-line,.007)-.00065*gauss(x-line-side*.012,.012))
    fold*=front*torso*smooth(1.015,1.07,y)*(1-smooth(1.18,1.32,y))
    p+=n*fold[:,None]
    p[:,2]+=.0011*back*gauss(y-1.25,.1)*(1-smooth(.11,.2,abs(x)))
    shirt['POSITION']=p.astype('f4');shirt['NORMAL']=normals(p,sf,original)
    # Calm the highest existing thigh folds without reducing garment ease.
    p=pants['POSITION'].copy();original=p.copy();n=pants['NORMAL'];x,y,z=p.T
    correction=-.0016*gauss(y-.865-.16*abs(x),.019)*smooth(.15,.8,n[:,2])
    correction*=smooth(.035,.065,abs(x))
    p+=n*correction[:,None]
    pants['POSITION']=p.astype('f4');pants['NORMAL']=normals(p,pf,original)
    return shirt,pants

class ClosestSurface:
    """Project garment details to the actual panel; interpolate skin weights."""
    def __init__(self,a,f):
        self.a=a;self.f=f;self.p=a['POSITION'][f];self.tree=cKDTree(self.p.mean(1))
    def sample(self,point):
        _,choices=self.tree.query(point,k=min(32,len(self.f)))
        tr=self.p[choices];a,b,c=tr[:,0],tr[:,1],tr[:,2];u=b-a;v=c-a;w=point-a
        uu=(u*u).sum(1);vv=(v*v).sum(1);uv=(u*v).sum(1);wu=(w*u).sum(1);wv=(w*v).sum(1);den=uu*vv-uv*uv
        beta=(vv*wu-uv*wv)/np.maximum(den,1e-20);gamma=(uu*wv-uv*wu)/np.maximum(den,1e-20)
        weights=np.column_stack([1-beta-gamma,beta,gamma]);points=(tr*weights[:,:,None]).sum(1)
        dist=np.linalg.norm(points-point,axis=1);dist[weights.min(1)<0]=np.inf
        allp=[points];allw=[weights];alld=[dist]
        for i,j in [(0,1),(1,2),(2,0)]:
            edge=tr[:,j]-tr[:,i];t=np.clip(((point-tr[:,i])*edge).sum(1)/np.maximum((edge*edge).sum(1),1e-20),0,1)
            q=tr[:,i]+edge*t[:,None];ew=np.zeros((len(tr),3));ew[:,i]=1-t;ew[:,j]=t
            allp.append(q);allw.append(ew);alld.append(np.linalg.norm(q-point,axis=1))
        best=np.argmin(np.concatenate(alld));group,ci=divmod(best,len(tr));ids=self.f[choices[ci]];bw=allw[group][ci]
        out={k:bw@v[ids] for k,v in self.a.items() if k not in ['JOINTS_0','WEIGHTS_0']};out['NORMAL']=normalize(out['NORMAL'])
        merged={}
        for vi,weight in zip(ids,bw):
            for bone,sw in zip(self.a['JOINTS_0'][vi],self.a['WEIGHTS_0'][vi]):merged[int(bone)]=merged.get(int(bone),0)+float(weight*sw)
        tops=sorted(merged.items(),key=lambda x:(-x[1],x[0]))[:4]
        while len(tops)<4:tops.append((0,0))
        out['JOINTS_0']=np.array([x[0] for x in tops],dtype='u2');ww=np.array([x[1] for x in tops]);out['WEIGHTS_0']=ww/ww.sum()
        return out

def constructed_bands(attrs,f,kind):
    groups,inward=boundaries(attrs,f);out={k:[] for k in attrs};faces=[];offset=0;report=[];surface=ClosestSurface(attrs,f)
    stitch={k:[] for k in attrs};stfaces=[]
    for edges in groups:
        vertices=sorted(set(v for e in edges for v in e));center=attrs['POSITION'][vertices].mean(0)
        if kind=='blouse':
            label='neck facing' if center[1]>1.4 else 'folded sleeve cuff' if abs(center[0])>.18 else 'blouse hem'
            width=.012 if center[1]>1.4 else .027 if abs(center[0])>.18 else .010
        else:
            label='waistband' if center[1]>.9 else 'trouser turn-up';width=.026 if center[1]>.9 else .022
        mapping={v:i for i,v in enumerate(vertices)};count=len(vertices)
        # Four cross-section rings round the folded edge with <1 mm height.
        for frac,height in [(0,.0007),(.08,.00135),(.92,.00135),(1,.0007)]:
            for v in vertices:
                projected=surface.sample(attrs['POSITION'][v]+inward[v]*width*frac)
                for key in attrs:
                    val=projected[key].copy()
                    if key=='POSITION':val+=projected['NORMAL']*height
                    out[key].append(val)
        for a,b in edges:
            for ring in range(3):
                aa=offset+mapping[a]+ring*count;bb=offset+mapping[b]+ring*count
                faces.extend([(aa,bb,aa+count),(bb,bb+count,aa+count)])
            # Narrow actual thread dashes, raised 0.2 mm above the cuff.
            sa=surface.sample(attrs['POSITION'][a]+inward[a]*width*.82);sb=surface.sample(attrs['POSITION'][b]+inward[b]*width*.82)
            pa=sa['POSITION']+sa['NORMAL']*.00158;pb=sb['POSITION']+sb['NORMAL']*.00158
            length=np.linalg.norm(pb-pa);num=max(1,int(length/.0032))
            for d in range(num):
                start=(d+.1)/num;end=(d+.65)/num;base=len(stitch['POSITION'])
                for t,sg in [(start,-1),(start,1),(end,-1),(end,1)]:
                    idx=a if t<.5 else b
                    position=pa*(1-t)+pb*t+(inward[a]*(1-t)+inward[b]*t)*.00022*sg
                    for key in attrs:
                        val=attrs[key][idx].copy()
                        if key=='POSITION':val=position
                        elif key=='NORMAL':val=normalize(attrs[key][a]*(1-t)+attrs[key][b]*t)
                        elif key=='TEXCOORD_0':val=attrs[key][a]*(1-t)+attrs[key][b]*t
                        stitch[key].append(val)
                stfaces.extend([(base,base+1,base+2),(base+1,base+3,base+2)])
        offset+=count*4;report.append({'name':label,'widthMm':width*1000,'vertices':count*4})
    cast=lambda dic:{k:np.asarray(v,dtype=attrs[k].dtype) for k,v in dic.items()}
    return cast(out),np.asarray(faces),cast(stitch),np.asarray(stfaces),report

def combine(items):
    out={k:[] for k in items[0][0]};faces=[];offset=0
    for a,f in items:
        for k in out:out[k].append(a[k])
        faces.append(f+offset);offset+=len(a['POSITION'])
    return {k:np.concatenate(v) for k,v in out.items()},np.concatenate(faces)

def material(name,color,roughness,sheen=None,normal=None):
    out={'name':name,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[*color,1],'metallicFactor':0,'roughnessFactor':roughness}}
    if sheen is not None:out['extensions']={'KHR_materials_sheen':{'sheenColorFactor':sheen,'sheenRoughnessFactor':.78}}
    if normal is not None:out['normalTexture']={'index':1,'scale':normal}
    return out

def build(source,output):
    raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==BASELINE_SHA,'Wrong input: use the exact accepted baseline.'
    g=GLB(source);before=copy.deepcopy(g)
    (shirt,sf),(pants,pf)=panels(g);oldshirt=shirt['POSITION'].copy();oldpants=pants['POSITION'].copy()
    shirt,pants=shaped_panels(shirt,pants,sf,pf)
    sb,sbf,ss,ssf,sbr=constructed_bands(shirt,sf,'blouse')
    pb,pbf,ps,psf,pbr=constructed_bands(pants,pf,'pants')
    pl,plf,buttons,btf=placket_and_buttons(shirt,sf)
    seams,sef=side_seams(pants,pf)
    sh,shf,_=turn_hems(shirt,sf);ph,phf,_=turn_hems(pants,pf)
    # The cream blouse creates a distinct upper-body silhouette against piano
    # lacquer. All factors are linear glTF color, not display hex values.
    mats=[material('Ivory crepe blouse — softly draped',[.71,.675,.59],.69,[.12,.105,.085]),
          material('Midnight wool trousers — pressed',[.017,.024,.034],.91,None,.14),
          material('Ivory blouse — folded facings',[.63,.60,.535],.74,[.085,.074,.059]),
          material('Midnight trousers — tailoring',[.012,.018,.025],.93),
          material('Warm pearl blouse buttons',[.64,.61,.54],.25),
          material('Ivory sewing thread',[.80,.755,.655],.93)]
    mats[4]['extensions']={'KHR_materials_clearcoat':{'clearcoatFactor':.28,'clearcoatRoughnessFactor':.22}}
    ids=[]
    for m in mats:ids.append(len(g.j['materials']));g.j['materials'].append(m)
    # Stitching on navy is kept in the navy seam batch. Blouse seam + placket
    # share a batch. Six garment primitives total, one fewer than baseline.
    binding,bindingf=combine([(sb,sbf),(pl,plf)])
    trdetail,trdetailf=combine([(pb,pbf),(seams,sef),(ps,psf)])
    prims=[(sh,shf,ids[0]),(ph,phf,ids[1]),(binding,bindingf,ids[2]),
           (trdetail,trdetailf,ids[3]),(buttons,btf,ids[4]),(ss,ssf,ids[5])]
    g.j['meshes'][1]['primitives']=[primitive(g,a,f,m) for a,f,m in prims]
    g.j['meshes'][1]['name']='tailored_concert_blouse_and_trousers'
    g.j.setdefault('extras',{})['daybreakWardrobe']={'version':2,'sourceSHA256':BASELINE_SHA,'palette':'warm ivory and midnight wool','skinChanged':False,'rigChanged':False,'dynamicCloth':False,'garment':'crepe blouse with rounded folded cuffs and facings, pearl buttons, actual seam stitches; pressed wool trousers'}
    g.j['asset']['generator']='Daybreak wardrobe v2; deterministic glTF geometry and PBR materials'
    g.save(output)
    report={'inputSHA256':BASELINE_SHA,'outputSHA256':hashlib.sha256(output.read_bytes()).hexdigest(),'outputBytes':output.stat().st_size,
            'blousePanelMaxMoveMm':float(np.linalg.norm(shirt['POSITION']-oldshirt,axis=1).max()*1000),
            'trouserPanelMaxMoveMm':float(np.linalg.norm(pants['POSITION']-oldpants,axis=1).max()*1000),
            'construction':sbr+pbr,'garmentPrimitiveCount':len(prims),
            'garmentVertices':sum(len(a['POSITION']) for a,f,m in prims),
            'garmentTriangles':sum(f.size//3 for a,f,m in prims),'nodesExact':g.j['nodes']==before.j['nodes'],
            'skinsExact':g.j['skins']==before.j['skins'],'nonGarmentMeshDefinitionsExact':all(g.j['meshes'][i]==before.j['meshes'][i] for i in range(8) if i!=1)}
    output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path);p.add_argument('--output',type=Path,default=Path(__file__).with_name('pianist-ivory.glb'));a=p.parse_args()
    build(a.input or locate_input(),a.output)
