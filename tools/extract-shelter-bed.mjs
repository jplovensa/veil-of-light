// Reuse the owner-supplied Shelter of Sky bed geometry, normalized for Veil's sleeping spaces.
import {pathToFileURL} from 'node:url';
const dep=process.env.VEIL_OPTIMIZER_ROOT||'/private/tmp/veil-optimizer/node_modules';
const {Document,NodeIO}=await import(pathToFileURL(dep+'/@gltf-transform/core/dist/index.js'));
const {getBounds,weld,simplify}=await import(pathToFileURL(dep+'/@gltf-transform/functions/dist/index.js'));
import {writeFileSync} from 'node:fs';
const {MeshoptSimplifier}=await import(pathToFileURL(dep+'/meshoptimizer/index.js'));
await MeshoptSimplifier.ready;
const source=process.argv[2];if(!source)throw Error('Supply Shelter shell-source.gltf');
const doc=await new NodeIO().read(source),root=doc.getRoot().listNodes()[947],b=getBounds(root),cx=(b.min[0]+b.max[0])/2,cz=(b.min[2]+b.max[2])/2;
const size=[b.max[2]-b.min[2],b.max[1]-b.min[1],b.max[0]-b.min[0]],scale=[1.85/size[0],1,2.13/size[2]],pieces=[];
root.traverse(n=>{const mesh=n.getMesh();if(!mesh)return;const m=n.getWorldMatrix();for(const p of mesh.listPrimitives()){const a=p.getAttribute('POSITION'),vertices=[];for(let i=0;i<a.getCount();i++){const v=a.getElement(i,[]),w=[0,1,2].map(r=>m[r]*v[0]+m[4+r]*v[1]+m[8+r]*v[2]+m[12+r]);vertices.push([(w[2]-cz)*scale[0],w[1]-b.min[1]+.025,-(w[0]-cx)*scale[2]].map(x=>+x.toFixed(6)));}const ind=p.getIndices()?.getArray()||Array.from({length:a.getCount()},(_,i)=>i),faces=[];for(let i=0;i<ind.length;i+=3)faces.push([ind[i],ind[i+1],ind[i+2]]);pieces.push({sourceMaterial:p.getMaterial().getName(),vertices,faces});}});
// Reduce the reference's 162k triangles before native authoring; retain a 3 mm error bound.
const compact=new Document(),buffer=compact.createBuffer(),scene=compact.createScene();
for(const piece of pieces){const pos=compact.createAccessor().setType('VEC3').setArray(new Float32Array(piece.vertices.flat())).setBuffer(buffer),ind=compact.createAccessor().setType('SCALAR').setArray(new Uint32Array(piece.faces.flat())).setBuffer(buffer),primitive=compact.createPrimitive().setAttribute('POSITION',pos).setIndices(ind),mesh=compact.createMesh().addPrimitive(primitive);scene.addChild(compact.createNode(piece.sourceMaterial).setMesh(mesh));}
await compact.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.12,error:.003,lockBorder:false}));
pieces.length=0;for(const n of scene.listChildren())for(const p of n.getMesh().listPrimitives()){const a=p.getAttribute('POSITION'),vertices=Array.from({length:a.getCount()},(_,i)=>a.getElement(i,[]).map(v=>+v.toFixed(6))),ind=p.getIndices().getArray(),faces=[];for(let i=0;i<ind.length;i+=3)faces.push([ind[i],ind[i+1],ind[i+2]]);pieces.push({sourceMaterial:n.getName(),vertices,faces});}
writeFileSync('dist/assets/furniture/shelter-bed.json',JSON.stringify({source:'Shelter of Sky owner-supplied model',sourceNode:947,dimensions:[1.85,size[1],2.13],headDirection:'+Z',pieces}));console.log(pieces.map(p=>({material:p.sourceMaterial,vertices:p.vertices.length,triangles:p.faces.length})));
