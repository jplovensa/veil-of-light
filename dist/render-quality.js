import * as T from 'three';
import {EffectComposer} from './vendor/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/postprocessing/OutputPass.js';
export function defaultQuality(){return new URLSearchParams(location.search).get('quality')==='lite'||innerWidth<700||(navigator.deviceMemory&&navigator.deviceMemory<4)?'lite':'refined';}
export function createRenderSystem(renderer,scene,camera,onChange){
 let quality=defaultQuality(),composer,pass,ao;const select=document.querySelector('#render-quality');select.value=quality;
 function setup(){if(composer)return;composer=new EffectComposer(renderer);composer.renderTarget1.samples=composer.renderTarget2.samples=Math.min(4,renderer.capabilities.maxSamples);pass=new RenderPass(scene,camera);composer.addPass(pass);ao=new SSAOPass(scene,camera,innerWidth,innerHeight,12);ao.kernelRadius=.38;ao.minDistance=.001;ao.maxDistance=.12;
  // Glass and editor lines are excluded from the contact-shadow depth pass.
  const base=ao.overrideVisibility.bind(ao);ao.overrideVisibility=()=>{base();scene.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.every(m=>m.transparent&&m.opacity<.5))o.visible=false;}});};
  ao.copyMaterial.fragmentShader=ao.copyMaterial.fragmentShader.replace('gl_FragColor = opacity * texel;','gl_FragColor = vec4(mix(vec3(1.0), texel.rgb, 0.65), 1.0);');composer.addPass(ao);composer.addPass(new OutputPass());
 }
 function resize(){const cap=quality==='refined'?2:1.25,pixelBudget=quality==='refined'?2600000:1600000;renderer.setPixelRatio(Math.min(devicePixelRatio,cap,Math.sqrt(pixelBudget/(innerWidth*innerHeight))));renderer.setSize(innerWidth,innerHeight);if(quality==='refined'){setup();composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);const scale=renderer.getPixelRatio()*.65;ao.setSize(Math.round(innerWidth*scale),Math.round(innerHeight*scale));}renderer.domElement.dataset.quality=quality;}
 function setQuality(value){if(value==='lite'&&composer){for(const p of composer.passes)p.dispose?.();composer.dispose();composer=pass=ao=null;}quality=value;select.value=value;resize();onChange();}
 select.onchange=e=>setQuality(e.target.value);resize();
 return{get quality(){return quality;},resize,render(camera,{mode,cutaway}){if(quality==='lite'){renderer.render(scene,camera);return;}setup();pass.camera=camera;ao.camera=camera;ao.enabled=mode!=='plan'&&!cutaway&&camera.position.y<5.2;composer.render();},setQuality};
}
