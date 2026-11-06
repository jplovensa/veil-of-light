import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {buildInteriorDesign} from '../dist/interior-design.js';
const scheme=process.argv[2]||'earth',output=resolve(process.argv[3]||'interior-spec.json');mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(buildInteriorDesign(scheme)));console.log(scheme+' specification: '+output);
