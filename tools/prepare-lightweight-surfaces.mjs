import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const three=pathToFileURL(process.cwd()+'/dist/vendor/three.module.js').href;
const loader=readFileSync('dist/vendor/loaders/RGBELoader.js','utf8').replace("from 'three'",`from '${three}'`);
writeFileSync('/private/tmp/veil-rgbe.mjs',loader);
const {RGBELoader}=await import('file:///private/tmp/veil-rgbe.mjs');const THREE=await import(three);
const b=readFileSync('dist/assets/realism/tropical-interior.hdr');const hdr=new RGBELoader().setDataType(THREE.FloatType).parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
const w=512,h=256,data=Buffer.alloc(w*h*4),channels=hdr.data.length/(hdr.width*hdr.height),sx=hdr.width/w,sy=hdr.height/h;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=[0,0,0];for(let j=0;j<sy;j++)for(let i=0;i<sx;i++){const p=((y*sy+j)*hdr.width+x*sx+i)*channels;for(let k=0;k<3;k++)c[k]+=hdr.data[p+k]/(sx*sy);}const max=Math.max(...c),e=max>1e-32?Math.ceil(Math.log2(max)):0,f=max>1e-32?256/2**e:0,p=(y*w+x)*4;for(let k=0;k<3;k++)data[p+k]=Math.min(255,Math.round(c[k]*f));data[p+3]=max>1e-32?e+128:0;}
writeFileSync('dist/assets/surfaces/studio-daylight.hdr',Buffer.concat([Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`),data]));console.log('Real daylight environment:',data.length,'bytes');
