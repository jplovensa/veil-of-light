"""Apply the shared modern tropical design to a new copy of the supplied SKP."""
import argparse, ctypes as C, json, math, hashlib, time, struct, zlib
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);parser.add_argument('--spec',type=Path,default=Path(__file__).resolve().parents[1]/'interior-spec.json');parser.add_argument('--sdk',default='/Applications/SketchUp 2025/SketchUpPro.app/Contents/Frameworks/SketchUpAPI.framework/SketchUpAPI');args=parser.parse_args()
assert args.source.resolve()!=args.output.resolve(),'Use a new output file to preserve the original.'
source_hash=hashlib.sha256(args.source.read_bytes()).hexdigest()
api=C.CDLL(args.sdk)
class Ref(C.Structure):_fields_=[('ptr',C.c_void_p)]
class V(C.Structure):_fields_=[('x',C.c_double),('y',C.c_double),('z',C.c_double)]
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
  tex=Ref();path=texture_png(name,props);tile=.4 if props['texture'] in('wood','stone')else .12;call('SUTextureCreateFromFile',C.byref(tex),str(path.resolve()).encode(),C.c_double(tile/.0254),C.c_double(tile/.0254));call('SUMaterialSetTexture',mat,tex)
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
 kind=part['shape'];s=part.get('s');verts=[];faces=[];smooth=kind!='box'
 if kind=='leaf':
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
 if kind!='rod':
  verts=[tuple(rotate(v,part.get('rotation',[0,0,0]))[i]+part['p'][i]for i in range(3))for v in verts]
 if kind!='leaf':
  center=part.get('p',[(part['a'][i]+part['b'][i])/2 for i in range(3)] if kind=='rod' else [0,0,0])
  for f in faces:
   a,b,c=[verts[i]for i in f[:3]];u=[b[k]-a[k]for k in range(3)];v=[c[k]-a[k]for k in range(3)];normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];mid=[sum(verts[i][k]for i in f)/len(f)-center[k]for k in range(3)]
   if sum(normal[k]*mid[k]for k in range(3))<0:f.reverse()
 return verts,faces,smooth
parts=0;facecount=0
for idx,item in enumerate(design['items']):
 ent=group(root,'MT | '+item['room']+' | '+item['name'])
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
assert hashlib.sha256(args.source.read_bytes()).hexdigest()==source_hash,'Original source changed unexpectedly.'
chairs=[i['facing'] for i in design['items'] if 'facing' in i];assert len(chairs)==4
for f in chairs:
 dx=f['target'][0]-f['position'][0];dz=f['target'][2]-f['position'][2];assert (-math.sin(f['rotation'])*dx-math.cos(f['rotation'])*dz)/math.hypot(dx,dz)>.999
report={'source_sha256':source_hash,'source_unchanged':True,'dining_chairs_face_table':True,'output':str(args.output.resolve()),'source':args.source.name,'design':design['version'],'items':len(native),'parts':parts,'new_faces':facecount,'rooms':sorted(set(i['room']for i in design['items'])),'palette_overrides':changed,'reopened_successfully':True,'bytes':args.output.stat().st_size,'seconds':round(time.time()-started,1)}
args.output.with_suffix('.verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True);call('SUModelRelease',C.byref(model));api.SUTerminate()
