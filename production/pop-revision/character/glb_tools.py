"""Small reproducible glTF utilities; NumPy and Pillow only."""
import copy, io, json, struct
from pathlib import Path
import numpy as np
from PIL import Image

DT={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
class GLB:
    def __init__(self,path):
        raw=Path(path).read_bytes();magic,version,length=struct.unpack_from('<III',raw)
        assert magic==0x46546c67 and version==2 and length==len(raw)
        n,t=struct.unpack_from('<II',raw,12);self.j=json.loads(raw[20:20+n]);n2,t2=struct.unpack_from('<II',raw,20+n)
        self.b=bytearray(raw[28+n:28+n+n2])
    def view(self,i):
        v=self.j['bufferViews'][i];s=v.get('byteOffset',0);return bytes(self.b[s:s+v['byteLength']])
    def arr(self,i):
        a=self.j['accessors'][i];dt=np.dtype(DT[a['componentType']]);nc=NC[a['type']]
        if 'bufferView' in a:
            v=self.j['bufferViews'][a['bufferView']];start=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',dt.itemsize*nc)
            ar=np.ndarray((a['count'],nc),dt,buffer=self.b,offset=start,strides=(stride,dt.itemsize)).copy()
        else: ar=np.zeros((a['count'],nc),dt)
        if 'sparse' in a:
            s=a['sparse'];ii=s['indices'];idx=np.frombuffer(self.view(ii['bufferView']),DT[ii['componentType']],count=s['count'],offset=ii.get('byteOffset',0));vv=s['values'];values=np.frombuffer(self.view(vv['bufferView']),dt,count=s['count']*nc,offset=vv.get('byteOffset',0)).reshape(-1,nc);ar[idx]=values
        return ar
    def addview(self,data,target=None):
        self.b.extend(b'\0'*((-len(self.b))%4));idx=len(self.j['bufferViews']);v={'buffer':0,'byteOffset':len(self.b),'byteLength':len(data)}
        if target:v['target']=target
        self.j['bufferViews'].append(v);self.b.extend(data);return idx
    def addarr(self,ar,kind='VEC3',component=5126,sparse=False,target=None):
        ar=np.asarray(ar,dtype=DT[component]).reshape(-1,NC[kind]);a={'componentType':component,'count':len(ar),'type':kind}
        if kind=='VEC3':a.update(min=ar.min(0).tolist(),max=ar.max(0).tolist())
        nonzero=np.flatnonzero(np.any(ar!=0,axis=1))
        if sparse and len(nonzero)>0 and len(nonzero)/len(ar)<.85:
            typ=5123 if len(ar)<65536 else 5125
            a['sparse']={'count':len(nonzero),'indices':{'bufferView':self.addview(nonzero.astype(DT[typ]).tobytes()),'componentType':typ},'values':{'bufferView':self.addview(ar[nonzero].tobytes())}}
        else:a['bufferView']=self.addview(ar.tobytes(),target)
        self.j['accessors'].append(a);return len(self.j['accessors'])-1
    def texture(self,i):
        im=self.j['images'][self.j['textures'][i]['source']];return Image.open(io.BytesIO(self.view(im['bufferView']))).convert('RGBA')
    def save(self,path):
        self.b.extend(b'\0'*((-len(self.b))%4));self.j['buffers']=[{'byteLength':len(self.b)}];j=json.dumps(self.j,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
        Path(path).write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(self.b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(self.b),0x004e4942)+self.b)

def normalize(x):return x/np.maximum(np.linalg.norm(x,axis=-1,keepdims=True),1e-12)

def render(path,out,center=(0,1.62,.1),height=.38,azimuth=0,size=800,expressions=None):
    """Orthographic CPU diagnostic render, diffuse shading; not the product renderer."""
    g=GLB(path);w=h=size;rad=np.radians(azimuth);right=np.array([np.cos(rad),0,-np.sin(rad)]);up=np.array([0,1,0]);forward=np.array([np.sin(rad),0,np.cos(rad)]);center=np.array(center)
    rgb=np.zeros((h,w,3))+np.array([.045,.055,.075]);zbuf=np.full((h,w),-np.inf);light=normalize(np.array([-.4,.7,1.]));fill=normalize(np.array([.8,.1,.5]));eyes={}
    for m in g.j['meshes']:
      for p in m['primitives']:
        pos=g.arr(p['attributes']['POSITION']).astype(float);norm=g.arr(p['attributes']['NORMAL']).astype(float);uv=g.arr(p['attributes']['TEXCOORD_0']);tris=g.arr(p['indices']).reshape(-1,3)
        names=m.get('extras',{}).get('targetNames',[])
        for name,value in (expressions or {}).items():
            if name in names:
                t=p['targets'][names.index(name)];pos+=g.arr(t['POSITION'])*value
                if 'NORMAL'in t:norm+=g.arr(t['NORMAL'])*value
        mat=g.j['materials'][p['material']];pbr=mat.get('pbrMetallicRoughness',{});factor=np.array(pbr.get('baseColorFactor',[1,1,1,1]));tex=np.asarray(g.texture(pbr['baseColorTexture']['index']))/255 if 'baseColorTexture'in pbr else None
        xy=np.stack([(pos-center)@right*w/height+w/2,h/2-(pos-center)@up*h/height],axis=1);zz=(pos-center)@forward
        for ids in tris:
            q=xy[ids];lo=np.maximum(np.floor(q.min(0)).astype(int),0);hi=np.minimum(np.ceil(q.max(0)).astype(int),[w-1,h-1]);
            if np.any(lo>hi):continue
            a,b,c=q;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if abs(den)<1e-10:continue
            xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5);v0=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;v1=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;v2=1-v0-v1;weights=np.stack([v0,v1,v2],-1);depth=weights@zz[ids]
            region=np.s_[lo[1]:hi[1]+1,lo[0]:hi[0]+1];mask=(weights.min(-1)>=-1e-7)&(depth>zbuf[region]);
            if not mask.any():continue
            texc=weights@uv[ids]
            if tex is not None:
                ty=np.clip((texc[...,1]*tex.shape[0]).astype(int),0,tex.shape[0]-1);tx=np.clip((texc[...,0]*tex.shape[1]).astype(int),0,tex.shape[1]-1);color=tex[ty,tx]*factor
            else:color=np.broadcast_to(factor,(*mask.shape,4))
            if mat.get('alphaMode')=='MASK':mask&=color[...,3]>=mat.get('alphaCutoff',.5)
            n=normalize(weights@norm[ids]);diff=.28+.63*np.maximum(n@light,0)+.14*np.maximum(n@fill,0);lin=np.power(color[...,:3],2.2)*diff[...,None];rgb[region][mask]=lin[mask];zbuf[region][mask]=depth[mask]
    Image.fromarray(np.uint8(np.clip(np.power(rgb,1/2.2),0,1)*255)).save(out)

if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser();ap.add_argument('glb');ap.add_argument('out');ap.add_argument('--azimuth',type=float,default=0);ap.add_argument('--height',type=float,default=.38);ap.add_argument('--cy',type=float,default=1.62);ap.add_argument('--size',type=int,default=800);a=ap.parse_args();render(a.glb,a.out,center=(0,a.cy,.1),height=a.height,azimuth=a.azimuth,size=a.size)
