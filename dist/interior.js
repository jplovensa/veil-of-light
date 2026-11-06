import * as THREE from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {buildInteriorDesign} from './interior-design.js';
function surfaceTexture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),data=ctx.createImageData(128,128);let seed=1729;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){seed=(seed*1664525+1013904223)>>>0;const noise=seed/4294967296;let v=248;
  if(kind==='wood')v=225+Math.sin(x*.38+Math.sin(y*.035)*1.8)*12+noise*14;
  if(kind==='linen')v=235+noise*10-((x%4===0||y%4===0)?15:0);
  if(kind==='cane')v=240-((x%16<3||y%16<3)?42:0)-((x%16<7&&y%16<7)?15:0)+noise*7;
  if(kind==='stone')v=236+noise*15-(Math.sin(y*.25+Math.sin(x*.03))>.95?9:0);
  if(kind==='plaster')v=239+noise*14;
  const i=(y*128+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;
 }ctx.putImageData(data,0,0);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;const r=kind==='linen'?8:kind==='cane'?3:1;tex.repeat.set(r,kind==='wood'?2:r);return tex;
}
export function buildModernTropicalInterior(parent){
 const design=buildInteriorDesign(),palette={},buckets=new Map(),root=new THREE.Group();root.name='Modern Tropical · full villa interiors';
 for(const[k,v]of Object.entries(design.materials)){palette[k]=new THREE.MeshStandardMaterial({name:'MT | '+k,color:v.color,roughness:v.roughness??.8,metalness:v.metalness??0,...(v.opacity?{opacity:v.opacity,transparent:true,depthWrite:false}:{}),...(v.texture?{map:surfaceTexture(v.texture)}:{}),...(v.emissive?{emissive:v.emissive,emissiveIntensity:v.emissiveIntensity}:{}),side:THREE.DoubleSide});}
 for(const item of design.items)for(const p of item.parts){let geometry;const transform=new THREE.Object3D();
  if(p.shape==='box')geometry=new THREE.BoxGeometry(...p.s);
  if(p.shape==='roundedBox'){geometry=new THREE.BoxGeometry(...p.s,6,6,6);const r=Math.min(...p.s)*.3,pos=geometry.attributes.position,norm=geometry.attributes.normal;for(let i=0;i<pos.count;i++){const v=new THREE.Vector3().fromBufferAttribute(pos,i),inner=v.clone();for(let k=0;k<3;k++)inner.setComponent(k,THREE.MathUtils.clamp(v.getComponent(k),-p.s[k]/2+r,p.s[k]/2-r));const n=v.clone().sub(inner).normalize();v.copy(inner).addScaledVector(n,r);pos.setXYZ(i,v.x,v.y,v.z);norm.setXYZ(i,n.x,n.y,n.z);}}
  if(p.shape==='leaf'){const verts=[],indices=[];for(let j=0;j<=10;j++){const t=j/10,w=Math.pow(Math.sin(Math.PI*t),.8)*p.s[0]/2;for(let k=-1;k<=1;k++)verts.push(k*w,(t-.5)*p.s[1],(1-Math.abs(k))*.3*Math.sin(Math.PI*t)*p.s[2]);}for(let j=0;j<10;j++)for(let k=0;k<2;k++){const a=j*3+k;indices.push(a,a+3,a+1,a+1,a+3,a+4);}geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(Array(verts.length/3*2).fill(0),2));geometry.setIndex(indices);geometry.computeVertexNormals();}
  if(p.shape==='sphere'){geometry=new THREE.SphereGeometry(.5,20,10);geometry.scale(...p.s);}
  if(p.shape==='cylinder')geometry=new THREE.CylinderGeometry(p.s[2],p.s[0],p.s[1],20);
  if(p.shape==='rod'){const a=new THREE.Vector3().fromArray(p.a),b=new THREE.Vector3().fromArray(p.b),dir=b.clone().sub(a);geometry=new THREE.CylinderGeometry(p.r,p.r,dir.length(),20);transform.position.copy(a.add(b).multiplyScalar(.5));transform.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());}
  else{transform.position.fromArray(p.p);transform.rotation.fromArray(p.rotation||[0,0,0]);}
  transform.updateMatrix();geometry.applyMatrix4(transform.matrix);const key=item.room+'|'+p.m;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(geometry);
 }
 for(const[key,geometries]of buckets){const [room,mat]=key.split('|'),merged=mergeGeometries(geometries,false);const mesh=new THREE.Mesh(merged,palette[mat]);mesh.name='MT | '+room+' | '+mat;mesh.userData.room=room;mesh.castShadow=mat!=='light';mesh.receiveShadow=true;root.add(mesh);for(const g of geometries)g.dispose();}
 const original=parent.children[0];if(original)for(const index of design.hideOriginalRootIndices){const group=original.children[index+1];if(group)group.visible=false;}
 parent.traverse(o=>{if(o.isMesh){for(const mat of(Array.isArray(o.material)?o.material:[o.material])){const c=design.paletteOverrides[mat.name];if(c){mat.color.set(c);mat.roughness=.95;}}}});
 parent.add(root);return {design,root,palette};
}
