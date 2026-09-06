import bpy,json,math,sys,os
from mathutils import Matrix,Vector
import numpy as np
source=sys.argv[1];output=sys.argv[2]
d=json.load(open(source));bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=int(os.environ.get('DAYBREAK_RENDER_SAMPLES','24'));scene.cycles.use_denoising=True;scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=3;scene.cycles.glossy_bounces=3;scene.cycles.transparent_max_bounces=8
scene.render.resolution_x=int(os.environ.get('DAYBREAK_RENDER_WIDTH','1280'));scene.render.resolution_y=int(scene.render.resolution_x/d['camera'].get('aspect',16/9));scene.render.resolution_percentage=100
scene.render.threads_mode='FIXED';scene.render.threads=8
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.3
world=bpy.data.worlds.new('Dawn');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.20,.27,1);world.node_tree.nodes['Background'].inputs[1].default_value=.48;scene.world=world
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
def mat4(arr):return Matrix(np.array(arr).reshape(4,4).T.tolist())
materials=[]
for i,m in enumerate(d['materials']):
 mat=bpy.data.materials.new(m['name'] or 'Material'+str(i));mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*m['color'],1);p.inputs['Roughness'].default_value=m['roughness'];p.inputs['Metallic'].default_value=m['metalness'];p.inputs['Coat Weight'].default_value=m['clearcoat'];p.inputs['Alpha'].default_value=m['alpha']
 if max(m['emissive'])>0:p.inputs['Emission Color'].default_value=(*m['emissive'],1);p.inputs['Emission Strength'].default_value=1
 if m['map']:
  tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(m['map'],check_existing=True);mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Alpha'],p.inputs['Alpha'])
 if m['normal']:
  tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(m['normal'],check_existing=True);tex.image.colorspace_settings.name='Non-Color';normal=mat.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.7;mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],p.inputs['Normal'])
 materials.append(mat)
for i,m in enumerate(d['meshes']):
 vs=np.array(m['vertices']).reshape(-1,3);tri=np.array(m['indices']).reshape(-1,3)
 geo=bpy.data.meshes.new(m['name'] or 'Mesh'+str(i));geo.from_pydata(vs.tolist(),[],tri.tolist());geo.update();obj=bpy.data.objects.new(m['name'] or 'Object'+str(i),geo);scene.collection.objects.link(obj);obj.matrix_world=C@mat4(m['matrix'])
 for mi in m['materials']:geo.materials.append(materials[mi])
 for g in m['groups']:
  for k in range(g['start']//3,min(len(geo.polygons),(g['start']+g['count'])//3)):geo.polygons[k].material_index=g['materialIndex']
 if m['uvs']:
  uv=geo.uv_layers.new(name='UVMap');uvs=np.array(m['uvs']).reshape(-1,2);uv.data.foreach_set('uv',np.array([[uvs[l.vertex_index,0],1-uvs[l.vertex_index,1]] for l in geo.loops]).ravel())
 for p in geo.polygons:p.use_smooth=m['smooth']
for l in d['lights']:
 typ='SPOT' if l['type']=='SpotLight' else 'POINT';data=bpy.data.lights.new(l['type'],typ);data.color=l['color'];data.energy=l['intensity']*7;data.shadow_soft_size=.25
 if typ=='SPOT':data.spot_size=l['angle']*2;data.spot_blend=l['penumbra']
 obj=bpy.data.objects.new(l['type'],data);scene.collection.objects.link(obj);obj.location=(C@Vector((*l['position'],1))).to_3d();
 if l['target']:
  target=C@Vector((*l['target'],1));obj.rotation_euler=(Vector(target[:3])-obj.location).to_track_quat('-Z','Y').to_euler()
# Film reflection uses the same physical stage surface; WebGL's separate reflector isn't exported.
# Broad ceiling source approximates the environment light panels used by the browser material.
ld=bpy.data.lights.new('Softbox','AREA');ld.energy=330;ld.shape='DISK';ld.size=4.0;lo=bpy.data.objects.new('Softbox',ld);scene.collection.objects.link(lo);lo.location=(0,.3,5)
camdata=bpy.data.cameras.new('Film camera');cam=bpy.data.objects.new('Film camera',camdata);scene.collection.objects.link(cam);cam.matrix_world=C@mat4(d['camera']['matrix']);camdata.lens=36/(2*math.tan(math.radians(d['camera']['fov'])/2)*d['camera'].get('aspect',16/9));camdata.sensor_width=36;camdata.sensor_fit='HORIZONTAL';camdata.clip_start=.025;scene.camera=cam
scene.render.image_settings.file_format='PNG';scene.render.filepath=output;bpy.ops.render.render(write_still=True)
print('RENDER PASS',source,output,flush=True)
