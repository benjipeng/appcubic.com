"""Author AppCubic's continuous metal ribbon. Run only in Blender, outside CI."""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
out=Path(args[0]);out.mkdir(parents=True,exist_ok=True)
hdri=Path(args[1]);mode=args[2] if len(args)>2 else 'preview'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=28 if mode=='loop' else 96
scene.cycles.use_denoising=True;scene.cycles.max_bounces=6
scene.render.threads_mode='FIXED';scene.render.threads=8
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=720 if mode=='loop' else 1000
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX'
scene.world.use_nodes=True
world=scene.world.node_tree
env=world.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(hdri))
world.links.new(env.outputs['Color'],world.nodes.get('Background').inputs['Color'])
world.nodes.get('Background').inputs['Strength'].default_value=.65

def material(name,color,metal=0,rough=.2):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal
 p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=.3
 return m
chrome=material('Polished aluminium',(.69,.73,.8),1,.19)
red=material('Vermilion enamel',(.72,.035,.012),.45,.23)
black=material('Graphite machining',(.045,.05,.064),.8,.26)
root=bpy.data.objects.new('Continuous form',None);bpy.context.collection.objects.link(root)

def position(t):
 return Vector(((2+math.cos(3*t))*math.cos(2*t)*.53,(2+math.cos(3*t))*math.sin(2*t)*.53,math.sin(3*t)*.62))

def basis(t):
 p=position(t);tangent=(position(t+.0001)-position(t-.0001)).normalized()
 normal=(Vector((0,0,1))-tangent*tangent.z).normalized();binormal=tangent.cross(normal).normalized()
 twist=t+.35*math.sin(t*3)
 return p,normal*math.cos(twist)+binormal*math.sin(twist),binormal*math.cos(twist)-normal*math.sin(twist)

# The ribbon is a closed trefoil with a broad rounded rectangular profile.
N=600;P=24;verts=[];faces=[]
for i in range(N):
 t=i*math.tau/N;p,n,b=basis(t)
 for j in range(P):
  a=j*math.tau/P
  u=math.copysign(abs(math.cos(a))**.35,math.cos(a))*.29
  v=math.copysign(abs(math.sin(a))**.35,math.sin(a))*.058
  verts.append(p+n*u+b*v)
for i in range(N):
 for j in range(P):faces.append((i*P+j,((i+1)%N)*P+j,((i+1)%N)*P+(j+1)%P,i*P+(j+1)%P))
mesh=bpy.data.meshes.new('Twisted ribbon');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Continuum',mesh);bpy.context.collection.objects.link(o);o.parent=root
o.data.materials.append(chrome);o.data.materials.append(red)
for i,p in enumerate(o.data.polygons):
 p.use_smooth=True
 # Enamel traces the narrow edge, not a painted-on accent floating above it.
 p.material_index=1 if i%P in [0,1,11,12,13,23] else 0

def line(name,points,radius,mat):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=radius;d.bevel_resolution=3
 s=d.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*v,1)
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.parent=root;o.data.materials.append(mat)

# Fine transverse inlays make the changing surface orientation legible.
for i in range(84):
 t=i*math.tau/84;p,n,b=basis(t)
 line('Machined transverse inlay',[p+n*u+b*.059 for u in [-.24,0,.24]],.003,black)

def light(name,loc,power,size,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=size;d.size_y=size*.3;d.color=color
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc
 o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
light('Long softbox',(-3,-5,6),850,5,(.86,.92,1))
light('Rim strip',(4,2,2),1100,4,(1,.84,.71))
c=bpy.data.cameras.new('Gallery camera');camera=bpy.data.objects.new('Gallery camera',c);bpy.context.collection.objects.link(camera)
camera.location=(0,-7,4.3);camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
c.type='ORTHO';c.ortho_scale=4.6;scene.camera=camera
frames=240 if mode=='loop' else 1
for i in range(frames):
 a=i*math.tau/240
 root.rotation_euler=(.2+.15*math.sin(a),.2*math.cos(a),a+.35)
 scene.render.filepath=str(out/(f'frame-{i:04d}.png' if mode=='loop' else 'continuum.png'))
 bpy.ops.render.render(write_still=True)
 print(f'RENDERED {i+1}/{frames}',flush=True)
