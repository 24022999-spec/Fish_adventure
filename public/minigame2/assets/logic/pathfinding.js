// Bản đồ khoảng cách BFS tính từ ô đích.
// Trả về mảng phẳng NROW*COLS: khoảng cách từng ô, Infinity nếu không tới được.
function bfsDistMap(tx,ty,forGhost,avoidHouse=false){
  const dist=new Float32Array(NROW*COLS).fill(Infinity);
  const queue=[];
  const push=(x,y,d)=>{
    if(y<0||y>=NROW)return;
    // Cho phép BFS đi qua đường hầm ngang để ma tìm đường qua hai mép bản đồ.
    // Việc này sửa trường hợp mục tiêu nửa dưới bản đồ bị xem như không tới được.
    // Nguyên nhân cũ là BFS cắt bỏ các ô ngoài mép trái/phải.
    if(x<0) x = COLS-1;
    else if(x>=COLS) x = 0;
    const t=tileAt(x,y);
    if(t==="#")return;
    if(!forGhost&&t==="-")return;
    // Khi ma đã ra ngoài nhà, không cho đường đi cắt ngang qua nhà ma.
    // Cách này tránh việc tuyến đường ngắn nhất chui qua cửa nhà.
    if(avoidHouse && inGhostHouse(x,y)) return;
    const k=y*COLS+x;
    if(dist[k]<=d)return;
    dist[k]=d; queue.push(x,y,d);
  };
  push(tx,ty,0);
  for(let i=0;i<queue.length;i+=3){
    const x=queue[i],y=queue[i+1],d=queue[i+2];
    push(x+1,y,d+1); push(x-1,y,d+1);
    push(x,y+1,d+1); push(x,y-1,d+1);
  }
  return dist;
}

// Chọn hướng đi tốt nhất từ distMap, tránh quay đầu nếu có thể.
function bestDirFromMap(g,distMap,allowOpp=false){
  const cx=g.tile.x, cy=g.tile.y;
  const opp=OPPOSITE[g.dir];
  let best=null, bestD=Infinity;
  for(const d of DIR_KEYS){
    if(!allowOpp && d===opp)continue;
    const nd=DIRS[d];
    const nx=cx+nd.x, ny=cy+nd.y;
    if(!isWalkable(nx,ny,true))continue;
    const dd=distMap[ny*COLS+nx];
    if(dd<bestD){bestD=dd;best=d;}
  }
  return best;
}

// Mục tiêu truy đuổi theo tính cách từng con ma.
function chaseTarget(g){
  const px=player.tile.x, py=player.tile.y;
  if(g.name==="blinky"){
    return {x:px, y:py};
  }
  if(g.name==="pinky"){
    const d=DIRS[player.dir||"left"];
    return {x:clamp(px+d.x*4,0,COLS-1), y:clamp(py+d.y*4,0,NROW-1)};
  }
  if(g.name==="inky"){
    const blinky=ghosts.find(h=>h.name==="blinky");
    const d=DIRS[player.dir||"left"];
    const ax=px+d.x*2, ay=py+d.y*2;
    if(blinky){
      return {x:clamp(ax*2-blinky.tile.x,0,COLS-1), y:clamp(ay*2-blinky.tile.y,0,NROW-1)};
    }
    return {x:ax, y:ay};
  }
  if(g.name==="clyde"){
    // Cho Clyde tấn công mạnh như Blinky/Pinky thay vì bỏ chạy khi ở gần.
    // Như vậy ma vàng có cảm giác thông minh tương đương.
    return {x:px, y:py};
  }
  return {x:px, y:py};
}

function decideNextDir(g,now){
  const opp=OPPOSITE[g.dir];

  // Các hướng hợp lệ: tránh quay đầu, dùng phương án dự phòng cho quay đầu nếu bị kẹt.
  const noUT=DIR_KEYS.filter(d=>{
    if(d===opp)return false;
    const nd=DIRS[d]; return isWalkable(g.tile.x+nd.x,g.tile.y+nd.y,true);
  });
  const choices=noUT.length ? noUT :
    DIR_KEYS.filter(d=>{const nd=DIRS[d];return isWalkable(g.tile.x+nd.x,g.tile.y+nd.y,true);});
  if(!choices.length)return g.dir||"up";

  // Chưa được thả: đi về ô thoát bằng distMap đã cache.
  if(!g.released){
    if(!g._exitMap) g._exitMap=bfsDistMap(EXIT_TILE.x,EXIT_TILE.y,true,false);
    const d=bestDirFromMap(g,g._exitMap);
    return (d&&choices.includes(d))?d:choices[0];
  }

  // Đã ra ngoài: tránh quay lại nhà ma, trừ khi player đang ở trong nhà.
  const playerInBox=player&&inGhostHouse(player.tile.x,player.tile.y);
  const safeChoices=playerInBox?choices:choices.filter(d=>{const nd=DIRS[d];return !inGhostHouse(g.tile.x+nd.x,g.tile.y+nd.y);});
  const validChoices=safeChoices.length?safeChoices:choices;

  // Nếu vẫn trong nhà ma: ưu tiên đi thẳng ra ngoài và cho phép quay đầu.
  if(inGhostHouse(g.tile.x,g.tile.y)){
    if(!g._exitMap) g._exitMap=bfsDistMap(EXIT_TILE.x,EXIT_TILE.y,true,false);
    const d=bestDirFromMap(g,g._exitMap,true);
    return (d&&validChoices.includes(d))?d:validChoices[0];
  }

  // Đang sợ hãi: đi ngẫu nhiên, không quay đầu.
  if(now<frightenedUntil) return validChoices[Math.floor(Math.random()*validChoices.length)];

  // Bình thường: lấy chế độ hiện tại từ lịch scatter/chase.
  const [curMode]=MODE_SCHEDULE[Math.min(modeIdx,MODE_SCHEDULE.length-1)];
  let target;
  if(curMode==="scatter"){
    target=g.scatter;
  } else {
    target=chaseTarget(g);
  }

  // Lưu cache distMap theo ô mục tiêu.
  // Mục tiêu của Inky phụ thuộc cả Blinky nên đưa ô của Blinky vào khóa cache.
  // Cách này giữ ma xanh đi ổn định khi Blinky di chuyển.
  let tk=target.y*COLS+target.x;
  if(g.name==="inky"){
    const blinky=ghosts.find(h=>h.name==="blinky");
    if(blinky) tk = tk ^ ((blinky.tile.y*COLS+blinky.tile.x) << 1);
  }
  if(!g._distMap||g._lastTargetKey!==tk){
    // Nếu ma đang ngoài nhà, tránh định tuyến đường cắt qua nhà ma.
    // Chỉ cho đi qua nhà khi player đang ở trong đó hoặc ma vẫn chưa ra ngoài.
    const avoidHouse = g.released && !inGhostHouse(g.tile.x,g.tile.y) && !playerInBox;
    g._distMap=bfsDistMap(target.x,target.y,true,avoidHouse);
    g._lastTargetKey=tk;
  }
  const d=bestDirFromMap(g,g._distMap);

  return (d&&validChoices.includes(d))?d:validChoices[Math.floor(Math.random()*validChoices.length)];
}

