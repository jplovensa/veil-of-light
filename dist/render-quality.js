import {ShaderPass} from './vendor/postprocessing/ShaderPass.js';
import {Vector2} from 'three';
// Fast edge antialiasing after tone mapping, including thin cane strands and piping.
export function makeEdgeSmoothing(){return new ShaderPass({uniforms:{tDiffuse:{value:null},resolution:{value:new Vector2(1,1)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 uniform sampler2D tDiffuse;uniform vec2 resolution;varying vec2 vUv;
 void main(){
  vec3 nw=texture2D(tDiffuse,vUv+vec2(-1.,-1.)*resolution).rgb,ne=texture2D(tDiffuse,vUv+vec2(1.,-1.)*resolution).rgb,sw=texture2D(tDiffuse,vUv+vec2(-1.,1.)*resolution).rgb,se=texture2D(tDiffuse,vUv+vec2(1.,1.)*resolution).rgb,m=texture2D(tDiffuse,vUv).rgb;
  vec3 luma=vec3(.299,.587,.114);float a=dot(nw,luma),b=dot(ne,luma),c=dot(sw,luma),d=dot(se,luma),e=dot(m,luma);float lo=min(e,min(min(a,b),min(c,d))),hi=max(e,max(max(a,b),max(c,d)));
  vec2 dir=vec2(-((a+b)-(c+d)),(a+c)-(b+d));float reduce=max((a+b+c+d)*.03125,.0078125);float inv=1./(min(abs(dir.x),abs(dir.y))+reduce);dir=clamp(dir*inv,vec2(-8.),vec2(8.))*resolution;
  vec3 aa=.5*(texture2D(tDiffuse,vUv+dir*(-.1666667)).rgb+texture2D(tDiffuse,vUv+dir*.1666667).rgb);vec3 bb=aa*.5+.25*(texture2D(tDiffuse,vUv-dir*.5).rgb+texture2D(tDiffuse,vUv+dir*.5).rgb);float y=dot(bb,luma);gl_FragColor=vec4(y<lo||y>hi?aa:bb,1.);
 }`});}
