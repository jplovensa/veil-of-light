// Shared, deterministic design geometry used by Three.js and the SketchUp builder.
export function buildInteriorDesign(){
 const materials={limewash:{color:'#e7ddc9',roughness:.96,texture:'plaster'},teak:{color:'#b48b60',roughness:.52,texture:'wood'},teakDark:{color:'#71563d',roughness:.6,texture:'wood'},cane:{color:'#bdaa83',roughness:.78,texture:'cane'},linen:{color:'#e9e2cf',roughness:.99,texture:'linen'},olive:{color:'#78805a',roughness:.98,texture:'linen'},clay:{color:'#9e8064',roughness:.86,texture:'plaster'},stone:{color:'#d8cbb3',roughness:.76,texture:'stone'},rug:{color:'#b7a17c',roughness:1,texture:'linen'},bronze:{color:'#4e4939',roughness:.48,metalness:.65},brass:{color:'#b19b61',roughness:.4,metalness:.72},leaf:{color:'#47684a',roughness:.84},leafLight:{color:'#739061',roughness:.85},ceramic:{color:'#ece3d2',roughness:.65},mirror:{color:'#bdc8bb',roughness:.08,metalness:.9},glass:{color:'#d4e3d4',roughness:.1,opacity:.18},light:{color:'#ffe3a8',roughness:.6,emissive:'#ffcd79',emissiveIntensity:.7}};
 const items=[];let item;
 const begin=(room,name)=>{item={room,name,parts:[]};items.push(item);};
 const part=(shape,p,s,m,rotation=[0,0,0],extra={})=>item.parts.push({shape,p,s,m,rotation,...extra});
 const box=(p,s,m,ry=0)=>part('box',p,s,m,[0,ry,0]);
 const ball=(p,s,m,rotation=[0,0,0])=>part('sphere',p,s,m,rotation);
 const soft=(p,s,m,rotation=[0,0,0])=>part('roundedBox',p,s,m,rotation);
 const cyl=(p,r,h,m,rt=r,rotation=[0,0,0])=>part('cylinder',p,[r,h,rt],m,rotation);
 const rod=(a,b,r,m)=>item.parts.push({shape:'rod',a,b,r,m});
 const panelSlats=(p,w,h,axis='z',spacing=.075)=>{
  const n=Math.floor(w/spacing);for(let i=0;i<n;i++){const d=(i-(n-1)/2)*spacing;box([p[0]+(axis==='x'?d:0),p[1],p[2]+(axis==='z'?d:0)],axis==='x'?[.035,h,.045]:[.045,h,.035],'teak');}
 };
 function lamp(room,p,scale=1){begin(room,'Linen and teak table lamp');cyl([p[0],p[1]+.13*scale,p[2]],.085*scale,.26*scale,'teakDark',.075*scale);cyl([p[0],p[1]+.34*scale,p[2]],.22*scale,.25*scale,'linen',.14*scale);ball([p[0],p[1]+.29*scale,p[2]],[.12,.12,.12].map(v=>v*scale),'light');}
 function vase(p,h=.3,m='clay'){part('vessel',[p[0],p[1]+h*.5,p[2]],[h*.32,h,h*.12],m);}
 function plant(room,p,h=1.7){begin(room,'Tropical planting in a clay vessel');part('vessel',[p[0],p[1]+.24,p[2]],[.31,.48,.285],'clay');cyl([p[0],p[1]+.405,p[2]],.259,.015,'teakDark');for(let i=0;i<11;i++){const a=i*2.399,reach=.26+(i%3)*.075,top=p[1]+h*(.64+(i%4)*.1);const end=[p[0]+Math.cos(a)*reach,top,p[2]+Math.sin(a)*reach];rod([p[0],p[1]+.4,p[2]],end,.012,'leaf');part('leaf',[end[0]+Math.cos(a)*.13,end[1]-.02,end[2]+Math.sin(a)*.13],[.34,.72,.075],i%2?'leafLight':'leaf',[Math.sin(a)*.65,a,Math.cos(a)*.6]);}}
 function pendant(room,p,r=.38,h=.32){begin(room,'Handwoven cane pendant');rod([p[0],p[1]+h,p[2]],[p[0],p[1]+1,p[2]],.008,'bronze');part('shade',p,[r,h,r],'cane');for(let j=0;j<24;j++){const a=j*Math.PI/12;let last;for(let k=0;k<=10;k++){const t=k/10*Math.PI/2,rr=r*Math.sin(t),v=[p[0]+Math.cos(a)*rr,p[1]+h*Math.cos(t),p[2]+Math.sin(a)*rr];if(last)rod(last,v,.003,'cane');last=v;}}ball([p[0],p[1]+.13,p[2]],[.07,.1,.07],'light');}
 function chair(room,p,ry=0,arm=false){
  begin(room,arm?'Sculpted teak lounge chair with handwoven cane':'Curved teak and cane dining chair');
  const point=(x,y,z)=>[p[0]+x*Math.cos(ry)+z*Math.sin(ry),p[1]+y,p[2]-x*Math.sin(ry)+z*Math.cos(ry)],w=arm?.71:.5,d=arm?.7:.52,seat=arm?.36:.45;
  for(const x of[-w*.37,w*.37])for(const z of[-d*.35,d*.35])rod(point(x*1.12,.018,z*1.15),point(x,seat+.02,z),arm?.026:.022,'teak');
  soft(point(0,seat,0),[w,.065,d],'teak',[0,ry,0]);soft(point(0,seat+.065,-.015),[w*.9,.085,d*.87],'linen',[arm?-.05:0,ry,0]);
  const backZ=x=>d*.4+.065*(1-(x/(w*.47))**2),bottom=seat+.13,top=seat+(arm?.53:.47);
  for(const x of[-w*.47,w*.47])rod(point(x,seat,backZ(x)-.035),point(x,top,backZ(x)),.022,'teak');
  for(let i=0;i<16;i++){const x1=-w*.47+i*w*.94/16,x2=-w*.47+(i+1)*w*.94/16;rod(point(x1,top,backZ(x1)),point(x2,top,backZ(x2)),.022,'teak');rod(point(x1,bottom,backZ(x1)),point(x2,bottom,backZ(x2)),.017,'teak');}
  for(let i=0;i<19;i++){const x=-w*.425+i*w*.85/18;rod(point(x,bottom+.012,backZ(x)),point(x,top-.012,backZ(x)),.0033,'cane');}
  for(let j=0;j<16;j++){const y=bottom+.015+(top-bottom-.03)*j/15;for(let i=0;i<9;i++){const x1=-w*.43+i*w*.86/9,x2=-w*.43+(i+1)*w*.86/9;rod(point(x1,y,backZ(x1)+Math.sin(i*Math.PI)*.002),point(x2,y,backZ(x2)),.003,'cane');}}
  if(arm)for(const x of[-w*.48,w*.48]){rod(point(x,seat+.04,-.27),point(x,seat+.28,-.25),.022,'teak');rod(point(x,seat+.28,-.29),point(x,seat+.34,.29),.029,'teak');}
 }
 function cabinet(room,p,s,doors=3,ry=0){begin(room,'Teak joinery with woven cane fronts');box(p,s,'teakDark',ry);const point=(x,y,z)=>[p[0]+x*Math.cos(ry)+z*Math.sin(ry),p[1]+y,p[2]-x*Math.sin(ry)+z*Math.cos(ry)];for(let i=0;i<doors;i++){const x=-s[0]/2+s[0]/doors*(i+.5);box(point(x,0,s[2]/2+.012),[s[0]/doors-.025,s[1]-.08,.035],'teak',ry);box(point(x,0,s[2]/2+.034),[s[0]/doors-.09,s[1]-.15,.014],'cane',ry);rod(point(x+s[0]/doors*.3,-.06,s[2]/2+.065),point(x+s[0]/doors*.3,.08,s[2]/2+.065),.009,'brass');}}
 function artwork(room,p,w,h,ry=0){begin(room,'Botanical relief artwork');box(p,[w,h,.045],'teakDark',ry);box([p[0]+Math.sin(ry)*.027,p[1],p[2]+Math.cos(ry)*.027],[w-.06,h-.06,.015],'linen',ry);for(let i=0;i<4;i++){const x=(i-1.5)*w*.16;ball([p[0]+x*Math.cos(ry)+Math.sin(ry)*.04,p[1]+Math.sin(i*1.7)*h*.16,p[2]-x*Math.sin(ry)+Math.cos(ry)*.04],[w*.18,h*.35,.014],i%2?'olive':'clay',[0,ry,(i-1.5)*.35]);}}
 function bedside(room,p){begin(room,'Round teak bedside table');cyl([p[0],p[1]+.25,p[2]],.235,.46,'teak',.235);cyl([p[0],p[1]+.49,p[2]],.26,.035,'stone');lamp(room,[p[0],p[1]+.51,p[2]],.7);}
 begin('Living','Honed travertine ground-floor finish');box([-40.05,.008,-4.55],[6.15,.016,8.9],'stone');
 begin('Loft bedroom','Teak loft floor');for(let i=0;i<34;i++)box([-40.05,2.956,-7.13+i*.13],[6,.012,.124],'teak');
 begin('Loft bedroom','Teak gallery floor');for(let i=0;i<19;i++)box([-37.39,2.956,-2.63+i*.13],[.68,.012,.124],'teak');
 begin('Loft study','Teak rear gallery floor');for(let i=0;i<12;i++)box([-40.05,2.906,-8.73+i*.13],[6,.012,.124],'teak');
 // Ground floor — an open living and dining space with a clear west-side route to the stair.
 begin('Living','Natural woven living rug');box([-39.85,.018,-6.25],[3.45,.024,3.3],'rug');
 begin('Living','Linen sofa on a teak plinth');box([-37.65,.18,-6.15],[.87,.18,2.65],'teak');for(const z of[-7.25,-5.05])for(const x of[-37.95,-37.35])cyl([x,.052,z],.035,.074,'teakDark');for(let i=0;i<3;i++)soft([-37.7,.43,-7.03+i*.88],[.94,.3,.868],'linen');soft([-37.18,.7,-6.15],[.25,.72,2.72],'linen');for(const z of[-7.47,-4.83])soft([-37.66,.61,z],[1.0,.48,.23],'linen');for(let i=0;i<3;i++)soft([-37.49,.8,-7+i*.84],[.18,.47,.49],i===1?'linen':'olive',[0,0,-.2]);
 begin('Living','Travertine coffee table');cyl([-39.4,.23,-6.15],.46,.4,'stone');cyl([-39.4,.46,-6.15],.7,.08,'stone');box([-39.52,.525,-6.18],[.3,.035,.21],'teakDark',.2);box([-39.51,.558,-6.17],[.28,.03,.2],'linen',.12);vase([-39.13,.51,-6.28],.23,'ceramic');
 chair('Living',[-41.05,0,-6.95],-Math.PI/2,true);chair('Living',[-40.9,0,-5.3],-Math.PI/2,true);
 cabinet('Living',[-42.77,.36,-6.1],[2.15,.64,.4],3,Math.PI/2);artwork('Living',[-43.02,1.72,-6.1],1.4,.95,Math.PI/2);
 begin('Living','Console styling');vase([-42.75,.7,-6.85],.36);vase([-42.75,.7,-6.5],.22,'ceramic');lamp('Living',[-42.72,.7,-5.45],.85);
 plant('Living',[-37.55,0,-8.15],1.9);plant('Living',[-42.52,0,-8.17],1.75);
 pendant('Living',[-39.45,2.28,-6.2],.48,.38);
 begin('Dining','Round teak dining table');cyl([-40.3,.36,-3.2],.26,.7,'teak');cyl([-40.3,.75,-3.2],.7,.065,'teak');
 for(const seat of[[-40.3,0,-4.18],[-40.3,0,-2.22],[-41.28,0,-3.2],[-39.32,0,-3.2]]){const angle=Math.atan2(seat[0]-(-40.3),seat[2]-(-3.2));chair('Dining',seat,angle);item.facing={position:seat,rotation:angle,target:[-40.3,0,-3.2]};}
 begin('Dining','Dining ceramics');vase([-40.3,.79,-3.2],.24,'ceramic');cyl([-40.01,.8,-3.18],.12,.025,'clay');pendant('Dining',[-40.3,2.18,-3.2],.38,.3);
 // Kitchen — retained appliances, new tactile surfaces, shelves and a pair of stools.
 begin('Kitchen','Travertine backsplash');box([-37.065,1.22,-1.55],[.035,.55,2.15],'stone');
 begin('Kitchen','Teak wall shelf');box([-37.22,1.64,-1.5],[.3,.055,1.85],'teak');for(let i=0;i<3;i++)cyl([-37.24,1.75,-2.15+i*.26],.065,.18,'ceramic');vase([-37.22,1.67,-.91],.24,'clay');
 begin('Kitchen','Counter styling');box([-37.56,.99,-2.32],[.38,.026,.25],'teak',.1);vase([-37.47,1.0,-.42],.25,'ceramic');
 begin('Kitchen','Warm under-cabinet light');box([-37.3,1.59,-1.55],[.2,.015,1.78],'light');
 plant('Kitchen',[-38.5,0,-.55],1.3);
 // Guest suite — detailed source bed retained, with a teak/cane headboard and coordinated accessories.
 begin('Guest bedroom','Cane headboard');box([-47.14,1.12,-3.17],[.07,1.7,2.65],'teak');box([-47.095,1.16,-3.17],[.02,1.47,2.44],'cane');panelSlats([-47.065,1.16,-3.17],2.5,1.5,'z',.11);
 bedside('Guest bedroom',[-46.72,0,-4.34]);bedside('Guest bedroom',[-46.72,0,-1.98]);
 begin('Guest bedroom','Soft linen window panels');for(const x of[-46.94,-43.58])for(let i=0;i<7;i++)box([x+(i-3)*.035,1.42,-1.54+Math.sin(i*1.7)*.035],[.039,2.7,.045],'linen');
 cabinet('Guest bedroom',[-43.59,.48,-2.48],[1.25,.9,.42],2,Math.PI/2);artwork('Guest bedroom',[-43.29,1.64,-2.55],.9,.82,-Math.PI/2);
 begin('Guest bedroom','Guest tray');vase([-43.59,.95,-2.85],.18,'ceramic');plant('Guest bedroom',[-43.72,0,-4.22],1.25);
 // Bathrooms — existing sanitary fittings remain; stone floors, teak screens and accessories finish both rooms.
 for(const [room,x,z,w,d]of[['Guest bathroom',-46.24,-6.12,1.82,2.23],['Main bathroom',-37.89,-3.78,1.58,1.72]]){
  begin(room,'Honed travertine floor');box([x,.027,z],[w,.025,d],'stone');
  begin(room,'Teak bath mat');const mx=room==='Guest bathroom'?-45.85:-38.26,mz=room==='Guest bathroom'?-5.72:-3.28;for(let i=0;i<11;i++)box([mx+(i-4)*.065,.061,mz],[.045,.035,.5],'teak');
  begin(room,'Towel rail and linen');const tx=room==='Guest bathroom'?-45.36:-38.65,tz=room==='Guest bathroom'?-5.65:-4.02;rod([tx,1.21,tz-.34],[tx,1.21,tz+.34],.014,'brass');box([tx-.025,.98,tz],[.035,.45,.44],'linen');
  if(room==='Guest bathroom'){begin(room,'Ceramic bath accessories');vase([-46.95,.896,-5.72],.16,'ceramic');}
 }
 begin('Guest bathroom','Floating teak vanity and stone basin');box([-46.96,.57,-5.97],[.48,.5,.66],'teak');box([-46.96,.86,-5.97],[.53,.07,.71],'stone');cyl([-46.94,.95,-5.98],.14,.1,'ceramic',.18);cyl([-46.94,1.002,-5.98],.14,.012,'stone');cyl([-46.94,1.01,-5.98],.015,.01,'bronze');rod([-47.1,.9,-5.97],[-47.1,1.14,-5.97],.015,'brass');rod([-47.1,1.14,-5.97],[-46.94,1.14,-5.97],.015,'brass');
 begin('Guest bathroom','Framed vanity mirror');box([-47.16,1.56,-5.97],[.032,.76,.59],'teak');box([-47.138,1.56,-5.97],[.012,.69,.52],'mirror');plant('Guest bathroom',[-44.4,0,-6.8],1.1);
 for(const [room,x,z,w,d]of[['Guest bathroom',-46.69,-6.74,.88,.94],['Main bathroom',-38.2,-4.37,.73,.86]]){
  begin(room,'Travertine shower with glass screen');box([x,.045,z],[w,.05,d],'stone');box([x+w/2+.012,1.1,z],[.015,2.05,d],'glass');rod([x+w/2+.012,.08,z-d/2],[x+w/2+.012,2.14,z-d/2],.009,'brass');box([x-w/2-.015,1.22,z],[.025,2.35,d],'stone');rod([x-w/2+.025,1.0,z],[x-w/2+.025,2.12,z],.013,'brass');rod([x-w/2+.025,2.12,z],[x-.12,2.12,z],.013,'brass');cyl([x-.12,2.1,z],.105,.025,'brass');
 }
 begin('Main bathroom','Teak vanity front');box([-37.57,.57,-3.34],[.035,.43,.8],'teak');box([-37.595,.57,-3.34],[.015,.34,.67],'cane');rod([-37.62,.7,-3.48],[-37.62,.7,-3.2],.009,'brass');
 // Loft suite — the floor is 2.95 m above ground; the stair void remains open.
 begin('Loft bedroom','Teak and cane bedhead');box([-37.11,3.78,-4.88],[.06,1.45,2.55],'teak');box([-37.155,3.82,-4.88],[.02,1.24,2.35],'cane');panelSlats([-37.18,3.82,-4.88],2.42,1.28,'z',.11);
 bedside('Loft bedroom',[-37.62,2.95,-6.2]);bedside('Loft bedroom',[-37.62,2.95,-3.48]);
 begin('Loft bedroom','Soft linen gallery curtains');for(const x of[-42.77,-37.33])for(let i=0;i<7;i++)box([x+(i-3)*.035,3.78,-8.79+Math.sin(i*1.7)*.035],[.039,1.7,.045],'linen');
 cabinet('Loft bedroom',[-42.65,3.9,-5.65],[1.7,1.86,.52],3,Math.PI/2);
 begin('Loft bedroom','Low reading rug');box([-41.27,2.924,-7.92],[2.2,.018,1.32],'rug');chair('Loft bedroom',[-42.1,2.916,-7.8],-.9,true);
 begin('Loft bedroom','Reading side table');cyl([-41.28,3.146,-7.85],.22,.46,'teak');vase([-41.28,3.38,-7.85],.18,'ceramic');
 begin('Loft study','Built-in teak writing desk');box([-39.25,3.69,-8.5],[1.55,.065,.48],'teak');for(const x of[-39.9,-38.6])box([x,3.28,-8.5],[.055,.76,.36],'teak');box([-39.75,3.77,-8.5],[.25,.03,.18],'linen');lamp('Loft study',[-38.68,3.73,-8.49],.65);chair('Loft study',[-39.27,2.916,-7.85],0);
 plant('Loft bedroom',[-40.75,2.95,-6.7],1.45);
 begin('Loft bedroom','Low teak bench');box([-40.75,3.2,-4.95],[.4,.42,1.45],'teak');box([-40.75,3.445,-4.95],[.42,.08,1.46],'linen');
 // Rear outdoor strip and entry — durable teak and clay keep the same palette outside.
 begin('Terrace','Teak outdoor deck');for(let i=0;i<17;i++)box([-42.1,.012,-9.12-i*.107],[10.15,.024,.095],'teak');
 for(const x of[-45.9,-38.15]){begin('Terrace','Teak outdoor lounge bench');box([x,.24,-9.85],[1.6,.12,.67],'teak');for(const dx of[-.63,.63])box([x+dx,.12,-9.85],[.085,.22,.48],'teak');soft([x,.34,-9.85],[1.54,.12,.62],'linen');box([x,.55,-10.12],[1.6,.44,.08],'teak');soft([x-.45,.53,-10.02],[.42,.4,.14],'olive',[.12,0,0]);}
 begin('Terrace','Outdoor side table');cyl([-42.05,.21,-9.9],.3,.4,'stone');vase([-42.05,.42,-9.9],.26,'clay');
 plant('Terrace',[-47.0,0,-10.48],1.7);plant('Terrace',[-36.95,0,-10.48],1.6);
 begin('Entry','Natural fibre entrance mat');box([-40.05,.028,.38],[1.45,.024,.58],'rug');plant('Entry',[-43.75,0,.35],1.15);
 const rooms=[{id:'living',name:'Living',eye:[-42.25,1.72,-4.4],target:[-39.35,.98,-6.35]},{id:'dining',name:'Dining & kitchen',eye:[-41.65,1.65,-4.55],target:[-38.5,.98,-1.7]},{id:'guest',name:'Guest bedroom',eye:[-43.9,1.65,-4.15],target:[-46.1,1,-3.1]},{id:'bath',name:'Guest bathroom',eye:[-45.75,1.62,-5.65],target:[-46.85,1.16,-6.3],fov:65},{id:'mainbath',name:'Main bathroom',eye:[-38.12,1.6,-3.95],target:[-37.27,1.05,-3.34],fov:65},{id:'entry',name:'Entry',eye:[-40.1,1.7,.5],target:[-40.1,1.1,-4.8]},{id:'loft',name:'Loft suite',eye:[-42.1,4.6,-3.1],target:[-38.7,3.9,-5.1]},{id:'study',name:'Loft study',eye:[-40.6,4.55,-7.9],target:[-38.85,3.8,-8.5]},{id:'terrace',name:'Terrace',eye:[-44.3,1.65,-10.7],target:[-40.2,.6,-9.85]}];
 return {version:'modern-tropical-2-realism',title:'Veil of Light · Modern Tropical',materials,items,rooms,hideOriginalRootIndices:[1,7,14],hideOriginalGltfNodes:[29,513,989],paletteOverrides:{'mmjhfdghd179':'#e9e2cf','mmjhfdghd189':'#7b815f','mmjhfdghd180':'#e9e2cf','mmjhfdghd188':'#cfb993','Unpainted':'#e7ddc9','[Color D01]':'#e7ddc9','[Color D01]1':'#e7ddc9','[Color F07]':'#e7ddc9','[0010_Snow]':'#ece5d6','[0130_Gainsboro]':'#e6ddcc'}};
}
