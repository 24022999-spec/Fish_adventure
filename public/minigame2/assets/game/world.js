// Tường đá: gộp thành một lệnh vẽ.
// Tạo texture đá bằng canvas: nhiều lớp noise, vết nứt tối và biến thiên màu.
(function(){
  // Texture đá tạo bằng canvas.
  const SZ=256;
  const tc=document.createElement("canvas");
  tc.width=tc.height=SZ;
  const tx=tc.getContext("2d");

  // Lớp nền: xám sáng nổi bật, gradient từ tâm ra ngoài.
  const grad=tx.createRadialGradient(SZ/2,SZ/2,SZ*.05,SZ/2,SZ/2,SZ*.82);
  grad.addColorStop(0,"#d8e0e4");
  grad.addColorStop(0.4,"#b8c4ca");
  grad.addColorStop(0.75,"#96a4aa");
  grad.addColorStop(1,"#6e7e86");
  tx.fillStyle=grad;
  tx.fillRect(0,0,SZ,SZ);

  // Lớp 1: hạt đá lớn, các mảng bất thường.
  for(let i=0;i<120;i++){
    const px=Math.random()*SZ, py=Math.random()*SZ;
    const rw=4+Math.random()*14, rh=3+Math.random()*9;
    const bright=Math.random();
    tx.save();
    tx.translate(px,py);
    tx.rotate(Math.random()*Math.PI);
    tx.scale(1, rh/rw);
    tx.beginPath();
    tx.arc(0,0,rw/2,0,Math.PI*2);
    if(bright>0.55){
      tx.fillStyle=`rgba(180,192,196,${(bright-0.55)*0.35})`;
    } else {
      tx.fillStyle=`rgba(35,45,50,${(0.55-bright)*0.45})`;
    }
    tx.fill();
    tx.restore();
  }

  // Lớp 2: noise mịn, tạo lỗ nhỏ và chi tiết bề mặt.
  for(let i=0;i<5000;i++){
    const px=Math.random()*SZ, py=Math.random()*SZ;
    const r=0.4+Math.random()*1.8;
    const v=Math.random();
    if(v>0.65){
      tx.fillStyle=`rgba(210,218,222,${(v-0.65)*0.6})`;
    } else if(v<0.28){
      tx.fillStyle=`rgba(20,30,35,${(0.28-v)*0.75})`;
    } else continue;
    tx.beginPath();tx.arc(px,py,r,0,Math.PI*2);tx.fill();
  }

  // Lớp 3: vết nứt chính, dày và gắt, có viền sáng.
  for(let c=0;c<12;c++){
    let cx2=Math.random()*SZ, cy2=Math.random()*SZ;
    const steps=4+Math.floor(Math.random()*5);
    // Lõi tối.
    tx.strokeStyle=`rgba(18,24,28,${0.6+Math.random()*0.3})`;
    tx.lineWidth=1.2+Math.random()*2.0;
    tx.lineCap="round";
    tx.beginPath();tx.moveTo(cx2,cy2);
    for(let s=0;s<steps;s++){
      cx2+=(Math.random()-.5)*40; cy2+=(Math.random()-.46)*32;
      tx.lineTo(cx2,cy2);
    }
    tx.stroke();
    // Viền sáng dọc vết nứt.
    tx.strokeStyle=`rgba(160,172,178,0.25)`;
    tx.lineWidth=0.6;
    tx.stroke();
  }

  // Lớp 4: vết nứt phụ rất mảnh.
  for(let c=0;c<22;c++){
    let cx2=Math.random()*SZ, cy2=Math.random()*SZ;
    tx.strokeStyle=`rgba(28,36,40,${0.3+Math.random()*0.25})`;
    tx.lineWidth=0.4+Math.random()*0.7;
    tx.beginPath();tx.moveTo(cx2,cy2);
    const steps=2+Math.floor(Math.random()*3);
    for(let s=0;s<steps;s++){
      cx2+=(Math.random()-.5)*28; cy2+=(Math.random()-.5)*22;
      tx.lineTo(cx2,cy2);
    }
    tx.stroke();
  }

  // Lớp 5: đốm khoáng nhỏ sáng như thạch anh/mica.
  for(let i=0;i<60;i++){
    const px=Math.random()*SZ, py=Math.random()*SZ;
    const r=0.5+Math.random()*1.5;
    tx.fillStyle=`rgba(240,248,252,${0.4+Math.random()*0.5})`;
    tx.beginPath();tx.arc(px,py,r,0,Math.PI*2);tx.fill();
  }

  // Lớp 6: làm tối cạnh để giả lập độ sâu trên mặt khối.
  const vg=tx.createRadialGradient(SZ/2,SZ/2,SZ*.3,SZ/2,SZ/2,SZ*.75);
  vg.addColorStop(0,"rgba(0,0,0,0)");
  vg.addColorStop(1,"rgba(0,0,0,0.38)");
  tx.fillStyle=vg;
  tx.fillRect(0,0,SZ,SZ);

  const rockTex=new THREE.CanvasTexture(tc);
  rockTex.wrapS=rockTex.wrapT=THREE.RepeatWrapping;
  rockTex.repeat.set(1.4,1.4);

  // Bản đồ độ nhám: thay đổi độ nhám từng pixel cho mảng ướt/khô.
  const rc=document.createElement("canvas");
  rc.width=rc.height=128;
  const rx=rc.getContext("2d");
  rx.fillStyle="#aaaaaa";rx.fillRect(0,0,128,128);
  // Các mảng biến thiên lớn.
  for(let i=0;i<40;i++){
    const px=Math.random()*128, py=Math.random()*128, pr=6+Math.random()*18;
    const v=Math.floor(60+Math.random()*140);
    const rg=rx.createRadialGradient(px,py,0,px,py,pr);
    rg.addColorStop(0,`rgb(${v},${v},${v})`);
    rg.addColorStop(1,"rgba(128,128,128,0)");
    rx.fillStyle=rg;
    rx.beginPath();rx.arc(px,py,pr,0,Math.PI*2);rx.fill();
  }
  // Noise mịn phủ lên trên.
  for(let i=0;i<1800;i++){
    const v=Math.floor(80+Math.random()*140);
    rx.fillStyle=`rgb(${v},${v},${v})`;
    rx.fillRect(Math.random()*128,Math.random()*128,1+Math.random()*2,1+Math.random()*2);
  }
  const roughTex=new THREE.CanvasTexture(rc);
  roughTex.wrapS=roughTex.wrapT=THREE.RepeatWrapping;
  roughTex.repeat.set(1.4,1.4);

  const rockMat=new THREE.MeshStandardMaterial({
    map:rockTex,
    roughnessMap:roughTex,
    roughness:0.92,
    metalness:0.0,
    color:0xffffff,
  });
  const mergedGeos=[];
  const dummy=new THREE.Object3D();

  for(let row=0;row<NROW;row++){
    for(let col=0;col<COLS;col++){
      if(ROWS[row][col]!=="#")continue;
      const cx=col*TILE+TILE/2, cz=row*TILE+TILE/2;
      const h=TILE*(0.55+Math.random()*0.35);
      const w=TILE*(0.75+Math.random()*0.3);
      const d=TILE*(0.75+Math.random()*0.3);
      // Khối chính.
      const g1=new THREE.BoxGeometry(w,h,d);
      dummy.position.set(cx,16,cz);
      dummy.rotation.y=Math.floor(Math.random()*4)*Math.PI/2;
      dummy.updateMatrix();
      g1.applyMatrix4(dummy.matrix);
      mergedGeos.push(g1);
      // Thỉnh thoảng thêm lớp thứ hai (20%).
      if(Math.random()>.8){
        const h2=h*.4, w2=w*.55;
        const g2=new THREE.BoxGeometry(w2,h2,d*.7);
        dummy.position.set(cx+(Math.random()-.5)*w*.3, 16+h/2+h2/2, cz+(Math.random()-.5)*d*.3);
        dummy.rotation.y=0; dummy.updateMatrix();
        g2.applyMatrix4(dummy.matrix);
        mergedGeos.push(g2);
      }
    }
  }
  // Gộp tất cả thành một geometry: toàn bộ tường chỉ tốn 1 lệnh vẽ.
  const merged=mergeGeos(mergedGeos);
  if(merged){
    const rockMesh=new THREE.Mesh(merged,rockMat);
    rockMesh.castShadow=true;
    rockMesh.receiveShadow=true;
    rockMesh.renderOrder=1;
    scene.add(rockMesh);
  } else {
    mergedGeos.forEach(g=>{
      const m=new THREE.Mesh(g,rockMat);
      m.renderOrder=1;
      scene.add(m);
    });
  }
  mergedGeos.forEach(g=>g.dispose());
})();

// Rong biển: gộp thành một lệnh vẽ, không đổ bóng.
const kelpGeosMerged=[];
const kelpDummy=new THREE.Object3D();
(function(){
  for(let i=0;i<10;i++){
    const col=Math.floor(Math.random()*COLS);
    const row=Math.floor(Math.random()*NROW);
    const ch=ROWS[row][col];
    if(ch!==" "&&ch!=="."&&ch!=="o")continue;
    const bx=col*TILE+TILE/2+(Math.random()-.5)*16;
    const bz=row*TILE+TILE/2+(Math.random()-.5)*16;
    const segs=1+Math.floor(Math.random()*2);
    const totalH=28+Math.random()*24;
    const segH=totalH/segs;
    let prevX=0,prevZ=0;
    for(let s=0;s<segs;s++){
      const geo=new THREE.CylinderGeometry(0.8,1.5,segH,4);
      const ox=(Math.random()-.5)*6, oz=(Math.random()-.5)*5;
      kelpDummy.position.set(bx+prevX+ox,-24+s*segH+segH/2,bz+prevZ+oz);
      kelpDummy.rotation.set((Math.random()-.5)*.3,0,(Math.random()-.5)*.3);
      kelpDummy.updateMatrix();
      geo.applyMatrix4(kelpDummy.matrix);
      kelpGeosMerged.push(geo);
      prevX+=ox; prevZ+=oz;
    }
  }
})();
const kelpMat=new THREE.MeshStandardMaterial({color:0x12382b,roughness:0.92,side:THREE.FrontSide});
if(kelpGeosMerged.length){
  const kelpMerged=mergeGeos(kelpGeosMerged);
  if(kelpMerged){
    scene.add(new THREE.Mesh(kelpMerged,kelpMat));
    kelpGeosMerged.forEach(g=>g.dispose());
  }
}
// Dao động nhẹ: xoay mesh rong biển duy nhất mỗi frame.