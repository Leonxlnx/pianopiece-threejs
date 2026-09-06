import os,json,time,subprocess,base64,math,ctypes.util
from pathlib import Path
import numpy as np
from PIL import Image
import moderngl
SOURCE=Path(__file__).resolve().parent
PROJECT=SOURCE.parent.parent
ROOT=Path(os.environ.get('DAYBREAK_QA_ROOT',str(PROJECT/'work/render-qa')));ROOT.mkdir(parents=True,exist_ok=True)
EGL=os.environ.get('DAYBREAK_EGL_ROOT')
egl_library=str(Path(EGL)/'usr/lib/x86_64-linux-gnu/libEGL.so.1') if EGL else ctypes.util.find_library('EGL') or 'libEGL.so.1'
ctx=moderngl.create_standalone_context(backend='egl',require=330,libegl=egl_library,libgl='libGL.so.1')
print('RENDERER',ctx.info['GL_RENDERER'],flush=True)
server=subprocess.Popen(['node',str(SOURCE/'pose-server.mjs')],cwd=PROJECT,stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
ready=json.loads(server.stdout.readline());d=json.load(open(ready['scene']))
W=int(os.environ.get('WIDTH','1280'));H=round(W/float(os.environ.get('DAYBREAK_ASPECT',16/9)))
vert='''#version 330
in vec3 in_pos;in vec3 in_norm;in vec2 in_uv;in vec3 in_color;out vec3 vertexTint;uniform mat4 model;uniform mat4 vp;uniform mat4 shadowVP[2];out vec3 world;out vec3 norm;out vec2 uv;out vec4 sh[2];
void main(){vec4 p=model*vec4(in_pos,1.);world=p.xyz;norm=mat3(transpose(inverse(model)))*in_norm;uv=in_uv;vertexTint=in_color;gl_Position=vp*p;sh[0]=shadowVP[0]*vec4(p.xyz+normalize(norm)*.004,1.);sh[1]=shadowVP[1]*vec4(p.xyz+normalize(norm)*.006,1.);}
'''
frag='''#version 330
in vec3 world;in vec3 norm;in vec2 uv;in vec3 vertexTint;in vec4 sh[2];out vec4 color;
uniform mat4 viewMatrix;uniform vec3 hemiSky;uniform vec3 hemiGround;uniform vec3 hemiDirection;uniform vec3 fogColor;uniform float fogDensity;uniform float envIntensity;uniform float lightDistance[4];uniform float lightDecay[4];uniform bool useShadows;uniform float coatRough;uniform int envMode;uniform sampler2DArray envAtlas;
uniform vec3 eye;uniform vec3 base;uniform float rough;uniform float metal;uniform float coat;uniform vec3 emissive;uniform float opacity;uniform float alphaTest;uniform sampler2D tex;uniform bool hasTex;uniform sampler2D normalTex;uniform bool hasNormal;uniform vec2 normalScale;uniform vec2 uvRepeat;uniform vec2 uvOffset;
uniform vec3 lightPos[4];uniform vec3 lightColor[4];uniform vec3 lightDir[4];uniform float lightIntensity[4];uniform vec2 cone[4];uniform sampler2DShadow shadow0;uniform sampler2DShadow shadow1;uniform float lift;uniform bool basic;uniform bool reflectionPass;uniform bool floorMirror;uniform sampler2D reflectionTex;uniform mat4 reflectionVP;
const float PI=3.14159265;
vec3 sky(vec3 p){float h=smoothstep(-.06,.75,p.y);vec3 horizon=mix(vec3(.38,.46,.50),vec3(.66,.64,.57),lift);vec3 zenith=mix(vec3(.13,.25,.37),vec3(.24,.39,.51),lift);return mix(horizon,zenith,h)+vec3(.25,.18,.09)*pow(max(0.,dot(p,normalize(vec3(-.63,.25,-.74)))),52.);}
// The atlas stores 6 faces for each of nine uniformly spaced roughness levels.
vec3 atlasSample(vec3 d,float roughness){
 vec3 ad=abs(d);vec2 p;float face;
 if(ad.x>=ad.y&&ad.x>=ad.z){if(d.x>0.){face=0.;p=vec2(-d.z,-d.y)/ad.x;}else{face=1.;p=vec2(d.z,-d.y)/ad.x;}}
 else if(ad.y>=ad.z){if(d.y>0.){face=2.;p=vec2(d.x,d.z)/ad.y;}else{face=3.;p=vec2(d.x,-d.z)/ad.y;}}
 else{if(d.z>0.){face=4.;p=vec2(d.x,-d.y)/ad.z;}else{face=5.;p=vec2(-d.x,-d.y)/ad.z;}}
 vec2 q=p*.5+.5;float level=clamp(roughness,0.,1.)*8.;float lo=floor(level),hi=min(lo+1.,8.);
 return mix(texture(envAtlas,vec3(q,face+6.*lo)).rgb,texture(envAtlas,vec3(q,face+6.*hi)).rgb,fract(level));
}
vec3 environment(vec3 direction,float roughness){if(envMode==0)return vec3(0.);if(envMode==1)return sky(direction);return atlasSample(direction,roughness);}
vec2 envBRDF(float roughness,float NV){
 // Analytic split-sum approximation; source Three.js uses a DFG lookup texture.
 vec4 q=roughness*vec4(-1.,-.0275,-.572,.022)+vec4(1.,.0425,1.04,-.04);
 float ab=min(q.x*q.x,exp2(-9.28*NV))*q.x+q.y;return vec2(-1.04,1.04)*ab+q.zw;
}
float shadowFactor(int i,vec3 N,vec3 L){vec3 p=sh[i].xyz/sh[i].w*.5+.5;if(sh[i].w<=0.||p.z<0.||p.z>1.||p.x<0.||p.x>1.||p.y<0.||p.y>1.)return 1.;float bias=i==0?.00018:.0002;float sum=0.;for(int a=-1;a<=1;a++)for(int b=-1;b<=1;b++){vec3 q=vec3(p.xy+vec2(a,b)/2048.,p.z-bias);sum+=i==0?texture(shadow0,q):texture(shadow1,q);}return sum/9.;}
vec3 fresnel(float c,vec3 f){return f+(1.-f)*pow(clamp(1.-c,0.,1.),5.);}
void main(){if(reflectionPass&&world.y<.008)discard;vec4 tx=hasTex?texture(tex,uv*uvRepeat+uvOffset):vec4(1);if(tx.a*opacity<max(alphaTest,.08))discard;vec3 albedo=base*vertexTint*tx.rgb;vec3 N=normalize(norm);if(hasNormal){vec3 dp1=dFdx(world),dp2=dFdy(world);vec2 duv1=dFdx(uv),duv2=dFdy(uv);vec3 dp2perp=cross(dp2,N),dp1perp=cross(N,dp1);vec3 T=dp2perp*duv1.x+dp1perp*duv2.x;vec3 B=dp2perp*duv1.y+dp1perp*duv2.y;float inv=inversesqrt(max(max(dot(T,T),dot(B,B)),1e-12));vec3 nm=texture(normalTex,uv*uvRepeat+uvOffset).xyz*2.-1.;nm.xy*=normalScale;N=normalize(mat3(T*inv,B*inv,N)*nm);}if(!gl_FrontFacing)N=-N;vec3 V=normalize(eye-world);float NV=max(dot(N,V),.001);vec3 F0=mix(vec3(.04),albedo,metal);vec3 dn=max(abs(dFdx(normalize(norm))),abs(dFdy(normalize(norm))));float gr=max(max(dn.x,dn.y),dn.z);float r=min(max(rough,.0525)+gr,1.);float a=r*r;float a2=a*a;
vec3 hemi=mix(hemiGround,hemiSky,.5*dot(N,hemiDirection)+.5);
vec3 result=albedo*(1.-metal)*hemi/PI;
vec3 R=reflect(-V,N);vec3 envspec=environment(normalize(mix(R,N,pow(r,4.))),r)*envIntensity;
vec3 diffuseEnv=environment(N,1.)*envIntensity;
vec2 fab=envBRDF(r,NV);vec3 single=F0*fab.x+fab.y;float missing=1.-fab.x-fab.y;
vec3 favg=F0+(1.-F0)/21.;vec3 multi=single*favg/max(vec3(1.)-missing*favg,vec3(.001));
vec3 scatter=single+multi*missing;vec3 diffuse=(1.-metal)*albedo*(1.-max(max(scatter.x,scatter.y),scatter.z));
result+=envspec*single+diffuseEnv*(multi*missing+diffuse);
float cr=min(max(coatRough,.0525)+gr,1.);vec2 cfab=envBRDF(cr,NV);
vec3 cc=environment(normalize(mix(R,N,pow(cr,4.))),cr)*envIntensity*(.04*cfab.x+cfab.y);
for(int i=0;i<4;i++){vec3 to=lightPos[i]-world;float dist=length(to);vec3 L=to/dist;float NL=max(dot(N,L),0.);vec3 H=normalize(V+L);float NH=max(dot(N,H),0.);float VH=max(dot(V,H),0.);float D=a2/(PI*pow(NH*NH*(a2-1.)+1.,2.));float vis=.5/max(NL*sqrt(a2+(1.-a2)*NV*NV)+NV*sqrt(a2+(1.-a2)*NL*NL),.000001);vec3 F=fresnel(VH,F0);vec3 spec=D*vis*F;float spot=i<3?smoothstep(cone[i].x,cone[i].y,dot(-L,lightDir[i])):1.;float shade=useShadows&&(i==0||i==2)?shadowFactor(i==0?0:1,N,L):1.;float attenuation=1./max(pow(dist,lightDecay[i]),.01);if(lightDistance[i]>0.)attenuation*=pow(clamp(1.-pow(dist/lightDistance[i],4.),0.,1.),2.);vec3 radiance=lightColor[i]*lightIntensity[i]*attenuation*spot;
result+=((1.-metal)*albedo/PI+spec)*radiance*NL*shade;
float ca2=pow(cr,4.);float cD=ca2/(PI*pow(NH*NH*(ca2-1.)+1.,2.));float cvis=.5/max(NL*sqrt(ca2+(1.-ca2)*NV*NV)+NV*sqrt(ca2+(1.-ca2)*NL*NL),.000001);cc+=cD*cvis*fresnel(VH,vec3(.04))*radiance*NL*shade;}
result=result*(1.-coat*fresnel(NV,vec3(.04)))+coat*cc+emissive;if(basic)result=base*vertexTint*tx.rgb;if(floorMirror&&!reflectionPass&&world.y>-.01){vec4 rh=reflectionVP*vec4(world,1.);vec2 ru=rh.xy/rh.w*.5+.5;vec3 rc=texture(reflectionTex,ru).rgb;result=mix(result,rc*.38,.35);}float fogDepth=max(0.,-(viewMatrix*vec4(world,1.)).z);float fog=1.-exp(-fogDensity*fogDensity*fogDepth*fogDepth);result=mix(result,fogColor,fog);color=vec4(result,tx.a*opacity);}
'''
prog=ctx.program(vertex_shader=vert,fragment_shader=frag)
shadowprog=ctx.program(vertex_shader='''#version 330
in vec3 in_pos;in vec2 in_uv;uniform mat4 model;uniform mat4 vp;out vec2 uv;void main(){uv=in_uv;gl_Position=vp*model*vec4(in_pos,1.);}''',fragment_shader='''#version 330
in vec2 uv;uniform sampler2D tex;uniform bool hasTex;uniform float alphaTest;void main(){if(hasTex&&texture(tex,uv).a<max(alphaTest,.08))discard;}''')
quadvert='''#version 330
in vec2 p;out vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0,1);}'''
bgprog=ctx.program(vertex_shader=quadvert,fragment_shader='''#version 330
in vec2 uv;out vec4 color;uniform mat4 invVP;uniform vec3 eye;uniform float lift;
'''+frag[frag.index('vec3 sky('):frag.index('// The atlas')]+'''
void main(){vec4 h=invVP*vec4(uv*2.-1.,1.,1.);vec3 ray=normalize(h.xyz/h.w-eye);color=vec4(sky(ray),1.);}''')
postprog=ctx.program(vertex_shader=quadvert,fragment_shader='''#version 330
in vec2 uv;out vec4 color;uniform sampler2D tex;uniform vec2 pixel;uniform float exposure;uniform float bloomStrength;uniform float bloomThreshold;
// ACES fit and matrices match the installed Three.js tonemapping shader.
vec3 aces(vec3 c){
 const mat3 inputMat=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));
 const mat3 outputMat=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));
 c=inputMat*(c*exposure/.6);c=(c*(c+.0245786)-.000090537)/(c*(.983729*c+.4329510)+.238081);return clamp(outputMat*c,0.,1.);
}
vec3 srgb(vec3 c){return mix(1.055*pow(c,vec3(1./2.4))-.055,c*12.92,lessThanEqual(c,vec3(.0031308)));}
void main(){vec3 c=texture(tex,uv).rgb;vec3 bloom=vec3(0);for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){vec3 q=texture(tex,uv+vec2(x,y)*pixel*3.).rgb;float l=dot(q,vec3(.2126,.7152,.0722));bloom+=q*smoothstep(bloomThreshold,bloomThreshold+.01,l)/25.;}color=vec4(srgb(aces(c+bloom*bloomStrength)),1.);}''')
quad=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes());bgvao=ctx.simple_vertex_array(bgprog,quad,'p');postvao=ctx.simple_vertex_array(postprog,quad,'p')
def mat4(a):return np.array(a,dtype='f4').reshape(4,4).T
def norm(v):return v/(np.linalg.norm(v)+1e-20)
def perspective(fov,asp,near=.03,far=180):
 f=1/math.tan(math.radians(fov)/2);return np.array([[f/asp,0,0,0],[0,f,0,0],[0,0,(far+near)/(near-far),2*far*near/(near-far)],[0,0,-1,0]],dtype='f4')
def lookat(eye,target):
 f=norm(np.array(target)-eye);r=norm(np.cross(f,[0,1,0]));u=np.cross(r,f);m=np.eye(4,dtype='f4');m[:3,:3]=[r,u,-f];m[:3,3]=-m[:3,:3]@eye;return m
textures={}
def texture(path,color=True,flip=False,anisotropy=4):
 key=(path,color,flip,anisotropy)
 if key not in textures:
  im=Image.open(PROJECT/path if path and not Path(path).is_absolute() else path).convert('RGBA') if path else Image.new('RGBA',(1,1),(255,255,255,255))
  if flip:im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
  tx=ctx.texture(im.size,4,im.tobytes(),internal_format=0x8C43 if color else 0x8058)
  tx.build_mipmaps();tx.filter=(moderngl.LINEAR_MIPMAP_LINEAR,moderngl.LINEAR);tx.anisotropy=min(anisotropy,ctx.max_anisotropy)
  textures[key]=tx
 return textures[key]
for m in d['materials']:
 stageMap=bool(m['map'] and str(m['map']).startswith('public/'))
 m['_tex']=texture(m['map'],True,m.get('mapFlipY',stageMap),m.get('mapAnisotropy',8 if stageMap else 4))
 m['_normal']=texture(m.get('normal'),False,m.get('normalFlipY',False),m.get('normalAnisotropy',4))
def linear_color(hexcode):
 c=np.array([(hexcode>>16)&255,(hexcode>>8)&255,hexcode&255],dtype='f4')/255
 return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def normals(v,idx):
 n=np.zeros_like(v);tris=idx.reshape(-1,3);tn=np.cross(v[tris[:,1]]-v[tris[:,0]],v[tris[:,2]]-v[tris[:,0]]);np.add.at(n,tris[:,0],tn);np.add.at(n,tris[:,1],tn);np.add.at(n,tris[:,2],tn);return n/np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-20)
meshes=[]
for m in d['meshes']:
 v=np.array(m['vertices'],dtype='f4').reshape(-1,3);idx=np.array(m['indices'],dtype='i4');n=np.array(m['normals'],dtype='f4').reshape(-1,3) if m.get('normals') else normals(v,idx);uv=np.array(m['uvs'],dtype='f4').reshape(-1,2) if m['uvs'] else np.zeros((len(v),2),'f4');vc=np.array(m['colors'],dtype='f4').reshape(-1,3) if m.get('colors') else np.ones((len(v),3),'f4');inter=np.hstack([v,n,uv,vc]).astype('f4');vb=ctx.buffer(inter.tobytes());ib=ctx.buffer(idx.tobytes());vao=ctx.vertex_array(prog,[(vb,'3f 3f 2f 3f','in_pos','in_norm','in_uv','in_color')],ib);sv=ctx.vertex_array(shadowprog,[(vb,'3f 12x 2f 12x','in_pos','in_uv')],ib);meshes.append({'source':m,'data':inter,'vb':vb,'vao':vao,'sv':sv,'matrix':mat4(m['matrix']),'idx':idx})
lineprog=ctx.program(vertex_shader="""#version 330
in vec3 in_pos;in vec3 in_color;out vec3 c;uniform mat4 vp;uniform mat4 model;void main(){c=in_color;gl_Position=vp*model*vec4(in_pos,1.);}""",fragment_shader="""#version 330
in vec3 c;out vec4 color;uniform float opacity;void main(){color=vec4(c*.68,opacity);}""")
lineobjects=[]
for m in d.get('lines',[]):
 v=np.array(m['vertices'],dtype='f4').reshape(-1,3);c=np.array(m['colors'],dtype='f4').reshape(-1,3) if m['colors'] else np.tile(m['color'],(len(v),1));buf=ctx.buffer(np.hstack([v,c]).astype('f4').tobytes());va=ctx.simple_vertex_array(lineprog,buf,'in_pos','in_color');lineobjects.append((va,mat4(m['matrix']),m['opacity']))
dustprog=ctx.program(vertex_shader="""#version 330
in vec3 in_pos;in float in_size;in float in_seed;uniform float t;uniform mat4 view;uniform mat4 projection;out float alpha;void main(){vec3 p=in_pos;p.x+=sin(t*.085+in_seed)*.18;p.y+=sin(t*.06+in_seed*2.)*.14;p.z+=cos(t*.035+in_seed)*.2;vec4 mv=view*vec4(p,1.);gl_Position=projection*mv;gl_PointSize=clamp(in_size*17./(-mv.z),.7,3.5);alpha=.18+.35*pow(sin(in_seed+t*.11),2.);}""",fragment_shader="""#version 330
in float alpha;out vec4 color;uniform float lift;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*alpha;color=vec4(mix(vec3(.68,.79,.9),vec3(1.,.8,.52),lift),a*.55);}""")
dustobjects=[]
for m in d.get('points',[]):
 v=np.array(m['vertices'],dtype='f4').reshape(-1,3);buf=ctx.buffer(np.column_stack([v,m['sizes'],m['seeds']]).astype('f4').tobytes());dustobjects.append(ctx.simple_vertex_array(dustprog,buf,'in_pos','in_size','in_seed'))
shadows=[];shadowVP=[]
for i in [0,2]:
 l=d['lights'][i];vp=perspective(math.degrees(l['angle']*2),1,.5,25 if i==0 else 40)@lookat(np.array(l['position']),l['target']);shadowVP.append(vp);depth=ctx.depth_texture((2048,2048));depth.compare_func='<=';depth.filter=(moderngl.LINEAR,moderngl.LINEAR);depth.repeat_x=False;depth.repeat_y=False;shadows.append((depth,ctx.framebuffer(depth_attachment=depth)))
color=ctx.texture((W,H),4,dtype='f2');resolved=ctx.framebuffer([color]);msColor=ctx.renderbuffer((W,H),4,samples=4,dtype='f2');depth=ctx.depth_renderbuffer((W,H),samples=4);fbo=ctx.framebuffer([msColor],depth);refl=ctx.texture((W//2,H//2),4,dtype='f2');refl.filter=(moderngl.LINEAR,moderngl.LINEAR);reflfbo=ctx.framebuffer([refl],ctx.depth_renderbuffer((W//2,H//2)));dummy=ctx.texture((1,1),4,bytes([0,0,0,255]));outtex=ctx.texture((W,H),4);outfbo=ctx.framebuffer([outtex]);prog['tex']=0;prog['normalTex']=4;prog['shadow0']=1;prog['shadow1']=2;prog['reflectionTex']=3;postprog['tex']=0;prog['normalTex']=4;postprog['pixel']=(1/W,1/H)
# Source defaults are fallbacks for legacy frozen scene exports.
hemi=d.get('hemisphere',{'skyColor':linear_color(0xc2d5e2).tolist(),'groundColor':linear_color(0x5f4934).tolist(),'direction':[0,1,0],'intensity':.56})
prog['hemiSky']=tuple(np.array(hemi['skyColor'])*hemi['intensity']);prog['hemiGround']=tuple(np.array(hemi['groundColor'])*hemi['intensity']);prog['hemiDirection']=tuple(hemi['direction'])
settings=d.get('renderSettings',{})
prog['fogColor']=tuple(settings.get('fogColor',linear_color(0x687c85)));prog['fogDensity']=settings.get('fogDensity',.006)
prog['lightDistance'].write(np.array([l.get('distance',v) for l,v in zip(d['lights'],[25,24,40,4])],dtype='f4').tobytes());prog['lightDecay'].write(np.array([l.get('decay',2) for l in d['lights']],dtype='f4').tobytes())
prog['useShadows']=True;prog['envIntensity']=.78;prog['envMode']=1;prog['envAtlas']=5
envAtlas=ctx.texture_array((1,1,54),3,np.zeros((54,1,1,3),dtype='f2').tobytes(),dtype='f2');envAtlas.use(5)
postprog['exposure']=settings.get('toneMappingExposure',1.02);postprog['bloomStrength']=float(os.environ.get('DAYBREAK_QA_BLOOM',.22));postprog['bloomThreshold']=1.3
prog['shadowVP'].write(np.stack(shadowVP).transpose(0,2,1).astype('f4').tobytes())
prog['lightPos'].write(np.array([l['position'] for l in d['lights']],dtype='f4').tobytes());prog['lightColor'].write(np.array([l['color'] for l in d['lights']],dtype='f4').tobytes());prog['lightDir'].write(np.array([norm(np.array(l['target'])-l['position']) if l['target'] else [0,0,0] for l in d['lights'][:3]],dtype='f4').tobytes());prog['cone'].write(np.array([[math.cos(l.get('angle',1)),math.cos(l.get('angle',1)*(1-l.get('penumbra',0)))] for l in d['lights'][:3]],dtype='f4').tobytes())
def draw_mesh(ob,pr,shadow=False):
 if shadow and not ob['source'].get('castShadow',False):return
 pr['model'].write(ob['matrix'].T.astype('f4').tobytes());m=ob['source'];groups=m['groups'] if len(m['materials'])>1 and m['groups'] else [{'start':0,'count':len(ob['idx']),'materialIndex':0}]
 for g in groups:
  mat=d['materials'][m['materials'][g['materialIndex'] if len(m['materials'])>1 else 0]]
  if shadow and mat['alpha']<.5:continue
  mat['_tex'].use(0);pr['hasTex']=bool(mat['map']);pr['alphaTest']=mat['alphaTest']
  if not shadow:
   mat['_normal'].use(4);pr['hasNormal']=bool(mat.get('normal'));pr['normalScale']=tuple(mat.get('normalScale',[1,1]));pr['uvRepeat']=tuple(mat.get('uvRepeat',[1,1]));pr['uvOffset']=tuple(mat.get('uvOffset',[0,0]))
  if not shadow:
   pr['basic']=mat.get('basic',False);pr['floorMirror']=False
   # Source materials use scene.environment, whose intensity replaces the
   # per-material default in Three's WebGLRenderer.
   pr['envIntensity']=float(settings.get('environmentIntensity',.78))
   pr['coatRough']=mat.get('clearcoatRoughness',.39 if mat['name']=='Satin walnut' else .095 if mat['clearcoat']==1 and mat['roughness']==.2 else .10 if mat['clearcoat']==1 and mat['roughness']==.23 else 0.)
   for key,mkey in [('base','color'),('rough','roughness'),('metal','metalness'),('coat','clearcoat'),('emissive','emissive'),('opacity','alpha')]:pr[key].value=tuple(np.array(mat[mkey])*mat.get('emissiveIntensity',1)) if mkey=='emissive' else tuple(mat[mkey]) if isinstance(mat[mkey],list) else mat[mkey]
  (ob['sv'] if shadow else ob['vao']).render(moderngl.TRIANGLES,vertices=g['count'],first=g['start'])
# A linear six-face pavilion capture, filtered with 128 GGX importance samples.
# The capture excludes piano, performer, reflector and particles, matching scene.ts.
# This uses a regular 9-level array atlas rather than Three.js CubeUV/VNDF PMREM.
def cube_view(position, direction, up):
 f=norm(np.array(direction,dtype='f4'));r=norm(np.cross(f,up));u=np.cross(r,f)
 m=np.eye(4,dtype='f4');m[:3,:3]=[r,u,-f];m[:3,3]=-m[:3,:3]@position;return m
CUBE_DIRECTIONS=[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)]
CUBE_UPS=[(0,-1,0),(0,-1,0),(0,0,1),(0,0,-1),(0,-1,0),(0,-1,0)]

def capture_environment():
 global envAtlas
 began=time.perf_counter();captureSettings=d.get('environmentCapture',{})
 size=int(os.environ.get('DAYBREAK_ENV_SIZE',captureSettings.get('size',256)))
 filteredSize=int(os.environ.get('DAYBREAK_ENV_FILTER_SIZE',128))
 position=np.array(captureSettings.get('position',[0,1.15,-.45]),dtype='f4')
 stage=[ob for ob in meshes if ob['source'].get('stage',all(d['materials'][mi]['name'] and not d['materials'][mi]['name'].startswith('Human.') for mi in ob['source']['materials']))]
 captureLift=float(captureSettings.get('lift',0));prog['envMode']=0;prog['useShadows']=True;prog['reflectionPass']=False;prog['lift']=captureLift
 prog['lightIntensity'].write(np.array(captureSettings.get('lightIntensities',[112,62,330,.2]),dtype='f4').tobytes())
 ctx.enable(moderngl.DEPTH_TEST);ctx.disable(moderngl.CULL_FACE|moderngl.BLEND)
 for j,(tx,sfbo) in enumerate(shadows):
  sfbo.use();sfbo.depth_mask=True;ctx.viewport=(0,0,2048,2048);sfbo.clear(depth=1.);shadowprog['vp'].write(shadowVP[j].T.tobytes())
  for ob in stage:draw_mesh(ob,shadowprog,True)
 shadows[0][0].use(1);shadows[1][0].use(2);dummy.use(3)
 cube=ctx.texture_cube((size,size),3,dtype='f2');cube.filter=(moderngl.LINEAR_MIPMAP_LINEAR,moderngl.LINEAR)
 targetTex=ctx.texture((size,size),3,dtype='f2');target=ctx.framebuffer([targetTex],ctx.depth_renderbuffer((size,size)))
 opaque=[ob for ob in stage if all(d['materials'][mi]['alpha']>=.98 for mi in ob['source']['materials'])]
 transparent=[ob for ob in stage if ob not in opaque];transparent.sort(key=lambda ob:-np.linalg.norm(ob['matrix'][:3,3]-position))
 captures=[]
 for face,(direction,up) in enumerate(zip(CUBE_DIRECTIONS,CUBE_UPS)):
  view=cube_view(position,direction,up);vp=perspective(90,1,.1,110)@view
  target.use();target.depth_mask=True;ctx.viewport=(0,0,size,size);target.clear(0,0,0,1,depth=1.)
  ctx.disable(moderngl.DEPTH_TEST);bgprog['invVP'].write(np.linalg.inv(vp).T.astype('f4').tobytes());bgprog['eye']=tuple(position);bgprog['lift']=captureLift;bgvao.render(moderngl.TRIANGLE_STRIP)
  ctx.enable(moderngl.DEPTH_TEST);prog['vp'].write(vp.T.astype('f4').tobytes());prog['viewMatrix'].write(view.T.astype('f4').tobytes());prog['eye']=tuple(position)
  for ob in opaque:draw_mesh(ob,prog)
  ctx.enable(moderngl.BLEND);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE_MINUS_SRC_ALPHA);ctx.fbo.depth_mask=False
  for ob in transparent:draw_mesh(ob,prog)
  ctx.fbo.depth_mask=True;ctx.disable(moderngl.BLEND)
  raw=target.read(components=3,dtype='f2');cube.write(face,raw);captures.append(np.frombuffer(raw,dtype='f2').reshape(size,size,3))
  print('ENV_CAPTURE_FACE',face,flush=True)
 np.savez_compressed(ROOT/'environment-capture-linear.npz',faces=np.stack(captures),position=position)
 cube.build_mipmaps();cube.use(6)
 filterprog=ctx.program(vertex_shader=quadvert,fragment_shader='''#version 330
 in vec2 uv;out vec4 color;uniform samplerCube source;uniform int face;uniform float roughness;uniform float sourceSize;
 const float PI=3.141592653589793;
 vec3 faceDirection(vec2 p){if(face==0)return normalize(vec3(1,-p.y,-p.x));if(face==1)return normalize(vec3(-1,-p.y,p.x));if(face==2)return normalize(vec3(p.x,1,p.y));if(face==3)return normalize(vec3(p.x,-1,-p.y));if(face==4)return normalize(vec3(p.x,-p.y,1));return normalize(vec3(-p.x,-p.y,-1));}
 float radicalInverse(uint x){x=(x<<16u)|(x>>16u);x=((x&0x55555555u)<<1u)|((x&0xAAAAAAAAu)>>1u);x=((x&0x33333333u)<<2u)|((x&0xCCCCCCCCu)>>2u);x=((x&0x0F0F0F0Fu)<<4u)|((x&0xF0F0F0F0u)>>4u);x=((x&0x00FF00FFu)<<8u)|((x&0xFF00FF00u)>>8u);return float(x)*2.3283064365386963e-10;}
 void main(){
  vec3 N=faceDirection(uv*2.-1.);vec3 up=abs(N.z)<.999?vec3(0,0,1):vec3(1,0,0);vec3 T=normalize(cross(up,N)),B=cross(N,T);
  vec3 sum=vec3(0);float weight=0.;float a=max(roughness*roughness,.001),a2=a*a;
  for(uint i=0u;i<128u;i++){
   vec2 xi=vec2(float(i)/128.,radicalInverse(i));float phi=2.*PI*xi.x;float cosTheta=sqrt((1.-xi.y)/(1.+(a2-1.)*xi.y));float sinTheta=sqrt(max(0.,1.-cosTheta*cosTheta));
   vec3 H=normalize(T*cos(phi)*sinTheta+B*sin(phi)*sinTheta+N*cosTheta);vec3 L=normalize(2.*dot(N,H)*H-N);float NL=max(dot(N,L),0.);
   if(NL>0.){float NH=max(dot(N,H),.0001);float D=a2/(PI*pow(NH*NH*(a2-1.)+1.,2.));float pdf=max(D*.25,.0001);float sampleArea=1./(128.*pdf);float texelArea=4.*PI/(6.*sourceSize*sourceSize);float lod=roughness<.001?0.:max(.5*log2(sampleArea/texelArea),0.);sum+=textureLod(source,L,lod).rgb*NL;weight+=NL;}
  }
  color=vec4(sum/max(weight,.0001),1.);
 }''')
 filtervao=ctx.simple_vertex_array(filterprog,quad,'p');filterprog['source']=6;filterprog['sourceSize']=size
 filtered=ctx.texture((filteredSize,filteredSize),3,dtype='f2');filterfbo=ctx.framebuffer([filtered]);filterfbo.use();ctx.disable(moderngl.DEPTH_TEST|moderngl.BLEND);ctx.viewport=(0,0,filteredSize,filteredSize)
 layers=[]
 for level in range(9):
  filterprog['roughness']=level/8
  for face in range(6):
   filterprog['face']=face;filtervao.render(moderngl.TRIANGLE_STRIP);layers.append(filterfbo.read(components=3,dtype='f2'))
  print('ENV_FILTER_LEVEL',level,flush=True)
 envAtlas.release();envAtlas=ctx.texture_array((filteredSize,filteredSize,54),3,b''.join(layers),dtype='f2');envAtlas.filter=(moderngl.LINEAR,moderngl.LINEAR);envAtlas.repeat_x=False;envAtlas.repeat_y=False;envAtlas.use(5)
 np.savez_compressed(ROOT/'environment-prefiltered-linear.npz',layers=np.frombuffer(b''.join(layers),dtype='f2').reshape(54,filteredSize,filteredSize,3),roughness=np.linspace(0,1,9),position=position)
 prog['envMode']=2
 print('ENVIRONMENT',json.dumps({'position':position.tolist(),'captureSize':size,'filteredSize':filteredSize,'roughnessLevels':9,'samples':128,'stageMeshes':len(stage),'seconds':time.perf_counter()-began,'approximation':'GGX NDF split-sum, 9 regular levels; source uses GGX VNDF CubeUV and initial sigma=.045'}),flush=True)
 # Leave a live framebuffer bound before deleting the temporary capture targets.
 # ModernGL restores its tracked binding when creating later depth-only FBOs.
 fbo.use()
 target.release();targetTex.release();filterfbo.release();filtered.release();filtervao.release();filterprog.release();cube.release()

if os.environ.get('DAYBREAK_ENV_MODE','pavilion')=='pavilion':capture_environment()
else:prog['envMode']=1



# Depth-only stage geometry is cached independently of animated performers/keys.
# The key includes every input read by the stage shadow pass, so a stage transform,
# alpha threshold/texture binding, cast flag or light projection rebuilds the cache.
import ctypes as _ctypes
_depthGL=_ctypes.CDLL('libGL.so.1')
_depthGL.glBindFramebuffer.argtypes=[_ctypes.c_uint,_ctypes.c_uint]
_depthGL.glBindFramebuffer.restype=None
_depthGL.glBlitFramebuffer.argtypes=[_ctypes.c_int]*8+[_ctypes.c_uint,_ctypes.c_uint]
_depthGL.glBlitFramebuffer.restype=None
def copy_shadow_depth(destination,source):
 # ModernGL copy_framebuffer copies color only, even for depth-only targets.
 _depthGL.glBindFramebuffer(0x8CA8,source.glo) # GL_READ_FRAMEBUFFER
 _depthGL.glBindFramebuffer(0x8CA9,destination.glo) # GL_DRAW_FRAMEBUFFER
 _depthGL.glBlitFramebuffer(0,0,2048,2048,0,0,2048,2048,0x00000100,0x2600) # DEPTH, NEAREST
 destination.use()
_staticShadowTargets=[]
_staticShadowKey=None
def render_frame_shadows():
 global _staticShadowKey
 stage=[ob for ob in meshes if ob['source'].get('stage',False) and not ob['source'].get('deformed',False)]
 stageIds={id(ob) for ob in stage}
 key=(tuple(vp.tobytes() for vp in shadowVP),tuple((id(ob),ob['matrix'].tobytes(),ob['source'].get('castShadow',False),tuple((d['materials'][mi]['alpha'],d['materials'][mi]['alphaTest'],bool(d['materials'][mi]['map']),d['materials'][mi]['_tex'].glo) for mi in ob['source']['materials'])) for ob in stage))
 if key!=_staticShadowKey:
  while len(_staticShadowTargets)<len(shadows):
   depth=ctx.depth_texture((2048,2048));_staticShadowTargets.append((depth,ctx.framebuffer(depth_attachment=depth)))
  for j,(_,target) in enumerate(_staticShadowTargets):
   target.use();target.depth_mask=True;ctx.viewport=(0,0,2048,2048);target.clear(depth=1.);shadowprog['vp'].write(shadowVP[j].T.tobytes())
   for ob in stage:draw_mesh(ob,shadowprog,True)
  _staticShadowKey=key
 for j,(_,target) in enumerate(shadows):
  copy_shadow_depth(target,_staticShadowTargets[j][1]);target.use();target.depth_mask=True;ctx.viewport=(0,0,2048,2048);shadowprog['vp'].write(shadowVP[j].T.tobytes())
  for ob in meshes:
   if id(ob) not in stageIds:draw_mesh(ob,shadowprog,True)

def frame(t):
 before=time.perf_counter();server.stdin.write(str(t)+'\n');server.stdin.flush();s=json.loads(server.stdout.readline());
 for ob,st in zip(meshes,s['meshes']):
  ob['matrix']=mat4(st['matrix'])
  if 'vertices' in st:
   v=np.frombuffer(base64.b64decode(st['vertices']),dtype='<f4').reshape(-1,3);ob['data'][:,:3]=v;ob['data'][:,3:6]=np.frombuffer(base64.b64decode(st['normals']),dtype='<f4').reshape(-1,3) if 'normals' in st else normals(v,ob['idx']);ob['vb'].write(ob['data'].tobytes())
 for m,e in zip(d['materials'],s['emissive']):m['emissive']=e
 updated=time.perf_counter();ctx.enable(moderngl.DEPTH_TEST);ctx.disable(moderngl.CULL_FACE|moderngl.BLEND)
 render_frame_shadows()
 shadowed=time.perf_counter();cm=mat4(s['camera']['matrix']);eye=cm[:3,3];vp=perspective(s['camera']['fov'],s['camera']['aspect'])@np.linalg.inv(cm);x=np.clip((s['energy']-.2)/.72,0,1);lift=float(x*x*(3-2*x));reflect=np.diag([1,-1,1,1]).astype('f4');rcm=reflect@cm;rvp=perspective(s['camera']['fov'],s['camera']['aspect'])@np.linalg.inv(rcm);prog['reflectionVP'].write(rvp.T.astype('f4').tobytes());prog['lightIntensity'].write(np.array(s['lights'],dtype='f4').tobytes());shadows[0][0].use(1);shadows[1][0].use(2)
 for reflectionPass,target,cvp,ceye,ww,hh in [(False,fbo,vp,eye,W,H)]:
  target.use();target.depth_mask=True;ctx.viewport=(0,0,ww,hh);target.clear(.1,.15,.2,1,depth=1.);ctx.disable(moderngl.DEPTH_TEST);bgprog['invVP'].write(np.linalg.inv(cvp).T.astype('f4').tobytes());bgprog['eye'].value=tuple(ceye);bgprog['lift']=lift;bgvao.render(moderngl.TRIANGLE_STRIP);ctx.enable(moderngl.DEPTH_TEST);prog['reflectionPass']=reflectionPass;(dummy if reflectionPass else refl).use(3)
  prog['viewMatrix'].write((np.linalg.inv(rcm) if reflectionPass else np.linalg.inv(cm)).T.astype('f4').tobytes());prog['vp'].write(cvp.T.astype('f4').tobytes());prog['eye'].value=tuple(ceye);prog['lift']=lift
  for ob in meshes:
   if reflectionPass and ob['matrix'][1,3]<0:continue
   if any(d['materials'][mi]['alpha']<.98 for mi in ob['source']['materials']):continue
   draw_mesh(ob,prog)
  ctx.enable(moderngl.BLEND);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE_MINUS_SRC_ALPHA);ctx.fbo.depth_mask=False
  transparent=[ob for ob in meshes if any(d['materials'][mi]['alpha']<.98 for mi in ob['source']['materials'])]
  transparent.sort(key=lambda ob:-np.linalg.norm(ob['matrix'][:3,3]-ceye))
  for ob in transparent:draw_mesh(ob,prog)
  ctx.fbo.depth_mask=True
  ctx.enable(moderngl.BLEND);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE_MINUS_SRC_ALPHA);lineprog['vp'].write(cvp.T.astype('f4').tobytes());ctx.line_width=1.
  for va,model,opacity in lineobjects:
   lineprog['model'].write(model.T.astype('f4').tobytes());lineprog['opacity']=opacity;va.render(moderngl.LINES)
  if not reflectionPass:
   ctx.enable(moderngl.PROGRAM_POINT_SIZE);ctx.blend_func=(moderngl.SRC_ALPHA,moderngl.ONE);ctx.fbo.depth_mask=False;dustprog['t']=t;dustprog['lift']=lift;dustprog['view'].write(np.linalg.inv(cm).T.astype('f4').tobytes());dustprog['projection'].write(perspective(s['camera']['fov'],s['camera']['aspect']).T.astype('f4').tobytes())
   for va in dustobjects:va.render(moderngl.POINTS)
   ctx.fbo.depth_mask=True
  ctx.disable(moderngl.BLEND)
 ctx.copy_framebuffer(resolved,fbo)
 outfbo.use();ctx.disable(moderngl.DEPTH_TEST);color.use(0);postvao.render(moderngl.TRIANGLE_STRIP);raw=outfbo.read(components=3,alignment=1);done=time.perf_counter();return raw,{'time':t,'shot':s['shot'],'update':updated-before,'shadows':shadowed-updated,'render':done-shadowed,'total':done-before,'pedal':s.get('pedal'),'contacts':s.get('contacts'),'activeNotes':s.get('activeNotes')}
if __name__=='__main__':
 result=[]
 for i,t in enumerate([float(x) for x in os.environ.get('TIMES','0,138,184,184.041667').split(',')]):
  raw,row=frame(t);Image.frombytes('RGB',(W,H),raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(ROOT/f'gl-{W}-{i}.jpg',quality=95);result.append(row);print(json.dumps(row),flush=True)
 (ROOT/f'benchmark-{W}.json').write_text(json.dumps(result,indent=2));server.terminate()
