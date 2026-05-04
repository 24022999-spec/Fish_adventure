function initGame(full=true){
  map=buildMap();pellets=countDots();frightenedUntil=0;
  modeIdx=0;modeTick=0;
  donutsLeft=4; donutsEaten=0;
  sprinklesTotal=countSprinkles();
  sprinklesEaten=0;
  if(full){score=0;lives=3;level=1;}
  resetEntities();
  buildPellets3D();
  init3DGhosts();
  updateHUD();
}

function canMove(dk){const d=DIRS[dk];return isWalkable(player.tile.x+d.x,player.tile.y+d.y,false);}
function updatePlayer(dt){
  if(atCentre(player)&&player.nextDir&&player.nextDir!==player.dir&&canMove(player.nextDir)){snapToTile(player);player.dir=player.nextDir;}
  if(!player.dir){if(atCentre(player)&&player.nextDir&&canMove(player.nextDir)){snapToTile(player);player.dir=player.nextDir;}else{syncTile(player);return;}}
  const d=DIRS[player.dir],c=tileToWorld(player.tile.x,player.tile.y);
  if(canMove(player.dir)){player.x+=d.x*player.speed*dt;player.y+=d.y*player.speed*dt;player.mouth+=dt*10;}
  else{
    if(d.x!==0){const nx=player.x+d.x*player.speed*dt,cr=d.x>0?nx>=c.x:nx<=c.x;player.x=cr?c.x:nx;if(cr)player.y=c.y;}
    else{const ny=player.y+d.y*player.speed*dt,cr=d.y>0?ny>=c.y:ny<=c.y;player.y=cr?c.y:ny;if(cr)player.x=c.x;}
    player.mouth+=dt*10;
    if(atCentre(player)){snapToTile(player);player.dir="";}
  }
  wrapX(player);syncTile(player);eatTile();
}

function eatTile(){
  const x=player.tile.x,y=player.tile.y;
  if(y<0||y>=NROW||x<0||x>=COLS)return;
  const t=map[y][x];
  if(t==="."){map[y][x]=" ";pellets--;sprinklesEaten++;removePellet3D(x,y);}
  else if(t==="o"){map[y][x]=" ";pellets--;donutsLeft=Math.max(0,donutsLeft-1);donutsEaten=Math.min(4,donutsEaten+1);frightenedUntil=performance.now()+POWER_MS;removePellet3D(x,y);}
  if(t==="."||t==="o"){updateHUD();if(pellets===0){started=false;paused=true;wonGame=true;}}
}

function updateGhosts(dt,now){
  // Cập nhật lịch chế độ.
  if(now>=frightenedUntil){
    const [,dur]=MODE_SCHEDULE[Math.min(modeIdx,MODE_SCHEDULE.length-1)];
    modeTick+=dt*1000;
    if(modeTick>=dur&&modeIdx<MODE_SCHEDULE.length-1){
      modeIdx++;modeTick=0;
      // Khi đổi chế độ: bắt quay đầu và xóa cache distMap để ma tính lại đường.
      ghosts.forEach(g=>{
        if(g.released&&!inGhostHouse(g.tile.x,g.tile.y)){
          g.dir=OPPOSITE[g.dir]||g.dir;
          g.nextDir=g.dir;
        }
        g._distMap=null; g._lastTargetKey=-1;
      });
    }
  }
  ghosts.forEach((g,i)=>{
    const el=gameStartTime?now-gameStartTime:0;
    const totalPellets=countDots?countDots():pellets; // dự phòng khi không đếm được
    const eaten=totalPellets-pellets;
    // Thả ma khi đủ thời gian hoặc người chơi đã ăn đủ pellet (inky: 10, clyde: 20).
    const pelletThresh=[0,0,10,20];
    if(!g.released&&(el>g.releaseDelay||eaten>=pelletThresh[i])){g.released=true;g.dir="up";g.nextDir="up";g._exitMap=null;}
    const extraSpeed=(g.name==="inky"||g.name==="clyde")?10:0;
    g.speed=now<frightenedUntil?FRIGHTENED_SPEED:BASE_GHOST_SPEED+level*4+extraSpeed;

    // Ping 20ms: chỉ tính hướng mới mỗi 20ms.
    const GHOST_PING_MS=20;
    if(!g._lastPingTime) g._lastPingTime=0;
    const pingReady=now-g._lastPingTime>=GHOST_PING_MS;

    // Đang sợ hãi: đi thẳng đến tường rồi dừng, chờ hết thời gian đóng băng.
    if(now<frightenedUntil){
      if(!g._frightenedStopped){
        if(g.dir){
          const d=DIRS[g.dir];
          const ok=isWalkable(g.tile.x+d.x,g.tile.y+d.y,true);
          if(ok){
            // Phía trước còn trống: tiếp tục di chuyển bình thường.
            g.x+=d.x*g.speed*dt;g.y+=d.y*g.speed*dt;
            if(atCentre(g)){syncTile(g);}
          } else {
            // Gặp tường phía trước: trượt về tâm ô hiện tại rồi dừng tự nhiên.
            const c=tileToWorld(g.tile.x,g.tile.y);
            const toX=c.x-g.x, toZ=c.y-g.y;
            const dist=Math.sqrt(toX*toX+toZ*toZ);
            const step=g.speed*dt;
            if(dist<=step){
              // Đã đến tâm ô: dừng chính xác tại tâm, không snap giật.
              g.x=c.x;g.y=c.y;
              g._frightenedStopped=true;
            } else {
              // Trượt mượt về tâm ô.
              g.x+=toX/dist*step;g.y+=toZ/dist*step;
            }
          }
        }
      }
      wrapX(g);syncTile(g);
      return;
    }

    // Hết trạng thái sợ hãi: reset cờ và tiếp tục di chuyển bình thường.
    if(g._frightenedStopped){
      g._frightenedStopped=false;
      g.nextDir=decideNextDir(g,now);
      g._lastPingTime=now;
    }

    if(atCentre(g)&&g.nextDir&&g.nextDir!==g.dir){const nd=DIRS[g.nextDir];if(isWalkable(g.tile.x+nd.x,g.tile.y+nd.y,true)){snapToTile(g);g.dir=g.nextDir;}}
    if(!g.dir){snapToTile(g);g.dir=decideNextDir(g,now);g.nextDir=g.dir;g._lastPingTime=now;}
    const d=DIRS[g.dir],c=tileToWorld(g.tile.x,g.tile.y),ok=isWalkable(g.tile.x+d.x,g.tile.y+d.y,true);
    if(ok){g.x+=d.x*g.speed*dt;g.y+=d.y*g.speed*dt;if(atCentre(g)){syncTile(g);g.lastDir=g.dir;if(pingReady){g.nextDir=decideNextDir(g,now);g._lastPingTime=now;}}}
    else{
      if(d.x!==0){const nx=g.x+d.x*g.speed*dt,cr=d.x>0?nx>=c.x:nx<=c.x;g.x=cr?c.x:nx;if(cr)g.y=c.y;}
      else{const ny=g.y+d.y*g.speed*dt,cr=d.y>0?ny>=c.y:ny<=c.y;g.y=cr?c.y:ny;if(cr)g.x=c.x;}
      if(atCentre(g)){snapToTile(g);g.lastDir=g.dir;g.dir="";if(pingReady){g.nextDir=decideNextDir(g,now);g._lastPingTime=now;}}
    }
    wrapX(g);syncTile(g);
  });
}

function checkCollisions(){
  ghosts.forEach(g=>{
    if(Math.hypot(player.x-g.x,player.y-g.y)<player.radius+g.radius-4){
      if(performance.now()<frightenedUntil){const sw=tileToWorld(g.startTile.x,g.startTile.y);g.tile={...g.startTile};g.x=sw.x;g.y=sw.y;const em=bfsDistMap(EXIT_TILE.x,EXIT_TILE.y,true,false);const g0={tile:{...g.startTile},dir:""};const rd=bestDirFromMap(g0,em)||"up";g.dir=rd;g.nextDir=rd;g.released=false;g._exitMap=em;g._frightenedStopped=false;}
      else loseLife();
    }
  });
}

let waitingForInput=false;
function loseLife(){
  if(paused)return;lives--;updateHUD();
  if(lives<=0){
    started=false;paused=true;
    // Đóng cứng hiển thị timer tại thời điểm thua.
    frozenTimeMs=Math.floor((performance.now()-gameStartTime+accumulatedMs)/1000);
    const finalStartTime=gameStartTime;
    initGame(); // reset điểm/mạng/cấp, nhưng giữ gameStartTime theo xử lý bên dưới
    gameStartTime=finalStartTime;
    showCard("gameover");
    // Không reset gameStartTime ở đây để tiếp tục hiện thời gian cũ cho đến khi chơi lại.
    return;
  }
  // Mất một mạng nhưng còn sống: tạm dừng ngắn, không reset timer.
  paused=true;waitingForInput=true;resetEntities();
  pauseTimer();
  showCard("life-lost");
}

