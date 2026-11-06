// Validate the actual native exports against floor triangles from the unchanged source architecture.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const dep=process.env.VEIL_OPTIMIZER_ROOT||'/private/tmp/veil-optimizer/node_modules';
const {NodeIO}=await import(pathToFileURL(dep+'/@gltf-transform/core/dist/index.js'));
const {ALL_EXTENSIONS}=await import(pathToFileURL(dep+'/@gltf-transform/extensions/dist/index.js'));
function getBounds(root){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];function visit(node){const mesh=node.getMesh();if(mesh){const m=node.getWorldMatrix();for(const primitive of mesh.listPrimitives()){const a=primitive.getAttribute('POSITION');for(let i=0;i<a.getCount();i++){const p=a.getElement(i,[]);for(let k=0;k<3;k++){const v=m[k]*p[0]+m[k+4]*p[1]+m[k+8]*p[2]+m[k+12];min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}}}}for(const child of node.listChildren())visit(child);}visit(root);return {min,max};}
const {MeshoptDecoder}=await import(pathToFileURL(dep+'/meshoptimizer/index.js'));
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const source=JSON.parse(readFileSync('dist/assets/upper-floor-support.json'));
const inside=(x,z,t)=>{const [a,b,c]=t.map(v=>[v[0],v[2]]),v0=[c[0]-a[0],c[1]-a[1]],v1=[b[0]-a[0],b[1]-a[1]],v2=[x-a[0],z-a[1]],den=v0[0]*v1[1]-v1[0]*v0[1];if(Math.abs(den)<1e-9)return false;const u=(v2[0]*v1[1]-v1[0]*v2[1])/den,v=(v0[0]*v2[1]-v2[0]*v0[1])/den;return u>=-.002&&v>=-.002&&u+v<=1.002;};
const report={source:source.source,schemes:{}};
for(const scheme of ['earth','chalk','canopy']){
 const d=await io.read(`dist/assets/optimized/${scheme}.glb`),bounds=new Map(),checked=[];
 for(const node of d.getRoot().listNodes()){
  const e=node.getExtras();if(!['Loft bedroom','Loft study','Balcony'].includes(e.room)||(!e.movable&&e.room!=='Loft study'))continue;
  const box=getBounds(node),level=e.room==='Balcony'?2.9:2.95;
  const floors=source.triangles.filter(f=>Math.abs(f.level-level)<.01);
  for(const tx of [.04,.5,.96])for(const tz of [.04,.5,.96]){const x=box.min[0]+(box.max[0]-box.min[0])*tx,z=box.min[2]+(box.max[2]-box.min[2])*tz;assert.ok(floors.some(f=>inside(x,z,f.triangle)),`${scheme} ${e.itemId} extends off its source floor at ${x.toFixed(3)},${z.toFixed(3)}`);}
  if(e.room==='Loft study')assert.ok(box.min[2]>-7.12,'Desk and chair must be inside the loft glazing');
  bounds.set(e.itemId,box);checked.push({id:e.itemId,room:e.room,bounds:box,floorLevel:level});
 }
 const desk=bounds.get('study-desk')||bounds.get('fixed-Loft study'),chair=bounds.get('study-chair'),bench=bounds.get('loft-bench'),bed=bounds.get('loft-bed');assert.ok(desk&&chair&&bench&&bed);
 const chairToBench=bench.min[0]-chair.max[0],benchToBed=bed.min[0]-bench.max[0];assert.ok(chairToBench>.7,'Retain a usable aisle between the work chair and bench');assert.ok(benchToBed>.9,'Retain the aisle at the bed foot');
 report.schemes[scheme]={checked,chairToBenchMetres:chairToBench,benchToBedMetres:benchToBed,deskIndoors:true};
 console.log(`${scheme}: ${checked.length} upstairs pieces supported by source floors; desk indoors; aisles ${chairToBench.toFixed(2)} m and ${benchToBed.toFixed(2)} m.`);
}
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2));
