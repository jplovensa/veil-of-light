import * as THREE from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {buildInteriorDesign} from './interior-design.js';

function generatedSurface(kind){
 const n=512,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d'),data=ctx.createImageData(n,n);let seed=1827;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  seed=(seed*1664525+1013904223)>>>0;const noise=seed/4294967296;let v=239,alpha=255;
  if(kind==='stone'){const veins=Math.sin(y*.04+Math.sin(x*.017)*2.3)+Math.sin(y*.09+x*.007)*.2;v=237+veins*5+noise*8;if(noise<.014)v-=35;}
  else if(kind==='cane'){const u=x%32,w=y%32;v=231-(u<5||w<5?32:0)+noise*10;}
  else if(kind==='shade'){const dx=(x%24)-12,dy=(y%24)-12;v=(Math.abs(dx)<3&&Math.abs(dy)<3)?0:255;}
  else if(kind==='leaf'){const mid=Math.abs(x-n/2)/(n/2),vein=Math.cos((y*.22+Math.abs(x-n/2)*.18));v=205+vein*8+noise*9-mid*16;if(Math.abs(x-n/2)<3)v+=26;}
  else v=236+noise*16;
  const i=(y*n+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=alpha;
 }ctx.putImageData(data,0,0);const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;return texture;
}
function neutralLinen(texture){
 const image=texture.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height);let mean=0;for(let i=0;i<data.data.length;i+=4)mean+=(data.data[i]+data.data[i+1]+data.data[i+2])/3;mean/=data.data.length/4;
 for(let i=0;i<data.data.length;i+=4){const l=(data.data[i]+data.data[i+1]+data.data[i+2])/3,v=THREE.MathUtils.clamp(237+(l-mean)*.8,170,255);data.data[i]=data.data[i+1]=data.data[i+2]=v;}ctx.putImageData(data,0,0);texture.dispose();return new THREE.CanvasTexture(canvas);
}
async function loadMaterials(design,manager){
 const loader=new THREE.TextureLoader(manager),maps={};await Promise.all(['teak','linen','plaster'].map(async name=>{maps[name]={};await Promise.all(['color','normal','roughness'].map(async channel=>{const texture=await loader.loadAsync(`./assets/realism/${name}-${channel}.jpg`);maps[name][channel]=name==='linen'&&channel==='color'?neutralLinen(texture):texture;const t=maps[name][channel];t.colorSpace=channel==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}));}));
 const palette={};for(const[k,v]of Object.entries(design.materials)){
  const textile=['linen','olive','rug'].includes(k),wood=['teak','teakDark'].includes(k),source=wood?maps.teak:textile?maps.linen:maps.plaster;
  const options={name:'MT | '+k,color:v.color,roughness:v.roughness??.8,metalness:v.metalness??0,side:THREE.DoubleSide,envMapIntensity:wood?.65:.45};
  if(wood){options.color=k==='teak'?'#ffffff':'#a69a86';options.map=source.color;options.normalMap=source.normal;options.normalScale=new THREE.Vector2(.16,.16);options.roughnessMap=source.roughness;options.roughness=.95;options.clearcoat=.035;options.clearcoatRoughness=.7;}
  else if(textile){options.map=source.color;options.normalMap=source.normal;options.normalScale=new THREE.Vector2(k==='rug'?.65:.3,k==='rug'?.65:.3);options.roughnessMap=source.roughness;options.roughness=1;options.sheen=1;options.sheenRoughness=.85;options.sheenColor=new THREE.Color(k==='olive'?'#a5a68b':'#e2d5bf');}
  else if(k==='stone'){options.map=generatedSurface('stone');options.bumpMap=options.map;options.bumpScale=.004;options.roughness=.82;}
  else if(k==='cane'){options.map=generatedSurface('cane');options.bumpMap=options.map;options.bumpScale=.0014;}
  else if(['limewash','clay'].includes(k)){options.map=generatedSurface('plaster');options.normalMap=maps.plaster.normal;options.normalScale=new THREE.Vector2(k==='clay'?.12:.055,k==='clay'?.12:.055);options.roughnessMap=maps.plaster.roughness;}
  else if(k.startsWith('leaf')){options.map=generatedSurface('leaf');options.bumpMap=options.map;options.bumpScale=.002;options.color=k==='leaf'?'#6a8054':'#829b66';options.roughness=.72;options.envMapIntensity=.25;options.sheen=.15;options.sheenColor=new THREE.Color('#a4bd79');}
  else if(k==='glass'){Object.assign(options,{color:'#ffffff',roughness:.08,metalness:0,transmission:.72,thickness:.012,ior:1.5,transparent:true,opacity:.32,depthWrite:false});}
  else if(k==='ceramic'){options.roughness=.3;options.clearcoat=.5;options.clearcoatRoughness=.2;}
  else if(k==='light'){options.emissive=v.emissive;options.emissiveIntensity=.35;}
  palette[k]=new THREE.MeshPhysicalMaterial(options);
 }
 palette.shade=palette.cane.clone();palette.shade.name='MT | handwoven shade';palette.shade.alphaMap=generatedSurface('shade');palette.shade.alphaTest=.3;palette.shade.color.set('#9a7a49');palette.shade.emissive=new THREE.Color('#20150c');palette.shade.emissiveIntensity=.03;
 palette.seam=palette.linen.clone();palette.seam.name='MT | tailored piping';palette.seam.color.set('#d6c9b4');palette.seam.map=null;palette.seam.normalMap=null;return {palette,maps};
}
function roundedGeometry(s,r,cloth=false){
 const g=new THREE.BoxGeometry(...s,cloth?18:4,cloth?12:4,cloth?18:4),pos=g.attributes.position,norm=g.attributes.normal;
 for(let i=0;i<pos.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pos,i),inner=v.clone();for(let k=0;k<3;k++)inner.setComponent(k,THREE.MathUtils.clamp(v.getComponent(k),-s[k]/2+r,s[k]/2-r));const n=v.clone().sub(inner).normalize();v.copy(inner).addScaledVector(n,r);
  if(cloth){const edge=Math.min(Math.abs(v.x)/s[0],Math.abs(v.z)/s[2]);const wrinkle=.0025*Math.sin(v.x*67+v.z*31)*Math.cos(v.z*49+v.y*37)*(edge+.15);v.addScaledVector(n,wrinkle);}pos.setXYZ(i,v.x,v.y,v.z);norm.setXYZ(i,n.x,n.y,n.z);
 }return g;
}
function leafGeometry(s){
 const verts=[],indices=[],uv=[],rows=24,cols=8;
 for(let j=0;j<=rows;j++){const t=j/rows,w=Math.pow(Math.sin(Math.PI*t),.72)*s[0]/2;for(let k=0;k<=cols;k++){const u=k/cols*2-1;verts.push(u*w,(t-.5)*s[1]-.08*u*u*Math.sin(t*Math.PI),((1-u*u)*.6*Math.sin(Math.PI*t)+Math.abs(u)*.08*Math.cos(t*45))*s[2]);uv.push(k/cols,t);}}
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function latheGeometry(p){
 const s=p.s,profile=[];if(p.shape==='shade'){for(let i=0;i<=16;i++){const t=(i+.3)/16.3*Math.PI/2;profile.push(new THREE.Vector2(s[0]*Math.sin(t),s[1]*Math.cos(t)));}}
 else{const open=s[2]/s[0]>.7;const outline=open?[[.48,0],[.7,.04],[.88,.2],[.99,.62],[1,.95],[s[2]/s[0],1],[s[2]/s[0]-.065,1],[.9,.93],[.88,.6],[.75,.22],[.38,.09],[0,.09]]:[[0,0],[.5,0],[.7,.04],[.97,.25],[1,.48],[.86,.64],[.48,.79],[.4,.97],[.4,1],[.31,1],[.31,.96],[.4,.8],[.73,.61],[.85,.45],[.73,.22],[.35,.09],[0,.09]];for(const[r,y]of outline)profile.push(new THREE.Vector2(r*s[0],(y-.5)*s[1]));}
 return new THREE.LatheGeometry(profile,64);
}
function physicalUV(g,kind,s){
 if(kind==='leaf')return;const pos=g.attributes.position,norm=g.attributes.normal,uv=g.attributes.uv,wood=['teak','teakDark'].includes(kind),tile=wood?1.2:['linen','olive'].includes(kind)?.42:kind==='rug'?.7:kind==='cane'?.18:kind==='stone'?1.6:2;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),ax=Math.abs(norm.getX(i)),ay=Math.abs(norm.getY(i)),az=Math.abs(norm.getZ(i));let u,v;if(ay>=ax&&ay>=az){u=x;v=z;}else if(ax>=az){u=z;v=y;}else{u=x;v=y;}
  // The photographed teak grain runs along U; orient it with the longest face dimension.
  if(wood&&(!s||ay<.7)){[u,v]=[v,u];}uv.setXY(i,u/tile,v/tile);
 }
}
export async function buildModernTropicalInterior(parent,manager){
 const design=buildInteriorDesign(),{palette,maps}=await loadMaterials(design,manager),buckets=new Map(),root=new THREE.Group();root.name='Modern Tropical · crafted interiors';
 const put=(room,mat,g)=>{const key=room+'|'+mat;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(g);};
 for(const item of design.items)for(const p of item.parts){let g;const transform=new THREE.Object3D(),cloth=['linen','olive'].includes(p.m);
  if(p.shape==='box')g=Math.min(...p.s)>.025&&!['glass','light'].includes(p.m)?roundedGeometry(p.s,Math.min(.007,Math.min(...p.s)*.16)):new THREE.BoxGeometry(...p.s);
  if(p.shape==='roundedBox')g=roundedGeometry(p.s,Math.min(...p.s)*(cloth?.34:.12),cloth);
  if(p.shape==='leaf')g=leafGeometry(p.s);
  if(p.shape==='vessel'||p.shape==='shade')g=latheGeometry(p);
  if(p.shape==='sphere'){g=new THREE.SphereGeometry(.5,40,24);g.scale(...p.s);}
  if(p.shape==='cylinder'){if(p.s[0]>.12){const b=Math.min(.008,p.s[1]*.14);g=new THREE.LatheGeometry([[0,-p.s[1]/2],[p.s[0]-b,-p.s[1]/2],[p.s[0],-p.s[1]/2+b],[p.s[2],p.s[1]/2-b],[p.s[2]-b,p.s[1]/2],[0,p.s[1]/2]].map(v=>new THREE.Vector2(...v)),64);}else g=new THREE.CylinderGeometry(p.s[2],p.s[0],p.s[1],48);}
  if(p.shape==='rod'){const a=new THREE.Vector3().fromArray(p.a),b=new THREE.Vector3().fromArray(p.b),dir=b.clone().sub(a);g=new THREE.CylinderGeometry(p.r,p.r,dir.length(),p.r<.006?6:16);transform.position.copy(a.add(b).multiplyScalar(.5));transform.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());}
  else{transform.position.fromArray(p.p);transform.rotation.fromArray(p.rotation||[0,0,0]);}
  transform.updateMatrix();physicalUV(g,p.m,p.s);g.applyMatrix4(transform.matrix);put(item.room,p.shape==='shade'?'shade':p.m,g);
 }
 for(const[key,geometries]of buckets){const [room,mat]=key.split('|'),g=mergeGeometries(geometries,false),mesh=new THREE.Mesh(g,palette[mat]);mesh.name='MT | '+room+' | '+mat;mesh.userData.room=room;mesh.castShadow=!['light','glass'].includes(mat);mesh.receiveShadow=true;root.add(mesh);for(const x of geometries)x.dispose();}
 const original=parent.children[0];if(original)for(const index of design.hideOriginalRootIndices){if(original.children[index+1])original.children[index+1].visible=false;}
 parent.updateMatrixWorld(true);
 parent.traverse(o=>{if(o.isMesh){if(!o.geometry.attributes.normal)o.geometry.computeVertexNormals();let replaced=false;const list=Array.isArray(o.material)?o.material:[o.material],next=list.map(mat=>{
  const name=mat.name,c=design.paletteOverrides[name];if(c){mat.color.set(c);mat.roughness=.94;}
  if(name==='Unpainted'||name.includes('Color D01')||name==='[Color F07]'||name==='[0010_Snow]'){replaced=true;const m=palette.limewash.clone();m.name=name;return m;}
  if(['Wood_Floor_Texture_by_AGF81','[Wood Floor]','89_pine light wood fine texture-seamless','CT-5572-T-Natural-Oak','71_dark  fine wood texture-seamless'].includes(name)){replaced=true;const m=palette.teak.clone();m.name=name;return m;}
  if(['mmjhfdghd179','mmjhfdghd189','mmjhfdghd180'].includes(name)){replaced=true;const m=(name==='mmjhfdghd189'?palette.olive:palette.linen).clone();m.name=name;return m;}return mat;});
  o.material=Array.isArray(o.material)?next:next[0];if(replaced){o.geometry=o.geometry.clone();const pos=o.geometry.attributes.position,normal=o.geometry.attributes.normal,uv=o.geometry.attributes.uv,normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);for(let i=0;i<pos.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld),n=new THREE.Vector3().fromBufferAttribute(normal,i).applyMatrix3(normalMatrix).normalize();const tile=next[0].map===maps.teak.color?1.2:next[0].map===maps.linen.color?.42:2;if(Math.abs(n.y)>.7)uv.setXY(i,v.x/tile,v.z/tile);else if(Math.abs(n.x)>.7)uv.setXY(i,v.y/tile,v.z/tile);else uv.setXY(i,v.x/tile,v.y/tile);}}}});
 parent.add(root);return {design,root,palette,maps};
}

export function addGarden(scene,palette){
 const group=new THREE.Group();group.name='Garden surroundings';const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#a5a58a',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set(-41,-.23,-5);ground.receiveShadow=true;group.add(ground);
 const leaf=leafGeometry([.55,1.35,.13]);for(const[x,z]of[[-49.2,-4],[-49.3,-8],[-48.8,-12.1],[-45.8,-12.6],[-42,-12.7],[-38,-12.6],[-34.8,-10],[-34.8,-6],[-34.7,-2]])for(let i=0;i<9;i++){const a=i*2.399,m=new THREE.Mesh(leaf,i%2?palette.leaf:palette.leafLight);m.position.set(x+Math.sin(a)*.48,.6+(i%4)*.42,z+Math.cos(a)*.48);m.rotation.set(Math.sin(a)*.8,a,Math.cos(a)*.65);m.castShadow=true;group.add(m);}
 const wall=new THREE.Mesh(new THREE.BoxGeometry(16,.65,.18),palette.limewash);wall.position.set(-41.7,.095,-13.1);wall.castShadow=true;wall.receiveShadow=true;group.add(wall);scene.add(group);return group;
}
