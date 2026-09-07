"""Panel-only tailoring of the exact accepted ivory wardrobe.

The skeleton, body, trousers, images and materials stay byte-identical. This
authors shallow garment geometry, not a fabric simulation or raster edit.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
from scipy.spatial import cKDTree
from glb_tools import GLB, normalize
from garment_tools import smooth, gauss, normals, boundaries, primitive, turn_hems, placket_and_buttons
from build_character import panels, constructed_bands, combine, ClosestSurface

ACCEPTED_SHA = 'be0341c8b4749721dc884eae7adfd5966dfa8db7c7f15319e4ddae49a71879bc'
HERE = Path(__file__).resolve().parent

def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def reshape(attrs, faces):
    p = attrs['POSITION'].astype(float).copy()
    original = p.copy()
    n = attrs['NORMAL'].astype(float)
    x, y, z = original.T
    edge_groups, _ = boundaries(attrs, faces)
    edge_ids = sorted(set(v for group in edge_groups for edge in group for v in edge))
    edge_distance = cKDTree(original[edge_ids]).query(original)[0]
    # Keep cuff, neckline and hem positions exact; new construction is projected
    # on the authored panel below, rather than leaving trim behind in space.
    edge_guard = smooth(.006, .022, edge_distance)
    # The original underarm joins contain covered intersections. Preserve that
    # interface exactly and taper the new tailoring into the exposed sleeve.
    # This guard is anatomical and continuous, not a per-pose vertex override.
    underarm_guard=np.maximum(smooth(1.36,1.405,y),smooth(.211,.237,abs(x)))
    reduce = np.zeros_like(p)
    fold = np.zeros(len(p))
    for side in (-1, 1):
        axis = normalize(np.array([side * .66, -.751, 0.]))
        origin = np.array([side * .157, 1.435, .024])
        delta = original - origin
        along = delta @ axis
        radial = delta - along[:, None] * axis
        radial_direction = normalize(radial)
        sleeve = smooth(.165, .218, side*x) * smooth(1.265,1.310,y) * (1-smooth(1.450,1.493,y))
        # Reduce excess cap ease, with a broad C1 field and less than 4 mm
        # inward travel. The cuff ring and upper shoulder attachment stay put.
        cap = .0038 * gauss(along-.052,.074) * sleeve * edge_guard
        reduce -= radial_direction * cap[:,None]
        # Two finite compression folds leave the front armhole and die before
        # the seam/cuff. They are shallow directional ridges, not all-over noise.
        armhole = gauss(side*x-.219,.032) * smooth(.15,.7,n[:,2])
        armhole *= smooth(1.335,1.36,y) * (1-smooth(1.40,1.425,y))
        line = y - (1.371 + .58*(side*x-.20))
        fold += armhole * (.00090*gauss(line,.008)-.00028*gauss(line-.012,.012)
                            +.00070*gauss(line+.030,.009))
    # The blouse front hangs from shoulder/chest. Small folds converge toward
    # the waist side instead of adding more parallel ridges to the placket.
    front = smooth(.22,.80,n[:,2])
    waist = smooth(1.025,1.075,y) * (1-smooth(1.16,1.235,y))
    side_panel = smooth(.070,.105,abs(x)) * (1-smooth(.155,.187,abs(x)))
    line = abs(x) - (.124 + .16*(y-1.08))
    waist_fold=front * waist * side_panel * (.0009*gauss(line,.010)-.00025*gauss(line-.016,.014))
    displacement = reduce*underarm_guard[:,None] + n*((fold*underarm_guard+waist_fold)*edge_guard)[:,None]
    p += displacement
    attrs['POSITION'] = p.astype('f4')
    attrs['NORMAL'] = normals(p,faces,original)
    return attrs, {'maxPanelMoveMm':float(np.linalg.norm(displacement,axis=1).max()*1000),
                   'movedVertices':int((np.linalg.norm(displacement,axis=1)>.00001).sum()),
                   'boundaryVerticesExact':bool(np.array_equal(original[edge_ids].astype('f4'),attrs['POSITION'][edge_ids]))}

def shoulder_seams(attrs, faces):
    """A thin joined shoulder seam, projected onto the garment itself.

    The two 1.1 mm strips follow the shoulder ridge and terminate before the
    neck facing and outer sleeve. Their raised height is only 0.45 mm.
    """
    surface=ClosestSurface(attrs,faces)
    out={k:[] for k in attrs}; triangles=[]
    for sign in (-1,1):
        points=[]
        for t in np.linspace(0,1,34):
            x=sign*(.087+.107*t)
            y=1.487-.041*t-.016*t*t
            z=.025
            points.append(surface.sample(np.array([x,y,z])))
        base=len(out['POSITION'])
        for row,sample in enumerate(points):
            tangent=points[min(row+1,len(points)-1)]['POSITION']-points[max(row-1,0)]['POSITION']
            across=normalize(np.cross(sample['NORMAL'],tangent))
            fade=smooth(0,.12,row/(len(points)-1))*(1-smooth(.88,1,row/(len(points)-1)))
            for side in (-1,1):
                actual=surface.sample(sample['POSITION']+across*side*.00055)
                for key in out:
                    value=actual[key].copy()
                    if key=='POSITION':value+=actual['NORMAL']*(.00015+.00030*fade)
                    out[key].append(value)
            if row:
                a=base+row*2-2;triangles.extend([(a,a+1,a+2),(a+1,a+3,a+2)])
    authored={k:np.asarray(v,dtype=attrs[k].dtype) for k,v in out.items()}
    faces=np.asarray(triangles)
    tr=authored['POSITION'][faces]
    geometric=np.cross(tr[:,1]-tr[:,0],tr[:,2]-tr[:,0])
    reverse=(geometric*authored['NORMAL'][faces].mean(1)).sum(1)<0
    faces[reverse]=faces[reverse][:,[0,2,1]]
    return authored,faces

def build(source, output):
    assert sha(source)==ACCEPTED_SHA, 'Only the exact accepted ivory asset is supported.'
    g=GLB(source)
    old_primitives=g.j['meshes'][1]['primitives'].copy()
    (shirt,sf),_=panels(g)
    old=shirt['POSITION'].copy()
    shirt,report=reshape(shirt,sf)
    sb,sbf,ss,ssf,_=constructed_bands(shirt,sf,'blouse')
    pl,plf,buttons,btf=placket_and_buttons(shirt,sf)
    shoulder,shoulderf=shoulder_seams(shirt,sf)
    sh,shf,_=turn_hems(shirt,sf)
    binding,bindingf=combine([(sb,sbf),(pl,plf),(shoulder,shoulderf)])
    updates={0:(sh,shf),2:(binding,bindingf),4:(buttons,btf),5:(ss,ssf)}
    for pi,(a,f) in updates.items():
        g.j['meshes'][1]['primitives'][pi]=primitive(g,a,f,old_primitives[pi]['material'])
    g.j.setdefault('extras',{})['daybreakWardrobeRefinement']={
        'version':1,'sourceSHA256':ACCEPTED_SHA,'method':'Finite sleeve-cap tailoring and armhole compression folds; projected existing trim',
        'skinChanged':False,'rigChanged':False,'trousersChanged':False,'dynamicCloth':False}
    g.save(output)
    oldtri=old[sf];newtri=shirt['POSITION'][sf]
    oldnormal=np.cross(oldtri[:,1]-oldtri[:,0],oldtri[:,2]-oldtri[:,0])
    newnormal=np.cross(newtri[:,1]-newtri[:,0],newtri[:,2]-newtri[:,0])
    cosine=(normalize(oldnormal)*normalize(newnormal)).sum(1)
    report.update({'inputSHA256':ACCEPTED_SHA,'outputSHA256':sha(output),'outputBytes':output.stat().st_size,
        'panelMinimumNormalCosine':float(cosine.min()),'sourceCodeSHA256':sha(__file__),
        'changedGarmentPrimitives':sorted(updates),'preservedGarmentPrimitives':[1,3]})
    output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--output',type=Path,default=HERE/'pianist-tailored.glb');a=ap.parse_args();build(a.input,a.output)
