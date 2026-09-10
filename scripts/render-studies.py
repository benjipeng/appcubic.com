"""Offline studies for AppCubic. No models or code are reused from sibling sites."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector
out=Path(sys.argv[sys.argv.index('--')+1]);out.mkdir(parents=True,exist_ok=True)
hdri=Path(sys.argv[sys.argv.index('--')+2])
def setup():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=64;s.cycles.use_denoising=True;s.cycles.max_bounces=8
 s.render.threads_mode='FIXED';s.render.threads=8;s.render.film_transparent=True
 s.render.resolution_x=s.render.resolution_y=1100;s.render.resolution_percentage=100
 s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.view_settings.view_transform='AgX'
 s.world.use_nodes=True;n=s.world.node_tree;n.nodes.clear();env=n.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(hdri))
 bg=n.nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.7;output=n.nodes.new('ShaderNodeOutputWorld');n.links.new(env.outputs['Color'],bg.inputs[0]);n.links.new(bg.outputs[0],output.inputs[0])
 return s
def material(name,color,metal=0,rough=.25,glass=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Transmission Weight'].default_value=glass;p.inputs['IOR'].default_value=1.45
 return m
def box(loc,size,mat,rotation=(0,0,0),bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.rotation_euler=rotation;o.data.materials.append(mat)
 b=o.modifiers.new('Edge finish','BEVEL');b.width=bevel;b.segments=4
 o.modifiers.new('Corner normals','WEIGHTED_NORMAL');return o
def camera(s,position,target,scale):
 d=bpy.data.cameras.new('Gallery camera');o=bpy.data.objects.new('Gallery camera',d);bpy.context.collection.objects.link(o);o.location=position;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=scale;s.camera=o
def light(loc,power,size):
 d=bpy.data.lights.new('Softbox','AREA');d.energy=power;d.size=size;o=bpy.data.objects.new('Softbox',d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
def render(s,name):
 s.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True);print('RENDERED',name,flush=True)

# A helix of individually finished blades, open through its central axis.
s=setup();chrome=material('Brushed aluminium',(.62,.69,.78),1,.23);red=material('Enamel accent',(.8,.035,.012),.35,.25)
for i in range(72):
 t=i/71;a=t*math.pi*1.65
 box((.85*math.cos(a),.85*math.sin(a),(t-.5)*3.2),(1.85,.037,.12),red if i in [0,1,35,36,70,71] else chrome,(0,.25*math.sin(a),a),.014)
camera(s,(4,-7,4),(0,0,0),5.3);light((-3,-4,6),1000,5);render(s,'open-assembly')

# Discrete crystalline cells describe structure at several scales.
s=setup();glass=material('Optical red glass',(.64,.065,.018),.08,.12,.8);metal=material('Silver substrate',(.7,.74,.8),1,.2)
for z in range(4):
 for x in range(4):
  for y in range(4):
   if (x+y+z)%3==0:continue
   p=((x-1.5)*.64,(y-1.5)*.64,(z-1.5)*.64)
   box(p,(.5,.5,.5),glass if (x+y+z)%2 else metal,bevel=.025)
camera(s,(5,-7,4),(0,0,0),4.5);light((-4,-5,7),1400,4);render(s,'discrete-matter')

# A woven waveform with a continuous surface and a visible machined edge.
s=setup();chrome=material('Satin silver',(.66,.72,.8),1,.24);red=material('Vermilion underside',(.8,.055,.02),.5,.23)
for j in range(43):
 verts=[];faces=[]
 for i in range(161):
  x=(i/160-.5)*3.6;y=(j/42-.5)*2.8;z=.5*math.sin(x*1.6+y*1.8)+.22*math.cos(y*3-x)
  for side in [-1,1]:verts.append((x,y+side*.019,z))
 for i in range(160):faces.append((i*2,i*2+1,i*2+3,i*2+2))
 d=bpy.data.meshes.new('Wave strip');d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new('Wave strip',d);bpy.context.collection.objects.link(o);o.data.materials.append(red if j%10==0 else chrome)
 for p in d.polygons:p.use_smooth=True
 m=o.modifiers.new('Sheet thickness','SOLIDIFY');m.thickness=.014
camera(s,(4,-5,5),(0,0,0),4.9);light((-3,-5,6),1000,5);render(s,'signal-weave')
