"""Tailored garment variant. Geometry operations only; no raster image edits.

Uses the existing refined rig/body and changes garment panels, folds, bindings,
placket, buttons and materials. The deformation field is spatially authored for
the existing seated concert pose; it is not a dynamic cloth simulation.
"""
import sys, copy, json, argparse, hashlib
from pathlib import Path
import numpy as np
from glb_tools import GLB, normalize


def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def gauss(x,s):return np.exp(-(x/s)**2)
def components(p,f):
    _,ids=np.unique(np.round(p,6),axis=0,return_inverse=True);parents=np.arange(ids.max()+1)
    def root(a):
        while parents[a]!=a:parents[a]=parents[parents[a]];a=parents[a]
        return a
    for tri in f:
        r=root(ids[tri[0]])
        for a in tri[1:]:parents[root(ids[a])]=r
    return np.array([root(i) for i in ids])
def subset(attrs,f):
    used=np.unique(f);mapping=np.full(len(attrs['POSITION']),-1);mapping[used]=np.arange(len(used));return {k:v[used].copy()for k,v in attrs.items()},mapping[f]
def normals(p,f,weld_reference=None):
    t=np.cross(p[f[:,1]]-p[f[:,0]],p[f[:,2]]-p[f[:,0]]);n=np.zeros_like(p)
    for k in range(3):np.add.at(n,f[:,k],t)
    if weld_reference is not None:
        _,inv=np.unique(np.round(weld_reference,6),axis=0,return_inverse=True);group=np.zeros((inv.max()+1,3));np.add.at(group,inv,n);n=group[inv]
    return normalize(n).astype('f4')
def boundaries(attrs,f):
    p=attrs['POSITION'];_,first,ids=np.unique(np.round(p,6),axis=0,return_index=True,return_inverse=True);edges={};neighbor={}
    for tri in f:
        for a,b in zip(tri,np.roll(tri,-1)):
            key=tuple(sorted((int(ids[a]),int(ids[b]))));edges.setdefault(key,[]).append((int(a),int(b)));neighbor.setdefault(int(ids[a]),set()).add(int(ids[b]));neighbor.setdefault(int(ids[b]),set()).add(int(ids[a]))
    edge=[es[0] for es in edges.values()if len(es)==1];bid=set(int(ids[v])for e in edge for v in e);adj={}
    for a,b in edge:adj.setdefault(int(ids[a]),set()).add(int(ids[b]));adj.setdefault(int(ids[b]),set()).add(int(ids[a]))
    groups=[];seen=set()
    for start in adj:
        if start in seen:continue
        stack=[start];comp=set()
        while stack:
            q=stack.pop()
            if q in seen:continue
            seen.add(q);comp.add(q);stack.extend(adj.get(q,[]))
        groups.append([e for e in edge if int(ids[e[0]])in comp])
    inward={}
    for vertex in set(v for e in edge for v in e):
        choices=[first[k]for k in neighbor[int(ids[vertex])]if k not in bid]
        if not choices:choices=[first[k]for k in neighbor[int(ids[vertex])]]
        d=p[choices].mean(0)-p[vertex];n=attrs['NORMAL'][vertex];inward[vertex]=normalize(d-n*np.dot(n,d))
    return groups,inward

def blouse_panel(attrs,f):
    p=attrs['POSITION'].copy();original=p.copy();n=attrs['NORMAL'];x,y,z=p.T;ax=abs(x);front=smooth(.05,.7,n[:,2]);back=smooth(.05,.7,-n[:,2]);side=smooth(.2,.8,abs(n[:,0]));torso=(1-smooth(.16,.225,ax))*smooth(.985,1.06,y)*(1-smooth(1.36,1.47,y))
    # Panels hang from the chest/shoulder region and blouse gently above the
    # waistband. The displacement tapers to zero at neckline and tucked hem.
    ellipse=np.sqrt(np.clip(1-(x/.195)**2,0,1));front_envelope=.025+.157*ellipse
    needed=np.clip(front_envelope-z,0,.032)
    p[:,2]+=needed*front*torso
    p[:,2]-=.014*back*torso*gauss(y-1.12,.20)
    p[:,0]+=np.sign(x)*(.012*gauss(y-1.115,.16))*side*torso
    # A few hanging folds converge into the waist. Their width and amplitude
    # decay above the lower panel, avoiding all-over corrugated cloth.
    waist=smooth(.985,1.035,y)*(1-smooth(1.14,1.28,y));phase=x*92+2.2*(y-1.02)
    fall=(.0035*np.sin(phase)+.0017*np.sin(x*151-3.5*y))*waist*(.35+.65*front)*torso
    # Two shallow diagonal tension folds emerge below each armhole.
    diag=y-(1.265+.60*(ax-.10));armzone=gauss(ax-.145,.052)*smooth(1.17,1.24,y)*(1-smooth(1.34,1.41,y))
    tension=(.0040*gauss(diag,.010)-.0016*gauss(diag-.014,.014)+.0028*gauss(diag+.043,.012))*armzone*front
    p+=n*(fall+tension)[:,None]
    # Sleeve ease and localized compression around the supported upper arm.
    for sign in [-1,1]:
        d=normalize(np.array([sign*.66,-.751,0.]));origin=np.array([sign*.157,1.435,.024]);delta=original-origin;u=delta@d;radial=delta-u[:,None]*d;rnorm=normalize(radial);sleeve=smooth(.168,.221,sign*x)*smooth(1.245,1.285,y)*(1-smooth(1.42,1.48,y))
        angle=np.arctan2(radial[:,2],radial@np.array([-d[1],d[0],0.]));ease=(.004+.006*smooth(.03,.15,u))*sleeve
        folds=(.0030*np.sin(angle*2.1+u*32)*gauss(u-.085,.061)+.0022*gauss(u-.147-.013*np.cos(angle),.009))*sleeve
        p+=rnorm*(ease+folds)[:,None]
    attrs['POSITION']=p.astype('f4');attrs['NORMAL']=normals(p,f,original);return attrs

def trouser_panel(attrs,f):
    p=attrs['POSITION'].copy();original=p.copy();n=attrs['NORMAL'];x,y,z=p.T;front=smooth(.10,.85,n[:,2]);rear=smooth(.10,.85,-n[:,2]);legmask=(1-smooth(.88,.98,y))*smooth(.095,.16,y)
    radial=normalize(np.column_stack([n[:,0],np.zeros(len(n)),n[:,2]]));ease=(.004+.010*gauss(y-.34,.22)+.006*gauss(y-.76,.13))*legmask
    p+=radial*ease[:,None]
    # Upper thigh folds follow the seated hip bend; posterior knee folds occupy
    # the compression side while the front knee stays comparatively smooth.
    upper=(.0048*gauss(y-.861-.16*abs(x),.014)-.0018*gauss(y-.883-.13*abs(x),.018)+.0032*gauss(y-.913+.12*abs(x),.013))*front
    knee=(.0038*gauss(y-.514-.06*x,.011)-.0015*gauss(y-.533,.014)+.0034*gauss(y-.555+.06*x,.011)+.0024*gauss(y-.591,.013))*rear
    sidefold=.0028*np.sin((y-.52)*76+np.sign(x)*.35)*gauss(y-.56,.062)*smooth(.35,.9,abs(n[:,0]))
    p+=n*(upper+knee+sidefold)[:,None]
    # Narrow, restrained pressed creases on the front of each trouser leg.
    crease=np.zeros(len(p))
    for sign in [-1,1]:
        centers=[];bins=np.linspace(.12,.86,35)
        for yy in bins:
            mask=(sign*x>.055)&(abs(y-yy)<.027)&(n[:,2]>.55)
            centers.append(np.mean(x[mask]) if mask.any() else sign*(.2-.04*yy))
        cx=np.interp(y,bins,centers);crease+=.0026*gauss(x-cx,.0085)*(sign*x>0)*front*smooth(.14,.22,y)*(1-smooth(.80,.88,y))
    p+=n*crease[:,None]
    # Preserve the concave joining seam between the two trouser legs. Expanding
    # opposing radial normals through that seam can invert its small triangles.
    seam_guard=1-gauss(original[:,0],.040)*smooth(.69,.79,original[:,1])*(1-smooth(.88,.94,original[:,1]))
    p=original+(p-original)*seam_guard[:,None]
    attrs['POSITION']=p.astype('f4');attrs['NORMAL']=normals(p,f,original);return attrs

def make_bands(attrs,f,kind):
    groups,inward=boundaries(attrs,f);out={k:[]for k in attrs};faces=[];count=0;report=[]
    for edges in groups:
        vertices=sorted(set(v for e in edges for v in e));center=attrs['POSITION'][vertices].mean(0)
        if kind=='blouse':width=.008 if center[1]>1.4 else .012 if abs(center[0])>.18 else .005;label='neck binding' if center[1]>1.4 else 'sleeve cuff' if abs(center[0])>.18 else 'blouse hem'
        else:width=.018 if center[1]>.9 else .018;label='waistband' if center[1]>.9 else 'trouser turn-up'
        mapping={v:i for i,v in enumerate(vertices)};num=len(vertices)
        for ring in [0,1]:
            for v in vertices:
                for key in attrs:
                    value=attrs[key][v].copy()
                    if key=='POSITION':value=value+attrs['NORMAL'][v]*.0009+inward[v]*width*ring
                    out[key].append(value)
        for a,b in edges:
            aa=count+mapping[a];bb=count+mapping[b];faces.extend([(aa,bb,aa+num),(bb,bb+num,aa+num)])
        count+=num*2;report.append({'name':label,'widthMm':width*1000,'vertices':num*2})
    return {k:np.array(v,dtype=attrs[k].dtype)for k,v in out.items()},np.array(faces),report

class Surface:
    def __init__(self,attrs,faces,axes=(0,1),depth=2):self.a=attrs;self.f=faces;self.axes=axes;self.depth=depth;self.p=attrs['POSITION'][faces];self.q=self.p[:,:,axes]
    def sample(self,c1,c2,highest=True):
        a,b,c=self.q[:,0],self.q[:,1],self.q[:,2];den=(b[:,1]-c[:,1])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,1]-c[:,1]);valid=abs(den)>1e-12;d=np.where(valid,den,1)
        w0=((b[:,1]-c[:,1])*(c1-c[:,0])+(c[:,0]-b[:,0])*(c2-c[:,1]))/d;w1=((c[:,1]-a[:,1])*(c1-c[:,0])+(a[:,0]-c[:,0])*(c2-c[:,1]))/d;weights=np.column_stack([w0,w1,1-w0-w1]);valid&=weights.min(1)>=-1e-6
        choices=np.flatnonzero(valid)
        if not len(choices):return None
        depths=np.sum(weights[choices]*self.p[choices,:,self.depth],1);fi=choices[np.argmax(depths)if highest else np.argmin(depths)];w=weights[fi];ids=self.f[fi];result={}
        for key,value in self.a.items():
            if key in ['JOINTS_0','WEIGHTS_0']:continue
            result[key]=w@value[ids]
        result['NORMAL']=normalize(result['NORMAL']);boneweights={}
        for vertex,weight in zip(ids,w):
            for joint,skinweight in zip(self.a['JOINTS_0'][vertex],self.a['WEIGHTS_0'][vertex]):boneweights[int(joint)]=boneweights.get(int(joint),0)+float(weight*skinweight)
        top=sorted(boneweights.items(),key=lambda x:x[1],reverse=True)[:4]
        while len(top)<4:top.append((0,0))
        jj,ww=zip(*top);result['JOINTS_0']=np.array(jj,dtype='u2');result['WEIGHTS_0']=np.array(ww)/sum(ww);return result

def placket_and_buttons(attrs,f):
    surf=Surface(attrs,f);out={k:[]for k in attrs};faces=[];rows=0
    for y in np.linspace(1.004,1.435,64):
        row=[surf.sample(x,y)for x in [-.006,.006]]
        if any(r is None for r in row):continue
        for r in row:
            for key in out:out[key].append(r[key]+r['NORMAL']*.0010 if key=='POSITION'else r[key])
        if rows:faces.extend([(rows*2-2,rows*2-1,rows*2),(rows*2-1,rows*2+1,rows*2)])
        rows+=1
    placket={k:np.array(v,dtype=attrs[k].dtype)for k,v in out.items()};buttons={k:[]for k in attrs};bfaces=[]
    for y in [1.405,1.332,1.259,1.186,1.113,1.04]:
        r=surf.sample(0,y)
        if r is None:continue
        n=r['NORMAL'];t=normalize(np.cross([0,1,0],n));b=normalize(np.cross(n,t));center=r['POSITION']+n*.002;offset=len(buttons['POSITION']);rings=6;segments=12
        for j in range(rings+1):
            phi=np.pi*j/rings
            for k in range(segments):
                theta=2*np.pi*k/segments;direction=t*np.sin(phi)*np.cos(theta)+b*np.sin(phi)*np.sin(theta);point=center+direction*.0027+n*np.cos(phi)*.0008
                for key in buttons:buttons[key].append(point if key=='POSITION'else normalize(direction+n*np.cos(phi)*3)if key=='NORMAL'else r[key])
        for j in range(rings):
            for k in range(segments):
                a=offset+j*segments+k;bb=offset+j*segments+(k+1)%segments;c=a+segments;d=bb+segments
                if j>0:bfaces.append((a,bb,c))
                if j<rings-1:bfaces.append((bb,d,c))
    return placket,np.array(faces),{k:np.array(v,dtype=attrs[k].dtype)for k,v in buttons.items()},np.array(bfaces)

def side_seams(attrs,f):
    surf=Surface(attrs,f,axes=(1,2),depth=0);out={k:[]for k in attrs};faces=[];count=0
    for sign in [-1,1]:
        rows=0
        for y in np.linspace(.12,.945,90):
            row=[surf.sample(y,z,highest=sign>0)for z in [.0165,.0195]]
            if any(r is None for r in row):continue
            for r in row:
                for key in out:out[key].append(r[key]+r['NORMAL']*.0007 if key=='POSITION'else r[key])
            if rows:
                a=count+rows*2-2;faces.extend([(a,a+1,a+2),(a+1,a+3,a+2)])
            rows+=1
        count+=rows*2
    return {k:np.array(v,dtype=attrs[k].dtype)for k,v in out.items()},np.array(faces)

def primitive(g,attrs,f,material):
    out={'attributes':{},'material':material}
    for key,ar in attrs.items():out['attributes'][key]=g.addarr(ar,'VEC2'if key=='TEXCOORD_0'else'VEC4'if key in ['JOINTS_0','WEIGHTS_0']else'VEC3',5123 if key=='JOINTS_0'else 5126,target=34962)
    out['indices']=g.addarr(f.reshape(-1,1),'SCALAR',5123 if len(attrs['POSITION'])<65536 else 5125,target=34963);return out


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

