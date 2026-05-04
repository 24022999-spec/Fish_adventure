// Pac-Man thành cá clownfish.
// Camera nhìn từ trên theo trục Y. Đầu cá hướng về local +X.
// X: đầu (+) đến đuôi (-). Z: bề ngang trái/phải. Y: mỏng để tạo chiều sâu ánh sáng.
function makeClownfish(){
  const g=new THREE.Group();
  const R=TILE*.46;

  // Thân chính bất đối xứng: bụng dày, đầu và đuôi thuôn.
  // Chồng 3 ellipsoid để giả lập dáng cá:
  //   nửa trước (đầu): nhỏ hơn, dịch về +X
  //   bụng giữa: lớn nhất
  //   phần sau (gốc đuôi): thuôn về -X
  const bodyMat =new THREE.MeshStandardMaterial({color:0xff4500,roughness:0.4,metalness:0.05,side:THREE.FrontSide,emissive:0xff3300,emissiveIntensity:0.3});
  const bellyMat=new THREE.MeshStandardMaterial({color:0xff5500,roughness:0.35,metalness:0.08,emissive:0xff4400,emissiveIntensity:0.25});

  // Bụng trên: màu cam/cá hồi, nhìn thấy từ phía trên.
  const belly=new THREE.Mesh(new THREE.SphereGeometry(R,12,8),bellyMat); // trước là 20,14
  belly.scale.set(1.3, 0.18, 0.88);
  g.add(belly);

  const under=new THREE.Mesh(new THREE.SphereGeometry(R,12,8),bodyMat); // trước là 20,14
  under.scale.set(1.25,0.15,0.82);
  under.position.y=-2;
  g.add(under);

  // Đầu nhọn, hướng về +X.
  const headMat=new THREE.MeshStandardMaterial({color:0xff5500,roughness:0.4,emissive:0xff3300,emissiveIntensity:0.2});
  const headCap=new THREE.Mesh(new THREE.SphereGeometry(R*.48,14,10),headMat);
  headCap.scale.set(0.85,0.18,0.72);
  headCap.position.set(R*1.0,0,0);
  g.add(headCap);

  // Vây đuôi: dạng rẽ quạt ở phía -X.
  const finMat=new THREE.MeshStandardMaterial({color:0xcc3300,roughness:0.55,side:THREE.DoubleSide,emissive:0xaa2200,emissiveIntensity:0.2});
  [-1,1].forEach(s=>{
    const lobe=new THREE.Mesh(new THREE.ConeGeometry(R*.4,R*.72,4),finMat);
    lobe.rotation.z= Math.PI/2;          // mũi hướng về -X
    lobe.rotation.y= s*Math.PI/7;        // xòe hai nhánh đuôi
    lobe.position.set(-R*1.45,0,s*R*.3);
    g.add(lobe);
  });

  // Vây lưng: gần giữa thân.
  const dorsal=new THREE.Mesh(new THREE.ConeGeometry(R*.18,R*.3,4),finMat);
  dorsal.position.set(-R*.05, R*.22, 0);
  g.add(dorsal);

  // Vây ngực theo trục Z.
  [-1,1].forEach(s=>{
    const pec=new THREE.Mesh(new THREE.ConeGeometry(R*.24,R*.48,4),finMat);
    pec.rotation.z=-Math.PI/3;
    pec.rotation.y= s*Math.PI/2.2;
    pec.position.set(R*.05,0,s*R*.88);
    g.add(pec);
  });

  // Mắt: lệch về phía đầu, nhìn được từ trên.
  const eyeW=new THREE.Mesh(new THREE.SphereGeometry(5.5,10,10),
    new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:0.3}));
  eyeW.position.set(R*.82,R*.22,R*.32);
  g.add(eyeW);
  const pup=new THREE.Mesh(new THREE.SphereGeometry(3.2,10,10),
    new THREE.MeshStandardMaterial({color:0x111111}));
  pup.position.set(R*.88,R*.24,R*.37);
  g.add(pup);

  g.traverse(m=>{if(m.isMesh){m.castShadow=false;m.receiveShadow=false;}}); // cá player không đổ bóng
  return g;
}

// Ma thành cá mập.
const GHOST_SHARK_COLORS={
  blinky:{body:0xcc2222,belly:0xff6666,fin:0x991111},
  pinky: {body:0x22aa44,belly:0x55dd77,fin:0x117733},
  inky:  {body:0x0088bb,belly:0x44ccee,fin:0x005577},
  clyde: {body:0x7722cc,belly:0xaa55ff,fin:0x551199},
};
function makeGhostFish(name){
  const g=new THREE.Group();
  const R=TILE*.42; // lớn hơn một chút để cá mập có cảm giác uy hiếp
  const cols=GHOST_SHARK_COLORS[name]||{body:0x4488bb,belly:0x88ccee,fin:0x225577};

  const bodyMat=new THREE.MeshStandardMaterial({
    color:cols.body,roughness:0.5,metalness:0.1,
    emissive:cols.body,emissiveIntensity:0.12,side:THREE.FrontSide
  });
  const bellyMat=new THREE.MeshStandardMaterial({
    color:cols.belly,roughness:0.45,metalness:0.05
  });
  const finMat=new THREE.MeshStandardMaterial({
    color:cols.fin,roughness:0.55,side:THREE.DoubleSide
  });

  // Thân chính: dạng thoi dài khi nhìn từ trên.
  // Trục dài là X (đầu +X, đuôi -X), mỏng theo Y, rộng theo Z.
  const torso=new THREE.Mesh(new THREE.SphereGeometry(R,12,8),bodyMat);
  torso.scale.set(1.75, 0.16, 0.72); // rất dài và đẹp khi nhìn từ trên
  g.add(torso);

  // Sọc bụng sáng màu hơn, nhỏ hơn và cùng dáng với thân.
  const belly=new THREE.Mesh(new THREE.SphereGeometry(R*.9,10,7),bellyMat);
  belly.scale.set(1.55,0.10,0.5);
  belly.position.set(R*.05,-1,0);
  g.add(belly);

  // Mũi nhọn: cone vươn về phía trước (+X).
  const snout=new THREE.Mesh(new THREE.ConeGeometry(R*.28,R*.7,6),bodyMat);
  snout.rotation.z=-Math.PI/2; // mũi hướng về +X
  snout.position.set(R*1.55,0,0);
  g.add(snout);

  // Vây lưng: tam giác cao ở nửa sau thân.
  // Nhìn từ trên sẽ thành hình thoi/mũi dao mỏng.
  const dorsalGeo=new THREE.ConeGeometry(R*.14,R*.85,4);
  const dorsal=new THREE.Mesh(dorsalGeo,finMat);
  dorsal.position.set(-R*.15, R*.18, 0);
  dorsal.rotation.z=0; // đứng thẳng, nhìn từ trên thành mũi hẹp
  dorsal.scale.set(1,1,0.4); // làm mỏng theo chiều ngang
  g.add(dorsal);

  // Vây ngực: hai cánh rộng quét về sau theo trục Z.
  [-1,1].forEach(s=>{
    const pec=new THREE.Mesh(new THREE.ConeGeometry(R*.22,R*.9,4),finMat);
    pec.rotation.z= Math.PI/2 * 0.15;      // nghiêng xuống nhẹ
    pec.rotation.y= s * (Math.PI/2 + 0.35); // quét về sau
    pec.position.set(R*.2, -1, s*R*.82);
    pec.scale.set(1,0.3,1);
    g.add(pec);
  });

  // Vây đuôi: hình lưỡi liềm bất đối xứng, đầu ở -X.
  // Cánh trên dài hơn.
  const upperLobe=new THREE.Mesh(new THREE.ConeGeometry(R*.22,R*.88,4),finMat);
  upperLobe.rotation.z= Math.PI/2;
  upperLobe.rotation.y=-0.22;
  upperLobe.position.set(-R*1.72, 2, -R*.18);
  g.add(upperLobe);
  // Cánh dưới ngắn hơn.
  const lowerLobe=new THREE.Mesh(new THREE.ConeGeometry(R*.17,R*.62,4),finMat);
  lowerLobe.rotation.z= Math.PI/2;
  lowerLobe.rotation.y= 0.28;
  lowerLobe.position.set(-R*1.62,-2, R*.15);
  g.add(lowerLobe);

  // Mắt: nhỏ, sát phần mũi.
  const eyeW=new THREE.Mesh(new THREE.SphereGeometry(4,6,6),
    new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:0.5}));
  eyeW.position.set(R*1.1, R*.14, R*.3);
  g.add(eyeW);
  const pup=new THREE.Mesh(new THREE.SphereGeometry(2.5,6,6),
    new THREE.MeshStandardMaterial({color:0x050505}));
  pup.position.set(R*1.15, R*.16, R*.34);
  g.add(pup);

  g.traverse(m=>{if(m.isMesh)m.castShadow=false;});
  g.userData={
    name,
    bMat:bodyMat,
    origColor:new THREE.Color(cols.body),
    // Tất cả material không phải mắt sẽ đổi màu khi bị sợ hãi.
    bodyMats:[bodyMat,bellyMat,finMat],
    origColors:[new THREE.Color(cols.body),new THREE.Color(cols.belly),new THREE.Color(cols.fin)],
  };
  return g;
}

