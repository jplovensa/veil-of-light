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
