// TRÌNH DỰNG THREE.JS
// Phong cách biển sâu, tối và nhân vật nổi bật.
// Camera: nhìn từ trên xuống bằng phép chiếu orthographic.
// Màu sắc: nước xanh teal, sàn biển tối, sương mờ đậm.
// Đá: khối thấp, ít đa giác, tông xám cát.
// Rong biển: xanh teal đậm, hình hữu cơ.
// Người chơi: cá clownfish hoạt hình màu cam và trắng.
// Ma: bóng cá và mục tiêu truy đuổi nhiều màu.
// ----------------------------------------
const canvas=document.getElementById("c");
const SIDEBAR_W=320;
function getCanvasSize(){
  const area=document.getElementById("game-area");
  if(area){
    const r=area.getBoundingClientRect();
    return{w:Math.max(r.width,200),h:Math.max(r.height,200)};
  }
  const panel=document.getElementById("left-panel");
  const sw=panel?panel.offsetWidth:SIDEBAR_W;
  const w=window.innerWidth-sw;
  const h=window.innerHeight;
  return{w:Math.max(w,200),h:Math.max(h,200)};
}
const renderer=new THREE.WebGLRenderer({canvas,antialias:false}); // tắt antialias để nhẹ hơn
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); // trước là 2, giảm tải GPU
renderer.localClippingEnabled = true;
// Kích thước sẽ được cập nhật trong animate frame đầu tiên.
const {w:W,h:H}=getCanvasSize();
renderer.setSize(W,H,false);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x1a2a30);
scene.fog=new THREE.FogExp2(0x1a2a30,0.00018);




// Camera orthographic nhìn thẳng từ trên, hiện toàn bộ bản đồ.
const BOARD_CX=(COLS*TILE)/2, BOARD_CZ=(NROW*TILE)/2;
const aspect=W/H;
const MAP_W=COLS*TILE, MAP_H=NROW*TILE;
// Fit bản đồ sát khung nhìn, chỉ giữ padding nhỏ để không cắt tường.
// Chọn trục bị giới hạn chặt hơn để toàn bộ bản đồ nằm trong viewport.
// Cách này tránh lộ nền biển thừa hai bên.
const PADDING=20; // lề an toàn nhỏ để tường không bị cắt
let ORTHO_HALF_W, ORTHO_HALF_H;
// Fit theo chiều rộng trước, sau đó kiểm tra chiều cao.
ORTHO_HALF_W = MAP_W/2 + PADDING;
ORTHO_HALF_H = ORTHO_HALF_W / aspect;
// Nếu chiều cao tràn ra ngoài bản đồ thì fit theo chiều cao.
if(ORTHO_HALF_H < MAP_H/2 + PADDING){
  ORTHO_HALF_H = MAP_H/2 + PADDING;
  ORTHO_HALF_W = ORTHO_HALF_H * aspect;
}
// Zoom out bằng cách mở rộng frustum đồng đều.
const SCALE_DOWN = 1.04; // bản đồ gần lấp đầy canvas, chỉ chừa lề nhỏ
ORTHO_HALF_W *= SCALE_DOWN;
ORTHO_HALF_H *= SCALE_DOWN;
const camera=new THREE.OrthographicCamera(
  -ORTHO_HALF_W, ORTHO_HALF_W,
   ORTHO_HALF_H,-ORTHO_HALF_H,
  1, 5000
);
// Nhìn thẳng từ trên, không nghiêng, bản đồ nằm giữa.
camera.position.set(BOARD_CX, 1800, BOARD_CZ);
camera.lookAt(BOARD_CX, 0, BOARD_CZ);
camera.up.set(0,0,-1);

// Ánh sáng
scene.add(new THREE.AmbientLight(0x1a4855,2.2)); // ánh sáng nền xanh biển tối

// Tia sáng từ phía trên, giảm độ sáng và nghiêng về xanh biển sâu.
const sun=new THREE.DirectionalLight(0x8ad4c0,1.5);
sun.position.set(BOARD_CX,600,BOARD_CZ-200);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); // trước là 2048, giảm bộ nhớ texture bóng
sun.shadow.camera.left=-800;sun.shadow.camera.right=800;
sun.shadow.camera.top=800;sun.shadow.camera.bottom=-800;
sun.shadow.camera.near=50;sun.shadow.camera.far=1500;
sun.shadow.bias=-0.001;
scene.add(sun);

// Ánh sáng chéo từ trên trái để làm nổi texture đá.
const diagLight=new THREE.DirectionalLight(0xc8e8f0, 2.8);
diagLight.position.set(BOARD_CX - MAP_W*0.8, 900, BOARD_CZ - MAP_H*0.8);
diagLight.target.position.set(BOARD_CX, 0, BOARD_CZ);
diagLight.castShadow=true;
diagLight.shadow.mapSize.set(2048,2048);
diagLight.shadow.camera.left  = -MAP_W*0.7;
diagLight.shadow.camera.right =  MAP_W*0.7;
diagLight.shadow.camera.top   =  MAP_H*0.7;
diagLight.shadow.camera.bottom= -MAP_H*0.7;
diagLight.shadow.camera.near=50; diagLight.shadow.camera.far=2500;
diagLight.shadow.bias=-0.0008;
scene.add(diagLight);
scene.add(diagLight.target);

// Ánh sáng phụ từ phía camera, tông lạnh nhẹ.
const fill=new THREE.DirectionalLight(0x2a8a9a,0.5);
fill.position.set(-200,150,500);
scene.add(fill);

// Sàn biển
// Mặt sàn xám cát có gợn sóng nhẹ.
const floorGeo=new THREE.PlaneGeometry(COLS*TILE+300,NROW*TILE+300,32,32); // trước là 80x80
const fp=floorGeo.attributes.position;
for(let i=0;i<fp.count;i++) fp.setZ(i,(Math.random()-.5)*6);
floorGeo.computeVertexNormals();
const floorMat=new THREE.MeshStandardMaterial({color:0x1a2a30,roughness:0.97,metalness:0.0});
const floor=new THREE.Mesh(floorGeo,floorMat);
floor.rotation.x=-Math.PI/2;
floor.position.set(BOARD_CX,-2,BOARD_CZ);
floor.receiveShadow=true;
scene.add(floor);

// Mặt nước
const waterSurfGeo=new THREE.PlaneGeometry(COLS*TILE+8000,NROW*TILE+8000); // không cần chia lưới
const waterSurfMat=new THREE.MeshStandardMaterial({
  color:0x7aaab8,transparent:true,opacity:0.05,
  roughness:0.0,metalness:0.9,side:THREE.DoubleSide,
});
const waterSurf=new THREE.Mesh(waterSurfGeo,waterSurfMat);
waterSurf.rotation.x=-Math.PI/2;
waterSurf.position.set(BOARD_CX,280,BOARD_CZ);
scene.add(waterSurf);

const water2Mat=new THREE.MeshStandardMaterial({
  color:0xa0bec8,transparent:true,opacity:0.03,
  roughness:0.0,metalness:1.0,side:THREE.DoubleSide,
});
const water2=new THREE.Mesh(new THREE.PlaneGeometry(COLS*TILE+8000,NROW*TILE+8000),water2Mat);
water2.rotation.x=-Math.PI/2;
water2.position.set(BOARD_CX,260,BOARD_CZ);
scene.add(water2);