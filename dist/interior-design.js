// Native SketchUp specification. Each scheme changes geometry, construction and decor.
export const schemeNames={earth:'Mediterranean',chalk:'Concrete Industrial',canopy:'Modern Tropical'};
export function buildInteriorDesign(scheme='earth'){
 if(!schemeNames[scheme])throw new Error('Unknown interior scheme: '+scheme);
 const industrial=scheme==='chalk',tropical=scheme==='canopy';
 const materials={
  limewash:{color:industrial?'#c7c5bc':'#e8dfcc',roughness:.96,texture:industrial?'concrete':'plaster'},
  teak:{color:industrial?'#aa9473':'#b68a59',roughness:.69,texture:'wood'},teakDark:{color:industrial?'#665c4e':'#795b3b',roughness:.8,texture:'wood'},
  cane:{color:'#bea67c',roughness:.85,texture:'cane'},linen:{color:industrial?'#bcbcb5':'#e9dfca',roughness:1,texture:'linen'},
  olive:{color:industrial?'#777a72':tropical?'#657347':'#b39a78',roughness:1,texture:'linen'},boucle:{color:industrial?'#b9b1a1':'#e8dfce',roughness:1,texture:'boucle'},
  clay:{color:industrial?'#999389':'#a58665',roughness:.9,texture:'plaster'},stone:{color:industrial?'#b7b6af':'#d8cbb2',roughness:.8,texture:industrial?'concrete':'stone'},
  rug:{color:industrial?'#a29e92':'#bfae8f',roughness:1,texture:'linen'},metal:{color:'#292d2a',roughness:.48,metalness:.65},bronze:{color:'#4e493c',roughness:.5,metalness:.65},brass:{color:'#b19b70',roughness:.44,metalness:.65},
  leaf:{color:'#506d43',roughness:.8},leafLight:{color:'#7a8d5a',roughness:.85},ceramic:{color:industrial?'#b2ada2':'#e4d9c3',roughness:.7},mirror:{color:'#bdc9bf',roughness:.1,metalness:1},glass:{color:'#d7e0d7',roughness:.1,opacity:.22},light:{color:'#ffe3b0',roughness:.5,emissive:'#ffca80',emissiveIntensity:.65}
 };
 const items=[];let item;
 const begin=(id,room,name,p=[0,0,0],ry=0,movable=false)=>{item={id,room,name,pivot:p,rotation:ry,movable,parts:[]};items.push(item);};
 const pt=(p)=>{const [x,y,z]=p,[a,b,c]=item.pivot,r=item.rotation;return[a+x*Math.cos(r)+z*Math.sin(r),b+y,c-x*Math.sin(r)+z*Math.cos(r)];};
 const part=(shape,p,s,m,r=[0,0,0],extra={})=>item.parts.push({shape,p:pt(p),s,m,rotation:[r[0],r[1]+item.rotation,r[2]],...extra});
 const box=(p,s,m,r=0)=>part('box',p,s,m,[0,r,0]);
 const soft=(p,s,m='linen',r=[0,0,0])=>part('roundedBox',p,s,m,r);
 const cyl=(p,rad,h,m,top=rad)=>part('cylinder',p,[rad,h,top],m);
 const ball=(p,s,m,r=[0,0,0])=>part('sphere',p,s,m,r);
 const rod=(a,b,r,m)=>item.parts.push({shape:'rod',a:pt(a),b:pt(b),r,m});
 const tube=(path,r,m)=>item.parts.push({shape:'tube',path:path.map(pt),r,m});
 const lathe=(p,r,h,m,profile)=>part('lathe',p,[r,h,r],m,[0,0,0],{profile});
 const arch=(p,w,h,d,m)=>part('archPanel',p,[w,h,d],m);
 const ring=(p,rad,t,m)=>part('torus',p,[rad,t,rad],m);
 function vase(p,h=.27,m='clay',type='urn'){
  const profiles={urn:[[0,-.5],[.5,-.5],[.92,-.3],[1,-.02],[.82,.2],[.4,.35],[.36,.5],[.27,.5],[.28,.34],[.68,.12],[.75,-.05],[.6,-.3],[0,-.4]],bottle:[[0,-.5],[.7,-.5],[1,-.37],[1,-.04],[.68,.2],[.3,.3],[.3,.5],[.22,.5],[.22,.28],[.52,.12],[.7,-.1],[0,-.4]],bowl:[[0,-.5],[.4,-.5],[1,.35],[1,.5],[.9,.5],[.5,-.28],[0,-.3]]};
  lathe([p[0],p[1]+h/2,p[2]],h*(type==='bowl'?.8:.4),h,m,profiles[type]);
 }
 function decor(p,tall=false){vase(p,tall?.43:.24,industrial?'ceramic':'clay',industrial?'bottle':'urn');if(tall){for(let j=0;j<4;j++){const a=j*2.3,top=[p[0]+Math.cos(a)*.17,p[1]+.9-j*.06,p[2]+Math.sin(a)*.15];rod([p[0],p[1]+.29,p[2]],top,.004,'teakDark');for(let k=0;k<3;k++)part('leaf',[top[0]+Math.sin(k+a)*.06,top[1]-k*.09,top[2]],[.07,.15,.012],'leaf',[.2,a+k,.5]);}}}
 function plant(id,room,p,h=1.7){
  begin(id,room,tropical?'Broad-leaf tropical plant in clay vessel':'Olive branches in an aged ceramic urn',p,0,true);vase([0,0,0],.5,'clay');
  if(tropical){for(let j=0;j<7;j++){const a=j*2.4,end=[Math.cos(a)*.3,h*(.65+(j%3)*.12),Math.sin(a)*.3];rod([0,.35,0],end,.009,'leaf');part('leaf',[end[0],end[1]-.05,end[2]],[.36,.72,.06],j%2?'leafLight':'leaf',[Math.sin(a)*.5,a,Math.cos(a)*.6]);}}
  else {rod([0,.3,0],[0,h*.86,0],.018,'teakDark');for(let j=0;j<8;j++){const a=j*2.4,start=[0,h*(.4+(j%3)*.13),0],end=[Math.cos(a)*.4,h*(.66+(j%4)*.08),Math.sin(a)*.4];rod(start,end,.005,'teakDark');for(let k=0;k<5;k++){const t=.25+k*.16;part('leaf',[end[0]*t,end[1]-(1-t)*.24,end[2]*t],[.07,.16,.015],j%2?'leafLight':'leaf',[.5,a+k,Math.sin(k)*.7]);}}}
 }
 function pendant(id,room,p,r=.4){
  begin(id,room,industrial?'Black spun-metal dome pendant':tropical?'Wide woven rattan dome pendant':'Bell-shaped woven fibre pendant',p);
  const suspension=Math.max(.3,2.88-p[1]);rod([0,.24,0],[0,suspension,0],.006,'metal');cyl([0,suspension,0],.055,.025,'metal');
  if(industrial)lathe([0,0,0],r,.35,'metal',[[0,.5],[.16,.46],[.6,.35],[.88,.08],[1,-.3],[1,-.5],[.96,-.5],[.85,0],[.55,.27],[.15,.38]]);
  else if(tropical)lathe([0,0,0],r,.32,'cane',[[.12,.5],[.48,.42],[.8,.2],[1,-.23],[1,-.5],[.95,-.5],[.76,.12],[.45,.34],[.12,.4]]);
  else lathe([0,0,0],r,.52,'cane',[[.24,.5],[.45,.4],[.62,.13],[.78,-.18],[1,-.5],[.93,-.5],[.72,-.14],[.56,.13],[.38,.36],[.23,.42]]);
  ball([0,-.07,0],[.07,.1,.07],'light');
 }
 function lamp(p,wall=false){
  if(industrial){rod([p[0],p[1],p[2]],[p[0],p[1]+.38,p[2]],.009,'metal');cyl([p[0],p[1]+.36,p[2]],.07,.18,'metal',.04);ball([p[0],p[1]+.25,p[2]],[.055,.065,.055],'light');}
  else{cyl([p[0],p[1]+.12,p[2]],.055,.24,'clay',.08);lathe([p[0],p[1]+.35,p[2]],.17,.24,'linen',[[.68,.5],[1,-.5],[.95,-.5],[.63,.48]]);}
 }
 function chair(id,room,p,ry,arm=false){
  begin(id,room,industrial?(arm?'Steel-framed upholstered lounge chair':'Oak shell dining chair on black steel legs'):tropical?(arm?'Teak sling lounge chair with woven cane back':'Curved teak dining chair with cane seat'):'Curved wishbone timber chair with upholstered seat',p,ry,true);
  const w=arm?.68:.5,d=arm?.66:.5,seat=arm?.35:.44;
  for(const x of[-w*.37,w*.37])for(const z of[-d*.34,d*.34])rod([x*1.08,.025,z*1.12],[x,seat,z],industrial?.012:.023,industrial?'metal':'teak');
  soft([0,seat,0],[w,.075,d],industrial?'teak':'teakDark');soft([0,seat+.075,-.015],[w*.92,.09,d*.88],tropical?'cane':arm?'boucle':'linen');
  if(industrial){soft([0,seat+.3,d*.38],[w,.38,.09],arm?'boucle':'teak',[.1,0,0]);if(arm)for(const x of[-w/2,w/2])rod([x,seat,-.25],[x,seat+.25,.24],.014,'metal');}
  else if(tropical){for(const x of[-w*.45,w*.45])rod([x,seat,d*.4],[x,seat+.52,d*.49],.023,'teak');soft([0,seat+.32,d*.46],[w*.86,.37,.035],'cane',[.1,0,0]);tube(Array.from({length:11},(_,i)=>{const t=i/10*Math.PI;return[Math.cos(t)*w*.48,seat+.51,d*.36+Math.sin(t)*.11]}),.027,'teak');}
  else{tube(Array.from({length:13},(_,i)=>{const t=i/12*Math.PI;return[Math.cos(t)*w*.51,seat+.4,d*.2+Math.sin(t)*.18]}),.027,'teak');for(const x of[-w*.4,w*.4])rod([x,seat,d*.33],[x*.65,seat+.4,d*.3],.019,'teak');rod([0,seat+.12,d*.33],[0,seat+.4,d*.35],.025,'teak');}
  if(arm&&!industrial)for(const x of[-w*.48,w*.48]){rod([x,seat,-.25],[x,seat+.25,-.23],.022,'teak');rod([x,seat+.25,-.27],[x,seat+.32,.26],.029,'teak');}
 }
 function sideTable(id,room,p){begin(id,room,industrial?'Open steel bedside table with oak shelf':'Solid timber bedside drum and linen lamp',p,0,true);if(industrial){for(const x of[-.18,.18])for(const z of[-.18,.18])rod([x,.03,z],[x,.51,z],.012,'metal');box([0,.12,0],[.4,.035,.4],'teak');box([0,.51,0],[.43,.04,.43],'stone');}else{cyl([0,.25,0],.215,.48,'teak');cyl([0,.5,0],.24,.035,'stone');}lamp([0,.52,0]);}
 function shelf(id,room,p,ry=0){
  begin(id,room,industrial?'Open black steel display shelving':'Arched timber display cabinet with pottery',p,ry);
  if(industrial){for(const x of[-.4,.4])for(const z of[-.14,.14])rod([x,0,z],[x,1.65,z],.014,'metal');}
  else {arch([0,.83,-.13],.9,1.66,.08,'teak');arch([0,.84,-.079],.78,1.53,.035,'limewash');}
  for(let j=0;j<4;j++){box([0,.13+j*.39,0],[.79,.035,.3],'teak');vase([j%2?.18:-.15,.16+j*.39,.02],.17+j*.015,j%2?'clay':'ceramic',j===1?'bottle':'urn');}
 }
 function sideboard(id,room,p,w=1.8,ry=0){begin(id,room,industrial?'Oak sideboard on exposed steel frame':tropical?'Fluted teak console with cane doors':'Fluted timber console with recessed plinth',p,ry);box([0,.35,0],[w,.58,.36],'teakDark');box([0,.66,0],[w+.03,.04,.39],industrial?'stone':'teak');
  if(industrial){for(const x of[-w*.42,w*.42])for(const z of[-.13,.13])rod([x,.02,z],[x,.16,z],.012,'metal');for(const x of[-w*.25,w*.25])box([x,.36,.19],[w/2-.02,.54,.025],'teak');}
  else for(let i=0;i<Math.floor(w/.055);i++)box([-w/2+.04+i*.055,.36,.193],[.024,.53,.026],tropical&&i%3===0?'cane':'teak');decor([-.42,.69,0],true);vase([.34,.69,0],.22,'ceramic','bowl');}
 function bed(id,room,p,ry=0){begin(id,room,industrial?'Grey upholstered platform bed with steel feet':tropical?'Teak platform bed with olive linen throw':'Ivory upholstered platform bed with sand throw',p,ry,true);
  for(const x of[-.72,.72])for(const z of[-.81,.81])cyl([x,.08,z],.025,.15,industrial?'metal':'teakDark');soft([0,.23,0],[1.85,.3,2.13],industrial?'boucle':tropical?'teak':'linen');soft([0,.46,0],[1.77,.24,2.03],'linen');soft([0,.585,-.12],[1.8,.065,1.8],'linen');for(const x of[-.44,.44])soft([x,.7,.64],[.78,.2,.48],'linen',[.1,0,x*.06]);for(const x of[-.43,.43])soft([x,.78,.84],[.7,.32,.13],x<0?'olive':'linen',[-.1,0,0]);soft([0,.63,-.62],[1.82,.045,.57],'olive');for(let i=0;i<5;i++)rod([-.86+i*.43,.662,-.88],[-.86+i*.43,.662,-.37],.003,tropical?'linen':'olive');}
 function bedWall(id,room,p,w=2.65,ry=0){begin(id,room,industrial?'Concrete bed wall with ash flutes and linear light':tropical?'Full-height teak slat bed wall and upholstered headrail':'Soft linen headboard against limewashed wall',p,ry);if(!industrial&&!tropical){soft([0,.7,0],[w,.94,.1],'linen');}else{box([0,1.0,-.025],[w,1.96,.07],industrial?'stone':'teakDark');for(let j=0;j<Math.floor(w/.095);j++)box([-w/2+.05+j*.095,1.29,.025],[.025,1.27,.035],industrial?'teakDark':'teak');soft([0,.68,.08],[w,.35,.09],industrial?'boucle':'linen');box([0,.94,.065],[w-.04,.018,.018],'light');}}
 function art(id,room,p,ry){begin(id,room,industrial?'Layered monochrome relief artwork':'Textured linen and earth-tone wall relief',p,ry);box([0,0,0],[.78,.8,.035],industrial?'metal':'teakDark');box([0,0,.025],[.72,.74,.02],'linen');for(let j=0;j<3;j++)box([-.23+j*.22,-.18+j*.12,.045],[.22,.24,.02],industrial?(j%2?'stone':'metal'):(j%2?'clay':'ceramic'));}
 function vanity(id,room,p,ry){begin(id,room,industrial?'Concrete vanity with open towel shelf and backlit oval mirror':tropical?'Teak vanity with cane front and open linen shelf':'Floating travertine vanity with oval brass mirror',p,ry);
  if(industrial){box([0,.67,0],[.7,.28,.46],'stone');for(const x of[-.31,.31])box([x,.4,0],[.07,.5,.43],'stone');box([0,.2,0],[.62,.055,.4],'teakDark');}
  else{box([0,.57,0],[.7,.34,.43],tropical?'teak':'stone');box([0,.8,0],[.75,.055,.49],'stone');if(tropical){box([0,.58,.226],[.6,.25,.018],'cane');box([0,.23,0],[.65,.045,.4],'teak');}}
  soft([-.16,.27,.02],[.24,.09,.25],'linen');soft([.12,.27,.02],[.22,.07,.24],'linen');lathe([0,.87,.02],.185,.13,'ceramic',[[0,-.5],[.55,-.5],[1,.36],[1,.5],[.91,.5],[.56,-.25],[0,-.3]]);rod([.22,.83,-.12],[.22,1.1,-.12],.011,industrial?'metal':'brass');rod([.22,1.1,-.12],[.08,1.1,-.12],.011,industrial?'metal':'brass');arch([0,1.51,-.216],.6,.84,.035,industrial?'light':tropical?'teak':'brass');arch([0,1.51,-.19],.555,.795,.015,'mirror');decor([-.27,.83,.02]);for(const x of[-.4,.4]){rod([x,1.38,-.16],[x,1.72,-.16],.013,industrial?'metal':'bronze');cyl([x,1.7,-.16],.025,.13,'light');}}
 // Finishes follow the reference's actual material types, not just its colours.
 begin('ground-finish','Living',industrial?'Microcement ground floor':tropical?'Natural timber living floor':'Honed travertine ground floor');box([-40.05,.008,-4.55],[6.15,.016,8.9],tropical?'teak':'stone');
 begin('loft-finish','Loft bedroom',industrial?'Ash plank loft floor':'Natural timber loft floor');box([-40.05,2.954,-5.05],[6,.012,4.3],'teak');box([-40.05,2.906,-8.02],[6,.012,1.72],'teak');box([-37.39,2.954,-1.46],[.68,.012,2.35],'teak');
 if(industrial){begin('living-concrete-wall','Living','Board-jointed concrete feature wall with form-tie details');box([-37.12,1.39,-6.2],[.025,2.73,2.7],'stone');for(const z of[-6.65,-5.75])box([-37.139,1.39,z],[.008,2.71,.008],'teakDark');for(const y of[.6,2.15])for(const z of[-7.15,-6.2,-5.25])part('cylinder',[-37.143,y,z],[.009,.002,.009],'metal',[0,0,Math.PI/2]);}
 else if(tropical){begin('living-timber-wall','Living','Vertical teak slat wall behind lounge');box([-37.12,1.39,-6.2],[.025,2.73,2.7],'teakDark');for(let j=0;j<28;j++)box([-37.145,1.39,-7.48+j*.095],[.027,2.7,.028],'teak');}
 begin('living-rug','Living',industrial?'Textured grey living rug':'Natural woven living rug',[-39.85,.023,-6.25],0,true);soft([0,0,0],[3.45,.018,3.3],'rug');
 begin('living-sofa','Living',industrial?'Low modular L sectional in grey linen':tropical?'Linen sofa with exposed teak frame':'Deep ivory slipcovered sofa',[-37.73,0,-6.15],Math.PI/2,true);
 if(industrial){box([0,.12,0],[2.65,.12,.83],'metal');for(const x of[-.86,0,.86]){soft([x,.29,0],[.85,.26,.88],'linen');soft([x,.64,.38],[.86,.56,.18],'linen');}soft([-.88,.29,-.52],[.85,.26,.94],'linen');soft([1.32,.46,.02],[.2,.52,.95],'linen');}
 else{soft([0,.22,0],[2.68,.28,.88],tropical?'teak':'linen');for(const x of[-.87,0,.87]){soft([x,.43,-.02],[.86,.22,.88],'linen');soft([x,.7,.33],[.86,.62,.22],'linen',[-.07,0,0]);}for(const x of[-1.32,1.32])soft([x,.54,0],[.23,.66,.96],tropical?'teak':'linen');}
 for(const x of[-.95,0,.95])soft([x,.74,.12],[.43,.42,.16],tropical?'olive':x===0?'linen':'boucle',[0,0,x*.17]);
 begin('living-table','Living',industrial?'Nested concrete tables on tubular black steel rings':tropical?'Low round teak drum coffee table':'Round timber coffee table on twin fluted drums',[-39.55,0,-6.15],0,true);
 if(industrial){for(const [x,z,r,y]of[[.12,0,.62,.42],[-.45,-.35,.35,.29]]){ring([x,.08,z],r-.09,.013,'metal');for(const a of[0,2.1,4.2])rod([x+Math.cos(a)*(r-.09),.08,z+Math.sin(a)*(r-.09)],[x+Math.cos(a)*(r-.09),y,z+Math.sin(a)*(r-.09)],.012,'metal');cyl([x,y,z],r,.055,'stone');}}
 else if(tropical){cyl([0,.2,0],.48,.34,'teakDark');cyl([0,.41,0],.71,.07,'teak');}
 else{for(const x of[-.33,.33]){cyl([x,.2,0],.215,.34,'teak');for(let j=0;j<16;j++){const a=j*Math.PI/8;rod([x+Math.cos(a)*.21,.04,Math.sin(a)*.21],[x+Math.cos(a)*.21,.36,Math.sin(a)*.21],.01,'teak');}}cyl([0,.4,0],.73,.065,'teak');}
 vase([.17,.46,.02],.12,industrial?'ceramic':'teakDark','bowl');decor([-.22,.46,-.09]);box([.12,.465,-.25],[.27,.025,.2],'linen');
 if(industrial){chair('living-chair','Living',[-41.15,0,-7.05],-Math.PI/2,true);}else{chair('living-chair-a','Living',[-41.05,0,-7.05],-Math.PI/2,true);chair('living-chair-b','Living',[-40.95,0,-5.25],-Math.PI/2,true);}
 sideboard('living-console','Living',[-42.78,0,-6.3],1.65,Math.PI/2);shelf('living-shelves','Living',[-42.82,0,-8],Math.PI/2);art('living-art','Living',[-43.04,1.7,-6.2],Math.PI/2);
 plant('living-plant','Living',[-37.57,0,-8.12],1.95);if(!industrial)plant('living-olive','Living',[-42.55,0,-4.8],1.65);
 pendant('living-pendant','Living',[-39.45,2.37,-6.2],industrial?.42:tropical?.54:.34);
 begin('dining-table','Dining',industrial?'Oak dining table on black trestle frame':'Solid timber dining table with softened rectangular top',[-40.3,0,-3.2],0,true);soft([0,.76,0],[1.55,.065,.9],'teak');if(industrial){for(const x of[-.57,.57]){rod([x,.03,-.3],[x,.72,-.3],.025,'metal');rod([x,.03,.3],[x,.72,.3],.025,'metal');rod([x,.13,-.3],[x,.13,.3],.025,'metal');}}else for(const x of[-.59,.59])for(const z of[-.29,.29])rod([x,.02,z],[x,.73,z],.04,'teak');
 for(const [j,seat]of[[-40.3,0,-4.13],[-40.3,0,-2.27],[-41.43,0,-3.2],[-39.17,0,-3.2]].entries()){const angle=Math.atan2(seat[0]+40.3,seat[2]+3.2);chair('dining-chair-'+j,'Dining',seat,angle);item.facing={position:seat,rotation:angle,target:[-40.3,0,-3.2]};}
 begin('dining-decor','Dining',industrial?'Slate tray and restrained stoneware':'Hand-thrown pottery and low ceramic bowl',[-40.3,.8,-3.2]);item.parentId='dining-table';vase([.18,0,0],.16,industrial?'ceramic':'teakDark','bowl');decor([-.2,0,-.05]);pendant('dining-pendant','Dining',[-40.3,2.26,-3.2],industrial?.4:tropical?.45:.35);
 // The source pantry, sink, doors and appliances retain their coordinates.
 begin('kitchen-fronts','Kitchen',industrial?'Microcement and oak kitchen finish panels':'Fluted teak kitchen end panel',[-37.79,.46,-1.62],Math.PI/2);if(industrial)box([0,0,0],[1.36,.7,.018],'stone');else for(let j=0;j<26;j++)box([-.65+j*.052,0,0],[.024,.7,.018],'teak');
 begin('kitchen-backsplash','Kitchen','Quartz splashback and discreet warm task strip',[-37.09,1.22,-1.85]);box([0,0,0],[.02,.54,1.63],'stone');box([-.03,.29,0],[.02,.015,1.6],'light');
 if(industrial){begin('kitchen-track','Kitchen','Black track with three compact cone spot heads',[-37.5,2.63,-1.7]);box([0,0,0],[.04,.035,1.6],'metal');for(const z of[-.53,0,.53])lathe([0,-.1,z],.065,.15,'metal',[[.4,.5],[.65,.2],[1,-.5],[.9,-.5],[.35,.43]]);}
 else {begin('kitchen-styling','Kitchen','Timber chopping board, small pots and linen',[-37.55,.97,-2.35]);box([0,0,0],[.28,.024,.24],'teak');vase([0,.02,0],.16,'ceramic','bottle');}
 // Two existing sleeping zones get genuinely rebuilt beds and scheme-specific headwalls.
 bed('guest-bed','Guest bedroom',[-45.95,0,-3.17],-Math.PI/2);bedWall('guest-headwall','Guest bedroom',[-47.13,.05,-3.17],2.55,Math.PI/2);
 sideTable('guest-side-a','Guest bedroom',[-46.75,0,-4.42]);sideTable('guest-side-b','Guest bedroom',[-46.75,0,-1.92]);sideboard('guest-storage','Guest bedroom',[-43.59,0,-2.5],1.2,-Math.PI/2);plant('guest-plant','Guest bedroom',[-43.7,0,-4.22],1.2);
 begin('guest-curtains','Guest bedroom','Full-height soft linen curtains');for(const x of[-46.97,-43.57])for(let j=0;j<5;j++)soft([x+j*.025,1.4,-1.53],[.035,2.65,.045],'linen');
 bed('loft-bed','Loft bedroom',[-38.35,2.95,-4.88],Math.PI/2);bedWall('loft-headwall','Loft bedroom',[-37.14,2.99,-4.88],2.55,-Math.PI/2);sideTable('loft-side-a','Loft bedroom',[-37.63,2.95,-6.23]);sideTable('loft-side-b','Loft bedroom',[-37.63,2.95,-3.48]);
 begin('loft-bench','Loft bedroom',industrial?'Steel-framed upholstered bed-end bench':'Low timber bed-end bench with linen pad',[-40.72,2.95,-4.88],Math.PI/2,true);soft([0,.43,0],[1.45,.12,.42],industrial?'boucle':'linen');for(const x of[-.59,.59])for(const z of[-.14,.14])rod([x,.02,z],[x,.4,z],industrial?.014:.032,industrial?'metal':'teak');
 sideboard('loft-storage','Loft bedroom',[-42.68,2.95,-5.6],1.7,Math.PI/2);chair('loft-chair','Loft bedroom',[-42.08,2.9,-7.75],-.9,true);plant('loft-plant','Loft bedroom',[-40.95,2.95,-6.8],1.3);
 begin('study-desk','Loft study',industrial?'Oak writing desk on black metal trestles':'Timber writing desk with fluted drawer',[-39.25,2.9,-8.48]);box([0,.74,0],[1.55,.055,.48],'teak');for(const x of[-.64,.64])for(const z of[-.15,.15])rod([x,.02,z],[x,.71,z],industrial?.014:.03,industrial?'metal':'teak');box([-.2,.68,0],[.72,.09,.35],'teakDark');box([-.35,.78,0],[.24,.03,.18],'linen');lamp([.51,.78,0]);chair('study-chair','Loft study',[-39.27,2.9,-7.82],0);
 if(tropical){begin('ceiling-fan','Loft bedroom','Three-blade timber ceiling fan with dark motor',[-39.45,6.05,-5.0]);rod([0,0,0],[0,.36,0],.018,'metal');cyl([0,0,0],.1,.12,'metal');for(let j=0;j<3;j++){const a=j*Math.PI*2/3;soft([Math.cos(a)*.4,0,Math.sin(a)*.4],[.77,.025,.13],'teak',[0,-a,0]);}}
 for(const [id,room,p,ry]of[['guest','Guest bathroom',[-46.93,0,-5.98],Math.PI/2],['main','Main bathroom',[-37.51,0,-3.34],-Math.PI/2]]){vanity(id+'-vanity',room,p,ry);begin(id+'-bath-floor',room,industrial?'Microcement bathroom floor':'Light travertine bathroom floor');box(id==='guest'?[-46.24,.027,-6.12]:[-37.89,.027,-3.78],id==='guest'?[1.82,.025,2.23]:[1.58,.025,1.72],'stone');begin(id+'-bath-accessories',room,'Dark towel rail and folded linen',id==='guest'?[-45.36,0,-5.65]:[-38.65,0,-4.02]);rod([0,1.2,-.28],[0,1.2,.28],.012,industrial?'metal':'brass');soft([-.02,1.0,0],[.028,.4,.35],'linen');}
 begin('terrace-deck','Terrace','Shaded timber deck');box([-42.1,.012,-10],[10.15,.024,1.85],'teak');
 for(const [j,x]of[-45.8,-38.25].entries()){chair('terrace-chair-'+j,'Terrace',[x,0,-9.9],j?Math.PI/2:-Math.PI/2,true);}
 begin('terrace-table','Terrace',industrial?'Concrete terrace table':'Timber terrace side table',[-42.05,0,-9.9],0,true);cyl([0,.22,0],.28,.42,industrial?'stone':'teak');vase([0,.44,0],.2,'clay');plant('terrace-plant','Terrace',[-46.95,0,-10.6],1.5);
 begin('entry-rug','Entry','Natural fibre entrance mat',[-40.05,.026,.38],0,true);box([0,0,0],[1.45,.022,.58],'rug');plant('entry-plant','Entry',[-43.75,0,.35],1.1);
 const rooms=[{id:'living',name:'Living',eye:[-42.25,1.72,-4.4],target:[-39.35,.98,-6.35]},{id:'dining',name:'Dining & kitchen',eye:[-41.65,1.65,-4.55],target:[-38.5,.98,-1.7]},{id:'guest',name:'Guest bedroom',eye:[-43.9,1.65,-4.15],target:[-46.1,1,-3.1]},{id:'bath',name:'Guest bathroom',eye:[-45.75,1.62,-5.65],target:[-46.85,1.16,-6.3],fov:65},{id:'mainbath',name:'Main bathroom',eye:[-38.12,1.6,-3.95],target:[-37.27,1.05,-3.34],fov:65},{id:'entry',name:'Entry',eye:[-40.1,1.7,.5],target:[-40.1,1.1,-4.8]},{id:'loft',name:'Loft suite',eye:[-42.1,4.6,-3.1],target:[-38.7,3.9,-5.1]},{id:'study',name:'Loft study',eye:[-40.6,4.55,-7.9],target:[-38.85,3.8,-8.5]},{id:'terrace',name:'Terrace',eye:[-44.3,1.65,-10.7],target:[-40.2,.6,-9.85]}];
 return{version:'catalogue-rebuilt-3',scheme,sourceBoardPage:{earth:19,chalk:20,canopy:21}[scheme],title:'Veil of Light · '+schemeNames[scheme],materials,items,rooms,hideOriginalRootIndices:[0,1,4,7,9,11,14],hideOriginalGltfNodes:[2,29,319,513,723,734,989],paletteOverrides:{'Unpainted':materials.limewash.color,'[Color D01]':materials.limewash.color,'[Color D01]1':materials.limewash.color,'[Color F07]':materials.limewash.color,'[0010_Snow]':materials.limewash.color}};
}
