// Đối tượng trong scene.
// fishMesh: Group dùng model clownfish mặc định.
const fishMesh=new THREE.Group();
scene.add(fishMesh);
makeClownfish().children.slice().forEach(c=>fishMesh.add(c));

const ghostFishMeshes=[];
function init3DGhosts(){
  ghostFishMeshes.forEach(g=>{scene.remove(g);});
  ghostFishMeshes.length=0;
  ghosts.forEach(g=>{
    const gm=makeGhostFish(g.name);
    scene.add(gm);
    ghostFishMeshes.push(gm);
  });
}

// Hạt bong bóng.
const bubbleGeo=new THREE.BufferGeometry();
const NUM_BUBBLES=60; // trước là 120, giảm một nửa số hạt
const bPos=new Float32Array(NUM_BUBBLES*3);
const bPhase=new Float32Array(NUM_BUBBLES);
for(let i=0;i<NUM_BUBBLES;i++){
  bPos[i*3]=Math.random()*COLS*TILE;
  bPos[i*3+1]=Math.random()*280;
  bPos[i*3+2]=Math.random()*NROW*TILE;
  bPhase[i]=Math.random()*Math.PI*2;
}
bubbleGeo.setAttribute("position",new THREE.BufferAttribute(bPos,3));
const bubbleMat=new THREE.PointsMaterial({color:0x80f0e0,size:3.5,transparent:true,opacity:0.55,sizeAttenuation:true});
const bubbles=new THREE.Points(bubbleGeo,bubbleMat);

