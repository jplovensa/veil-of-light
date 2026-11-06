import {writeFileSync} from 'node:fs';
import {buildInteriorDesign} from '../dist/interior-design.js';
writeFileSync(new URL('../interior-spec.json',import.meta.url),JSON.stringify(buildInteriorDesign()));
console.log('Interior design specification written.');
