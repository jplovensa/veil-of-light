import json,struct,subprocess
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'dist/assets';raw=(p/'villa.glb').read_bytes();jl=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+jl]);data=raw[28+jl:]
image_views=set()
for i,img in enumerate(g['images']):
 view=img.pop('bufferView');image_views.add(view);v=g['bufferViews'][view];f=p/f'texture_{i:03d}.png';f.write_bytes(data[v['byteOffset']:v['byteOffset']+v['byteLength']]);img.pop('mimeType',None)
 # Resample large source textures; retain PNG transparency for plants and cutouts.
 subprocess.run(['sips','-Z','1024',str(f)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 info=subprocess.check_output(['sips','-g','hasAlpha',str(f)],text=True)
 if 'yes' not in info:
  dest=f.with_suffix('.jpg');subprocess.run(['sips','-s','format','jpeg','-s','formatOptions','82',str(f),'--out',str(dest)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);f.unlink();f=dest
 img['uri']=f.name
# Separate geometry into small browser-cacheable buffers.
g['buffers']=[];newviews=[];mapping={};chunk=bytearray()
def flush():
 global chunk
 if chunk:
  name=f'geometry_{len(g["buffers"]):02d}.bin';(p/name).write_bytes(chunk);g['buffers'].append({'uri':name,'byteLength':len(chunk)});chunk=bytearray()
for i,v in enumerate(g['bufferViews']):
 if i in image_views:continue
 length=v['byteLength']
 if len(chunk)+length>12_000_000:flush()
 while len(chunk)%4:chunk.append(0)
 nv=dict(v);nv['buffer']=len(g['buffers']);nv['byteOffset']=len(chunk);chunk.extend(data[v['byteOffset']:v['byteOffset']+length]);mapping[i]=len(newviews);newviews.append(nv)
flush();g['bufferViews']=newviews
for a in g['accessors']:a['bufferView']=mapping[a['bufferView']]
# glTF nodes must form a tree; instances share meshes rather than node objects.
old=g['nodes'];g['nodes']=[]
def clone(i):
 n=dict(old[i]);idx=len(g['nodes']);g['nodes'].append(n)
 if 'children' in n:n['children']=[clone(c) for c in n['children']]
 return idx
g['scenes'][0]['nodes']=[clone(0)]
(p/'villa.gltf').write_text(json.dumps(g,separators=(',',':')))
print('Nodes',len(g['nodes']),'meshes',len(g['meshes']),'buffers',len(g['buffers']),'total MB',sum(f.stat().st_size for f in p.iterdir() if f.name!='villa.glb')/1e6)
(p/'villa.glb').unlink()
