import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exteriorPalettes,interiorPalettes,ambiancePresets} from '../dist/exterior-palettes.js';
assert.deepEqual(exteriorPalettes.map(p=>p.name),['Mediterranean','Concrete Industrial','Modern Tropical']);
for(const p of exteriorPalettes){assert.equal(p.finishes.length,6);assert.equal(interiorPalettes[p.id].finishes.length,8);for(const path of [p.image,p.exteriorImage])assert.ok(existsSync(new URL('../dist/'+path,import.meta.url)),`Missing catalogue board: ${path}`);}
assert.ok(ambiancePresets.day.power>ambiancePresets.night.power);assert.ok(ambiancePresets.night.lamps>ambiancePresets.day.lamps);
const hash=createHash('sha256').update(readFileSync(new URL('../dist/assets/villa.gltf',import.meta.url))).digest('hex');assert.equal(hash,'e0903dc83663854a09c6ee1ab5dc550eaf1f6641ad6020e146fbf24b711c8c46','Preserve the original architectural export');
assert.ok(existsSync(new URL('../dist/assets/exterior/Veil-of-Light-Exterior-Moodboards.pdf',import.meta.url)));
console.log('Three original catalogue schemes, 42 finish entries, three lighting presets, all moodboard assets, and unchanged architectural source verified.');
const manifest=JSON.parse(readFileSync(new URL('../dist/assets/optimized/manifest.json',import.meta.url)));
assert.ok(manifest.shell.bytes<3_500_000,'Keep the architectural shell under 3.5 MB');
const nativeHashes=new Set();for(const id of ['earth','chalk','canopy']){const s=manifest.schemes[id];assert.ok(s.nativeVerified);assert.ok(s.bytes<3_700_000,'Detailed on-demand interiors stay under 3.7 MB');assert.ok(s.triangles>50000);nativeHashes.add(s.nativeSHA256);assert.equal(readFileSync(new URL('../dist/assets/optimized/'+id+'.glb',import.meta.url)).length,s.bytes);}
for(const s of Object.values(manifest.schemes))assert.ok(manifest.shell.bytes+s.bytes+manifest.shell.doors.reduce((n,d)=>n+d.bytes,0)<8_000_000,'Initial geometry stays below 8 MB including detailed upholstery and opening doors');
assert.equal(nativeHashes.size,3,'Distinct verified native files are required for all schemes');
assert.ok(readFileSync(new URL('../dist/assets/surfaces/studio-daylight.hdr',import.meta.url)).length<550000,'Captured lighting stays small');
console.log('Three distinct native exports, compressed model budgets and small captured-lighting asset verified.');
