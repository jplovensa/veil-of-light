"""Shelter of Sky material workflow, using Veil of Light's own original catalogue pages."""
from pathlib import Path
from pypdf import PdfReader
from PIL import Image,ImageFilter,ImageOps
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];SRC=Path('/Users/jplovensa/Downloads/Library Archive/02 FJALL/Presentations and Catalogues/To Breathe_FG Signature Catalogue.pdf');OUT=ROOT/'dist/assets/catalogue';OUT.mkdir(exist_ok=True)
reader=PdfReader(SRC);manifest={'referenceSystem':'Shelter of Sky / catalogue-materials.js and extract-catalogue-schemes.py','sourcePDF':SRC.name,'sourceSHA256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'schemes':{}}
sets={'earth':(19,{'wall':6,'stone':7,'wood':8,'linen':9,'boucle':10,'quartz':11}),'chalk':(20,{'wall':6,'concrete':7,'stone':8,'wood':9,'linen':10,'boucle':11,'quartz':12}),'canopy':(21,{'wall':6,'stone':7,'wood':8,'cane':9,'linen':10,'quartz':11})}
for scheme,(page,items)in sets.items():
 folder=OUT/scheme;folder.mkdir(exist_ok=True);images=list(reader.pages[page-1].images);records={};manifest['schemes'][scheme]={'page':page,'maps':records}
 for finish,index in items.items():
  im=images[index].image.convert('RGB');w,h=im.size;crop=(int(w*.14),int(h*.12),int(w*.86),int(h*.88));im=im.crop(crop);im.save(folder/(finish+'-color.jpg'),quality=92,optimize=True)
  lum=im.convert('L').resize((256,256),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(.7));p=lum.load();normal=Image.new('RGB',lum.size);n=normal.load();strength=.14 if finish in ['linen','boucle','wall']else .35 if finish=='cane'else .22
  for y in range(256):
   for x in range(256):
    dx=(p[min(255,x+1),y]-p[max(0,x-1),y])*strength;dy=(p[x,min(255,y+1)]-p[x,max(0,y-1)])*strength;n[x,y]=(max(0,min(255,round(128-dx))),max(0,min(255,round(128-dy))),255)
  normal.save(folder/(finish+'-normal.jpg'),quality=86,optimize=True)
  rough=lum.point(lambda x: 231+round(x*.08)if finish in ['linen','boucle','wall']else 180+round(x*.25)if finish=='wood'else 205+round(x*.16));rough.save(folder/(finish+'-roughness.jpg'),quality=80,optimize=True)
  records[finish]={'embeddedImage':images[index].name,'originalPixels':[w,h],'crop':crop,'diffuse':'Original embedded catalogue swatch, border crop only','normal':'Reference-derived surface approximation','roughness':'Conservative matte/honed material response'}
(OUT/'provenance.json').write_text(json.dumps(manifest,indent=2));print('Catalogue material maps:',sum(len(q['maps'])for q in manifest['schemes'].values()))
