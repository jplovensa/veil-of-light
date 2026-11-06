import assert from 'node:assert/strict';
import {buildInteriorDesign} from '../dist/interior-design.js';
const design=buildInteriorDesign();
assert.equal(new Set(design.items.map(i=>i.room)).size,10);
const chairs=design.items.filter(i=>i.facing);
assert.equal(chairs.length,4);
for(const {facing:f}of chairs){const dx=f.target[0]-f.position[0],dz=f.target[2]-f.position[2];const alignment=(-Math.sin(f.rotation)*dx-Math.cos(f.rotation)*dz)/Math.hypot(dx,dz);assert.ok(alignment>.999,'Dining chair must face the table centre');}
for(const item of design.items){assert.ok(item.parts.length,`${item.name} has geometry`);for(const part of item.parts){assert.ok(design.materials[part.m]);const values=part.shape==='rod'?[...part.a,...part.b,part.r]:[...part.p,...part.s,...part.rotation];assert.ok(values.every(Number.isFinite),`${item.name} has finite coordinates`);}}
assert.ok(!design.hideOriginalGltfNodes.includes(155)&&!design.hideOriginalGltfNodes.includes(349),'Retain original bathroom door assemblies');
assert.ok(!design.hideOriginalGltfNodes.includes(771),'Retain original kitchen joinery');
assert.ok(!design.items.some(i=>/bathroom door/i.test(i.name)),'Do not overlay assumed replacement doors');
console.log(`${design.items.length} furnishing groups across 10 spaces; all four dining chairs face the table.`);
