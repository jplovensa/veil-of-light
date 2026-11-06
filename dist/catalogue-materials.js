import * as T from 'three';
// Same catalogue-swatch workflow as Shelter of Sky, using Veil of Light pages 19–21.
const schemes={earth:['wall','stone','wood','linen','boucle','quartz'],chalk:['wall','concrete','stone','wood','linen','boucle','quartz'],canopy:['wall','stone','wood','cane','linen','quartz']};
export function createCatalogueMaterials(renderer,onLoad){
 const loader=new T.TextureLoader(),cache=new Map(),waiting=new Map(),anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());
 function texture(scheme,finish,kind){if(!schemes[scheme].includes(finish)){if(finish==='cane')scheme='canopy';else finish=finish==='boucle'?'linen':finish==='concrete'?'wall':finish;}
  const key=`${scheme}/${finish}-${kind}`;if(cache.has(key))return cache.get(key);let done;waiting.set(key,new Promise(r=>done=r));const t=loader.load(`assets/catalogue/${key}.jpg`,()=>{for(const fn of t.userData.listeners||[])fn();t.userData.listeners=[];done();onLoad();},undefined,()=>done());t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.anisotropy=anisotropy;const repeat=['linen','boucle'].includes(finish)?4:finish==='cane'?1:/wood/.test(finish)?1.8:1;t.repeat.set(repeat,repeat);if(kind==='color')t.colorSpace=T.SRGBColorSpace;cache.set(key,t);return t;
 }
 function assign(mat,key,tex){if(tex.image)mat[key]=tex;else{mat[key]=null;(tex.userData.listeners||=[]).push(()=>{mat[key]=tex;mat.needsUpdate=true;});}}
 function apply(mat,scheme,finish,{tint='#ffffff',roughness,normal}={}){assign(mat,'map',texture(scheme,finish,'color'));assign(mat,'normalMap',texture(scheme,finish,'normal'));assign(mat,'roughnessMap',texture(scheme,finish,'roughness'));mat.bumpMap=null;mat.color.set(tint);mat.roughness=roughness??(['linen','boucle'].includes(finish)?.96:finish==='wood'?.72:.9);mat.normalScale.setScalar(normal??(['linen','boucle'].includes(finish)?.12:finish==='wall'?.16:.28));mat.userData.catalogueFinish=finish;mat.userData.catalogueScheme=scheme;mat.needsUpdate=true;return mat;}
 function palette(palette,scheme){for(const [key,mat]of Object.entries(palette)){
  if(['teak','teakDark'].includes(key))apply(mat,scheme,'wood',{tint:key==='teakDark'?'#c8bdab':'#ffffff'});
  else if(['linen','boucle'].includes(key))apply(mat,scheme,key);
  else if(key==='olive')apply(mat,scheme,'linen',{tint:scheme==='canopy'?'#657347':scheme==='chalk'?'#72776c':'#b9a48a'});
  else if(key==='rug')apply(mat,scheme,'linen',{tint:'#c0b5a2',normal:.09});
  else if(key==='limewash')apply(mat,scheme,'wall');
  else if(key==='stone')apply(mat,scheme,scheme==='chalk'?'concrete':'stone');
  else if(key==='cane'){apply(mat,scheme,'cane',{roughness:.96,normal:.22});mat.alphaMap=null;mat.alphaTest=0;}
  else if(key==='clay'){apply(mat,scheme,'wall',{tint:scheme==='chalk'?'#aaa79c':'#b29675',normal:.09});}
  else if(key==='ceramic'){mat.roughness=.32;if('clearcoat'in mat){mat.clearcoat=.18;mat.clearcoatRoughness=.32;}}
 }
 return palette;}
 function roleMaterial(mat,scheme,itemId){if(mat.name==='MT | stone'&&/vanity|backsplash|side|storage/.test(itemId||'')){const out=mat.clone();apply(out,scheme,'quartz',{roughness:.73,normal:.12});return out;}return mat;}
 return{apply,palette,roleMaterial,ready:()=>Promise.all(waiting.values())};
}
export function sourceFinish(name){if(/glass|translucent/i.test(name))return 'glass';if(/roof/i.test(name))return 'roof';if(/wood|pine|oak|color_006|color_b24/i.test(name))return 'teak';if(['Unpainted','[Color D01]','[Color D01]1','[Color F07]','[0010_Snow]'].includes(name))return 'limewash';if(/chrome|^ss$/i.test(name))return 'chrome';if(/bronze/i.test(name))return 'bronze';if(/metal|color m0|carpaint|material~[59]/i.test(name))return 'metal';if(/standardmaterial|ArchModels_68/i.test(name))return 'ceramic';return null;}
