import {pathToFileURL} from 'node:url';
import {writeFileSync,mkdirSync,statSync} from 'node:fs';
import {smoothSource} from './smooth-normals.mjs';
const dep=process.env.VEIL_OPTIMIZER_ROOT||'/private/tmp/veil-optimizer/node_modules';
const {cloneDocument,transformMesh,prune,dedup,weld,normals,flatten,join,meshopt,getBounds,unpartition}=await import(pathToFileURL(dep+'/@gltf-transform/functions/dist/index.js'));
export async function buildAnimatedDoors(doc,io,encoder,out){
 const registry=[];mkdirSync(out+'/doors',{recursive:true});
 for(const def of [{id:'main-bath',name:'Main bathroom',node:171,hinge:[-38.64243,0,-2.9887],closedDirection:-1},{id:'guest-bath',name:'Guest bathroom',node:365,hinge:[-45.21794,0,-7.07015],closedDirection:1}]){
  const original=doc.getRoot().listNodes()[def.node],before=getBounds(original),matrix=original.getWorldMatrix(),sourceAngle=def.closedDirection<0?Math.atan2(-matrix[0],-matrix[2]):Math.atan2(matrix[0],matrix[2]);
  const d=cloneDocument(doc),leaf=d.getRoot().listNodes()[def.node],scene=d.getRoot().getDefaultScene(),pieces=[];function visit(n){if(n.getMesh())pieces.push({source:n.getMesh(),matrix:n.getWorldMatrix(),name:n.getName()});for(const c of n.listChildren())visit(c);}visit(leaf);for(const child of scene.listChildren())scene.removeChild(child);
  // Bake complete world matrices, including inherited non-uniform scale/shear, into vertices.
  for(const piece of pieces){const mesh=d.createMesh(piece.name);for(const src of piece.source.listPrimitives()){const p=src.clone();for(const semantic of p.listSemantics())p.setAttribute(semantic,p.getAttribute(semantic).clone());if(p.getIndices())p.setIndices(p.getIndices().clone());mesh.addPrimitive(p);}transformMesh(mesh,piece.matrix);scene.addChild(d.createNode(piece.name).setMesh(mesh));}
  await d.transform(prune(),dedup(),weld(),normals());smoothSource(d);await d.transform(weld(),flatten(),join({keepNamed:false}),prune(),unpartition(),meshopt({encoder,level:'medium',quantizePosition:16,quantizeNormal:10,quantizeTexcoord:12}));
  const after=getBounds(scene);for(const key of ['min','max'])for(let i=0;i<3;i++)if(Math.abs(before[key][i]-after[key][i])>.001)throw Error('Door source placement changed');
  const url=`./assets/optimized/doors/${def.id}.glb`;await io.write(out+'/doors/'+def.id+'.glb',d);registry.push({...def,sourceAngle,sourcePositionPreserved:true,bounds:after,hingeDerivation:'Centres of the retained upper and lower source hinge components',url,bytes:statSync(out+'/doors/'+def.id+'.glb').size});
 }
 // Remove only moving leaves. Original fixed frames and opening geometry remain in the shell.
 for(const def of registry){const node=doc.getRoot().listNodes()[def.node];for(const p of node.listParents())if(p.propertyType==='Node')p.removeChild(node);}
 writeFileSync(out+'/doors/manifest.json',JSON.stringify({source:'Original villa.gltf door leaves, handles and hinges',doors:registry},null,2));return registry;
}
