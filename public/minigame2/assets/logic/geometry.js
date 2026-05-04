// Gộp hình học thủ công để tương thích với Three.js r128.
function mergeGeos(geos){
  if(!geos||!geos.length)return null;
  // Đếm tổng số đỉnh và chỉ số.
  let vtxCount=0, idxCount=0, hasIndex=false;
  geos.forEach(g=>{
    g.computeBoundingBox&&g.computeBoundingBox();
    vtxCount+=g.attributes.position.count;
    if(g.index){hasIndex=true;idxCount+=g.index.count;}
  });
  const merged=new THREE.BufferGeometry();
  const positions=new Float32Array(vtxCount*3);
  const normals=new Float32Array(vtxCount*3);
  const indices=hasIndex?new Uint32Array(idxCount):null;
  let vi=0, ii=0, vtxOffset=0;
  geos.forEach(g=>{
    const pos=g.attributes.position.array;
    const nor=g.attributes.normal?g.attributes.normal.array:null;
    const cnt=g.attributes.position.count;
    for(let i=0;i<pos.length;i++) positions[vi+i]=pos[i];
    if(nor) for(let i=0;i<nor.length;i++) normals[vi+i]=nor[i];
    vi+=pos.length;
    if(g.index&&indices){
      const idx=g.index.array;
      for(let i=0;i<idx.length;i++) indices[ii++]=idx[i]+vtxOffset;
    }
    vtxOffset+=cnt;
  });
  merged.setAttribute("position",new THREE.BufferAttribute(positions,3));
  merged.setAttribute("normal",new THREE.BufferAttribute(normals,3));
  if(indices) merged.setIndex(new THREE.BufferAttribute(indices,1));
  merged.computeVertexNormals();
  return merged;
}