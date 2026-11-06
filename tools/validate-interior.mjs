import assert from 'node:assert/strict';
import {buildInteriorDesign} from '../dist/interior-design.js';
for(const scheme of ['earth','chalk','canopy']){
const design=buildInteriorDesign(scheme);
assert.equal(new Set(design.items.map(i=>i.room)).size,11);
const desk=design.items.find(i=>i.id==='study-desk'),studyChair=design.items.find(i=>i.id==='study-chair');assert.ok(desk.pivot[2]>-7.12&&desk.pivot[1]===2.95,'The desk belongs inside the enclosed loft at its source floor level');assert.ok(studyChair.pivot[2]>-7.12&&studyChair.pivot[1]===2.95,'The desk chair stays on the enclosed loft floor');
const chairs=design.items.filter(i=>i.facing);
assert.equal(chairs.length,4);
for(const {facing:f}of chairs){const dx=f.target[0]-f.position[0],dz=f.target[2]-f.position[2];const alignment=(-Math.sin(f.rotation)*dx-Math.cos(f.rotation)*dz)/Math.hypot(dx,dz);assert.ok(alignment>.999,'Dining chair must face the table centre');}
for(const item of design.items){assert.ok(item.parts.length,`${item.name} has geometry`);for(const part of item.parts){assert.ok(design.materials[part.m]);const values=part.shape==='rod'?[...part.a,...part.b,part.r]:part.shape==='tube'?[...part.path.flat(),part.r]:[...(part.p||[]),...(part.s||[]),...(part.rotation||[]),...(part.profile||[]).flat()];assert.ok(values.every(Number.isFinite),`${item.name} has finite coordinates`);}}
assert.ok(!design.hideOriginalGltfNodes.includes(155)&&!design.hideOriginalGltfNodes.includes(349),'Retain original bathroom door assemblies');
assert.ok(!design.hideOriginalGltfNodes.includes(771),'Retain original kitchen joinery');
assert.ok(!design.items.some(i=>/bathroom door/i.test(i.name)),'Do not overlay assumed replacement doors');
console.log(`${design.items.length} furnishing groups across 11 spaces; all four dining chairs face the table.`);

}
