"""Export only the rebuilt, verified native SketchUp furniture to a compact GLB."""
import argparse,ctypes as C,json,math,array,struct,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);p.add_argument('--spec',type=Path,required=True);p.add_argument('--sdk',default='/Applications/SketchUp 2025/SketchUpPro.app/Contents/Frameworks/SketchUpAPI.framework/SketchUpAPI');args=p.parse_args();spec=json.loads(args.spec.read_text());report=json.loads(args.source.with_suffix('.verification.json').read_text());assert report['reopened_successfully']and report['source_doors_retained'];api=C.CDLL(args.sdk)
class Ref(C.Structure):_fields_=[('ptr',C.c_void_p)]
class V(C.Structure):_fields_=[('x',C.c_double),('y',C.c_double),('z',C.c_double)]
class Transform(C.Structure):_fields_=[('values',C.c_double*16)]
def call(n,*a):
 result=getattr(api,n)(*a)
 if result:raise RuntimeError((n,result))
def ref(n,*a):
 r=Ref();result=getattr(api,n)(*a,C.byref(r))
 if result and not(result==9 and n in('SUDrawingElementGetMaterial','SUFaceGetFrontMaterial')):raise RuntimeError((n,result))
 return r
def count(n,*a):v=C.c_size_t();call(n,*a,C.byref(v));return v.value
def refs(n,obj):
 total=count(n.replace('Get','GetNum',1),obj)
 if not total:return []
 arr=(Ref*total)();got=C.c_size_t();call(n,obj,C.c_size_t(total),arr,C.byref(got));return list(arr)[:got.value]
def string(n,obj):
 s=ref('SUStringCreate');call(n,obj,C.byref(s));l=count('SUStringGetUTF8Length',s);buf=C.create_string_buffer(l+1);got=C.c_size_t();call('SUStringGetUTF8',s,C.c_size_t(l+1),buf,C.byref(got));call('SUStringRelease',C.byref(s));return buf.value.decode('utf8','replace')
api.SUGroupToDrawingElement.restype=Ref
I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
def mul(a,b):return [sum(a[k*4+r]*b[c*4+k]for k in range(4))for c in range(4)for r in range(4)]
def apply(m,v,w=1):return tuple(sum(m[k*4+r]*(*v,w)[k]for k in range(4))for r in range(3))
def metres(v):return(v[0]*.0254,v[2]*.0254,-v[1]*.0254)
def normalize(v):l=math.sqrt(sum(x*x for x in v))or 1;return tuple(x/l for x in v)
api.SUInitialize();model=Ref();status=C.c_int();call('SUModelCreateFromFileWithStatus',C.byref(model),str(args.source.resolve()).encode(),C.byref(status));root=ref('SUModelGetEntities',model)
items={i['id']:i for i in spec['items']};buckets={};native=[];triangles=0

def collect(ent,matrix,inherited,item):
 global triangles
 for face in refs('SUEntitiesGetFaces',ent):
  mat=ref('SUFaceGetFrontMaterial',face)
  if not mat.ptr:mat=inherited
  name=string('SUMaterialGetName',mat).removeprefix('MT | ')if mat and mat.ptr else 'limewash'
  mesh=Ref();call('SUMeshHelperCreate',C.byref(mesh),face);nv=count('SUMeshHelperGetNumVertices',mesh);nt=count('SUMeshHelperGetNumTriangles',mesh);got=C.c_size_t();points=(V*nv)();normals=(V*nv)();inds=(C.c_size_t*(nt*3))();call('SUMeshHelperGetVertices',mesh,C.c_size_t(nv),points,C.byref(got));call('SUMeshHelperGetNormals',mesh,C.c_size_t(nv),normals,C.byref(got));call('SUMeshHelperGetVertexIndices',mesh,C.c_size_t(nt*3),inds,C.byref(got))
  owner=items.get(item.get('parentId'),item);key=(owner['id']if owner['movable']else 'fixed-'+owner['room'],name);bucket=buckets.setdefault(key,{'positions':[],'normals':[],'uv':[],'indices':[],'lookup':{},'item':owner})
  pivot=owner['pivot']if owner['movable']else[0,0,0];ids=[]
  for v,n in zip(points,normals):
   world=metres(apply(matrix,(v.x,v.y,v.z)));nn=apply(matrix,(n.x,n.y,n.z),0);normal=normalize((nn[0],nn[2],-nn[1]));pos=tuple(world[k]-pivot[k]for k in range(3));ax,ay,az=map(abs,normal)
   tile=.048 if name=='cane'else 1.2 if name in('teak','teakDark')else .45 if name in('linen','olive','boucle','rug','cane')else 1.6
   uv=(world[0]/tile,world[2]/tile)if ay>=ax and ay>=az else (world[2]/tile,world[1]/tile)if ax>=az else(world[0]/tile,world[1]/tile)
   if name in('teak','teakDark')and ay<.7:uv=uv[::-1]
   code=tuple(round(c,5)for c in pos)+tuple(round(c,3)for c in normal)+tuple(round(c,4)for c in uv)
   if code not in bucket['lookup']:
    bucket['lookup'][code]=len(bucket['positions'])//3;bucket['positions'].extend(pos);bucket['normals'].extend(normal);bucket['uv'].extend(uv)
   ids.append(bucket['lookup'][code])
  bucket['indices'].extend(ids[i]for i in inds);triangles+=nt;call('SUMeshHelperRelease',C.byref(mesh))
 for child in refs('SUEntitiesGetGroups',ent):
  t=Transform();call('SUGroupGetTransform',child,C.byref(t));paint=ref('SUDrawingElementGetMaterial',api.SUGroupToDrawingElement(child));collect(ref('SUGroupGetEntities',child),mul(matrix,list(t.values)),paint if paint.ptr else inherited,item)
for group in refs('SUEntitiesGetGroups',root):
 name=string('SUGroupGetName',group)
 if not name.startswith('MT | '):continue
 ident=name.split(' | ')[1];item=items[ident];native.append(ident);t=Transform();call('SUGroupGetTransform',group,C.byref(t));paint=ref('SUDrawingElementGetMaterial',api.SUGroupToDrawingElement(group));collect(ref('SUGroupGetEntities',group),list(t.values),paint,item)
assert len(native)==len(items)
blob=bytearray();g={'asset':{'version':'2.0','generator':'Verified SketchUp C API furniture export','extras':{'scheme':spec['scheme'],'sourceNativeSHA256':hashlib.sha256(args.source.read_bytes()).hexdigest(),'sourceBoardPage':spec['sourceBoardPage']}},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':[],'buffers':[],'bufferViews':[],'accessors':[]}
def attr(values,kind,component=5126):
 while len(blob)%4:blob.append(0)
 raw=array.array('f'if component==5126 else 'H'if component==5123 else 'I',values).tobytes();view=len(g['bufferViews']);g['bufferViews'].append({'buffer':0,'byteOffset':len(blob),'byteLength':len(raw)});blob.extend(raw);dim={'VEC3':3,'VEC2':2,'SCALAR':1}[kind];a={'bufferView':view,'componentType':component,'count':len(values)//dim,'type':kind}
 if kind=='VEC3':a.update(min=[min(values[k::3])for k in range(3)],max=[max(values[k::3])for k in range(3)])
 g['accessors'].append(a);return len(g['accessors'])-1
matids={}
for key,props in spec['materials'].items():
 matids[key]=len(g['materials']);rgb=[int(props['color'][k:k+2],16)/255 for k in(1,3,5)];m={'name':'MT | '+key,'pbrMetallicRoughness':{'baseColorFactor':rgb+[props.get('opacity',1)],'roughnessFactor':props.get('roughness',.8),'metallicFactor':props.get('metalness',0)},'doubleSided':True}
 if props.get('opacity'):m['alphaMode']='BLEND'
 g['materials'].append(m)
nodes={}
for (ident,mat),b in buckets.items():
 item=b['item']
 if ident not in nodes:
  index=len(g['nodes']);nodes[ident]=index;g['scenes'][0]['nodes'].append(index);g['meshes'].append({'name':ident,'primitives':[]});g['nodes'].append({'name':item['name']if item['movable']else item['room']+' | fitted finishes','mesh':len(g['meshes'])-1,'translation':item['pivot']if item['movable']else[0,0,0],'extras':{'itemId':ident,'room':item['room'],'name':item['name'],'movable':item['movable']}})
 prim={'attributes':{'POSITION':attr(b['positions'],'VEC3'),'NORMAL':attr(b['normals'],'VEC3'),'TEXCOORD_0':attr(b['uv'],'VEC2')},'indices':attr(b['indices'],'SCALAR',5123 if len(b['positions'])//3<65536 else 5125),'material':matids[mat]};g['meshes'][g['nodes'][nodes[ident]]['mesh']]['primitives'].append(prim)
g['buffers']=[{'byteLength':len(blob)}];js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);blob+=b'\0'*((-len(blob))%4);args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(blob))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(blob),0x004e4942)+blob)
summary={'scheme':spec['scheme'],'nativeFile':args.source.name,'nativeSHA256':g['asset']['extras']['sourceNativeSHA256'],'nativeVerified':True,'furnitureGroups':len(native),'renderGroups':len(nodes),'triangles':triangles,'bytes':args.output.stat().st_size,'materials':len(matids)};args.output.with_suffix('.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary),flush=True);call('SUModelRelease',C.byref(model));api.SUTerminate()
