"""Keep the supplied Veil of Light moodboards intact and add applied finish schedules."""
import json
from pathlib import Path
from PIL import Image
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
BASE=Path(__file__).resolve().parents[1];OUT=BASE.parents[1]/'outputs/veil-of-light-exterior';ASSETS=BASE/'dist/assets/exterior'
data=json.loads((ASSETS/'finish-specification.json').read_text());pdfmetrics.registerFont(TTFont('Inter',str(BASE/'dist/vendor/Inter-Regular.ttf')));pdfmetrics.registerFont(TTFont('InterBold',str(BASE/'dist/vendor/Inter-Semibold.ttf')))
W,H=1152,768;ink='#293d34';muted='#6b786c';line='#d0d4c9';paper='#f3f2eb'
styles={k:ParagraphStyle(k,fontName='Inter',fontSize=s,leading=s*1.4,textColor=HexColor(ink))for k,s in [('body',10),('small',8),('note',8.5)]}
def text(c,x,y,s,size=10,font='Inter',color=ink):c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,y,s)
def para(c,s,x,y,w,style='body'):
 p=Paragraph(s,styles[style]);_,h=p.wrap(w,200);p.drawOn(c,x,y-h);return h
def imgfill(c,path,x,y,w,h):
 im=Image.open(path);iw,ih=im.size;scale=min(w/iw,h/ih);c.saveState();q=c.beginPath();q.rect(x,y,w,h);c.clipPath(q,stroke=0);c.drawImage(str(path),x+(w-iw*scale)/2,y+(h-ih*scale)/2,iw*scale,ih*scale,mask='auto');c.restoreState()
app=OUT/'applications.pdf';c=canvas.Canvas(str(app),pagesize=(W,H));c.setTitle('Veil of Light - Catalogue moodboards and applied finishes')
for idx,e in enumerate(data['exteriorPalettes']):
 it=data['interiorPalettes'][e['id']];c.setFillColor(HexColor(paper));c.rect(0,0,W,H,fill=1,stroke=0)
 c.drawImage(str(BASE/'dist/assets/fjall-group-logo-transparent.png'),40,699,125,40,mask='auto',preserveAspectRatio=True)
 text(c,190,729,'VEIL OF LIGHT / TO BREATHE',9,'InterBold',muted);text(c,190,693,e['name'],29,'InterBold');text(c,930,726,f'FINISH APPLICATION / 0{idx+1}',9,'InterBold',muted)
 para(c,e['source']+'. Original moodboard preserved on the preceding page. The views below show the supplied SketchUp geometry with coordinated finishes.',190,678,900,'note')
 for j,key in enumerate(['model','interior']):
  p=OUT/f"{e['id']}-{key}.jpg";x=40+j*548
  # Browser captures are retained as evidence; crop only for the document layout.
  im=Image.open(p)
  if im.width>800:im=im.crop((0,105,min(680,im.width),min(570 if key=='interior' else 650,im.height)))
  crop=OUT/f"{e['id']}-{key}-crop.jpg";im.convert('RGB').save(crop,quality=93)
  imgfill(c,crop,x,390,524,245);text(c,x,371,'APPLIED TO ORIGINAL SKP / '+('EXTERIOR' if key=='model' else 'INTERIOR'),8,'InterBold',muted)
 text(c,40,337,'EXTERIOR FINISH SCHEDULE',10,'InterBold');text(c,588,337,'INTERIOR FINISH SCHEDULE',10,'InterBold')
 colors=[e['wall'],e['roof'],e['stone'],e['timber'],e['frame'],e['paving']]
 for r,row in enumerate(e['finishes']):
  yy=316-r*42;c.setStrokeColor(HexColor(line));c.line(40,yy-32,564,yy-32);c.setFillColor(HexColor(colors[r]));c.rect(40,yy-19,22,22,fill=1,stroke=0);text(c,72,yy-2,row[0]+' / '+row[1],8,'InterBold');text(c,72,yy-16,row[2],9);para(c,row[3],285,yy+1,272,'small')
 colorsi=[it['wall'],('#bba98b' if e['id']=='chalk' else e['timber']),it['stone'],it['linen'],it['accent'],'#30372f'if e['id']=='chalk'else it['cane'],it['rug'],it['ceramic']]
 for r,row in enumerate(it['finishes']):
  yy=316-r*31;c.setStrokeColor(HexColor(line));c.line(588,yy-24,1112,yy-24);c.setFillColor(HexColor(colorsi[r]));c.rect(588,yy-15,17,17,fill=1,stroke=0);text(c,615,yy-1,row[0]+' / '+row[1],8,'InterBold');text(c,805,yy-1,row[2],8)
 para(c,'VISUAL DESIGN STUDY / Existing openings, doors and fixed joinery are retained. Material appearances follow the catalogue; products, assembly details, samples and fabrication dimensions remain to be specified. Furniture edits are saved locally in the viewer.',40,59,1060,'note')
 text(c,40,19,'FJÄLL GROUP / SECHA',8,'InterBold',muted);text(c,852,19,'jplovensa.github.io/veil-of-light/',8,color=muted);c.showPage()
c.save();originals=OUT/'original-catalogue-boards.pdf';oc=canvas.Canvas(str(originals),pagesize=(W,H));
for filename in ['mediterranean-board.jpg','concrete-board.jpg','tropical-board.jpg']:
 oc.drawImage(str(ASSETS/filename),0,0,W,H);oc.showPage()
oc.save();source=PdfReader(originals);application=PdfReader(app);writer=PdfWriter()
for i in range(3):writer.add_page(source.pages[i]);writer.add_page(application.pages[i])
writer.add_metadata({'/Title':'Veil of Light | Original catalogue moodboards & applied finishes','/Author':'Fjäll Group / SECHA','/Subject':'Mediterranean, Concrete Industrial and Modern Tropical; interior and exterior finishing studies'})
# Downsample oversized embedded photographs while preserving the original board layout and text.
for page in writer.pages:
 for image in list(page.images):
  if image.image and max(image.image.size)>1600:
   pic=image.image.copy();pic.thumbnail((1600,1600),Image.Resampling.LANCZOS);image.replace(pic,quality=80)
writer.compress_identical_objects(remove_identicals=True,remove_orphans=True)
final=OUT/'Veil-of-Light-Catalogue-Moodboards-and-Finishes.pdf'
with final.open('wb')as f:writer.write(f)
ASSETS.mkdir(exist_ok=True);(ASSETS/'Veil-of-Light-Exterior-Moodboards.pdf').write_bytes(final.read_bytes());print(final)
