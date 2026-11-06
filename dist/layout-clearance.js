// Conservative plan clearance from actual exported/rendered geometry bounds.
export function horizontalGap(a,b){const x=Math.max(0,a.min[0]-b.max[0],b.min[0]-a.max[0]),z=Math.max(0,a.min[2]-b.max[2],b.min[2]-a.max[2]);return Math.hypot(x,z);}
export function isLivingSeatOrTable(id){return /^living-(sofa|table|chair(?:-[ab])?)$/.test(id||'');}
