import ctypes as C, json, struct, array, time, argparse, os
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]; OUT=BASE/'dist/assets'; OUT.mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser(description='Convert SketchUp geometry using an installed SketchUp C API.');parser.add_argument('source',type=Path);parser.add_argument('--sdk',default=os.environ.get('SKETCHUP_API_LIBRARY','/Applications/SketchUp 2025/SketchUpPro.app/Contents/Frameworks/SketchUpAPI.framework/SketchUpAPI'));args=parser.parse_args();api=C.CDLL(args.sdk)
class Ref(C.Structure): _fields_=[('ptr',C.c_void_p)]
class Vec(C.Structure): _fields_=[('x',C.c_double),('y',C.c_double),('z',C.c_double)]
class Transform(C.Structure): _fields_=[('values',C.c_double*16)]
class Color(C.Structure): _fields_=[('r',C.c_ubyte),('g',C.c_ubyte),('b',C.c_ubyte),('a',C.c_ubyte)]
def call(n,*a): return getattr(api,n)(*a)
def ref(n,*a):
 r=Ref(); call(n,*a,C.byref(r)); return r
def size(n,*a):
 r=C.c_size_t();call(n,*a,C.byref(r));return r.value
def refs(n,obj):
 count=size(n.replace('Get','GetNum',1),obj)
 if not count:return []
 arr=(Ref*count)();got=C.c_size_t();r=call(n,obj,C.c_size_t(count),arr,C.byref(got));return list(arr)[:got.value]
def string(n,obj):
 s=Ref();call('SUStringCreate',C.byref(s));call(n,obj,C.byref(s)); l=size('SUStringGetUTF8Length',s);b=C.create_string_buffer(l+1);got=C.c_size_t();call('SUStringGetUTF8',s,C.c_size_t(l+1),b,C.byref(got));call('SUStringRelease',C.byref(s));return b.value.decode('utf8','replace')
def visible(r,kind):
 fn=getattr(api,kind+'ToDrawingElement');fn.restype=Ref;d=fn(r); hidden=C.c_bool();call('SUDrawingElementGetHidden',d,C.byref(hidden))
 layer=ref('SUDrawingElementGetLayer',d);vis=C.c_bool(True)
 if layer.ptr:call('SULayerGetVisibility',layer,C.byref(vis))
 return not hidden.value and vis.value
api.SUInitialize();model=Ref();status=C.c_int();start=time.time()
r=call('SUModelCreateFromFileWithStatus',C.byref(model),str(args.source.resolve()).encode(),C.byref(status))
assert r==0,(r,status.value)
print('Model loaded',time.time()-start,flush=True)
g={'asset':{'version':'2.0','generator':'Villa SketchUp C API conversion'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'SketchUp inches Z-up → metres Y-up','matrix':[.0254,0,0,0,0,0,-.0254,0,0,.0254,0,0,0,0,0,1],'children':[]}],'meshes':[],'materials':[],'accessors':[],'bufferViews':[],'buffers':[],'textures':[],'images':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]}
binary=bytearray();mats={};cache={};stats={'faces':0,'triangles_unique':0,'containers':0,'hidden':0};names=[]
def buffer(data,target=None):
 while len(binary)%4:binary.append(0)
 v={'buffer':0,'byteOffset':len(binary),'byteLength':len(data)}
 if target:v['target']=target
 g['bufferViews'].append(v);binary.extend(data);return len(g['bufferViews'])-1
def accessor(vals,typ,component=5126):
 code='f' if component==5126 else 'I';ar=array.array(code,vals);view=buffer(ar.tobytes(),34963 if component==5125 else 34962);dim={'VEC3':3,'VEC2':2,'SCALAR':1}[typ];a={'bufferView':view,'componentType':component,'count':len(vals)//dim,'type':typ}
 if typ=='VEC3' and vals:a['min']=[min(vals[i::3]) for i in range(3)];a['max']=[max(vals[i::3]) for i in range(3)]
 g['accessors'].append(a);return len(g['accessors'])-1
# Neutral default for unpainted SketchUp faces.
g['materials'].append({'name':'Unpainted','pbrMetallicRoughness':{'baseColorFactor':[.78,.76,.68,1],'metallicFactor':0,'roughnessFactor':.85},'doubleSided':True});mats[0]=0
tex_count=0
def material(m):
 global tex_count
 if not m.ptr:return 0
 if m.ptr in mats:return mats[m.ptr]
 name=string('SUMaterialGetName',m);c=Color(200,195,180,255);call('SUMaterialGetColor',m,C.byref(c));alpha=C.c_double(1);use=C.c_bool();call('SUMaterialGetUseOpacity',m,C.byref(use))
 if use.value:call('SUMaterialGetOpacity',m,C.byref(alpha))
 pbr={'baseColorFactor':[c.r/255,c.g/255,c.b/255,alpha.value],'metallicFactor':0,'roughnessFactor':.78};entry={'name':name,'pbrMetallicRoughness':pbr,'doubleSided':True}
 tex=ref('SUMaterialGetTexture',m)
 if tex.ptr:
  filename='texture_%03d.png'%tex_count;ret=call('SUTextureWriteToFile',tex,str(OUT/filename).encode())
  if ret==0:
   g['images'].append({'uri':filename});g['textures'].append({'sampler':0,'source':len(g['images'])-1});pbr['baseColorTexture']={'index':len(g['textures'])-1};pbr['baseColorFactor']=[1,1,1,alpha.value];tex_count+=1
 if alpha.value<.999:entry['alphaMode']='BLEND';entry['extras']={'glass':True}
 idx=len(g['materials']);g['materials'].append(entry);mats[m.ptr]=idx;return idx
# Reuse each SketchUp component definition instead of duplicating furniture.
def entities(ent,label='Group',inherited=None,depth=0):
 key=(ent.ptr,inherited.ptr if inherited else 0)
 if key in cache:return cache[key]
 stats['containers']+=1;children=[];buckets={}
 for face in refs('SUEntitiesGetFaces',ent):
  if not visible(face,'SUFace'):stats['hidden']+=1;continue
  mat=ref('SUFaceGetFrontMaterial',face)
  if not mat.ptr:mat=inherited or Ref()
  mid=material(mat);mesh=Ref()
  if call('SUMeshHelperCreate',C.byref(mesh),face):continue
  nv=size('SUMeshHelperGetNumVertices',mesh);ni=size('SUMeshHelperGetNumTriangles',mesh)*3
  if nv and ni:
   verts=(Vec*nv)();uv=(Vec*nv)();inds=(C.c_size_t*ni)();count=C.c_size_t();call('SUMeshHelperGetVertices',mesh,C.c_size_t(nv),verts,C.byref(count));call('SUMeshHelperGetFrontSTQCoords',mesh,C.c_size_t(nv),uv,C.byref(count));call('SUMeshHelperGetVertexIndices',mesh,C.c_size_t(ni),inds,C.byref(count))
   b=buckets.setdefault(mid,[array.array('f'),array.array('f'),array.array('I')]);offset=len(b[0])//3
   for v in verts:b[0].extend((v.x,v.y,v.z))
   for v in uv:b[1].extend((v.x/(v.z or 1),v.y/(v.z or 1)))
   b[2].extend(i+offset for i in inds);stats['triangles_unique']+=ni//3;stats['faces']+=1
  call('SUMeshHelperRelease',C.byref(mesh))
 if buckets:
  prim=[]
  for mid,(pos,uv,ind) in buckets.items():prim.append({'attributes':{'POSITION':accessor(pos,'VEC3'),'TEXCOORD_0':accessor(uv,'VEC2')},'indices':accessor(ind,'SCALAR',5125),'material':mid})
  g['meshes'].append({'name':label,'primitives':prim});children.append({'name':label+' geometry','mesh':len(g['meshes'])-1})
 for kind,getter in [('SUGroup','Groups'),('SUComponentInstance','Instances')]:
  for obj in refs('SUEntitiesGet'+getter,ent):
   if not visible(obj,kind):stats['hidden']+=1;continue
   fn=getattr(api,kind+'ToDrawingElement');fn.restype=Ref;paint=ref('SUDrawingElementGetMaterial',fn(obj))
   if not paint.ptr:paint=inherited
   if kind=='SUGroup':sub=ref('SUGroupGetEntities',obj);name=string('SUGroupGetName',obj)
   else:
    definition=ref('SUComponentInstanceGetDefinition',obj);sub=ref('SUComponentDefinitionGetEntities',definition);name=string('SUComponentDefinitionGetName',definition)
   t=Transform();call(kind+'GetTransform',obj,C.byref(t));nodes=entities(sub,name or 'Group',paint,depth+1)
   if nodes:children.append({'name':name or 'Group','matrix':list(t.values),'children':nodes})
 result=[]
 for node in children:result.append(len(g['nodes']));g['nodes'].append(node)
 cache[key]=result
 if stats['containers']%100==0:print(stats,flush=True)
 return result
ent=ref('SUModelGetEntities',model);g['nodes'][0]['children']=entities(ent,'Villa')
# Preserve the saved SketchUp camera as an optional original view.
cam=ref('SUModelGetCamera',model);eye=Vec();target=Vec();up=Vec();call('SUCameraGetOrientation',cam,C.byref(eye),C.byref(target),C.byref(up))
conv=lambda v:[v.x*.0254,v.z*.0254,-v.y*.0254]
meta={'source':args.source.name,'units':'metres','camera':{'eye':conv(eye),'target':conv(target),'up':conv(up)},'statistics':stats,'materials':len(g['materials']),'textures':tex_count}
# Embed images into GLB for a self-contained portable model.
for img in g['images']:
 p=OUT/img.pop('uri');img['bufferView']=buffer(p.read_bytes());img['mimeType']='image/png';p.unlink()
g['buffers']=[{'byteLength':len(binary)}]
js=json.dumps(g,separators=(',',':'),ensure_ascii=True).encode();js+=b' '*((-len(js))%4);binary+=b'\0'*((-len(binary))%4)
with (OUT/'villa.glb').open('wb') as f:f.write(struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(binary)));f.write(struct.pack('<II',len(js),0x4E4F534A));f.write(js);f.write(struct.pack('<II',len(binary),0x004E4942));f.write(binary)
(OUT/'model-info.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta), 'GLB MB',len(binary)/1e6,'seconds',time.time()-start,flush=True)
call('SUModelRelease',C.byref(model));api.SUTerminate()
