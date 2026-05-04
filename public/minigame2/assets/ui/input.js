// Xử lý input.
let tabHidden=false;
const KEY_DIR={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
window.addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="s"){
    e.preventDefault();
    skipToWin();
    return;
  }
  // Màn hình thắng: cho phép bấm phím bất kỳ để tiếp tục/chơi lại.
  if(wonGame && !started && e.key!=="Escape"){
    wonGame=false; initGame(true); init3DGhosts();
    started=true;paused=false;
    accumulatedMs=0;
    frozenTimeMs=-1;
    gameStartTime=performance.now();
    if(elTime) elTime.textContent="00:00";
    hideOv();
    return;
  }
  if(e.key==="Escape"){
    if(waitingForInput)return;
    paused=!paused;
    if(paused){ pauseTimer(); showCard("pause"); }
    else { resumeTimer(); hideOv(); }
    return;
  }
  const d=KEY_DIR[e.key];
  if(d){
    e.preventDefault();
    if(waitingForInput){
      // Tiếp tục sau khi mất mạng: giữ timer chạy, chỉ bù khoảng thời gian tạm dừng.
      waitingForInput=false;paused=false;started=true;
      if(!gameStartTime){ gameStartTime=performance.now(); }
      else { resumeTimer(); }
      hideOv();
      player.nextDir=d;return;
    }
    player.nextDir=d;
    if(!started){
      // Khởi động lại hoàn toàn sau khi game over hoặc thắng.
      if(wonGame){ wonGame=false; initGame(true); init3DGhosts(); }
      started=true;paused=false;
      accumulatedMs=0;
      frozenTimeMs=-1;
      gameStartTime=performance.now();
      if(elTime) elTime.textContent="00:00";
      hideOv();
    }
  }
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)tabHidden=true;});
window.addEventListener("resize",()=>{
  const area=document.getElementById("game-area");
  let rw,rh;
  if(area){const r=area.getBoundingClientRect();rw=Math.max(r.width,200);rh=Math.max(r.height,200);}
  else{const panel=document.getElementById("left-panel");const sw=panel?panel.offsetWidth:SIDEBAR_W;rw=window.innerWidth-sw;rh=window.innerHeight;}
  const a=rw/rh;
  const PAD=20;
  let hw=MAP_W/2+PAD, hh=hw/a;
  if(hh < MAP_H/2+PAD){ hh=MAP_H/2+PAD; hw=hh*a; }
  hw*=SCALE_DOWN; hh*=SCALE_DOWN;
  camera.left=-hw;camera.right=hw;camera.top=hh;camera.bottom=-hh;
  camera.updateProjectionMatrix();
  renderer.setSize(rw,rh,false);
});

