// Build-time dependencies: @gltf-transform/{core,functions,extensions}@4.5.1 and meshoptimizer@1.3.0.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,statSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dep=process.env.VEIL_OPTIMIZER_ROOT||'/private/tmp/veil-optimizer/node_modules';
const {NodeIO}=await import(pathToFileURL(dep+'/@gltf-transform/core/dist/index.js'));
const {ALL_EXTENSIONS}=await import(pathToFileURL(dep+'/@gltf-transform/extensions/dist/index.js'));
const {prune,dedup,weld,simplify,normals,join,meshopt,getBounds,unpartition,flatten}=await import(pathToFileURL(dep+'/@gltf-transform/functions/dist/index.js'));
const {MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier}=await import(pathToFileURL(dep+'/meshoptimizer/index.js'));
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const out=resolve('dist/assets/optimized');mkdirSync(out,{recursive:true});
let manifests;
if(process.argv.includes('--interiors-only'))manifests=JSON.parse(readFileSync(out+'/manifest.json','utf8'));
else{
const source=JSON.parse(readFileSync('dist/assets/villa.gltf','utf8'));const doc=await io.read('dist/assets/villa.gltf');
const root=doc.getRoot().getDefaultScene().listChildren()[0],children=root.listChildren();const removed=new Set([2,29,319,513,723,734,989]);const retained=[];
for(let i=0;i<children.length;i++){if(removed.has(source.nodes[0].children[i]))root.removeChild(children[i]);else retained.push(source.nodes[0].children[i]);}
for(const mat of doc.getRoot().listMaterials()){mat.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setEmissiveTexture(null);if(mat.getName().includes('Glass'))mat.setAlphaMode('BLEND').setBaseColorFactor([.8,.88,.86,.19]);}
for(const mesh of doc.getRoot().listMeshes())for(const primitive of mesh.listPrimitives())primitive.setAttribute('TEXCOORD_0',null);
const before=getBounds(doc.getRoot().getDefaultScene());
await doc.transform(prune(),dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.2,error:.0005,lockBorder:true}),normals(),flatten(),join({keepNamed:false}),prune(),unpartition(),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:10,quantizeTexcoord:12}));
await io.write(out+'/villa-shell.glb',doc);const after=getBounds(doc.getRoot().getDefaultScene());
manifests={shell:{url:'./assets/optimized/villa-shell.glb',bytes:statSync(out+'/villa-shell.glb').size,sourceRetainedNodes:retained,removedOldFurnitureNodes:[...removed],boundsBefore:before,boundsAfter:after},schemes:{}};
}
for(const id of ['earth','chalk','canopy']){if(!existsSync(`dist/assets/interiors/${id}.glb`))continue;const file=`dist/assets/interiors/${id}.glb`,d=await io.read(file);await d.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.6,error:.0003,lockBorder:true}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:10,quantizeTexcoord:12}));await io.write(`${out}/${id}.glb`,d);const native=JSON.parse(readFileSync(`dist/assets/interiors/${id}.json`,'utf8'));manifests.schemes[id]={...native,renderTriangles:d.getRoot().listMeshes().reduce((sum,mesh)=>sum+mesh.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0),furnitureRevision:'proposal-furniture-7',url:`./assets/optimized/${id}.glb`,bytes:statSync(`${out}/${id}.glb`).size};}
copyFileSync(dep+'/meshoptimizer/meshopt_decoder.mjs','dist/vendor/meshopt_decoder.mjs');writeFileSync(out+'/manifest.json',JSON.stringify(manifests,null,2));console.log(JSON.stringify(manifests,null,2));
