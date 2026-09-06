"""Neutral EGL diagnostic of the exact GLB and optional Three.js posed arrays.

Material lighting is an approximation; this is not a browser/product capture.
"""
from pathlib import Path
import os, argparse, json, gzip, math, hashlib
import numpy as np
import moderngl
from PIL import Image
from glb_tools import GLB, normalize

VERT='''#version 330
in vec3 p;in vec3 n;in vec2 uv;out vec3 world;out vec3 norm;out vec2 texcoord;uniform mat4 vp;
void main(){world=p;norm=n;texcoord=uv;gl_Position=vp*vec4(p,1.);}
'''
FRAG='''#version 330
in vec3 world;in vec3 norm;in vec2 texcoord;out vec4 frag;
uniform vec3 eye;uniform vec3 base;uniform float alphaCut;uniform float roughness;uniform bool hasTex;uniform sampler2D tex;uniform bool hasNormal;uniform sampler2D normalTex;uniform float normalScale;
void main(){
 vec4 tx=hasTex?texture(tex,texcoord):vec4(1.);if(tx.a<alphaCut)discard;
 vec3 N=normalize(norm);if(!gl_FrontFacing)N=-N;
 if(hasNormal){
  vec3 dp1=dFdx(world),dp2=dFdy(world);vec2 duv1=dFdx(texcoord),duv2=dFdy(texcoord);
  vec3 dp2p=cross(dp2,N),dp1p=cross(N,dp1);vec3 T=dp2p*duv1.x+dp1p*duv2.x;vec3 B=dp2p*duv1.y+dp1p*duv2.y;
  float inv=inversesqrt(max(max(dot(T,T),dot(B,B)),1e-12));vec3 nm=texture(normalTex,texcoord).xyz*2.-1.;nm.xy*=normalScale;N=normalize(mat3(T*inv,B*inv,N)*nm);
 }
 vec3 albedo=base*tx.rgb;vec3 V=normalize(eye-world);float NV=max(dot(N,V),.001);
 vec3 col=albedo*mix(vec3(.19,.185,.175),vec3(.34,.37,.40),.5+.5*N.y);
 vec3 lights[3]=vec3[3](vec3(-2.8,4.,-3.5),vec3(2.6,2.5,1.2),vec3(-1.,2.6,2.8));
 vec3 colors[3]=vec3[3](vec3(.85,.79,.70),vec3(.39,.43,.48),vec3(.40,.38,.33));
 for(int i=0;i<3;i++){
  vec3 L=normalize(lights[i]-world);float NL=max(dot(N,L),0.);vec3 H=normalize(V+L);float NH=max(dot(N,H),0.);float VH=max(dot(V,H),0.);
  float a=pow(roughness,4.);float D=a/(3.14159*pow(NH*NH*(a-1.)+1.,2.));
  float visibility=.5/max(NL*sqrt(a+(1.-a)*NV*NV)+NV*sqrt(a+(1.-a)*NL*NL),.001);
  vec3 F=vec3(.04)+.96*pow(1.-VH,5.);col+=(albedo+D*visibility*F)*colors[i]*NL;
 }
 col=col/(1.+col*.30);col=mix(col*12.92,1.055*pow(max(col,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),col));frag=vec4(col,1.);
}
'''

def view(eye,target):
    f=normalize(np.asarray(target)-eye);r=normalize(np.cross(f,[0,1,0]));u=np.cross(r,f)
    m=np.eye(4);m[:3,:3]=[r,u,-f];m[:3,3]=-m[:3,:3]@eye;return m

def render(asset,output,pose=None,kind='front',size=1000):
    libs=os.environ.get('DAYBREAK_EGL_ROOT')
    args={'backend':'egl','require':330}
    if libs:args.update(libegl=str(Path(libs)/'usr/lib/x86_64-linux-gnu/libEGL.so.1'),libgl='libGL.so.1')
    ctx=moderngl.create_standalone_context(**args);g=GLB(asset)
    pp=json.loads(gzip.decompress(pose.read_bytes())) if pose else None
    if pp:
        target=np.array([0,.95,.48]);eye=np.array([1.8,1.48,-1.35]);height=1.24
        if kind=='side':eye=np.array([2.4,1.1,.9]);target=np.array([0,.95,.48]);height=1.30
        elif kind=='detail':eye=np.array([1.6,1.35,-1.8]);target=np.array([0,1.02,.55]);height=.69
        elif kind=='face':eye=np.array([1.2,1.5,-2.1]);target=np.array([0,1.34,.46]);height=.40
    else:
        eye=np.array([1.5,1.8,3.]);target=np.array([0,1.20,.04]);height=1.24
        if kind=='detail':target=np.array([0,1.285,.08]);height=.65
    projection=np.eye(4);projection[0,0]=2/height;projection[1,1]=2/height;projection[2,2]=-2/20;projection[2,3]=-1
    prog=ctx.program(vertex_shader=VERT,fragment_shader=FRAG);prog['vp'].write((projection@view(eye,target)).T.astype('f4').tobytes());prog['eye']=tuple(eye);prog['tex']=0;prog['normalTex']=1
    c=ctx.renderbuffer((size,size),4,samples=4);depth=ctx.depth_renderbuffer((size,size),samples=4);fbo=ctx.framebuffer([c],depth)
    resolved=ctx.framebuffer([ctx.texture((size,size),4)]);fbo.use();fbo.clear(.165,.181,.197,1,depth=1);ctx.enable(moderngl.DEPTH_TEST);ctx.disable(moderngl.CULL_FACE|moderngl.BLEND)
    textures={}
    def texture(i,srgb):
        key=(i,srgb)
        if key not in textures:
            im=g.texture(i) if i is not None else Image.new('RGBA',(1,1),(255,255,255,255))
            t=ctx.texture(im.size,4,im.tobytes(),internal_format=0x8C43 if srgb else 0x8058);t.build_mipmaps();t.filter=(moderngl.LINEAR_MIPMAP_LINEAR,moderngl.LINEAR);textures[key]=t
        return textures[key]
    for mi,mesh in enumerate(g.j['meshes']):
        for pi,pr in enumerate(mesh['primitives']):
            a=pr['attributes'];pos=g.arr(a['POSITION']);norm=g.arr(a['NORMAL']);indices=g.arr(pr['indices']).reshape(-1)
            if pp:
                posed=pp['meshes'][f'{mi}:{pi}'];pos=np.asarray(posed['position']).reshape(-1,3);norm=np.asarray(posed['normal']).reshape(-1,3)
                if posed.get('indices') is not None:indices=np.asarray(posed['indices'])
            uv=g.arr(a['TEXCOORD_0']);mat=g.j['materials'][pr['material']];pbr=mat.get('pbrMetallicRoughness',{})
            prog['base']=tuple(pbr.get('baseColorFactor',[1,1,1,1])[:3]);prog['roughness']=pbr.get('roughnessFactor',.7)
            prog['alphaCut']=mat.get('alphaCutoff',.5) if mat.get('alphaMode')=='MASK' else 0
            tex=pbr.get('baseColorTexture');normal=mat.get('normalTexture');prog['hasTex']=tex is not None;prog['hasNormal']=normal is not None;prog['normalScale']=normal.get('scale',1) if normal else 1
            texture(tex['index'] if tex else None,True).use(0);texture(normal['index'] if normal else None,False).use(1)
            vb=ctx.buffer(np.hstack([pos,norm,uv]).astype('f4').tobytes());ib=ctx.buffer(indices.astype('i4').tobytes());vao=ctx.vertex_array(prog,[(vb,'3f 3f 2f','p','n','uv')],ib);vao.render();vao.release();vb.release();ib.release()
    ctx.copy_framebuffer(resolved,fbo);Image.frombytes('RGBA',(size,size),resolved.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB').save(output)
    digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    manifest={'image':output.name,'imageSHA256':digest(output),'assetSHA256':digest(asset),'renderer':ctx.info['GL_RENDERER'],'poseTime':pp['time'] if pp else None,'poseSHA256':digest(pose) if pose else None,'view':kind,'eye':eye.tolist(),'target':target.tolist(),'orthographicHeight':height,'width':size,'height':size,'scope':'Neutral offline material lighting; exact GLB and Three.js skinned arrays; not browser parity.'}
    output.with_suffix('.render.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest));ctx.release()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('asset',type=Path);p.add_argument('output',type=Path);p.add_argument('--pose',type=Path);p.add_argument('--view',default='front',choices=['front','side','detail','face']);p.add_argument('--size',type=int,default=1000);a=p.parse_args();render(a.asset,a.output,a.pose,a.view,a.size)
