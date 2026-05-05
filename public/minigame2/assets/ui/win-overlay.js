(function initWinGiftOverlay(){
  const cvs = document.getElementById('win-donut-canvas');
  const fallback = document.querySelector('.win-donut-fallback');
  if(!cvs) return;

  const W = 240, H = 240;
  const ren = new THREE.WebGLRenderer({ canvas: cvs, alpha: true, antialias: true });
  ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ren.setSize(W, H, true);
  ren.setClearColor(0x000000, 0);
  ren.shadowMap.enabled = true;
  ren.shadowMap.type = THREE.PCFSoftShadowMap;
  ren.toneMapping = THREE.ACESFilmicToneMapping;
  ren.toneMappingExposure = 1.15;

  const sc = new THREE.Scene();

  // Camera perspective nhìn từ trước, hơi cao và lệch bên.
  const cam = new THREE.PerspectiveCamera(48, W / H, 0.1, 200);
  cam.position.set(5.5, 5.5, 8.5);
  cam.lookAt(0, 0, 0); // cập nhật lại lookAt sau khi mô hình tải xong

  // Ánh sáng ấm, có sắc tím nhẹ như video mẫu.
  sc.add(new THREE.AmbientLight(0xffeedd, 1.1));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(4, 8, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.bias = -0.001;
  sc.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xaa88ff, 0.45);
  fillLight.position.set(-5, 3, -3);
  sc.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, -3, -5);
  sc.add(rimLight);

  // Nhóm xoay: Present.glb được tải vào đây, tự căn giữa rồi tạo chuyển động.
  const giftGroup = new THREE.Group();
  sc.add(giftGroup);

  let modelBaseY = 0;

  const loader = new THREE.GLTFLoader();
  loader.load(
    'glb_model_file/Present.glb',
    function(gltf) {
      const model = gltf.scene;
      model.traverse(m => {
        if(!m.isMesh) return;
        m.castShadow = true;
        m.receiveShadow = true;
      });

      // Tự động scale model vừa khung khoảng 2 đơn vị.
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 7 / maxDim;

      model.scale.setScalar(scale);
      // Đưa mô hình về gốc của giftGroup để xoay quanh tâm hình.
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      giftGroup.add(model);

      // Sau khi thêm vào nhóm, tính lại tâm khung bao đã scale.
      // Camera sẽ lookAt vào tâm hiển thị thật của model.
      const scaledBox = new THREE.Box3().setFromObject(giftGroup);
      const scaledCenter = new THREE.Vector3();
      scaledBox.getCenter(scaledCenter);
      // Dịch nhóm để tâm hình nằm đúng tại gốc tọa độ thế giới.
      const upOffset = 1.5; // đẩy model lên trên
      giftGroup.position.set(-scaledCenter.x, -scaledCenter.y + upOffset, -scaledCenter.z);
      modelBaseY = -scaledCenter.y + upOffset;
      cam.lookAt(0, 0, 0);

      if(fallback) fallback.style.opacity = '0';
    },
    undefined,
    function(err) {
      console.warn('Present.glb load failed:', err);
      if(fallback) fallback.style.opacity = '1';
    }
  );

  // Vòng lặp animate: xoay và bob lên/xuống.
  let startT = null;
  function render(ts) {
    requestAnimationFrame(render);
    if(!startT) startT = ts;
    const t = (ts - startT) * 0.001;

    // Xoay chậm liên tục theo trục Y.
    giftGroup.rotation.y = t * 0.55;

    // Nhún lên/xuống mượt.
    giftGroup.position.y = modelBaseY + Math.sin(t * 1.1) * 0.12;

    // Lắc nhẹ theo trục X.
    giftGroup.rotation.x = Math.sin(t * 0.7) * 0.06;

    ren.render(sc, cam);
  }
  requestAnimationFrame(render);
})();
