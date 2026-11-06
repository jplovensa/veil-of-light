"""Apply the shared modern tropical design to a new copy of the supplied SKP."""
import argparse, ctypes as C, json, math, hashlib, time, struct, zlib
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--spec',type=Path,default=Path(__file__).resolve().parents[1]/'interior-spec.json');parser.add_argument('--sdk',default='/Applications/SketchUp 2025/SketchUpPro.app/Contents/Frameworks/SketchUpAPI.framework/SketchUpAPI');args=parser.parse_args()
assert args.source.resolve()!=args.output.resolve(),'Use a new output file to preserve the original.'
source_hash=hashlib.sha256(args.source.read_bytes()).hexdigest()
api=C.CDLL(args.sdk)
class Ref(C.Structure):_fields_=[('ptr',C.c_void_p)]
class V(C.Structure):_fields_=[('x',C.c_double),('y',C.c_double),('z',C.c_double)]
class Transform(C.Structure):_fields_=[('values',C.c_double*16)]
class Color(C.Structure):_fields_=[('r',C.c_ubyte),('g',C.c_ubyte),('b',C.c_ubyte),('a',C.c_ubyte)]
def call(name,*a):
 r=getattr(api,name)(*a)
 if r:raise RuntimeError((name,r))
def ref(name,*a):
 r=Ref();call(name,*a,C.byref(r));return r
def count(name,*a):
 n=C.c_size_t();call(name,*a,C.byref(n));return n.value
def refs(name,obj):
 n=count(name.replace('Get','GetNum',1),obj)
 if not n:return []
 arr=(Ref*n)();got=C.c_size_t();call(name,obj,C.c_size_t(n),arr,C.byref(got));return list(arr)[:got.value]
def string(name,obj):
 s=ref('SUStringCreate');call(name,obj,C.byref(s));n=count('SUStringGetUTF8Length',s);b=C.create_string_buffer(n+1);got=C.c_size_t();call('SUStringGetUTF8',s,C.c_size_t(n+1),b,C.byref(got));call('SUStringRelease',C.byref(s));return b.value.decode('utf8','replace')
api.SUGroupToDrawingElement.restype=Ref
api.SUInitialize();started=time.time();model=Ref();status=C.c_int();call('SUModelCreateFromFileWithStatus',C.byref(model),str(args.source.resolve()).encode(),C.byref(status));root=ref('SUModelGetEntities',model);design=json.loads(args.spec.read_text());print('Source loaded.',flush=True)
def rgb(value):return Color(*[int(value[i:i+2],16)for i in(1,3,5)],255)
def texture_png(name,props):
 path=args.output.parent/'material-textures'/f'{name}.png';path.parent.mkdir(parents=True,exist_ok=True);kind=props['texture'];base=[int(props['color'][i:i+2],16)for i in(1,3,5)];rows=bytearray();seed=1729
 for y in range(128):
  rows.append(0)
  for x in range(128):
   seed=(seed*1664525+1013904223)&0xffffffff;noise=seed/4294967296;v=248
   if kind=='wood':v=225+math.sin(x*.38+math.sin(y*.035)*1.8)*12+noise*14
   if kind=='linen':v=235+noise*10-(15 if x%4==0 or y%4==0 else 0)
   if kind=='cane':v=240-(42 if x%16<3 or y%16<3 else 0)-(15 if x%16<7 and y%16<7 else 0)+noise*7
   if kind=='stone':v=236+noise*15-(9 if math.sin(y*.25+math.sin(x*.03))>.95 else 0)
   if kind=='plaster':v=239+noise*14
   rows.extend(max(0,min(255,round(c*v/255)))for c in base)
 def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',128,128,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b''));return path
matrefs={}
for name,props in design['materials'].items():
 mat=ref('SUMaterialCreate');call('SUMaterialSetName',mat,('MT | '+name).encode());col=rgb(props['color']);call('SUMaterialSetColor',mat,C.byref(col));
 if props.get('texture'):
  tex=Ref();path=texture_png(name,props);photo=Path(__file__).resolve().parents[1]/'dist/assets/realism/teak-color.jpg';tinted=Path(__file__).resolve().parents[1]/f'dist/assets/surfaces/native/{design["scheme"]}-{name}.jpg';path=tinted if tinted.exists() else photo if name in('teak','teakDark') and photo.exists() else path;tile=.4 if props['texture'] in('wood','stone')else .12;call('SUTextureCreateFromFile',C.byref(tex),str(path.resolve()).encode(),C.c_double(tile/.0254),C.c_double(tile/.0254));call('SUMaterialSetTexture',mat,tex)
 call('SUModelAddMaterials',model,C.c_size_t(1),(Ref*1)(mat));
 if props.get('opacity'):
  call('SUMaterialSetOpacity',mat,C.c_double(props['opacity']));call('SUMaterialSetUseOpacity',mat,C.c_bool(True))
 matrefs[name]=mat
changed=[]
for mat in refs('SUModelGetMaterials',model):
 name=string('SUMaterialGetName',mat)
 if name in design['paletteOverrides']:
  col=rgb(design['paletteOverrides'][name]);call('SUMaterialSetColor',mat,C.byref(col));changed.append(name)
original=refs('SUEntitiesGetGroups',root)
door_transforms={}
for i in [3,6]:
 t=Transform();call('SUGroupGetTransform',original[i],C.byref(t));door_transforms[i]=list(t.values)
for i,group in enumerate(original):
 d=api.SUGroupToDrawingElement(group)
 if i in design['hideOriginalRootIndices']:call('SUDrawingElementSetHidden',d,C.c_bool(True))
 # Explicit face materials remain; this sets warm limewash for inherited/unpainted faces.
 paint=Ref();r=api.SUDrawingElementGetMaterial(d,C.byref(paint))
 if not paint.ptr:call('SUDrawingElementSetMaterial',d,matrefs['limewash'])
def group(parent,name,mat=None):
 g=ref('SUGroupCreate');call('SUGroupSetName',g,name.encode());call('SUEntitiesAddGroup',parent,g)
 if mat:call('SUDrawingElementSetMaterial',api.SUGroupToDrawingElement(g),mat)
 return ref('SUGroupGetEntities',g)
def rotate(v,angles):
 x,y,z=v;rx,ry,rz=angles
 x,y=x*math.cos(rz)-y*math.sin(rz),x*math.sin(rz)+y*math.cos(rz)
 x,z=x*math.cos(ry)+z*math.sin(ry),-x*math.sin(ry)+z*math.cos(ry)
 y,z=y*math.cos(rx)-z*math.sin(rx),y*math.sin(rx)+z*math.cos(rx)
 return x,y,z
def shape(part):
 kind=part['shape'];s=part.get('s');verts=[];faces=[];smooth=kind not in('box','archPanel')
 if kind in('vessel','shade','lathe'):
  seg=32
  if kind=='lathe':profile=[(r*s[0],y*s[1])for r,y in part['profile']]
  elif kind=='shade':profile=[(s[0]*math.sin((i+.3)/16.3*math.pi/2),s[1]*math.cos((i+.3)/16.3*math.pi/2))for i in range(17)]
  else:
   outline=[(.48,0),(.7,.04),(.88,.2),(.99,.62),(1,.95),(s[2]/s[0],1),(s[2]/s[0]-.065,1),(.9,.93),(.88,.6),(.75,.22),(.38,.09),(0,.09)] if s[2]/s[0]>.7 else [(0,0),(.5,0),(.7,.04),(.97,.25),(1,.48),(.86,.64),(.48,.79),(.4,.97),(.4,1),(.31,1),(.31,.96),(.4,.8),(.73,.61),(.85,.45),(.73,.22),(.35,.09),(0,.09)]
   profile=[(r*s[0],(y-.5)*s[1])for r,y in outline]
  for r,y in profile:
   for i in range(seg):angle=i*2*math.pi/seg;verts.append((r*math.cos(angle),y,r*math.sin(angle)))
  for j in range(len(profile)-1):
   for i in range(seg):a=j*seg+i;b=(j+1)*seg+i;c=(j+1)*seg+(i+1)%seg;d=j*seg+(i+1)%seg;faces.append([a,b,c,d])
  unique=[];mapping={};remap=[]
  for v in verts:
   key=tuple(round(c,8)for c in v)
   if key not in mapping:mapping[key]=len(unique);unique.append(v)
   remap.append(mapping[key])
  filtered=[]
  for f in faces:
   seq=[]
   for index in f:
    if remap[index] not in seq:seq.append(remap[index])
   if len(seq)>2:filtered.append(seq)
  verts=unique;faces=filtered
 elif kind=='archPanel':
  w,h,d=s;radius=w/2;outline=[(-w/2,-h/2),(w/2,-h/2)]+[(math.cos(i*math.pi/16)*radius,h/2-radius+math.sin(i*math.pi/16)*radius)for i in range(17)]
  for z in[-d/2,d/2]:verts.extend((x,y,z)for x,y in outline)
  n=len(outline);faces=[list(range(n-1,-1,-1)),list(range(n,2*n))]+[[i,(i+1)%n,(i+1)%n+n,i+n]for i in range(n)]
 elif kind in('tube','torus'):
  seg=8
  if kind=='torus':path=[(s[0]*math.cos(j*math.pi*2/32),0,s[0]*math.sin(j*math.pi*2/32))for j in range(33)];radius=s[1]
  else:path=part['path'];radius=part['r']
  for j,point in enumerate(path):
   a=path[max(0,j-1)];b=path[min(len(path)-1,j+1)];axis=[b[k]-a[k]for k in range(3)];length=math.sqrt(sum(v*v for v in axis));axis=[v/length for v in axis];test=[0,1,0]if abs(axis[1])<.9 else[1,0,0];u=[axis[1]*test[2]-axis[2]*test[1],axis[2]*test[0]-axis[0]*test[2],axis[0]*test[1]-axis[1]*test[0]];length=math.sqrt(sum(v*v for v in u));u=[v/length for v in u];v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]]
   for i in range(seg):angle=i*math.pi*2/seg;verts.append(tuple(point[k]+radius*(math.cos(angle)*u[k]+math.sin(angle)*v[k])for k in range(3)))
  for j in range(len(path)-1):
   for i in range(seg):faces.append([j*seg+i,j*seg+(i+1)%seg,(j+1)*seg+(i+1)%seg,(j+1)*seg+i])
  if kind=='tube':faces.extend([list(range(seg-1,-1,-1)),list(range((len(path)-1)*seg,len(path)*seg))])
 elif kind=='leaf':
  for j in range(11):
   t=j/10;w=math.sin(math.pi*t)**.8*s[0]/2
   for k in[-1,0,1]:verts.append((k*w,(t-.5)*s[1],(1-abs(k))*.3*math.sin(math.pi*t)*s[2]))
  for j in range(10):
   for k in range(2):
    a=j*3+k;faces.extend([[a,a+3,a+1],[a+1,a+3,a+4]])
  # Weld pole vertices and drop zero-area triangles.
  unique=[];mapping={};remap=[]
  for v in verts:
   key=tuple(round(c,8)for c in v)
   if key not in mapping:mapping[key]=len(unique);unique.append(v)
   remap.append(mapping[key])
  faces=[[remap[i]for i in f]for f in faces if len(set(remap[i]for i in f))==3];verts=unique
 elif kind=='roundedBox':
  radius=min(s)*.3;seg=6
  for axis in range(3):
   others=[i for i in range(3)if i!=axis]
   for sign in[-1,1]:
    start=len(verts)
    for j in range(seg+1):
     for i in range(seg+1):
      v=[0.,0.,0.];v[axis]=sign*s[axis]/2;v[others[0]]=(i/seg-.5)*s[others[0]];v[others[1]]=(j/seg-.5)*s[others[1]];inner=[max(-s[k]/2+radius,min(s[k]/2-radius,v[k]))for k in range(3)];delta=[v[k]-inner[k]for k in range(3)];length=math.sqrt(sum(q*q for q in delta));verts.append(tuple(inner[k]+delta[k]/length*radius for k in range(3)))
    for j in range(seg):
     for i in range(seg):a=start+j*(seg+1)+i;faces.extend([[a,a+1,a+seg+1],[a+1,a+seg+2,a+seg+1]])
 elif kind=='box':
  verts=[(x*s[0]/2,y*s[1]/2,z*s[2]/2)for x,y,z in[(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
  faces=[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]]
 elif kind=='sphere':
  seg=20;rings=10;verts=[(0,s[1]/2,0)]
  for j in range(1,rings):
   phi=math.pi*j/rings
   for i in range(seg):
    a=2*math.pi*i/seg;verts.append((math.sin(phi)*math.cos(a)*s[0]/2,math.cos(phi)*s[1]/2,math.sin(phi)*math.sin(a)*s[2]/2))
  bottom=len(verts);verts.append((0,-s[1]/2,0))
  for i in range(seg):faces.append([0,1+(i+1)%seg,1+i]);faces.append([bottom,1+(rings-2)*seg+i,1+(rings-2)*seg+(i+1)%seg])
  for j in range(rings-2):
   for i in range(seg):a=1+j*seg+i;b=1+j*seg+(i+1)%seg;faces.append([a,b,b+seg,a+seg])
 elif kind in('cylinder','rod'):
  seg=20
  if kind=='rod':
   a=part['a'];b=part['b'];delta=[b[i]-a[i]for i in range(3)];length=math.sqrt(sum(v*v for v in delta));axis=[v/length for v in delta];test=[0,1,0]if abs(axis[1])<.9 else[1,0,0]
   u=[axis[1]*test[2]-axis[2]*test[1],axis[2]*test[0]-axis[0]*test[2],axis[0]*test[1]-axis[1]*test[0]];l=math.sqrt(sum(v*v for v in u));u=[v/l for v in u];v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]]
   for center in[a,b]:
    for i in range(seg):angle=i*math.pi*2/seg;verts.append(tuple(center[k]+part['r']*(math.cos(angle)*u[k]+math.sin(angle)*v[k])for k in range(3)))
  else:
   for yy,rr in[(-s[1]/2,s[0]),(s[1]/2,s[2])]:
    for i in range(seg):a=i*math.pi*2/seg;verts.append((rr*math.cos(a),yy,rr*math.sin(a)))
  faces.append(list(range(seg-1,-1,-1)));faces.append(list(range(seg,seg*2)))
  for i in range(seg):j=(i+1)%seg;faces.append([i,j,j+seg,i+seg])
 else:raise ValueError(kind)
 if kind not in('rod','tube'):
  verts=[tuple(rotate(v,part.get('rotation',[0,0,0]))[i]+part['p'][i]for i in range(3))for v in verts]
 if kind not in('leaf','vessel','shade','lathe','tube','torus'):
  center=part.get('p',[(part['a'][i]+part['b'][i])/2 for i in range(3)] if kind=='rod' else [0,0,0])
  for f in faces:
   a,b,c=[verts[i]for i in f[:3]];u=[b[k]-a[k]for k in range(3)];v=[c[k]-a[k]for k in range(3)];normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];mid=[sum(verts[i][k]for i in f)/len(f)-center[k]for k in range(3)]
   if sum(normal[k]*mid[k]for k in range(3))<0:f.reverse()
 return verts,faces,smooth
parts=0;facecount=0
for idx,item in enumerate(design['items']):
 ent=group(root,'MT | '+item['id']+' | '+item['room']+' | '+item['name'])
 for j,part in enumerate(item['parts']):
  dest=group(ent,f'{part["m"]} {j+1}',matrefs[part['m']]);verts,faces,smooth=shape(part);geom=ref('SUGeometryInputCreate')
  points=(V*len(verts))(*[V(x/.0254,-z/.0254,y/.0254)for x,y,z in verts]);call('SUGeometryInputSetVertices',geom,C.c_size_t(len(points)),points)
  for f in faces:
   loop=ref('SULoopInputCreate')
   for index in f:call('SULoopInputAddVertexIndex',loop,C.c_size_t(index))
   if smooth:
    for e in range(len(f)):
     call('SULoopInputEdgeSetSoft',loop,C.c_size_t(e),C.c_bool(True));call('SULoopInputEdgeSetSmooth',loop,C.c_size_t(e),C.c_bool(True))
   added=C.c_size_t();call('SUGeometryInputAddFace',geom,C.byref(loop),C.byref(added))
  call('SUEntitiesFill',dest,geom,C.c_bool(True));call('SUGeometryInputRelease',C.byref(geom));parts+=1;facecount+=len(faces)
 if idx%20==0:print(f'Built {idx+1}/{len(design["items"])} furniture and finish groups.',flush=True)
args.output.parent.mkdir(parents=True,exist_ok=True);call('SUModelSaveToFile',model,str(args.output.resolve()).encode());call('SUModelRelease',C.byref(model))
# Reopen the exact saved model and check every native furniture group survived.
model=Ref();call('SUModelCreateFromFileWithStatus',C.byref(model),str(args.output.resolve()).encode(),C.byref(status));root=ref('SUModelGetEntities',model);groups=refs('SUEntitiesGetGroups',root);names=[string('SUGroupGetName',g)for g in groups];native=[n for n in names if n.startswith('MT |')];assert len(native)==len(design['items']),(len(native),len(design['items']))
for i,expected in door_transforms.items():
 t=Transform();call('SUGroupGetTransform',groups[i],C.byref(t));assert all(abs(a-b)<1e-8 for a,b in zip(expected,t.values)),'Door placement changed'
assert hashlib.sha256(args.source.read_bytes()).hexdigest()==source_hash,'Original source changed unexpectedly.'
chairs=[i['facing'] for i in design['items'] if 'facing' in i];assert len(chairs)==4
for f in chairs:
 dx=f['target'][0]-f['position'][0];dz=f['target'][2]-f['position'][2];assert (-math.sin(f['rotation'])*dx-math.cos(f['rotation'])*dz)/math.hypot(dx,dz)>.999
report={'source_sha256':source_hash,'source_unchanged':True,'source_doors_retained':True,'scheme':design['scheme'],'source_board_page':design['sourceBoardPage'],'dining_chairs_face_table':True,'output':str(args.output.resolve()),'source':args.source.name,'design':design['version'],'items':len(native),'parts':parts,'new_faces':facecount,'rooms':sorted(set(i['room']for i in design['items'])),'palette_overrides':changed,'reopened_successfully':True,'bytes':args.output.stat().st_size,'seconds':round(time.time()-started,1)}
args.output.with_suffix('.verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);call('SUModelRelease',C.byref(model));api.SUTerminate()
