"""Fetch credited CC0 PBR materials and the matching Three.js 0.170 addons."""
from pathlib import Path
import concurrent.futures,json,urllib.request,re,posixpath,subprocess
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'dist/assets/realism';out.mkdir(parents=True,exist_ok=True)
assets={'teak':'teak_veneer','linen':'rough_linen','plaster':'plastered_wall_02'}
def read_url(url):return subprocess.check_output(['curl','-fLsS','--retry','2',url])
credits=[];downloads=[]
for key,asset in assets.items():
 data=json.loads(read_url('https://api.polyhaven.com/files/'+asset))
 for name,channel in [('color','Diffuse'),('normal','nor_gl'),('roughness','Rough')]:downloads.append((data[channel]['1k']['jpg']['url'],out/f'{key}-{name}.jpg'))
 credits.append({'name':asset,'url':'https://polyhaven.com/a/'+asset,'license':'CC0'})
hdr=json.loads(read_url('https://api.polyhaven.com/files/kiara_interior'));downloads.append((hdr['hdri']['1k']['hdr']['url'],out/'tropical-interior.hdr'));credits.append({'name':'Kiara Interior','url':'https://polyhaven.com/a/kiara_interior','license':'CC0','author':'Greg Zaal'})
def fetch(pair):
 url,path=pair
 if not path.exists():
  path.write_bytes(read_url(url))
 if path.suffix=='.jpg':subprocess.run(['sips','-s','formatOptions','80',str(path)],stdout=subprocess.DEVNULL,check=True)
 return path.name,path.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
 for name,size in pool.map(fetch,downloads):print(name,size,flush=True)
base='https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/';vendor=ROOT/'dist/vendor';seen=set();queue=['loaders/RGBELoader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/SSAOPass.js','postprocessing/OutputPass.js']
while queue:
 name=queue.pop()
 if name in seen:continue
 seen.add(name);path=vendor/name;path.parent.mkdir(parents=True,exist_ok=True);content=read_url(base+name).decode();path.write_text(content)
 for rel in re.findall(r"from\s+['\"]([^'\"]+)['\"]",content):
  if rel.startswith('.'):
   dep=posixpath.normpath(posixpath.join(posixpath.dirname(name),rel));assert not dep.startswith('..');queue.append(dep)
 print('Three addon',name,flush=True)
(out/'credits.json').write_text(json.dumps(credits,indent=2));print('All realism assets are bundled locally.',flush=True)
