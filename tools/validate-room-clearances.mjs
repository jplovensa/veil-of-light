// Check real exported furniture, using retained source-wall coordinates rather than design pivots.
import assert from 'node:assert/strict';
import {horizontalGap,isLivingSeatOrTable} from '../dist/layout-clearance.js';
import {pathToFileURL} from 'node:url';
const dep=process.env.VEIL_OPTIMIZER_ROOT||'/private/tmp/veil-optimizer/node_modules';
const {NodeIO}=await import(pathToFileURL(dep+'/@gltf-transform/core/dist/index.js'));
const {ALL_EXTENSIONS}=await import(pathToFileURL(dep+'/@gltf-transform/extensions/dist/index.js'));
const {MeshoptDecoder}=await import(pathToFileURL(dep+'/meshoptimizer/index.js'));await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
function bounds(node){let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];node.traverse(n=>{const m=n.getWorldMatrix();for(const p of n.getMesh()?.listPrimitives()||[]){const a=p.getAttribute('POSITION');for(let i=0;i<a.getCount();i++){const v=a.getElement(i,[]);for(let k=0;k<3;k++){const x=m[k]*v[0]+m[k+4]*v[1]+m[k+8]*v[2]+m[k+12];min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);}}}});return{min,max};}
for(const scheme of ['earth','chalk','canopy']){const doc=await io.read(`dist/assets/optimized/${scheme}.glb`),find=id=>doc.getRoot().listNodes().find(n=>n.getExtras().itemId===id),sofa=bounds(find('living-sofa'));
// Main bath wall's living face z=-5.10 from source mesh [Color D01], floor-level section.
const partitionGap=-5.10-sofa.max[2],backGap=-37.1585-sofa.max[0];assert.ok(partitionGap>.08,`${scheme}: sofa overlaps main-bath partition`);assert.ok(backGap>.15,`${scheme}: sofa touches rear finish`);
const sofaNode=find('living-sofa');sofaNode.traverse(n=>{for(const p of n.getMesh()?.listPrimitives()||[]){if(!/MT \| (metal|teakDark)$/.test(p.getMaterial()?.getName()||''))continue;const a=p.getAttribute('POSITION');for(let k=0;k<a.getCount();k++)assert.ok(a.getElement(k,[])[1]<.17,`${scheme}: sofa upholstery must use fabric, not a foot material`);}});
const loose=doc.getRoot().listNodes().filter(n=>isLivingSeatOrTable(n.getExtras().itemId));for(let i=0;i<loose.length;i++)for(let j=i+1;j<loose.length;j++){const gap=horizontalGap(bounds(loose[i]),bounds(loose[j]));assert.ok(gap>=.12,`${scheme}: ${loose[i].getExtras().itemId} clashes with ${loose[j].getExtras().itemId}`);}
const facadeLeaves=doc.getRoot().listNodes().filter(n=>n.getExtras().facadeDoor);assert.equal(facadeLeaves.length,4,'Front and rear each need two opening glass leaves');for(const n of facadeLeaves){const b=bounds(n);assert.ok(b.max[1]>2.5&&b.min[1]<.05,'Glass leaves cover door height');assert.ok(n.getExtras().facadeDoor.travel.some(v=>Math.abs(v)>1),'Sliding doors need a clear passage');}
for(const id of ['guest-bed','loft-bed']){const n=find(id),b=bounds(n);assert.match(n.getName(),/Shelter of Sky bed/);const size=b.max.map((v,i)=>v-b.min[i]);assert.ok(size[0]>2.10&&size[0]<2.15&&size[2]>1.82&&size[2]<1.88,`${id}: preserve fitted reference asset footprint`);assert.ok(size[1]>.85,'Retain detailed headboard/pillows');}
console.log(`${scheme}: sofa partition gap ${(partitionGap*100).toFixed(0)} cm, rear gap ${(backGap*100).toFixed(0)} cm; both detailed reference beds fitted.`);}
