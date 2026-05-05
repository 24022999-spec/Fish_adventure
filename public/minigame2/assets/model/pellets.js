// Pellet: dÃ¹ng InstancedMesh Ä‘á»ƒ gom thÃ nh Ã­t lá»‡nh váº½.
const pelletMeshes=new Map();
let donutGLBModel = null;
let donutGLBBox = null;

// Sprinkle: CylinderGeometry dáº¡ng thanh nhá» dÃ i, dÃ¹ng nhiá»u mÃ u ná»•i.
const SPRINKLE_COLORS=[0xffdd00,0xff4444,0x44ccff,0xffffff,0xff88cc];
const SPRINKLE_MATS=SPRINKLE_COLORS.map(c=>new THREE.MeshBasicMaterial({color:c}));
// Thanh sprinkle giá»¯ bá» dÃ y nhá» vÃ  Ä‘á»™ dÃ i vá»«a pháº£i Ä‘á»ƒ nhÃ¬n nháº¹ hÆ¡n.
const SPRINKLE_GEO=new THREE.CylinderGeometry(1.5,1.5,12,6); // thanh ngáº¯n

// Pellet sá»©c máº¡nh: 1/4 torus náº±m pháº³ng, má»—i vá»‹ trÃ­ dÃ¹ng má»™t gÃ³c xoay.
// Äáº¿m dot vÃ  power pellet trÆ°á»›c.
let totalDots=0, totalPowers=0;
for(let r=0;r<NROW;r++) for(let c=0;c<COLS;c++){if(ROWS[r][c]===".")totalDots++;else if(ROWS[r][c]==="o")totalPowers++;}

// Má»—i mÃ u sprinkle dÃ¹ng má»™t InstancedMesh.
const dotInstancedArr=SPRINKLE_MATS.map(m=>new THREE.InstancedMesh(SPRINKLE_GEO,m,Math.ceil(totalDots/SPRINKLE_COLORS.length)+10));
dotInstancedArr.forEach(m=>{m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.renderOrder=1;scene.add(m);});

// Pellet sá»©c máº¡nh: 4 máº£nh torus tÃ¡ch nhau, cÃ³ khe rÃµ á»Ÿ giá»¯a.
const donutGroups=new Map();

// Donut Ã­t Ä‘a giÃ¡c: tÃ´ pháº³ng vÃ  dÃ¹ng mÃ u Ä‘á»‰nh theo cÃ¡c tÃ´ng nÃ¢u chocolate.
const DONUT_BROWNS=[
  new THREE.Color(0x5c3317), // nÃ¢u Ä‘áº­m
  new THREE.Color(0x7b4a22), // nÃ¢u trung
  new THREE.Color(0x8b5a2b), // nÃ¢u caramel
  new THREE.Color(0x9b6a35), // nÃ¢u sÃ¡ng
  new THREE.Color(0x6b3d1e), // nÃ¢u Ä‘á»
  new THREE.Color(0x4a2810), // nÃ¢u ráº¥t Ä‘áº­m
  new THREE.Color(0xa07040), // nÃ¢u vÃ ng
];

function makeDonutSegment(startAngle){
  const R = TILE * 0.62;
  const r = TILE * 0.17;
  const GAP = 0.28;
  const ARC = Math.PI/2 - GAP;
  // Low-poly: dÃ¹ng ráº¥t Ã­t segment.
  const arcSegs = 5, tubeSegs = 5;

  const midAngle = startAngle + Math.PI/4;
  const pts = [];
  for(let i = 0; i <= arcSegs; i++){
    const a = startAngle + GAP/2 + (i/arcSegs) * ARC;
    pts.push(new THREE.Vector3(Math.cos(a)*R, 0, Math.sin(a)*R));
  }
  const arc = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(arc, arcSegs, r, tubeSegs, false);

  // TÃ´ pháº³ng: má»—i máº·t dÃ¹ng má»™t mÃ u nÃ¢u khÃ¡c nhau qua mÃ u Ä‘á»‰nh.
  // Chuyá»ƒn sang dáº¡ng khÃ´ng dÃ¹ng chá»‰ sá»‘ Ä‘á»ƒ má»—i tam giÃ¡c Ä‘á»™c láº­p.
  const nonIdx = geo.toNonIndexed();
  nonIdx.computeVertexNormals();

  const count = nonIdx.attributes.position.count;
  const colors = new Float32Array(count * 3);
  // Má»—i tam giÃ¡c gá»“m 3 vertex liÃªn tiáº¿p, gÃ¡n cÃ¹ng mÃ u cho cáº£ 3.
  for(let i = 0; i < count; i += 3){
    const col = DONUT_BROWNS[Math.floor(i/3) % DONUT_BROWNS.length];
    colors[i*3]   = col.r; colors[i*3+1]   = col.g; colors[i*3+2]   = col.b;
    colors[i*3+3] = col.r; colors[i*3+4]   = col.g; colors[i*3+5]   = col.b;
    colors[i*3+6] = col.r; colors[i*3+7]   = col.g; colors[i*3+8]   = col.b;
  }
  nonIdx.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // ÄÆ°a vá» tÃ¢m tile.
  const midX = Math.cos(midAngle) * R;
  const midZ = Math.sin(midAngle) * R;
  nonIdx.translate(-midX, 0, -midZ);

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.6,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(nonIdx, mat);
  mesh.castShadow = true;
  return mesh;
}

// Má»—i piece chá»‰ hiá»‡n má»™t máº£nh (pieceIdx 0-3), khe rÃµ rÃ ng.
function buildDonutMesh(cx, cz, key, pieceIdx){
  const pivot = new THREE.Group();
  if(donutGLBModel && donutGLBBox){
    const model = donutGLBModel.clone(true);
    model.traverse(m => { if(m.isMesh){ m.castShadow = true; m.receiveShadow = true; }});

    const size = new THREE.Vector3();
    donutGLBBox.getSize(size);
    const maxSize = Math.max(size.x, size.y, size.z);
    const targetDiameter = TILE * 0.75;
    const scale = targetDiameter / maxSize;

    const box = new THREE.Box3().setFromObject(model);
    const ctr = new THREE.Vector3();
    box.getCenter(ctr);

    model.scale.setScalar(scale);
    model.position.set(-ctr.x * scale, -ctr.y * scale, -ctr.z * scale);
    pivot.add(model);
  } else {
    pivot.add(makeDonutSegment(pieceIdx * Math.PI/2));
  }
  pivot.rotation.set(Math.PI, 0, Math.PI);
  // CÄƒn Ä‘Ãºng tÃ¢m tile, y=6 giá»‘ng sprinkle.
  pivot.position.set(cx, 6, cz);
  pivot.renderOrder = 1;
  scene.add(pivot);
  donutGroups.set(key, {group:pivot, baseX:cx, baseZ:cz});
}

// Theo dÃµi sá»‘ lÆ°á»£ng theo tá»«ng mÃ u.
let donutPieceCounter=0;
function buildPellets3D(){
  pelletMeshes.clear();
  donutPieceCounter=0;
  // XÃ³a cÃ¡c group donut cÅ©.
  donutGroups.forEach(({group})=>scene.remove(group));
  donutGroups.clear();

  const dummy=new THREE.Object3D();
  const colorCounters=new Array(SPRINKLE_COLORS.length).fill(0);
  let dotIdx=0;
  for(let row=0;row<NROW;row++){
    for(let col=0;col<COLS;col++){
      const ch=ROWS[row][col];
      if(ch==="."){
        const ci=dotIdx%SPRINKLE_COLORS.length;
        dotIdx++;
        const instIdx=colorCounters[ci]++;
        dummy.position.set(col*TILE+TILE/2,6,row*TILE+TILE/2);
        const seed=col*2654435761^row*2246822519;
        const rng=(s)=>{let x=s^(s>>>16);x=Math.imul(x,0x45d9f3b);x^=x>>>16;return(x>>>0)/0xffffffff;};
        dummy.rotation.set(rng(seed)*Math.PI*2, rng(seed^0xdeadbeef)*Math.PI*2, rng(seed^0xcafebabe)*Math.PI*2);
        dummy.updateMatrix();
        dotInstancedArr[ci].setMatrixAt(instIdx,dummy.matrix);
        pelletMeshes.set(`${col},${row}`,{mesh:dotInstancedArr[ci],idx:instIdx,isPower:false});
      } else if(ch==="o"){
        const cx=col*TILE+TILE/2, cz=row*TILE+TILE/2;
        const key=`${col},${row}`;
        const pieceIdx=donutPieceCounter%4; donutPieceCounter++;
        buildDonutMesh(cx,cz,key,pieceIdx);
        pelletMeshes.set(key,{isPower:true,baseX:cx,baseZ:cz,key});
      }
    }
  }
  dotInstancedArr.forEach((m,i)=>{m.instanceMatrix.needsUpdate=true;m.count=colorCounters[i];});
}
buildPellets3D();

// Táº£i trÆ°á»›c Donut.glb, dá»±ng láº¡i pellet trÃªn báº£n Ä‘á»“ vÃ  khá»Ÿi táº¡o renderer cho panel.
(function(){
  const DONUT_PATH = 'glb_model_file/Donut.glb';
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load(DONUT_PATH, function(gltf){
    const model = gltf.scene;
    model.traverse(m => { if(m.isMesh){ m.castShadow = true; m.receiveShadow = true; }});

    const box = new THREE.Box3().setFromObject(model);
    donutGLBModel = model;
    donutGLBBox   = box;

    // Dá»±ng láº¡i pellet khi GLB Ä‘Ã£ sáºµn sÃ ng.
    buildPellets3D();

    // Khá»Ÿi táº¡o 4 renderer nhá» trong panel.
    initDonutPanelRenderers(model, box);
  }, undefined, function(err){
    console.warn('Donut.glb load failed, using fallback segments:', err);
  });

  function initDonutPanelRenderers(sourceModel, bbox){
    const canvases = document.querySelectorAll('.donut-panel-canvas');
    if(!canvases.length) return;

    const W = 80, H = 80;
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const scale = 3.2 / maxDim;

    function makeScene(){
      const sc = new THREE.Scene();
      sc.add(new THREE.AmbientLight(0xfff5e0, 1.3));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 6, 5); sc.add(key);
      const fill = new THREE.DirectionalLight(0xffcc88, 0.5);
      fill.position.set(-4, 2, -3); sc.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 0.25);
      rim.position.set(0, -3, -4); sc.add(rim);
      return sc;
    }

    canvases.forEach((cvs, i) => {
      const ren = new THREE.WebGLRenderer({ canvas: cvs, alpha: true, antialias: true });
      ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      ren.setSize(W, H, true);
      ren.setClearColor(0x000000, 0);
      ren.toneMapping = THREE.ACESFilmicToneMapping;
      ren.toneMappingExposure = 1.1;

      const sc = makeScene();
      const cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
      cam.position.set(0, 2.8, 5.5);
      cam.lookAt(0, 0, 0);

      const clone = sourceModel.clone(true);
      clone.scale.setScalar(scale);
      clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      const pivot = new THREE.Group();
      pivot.add(clone);
      sc.add(pivot);

      const phase = i * (Math.PI / 2);
      (function loop(ts){
        requestAnimationFrame(loop);
        const t = ts * 0.001;
        pivot.rotation.y = t * 0.7 + phase;
        pivot.rotation.x = Math.sin(t * 0.4 + phase) * 0.12;
        ren.render(sc, cam);
      })(0);
    });
  }
})();
const _hiddenM=new THREE.Matrix4().makeTranslation(0,-9999,0);
function removePellet3D(col,row){
  const k=`${col},${row}`;
  const p=pelletMeshes.get(k);
  if(p){
    if(p.isPower){
      // áº¨n group donut GLB.
      const dg=donutGroups.get(k);
      if(dg) dg.group.visible=false;
    } else if(p.mesh){
      p.mesh.setMatrixAt(p.idx,_hiddenM);
      p.mesh.instanceMatrix.needsUpdate=true;
    }
    pelletMeshes.delete(k);
  }
}
