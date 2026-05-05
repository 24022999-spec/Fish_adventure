function makePlayer(tile){const w=tileToWorld(tile.x,tile.y);return{x:w.x,y:w.y,tile:{...tile},dir:"",nextDir:"left",speed:BASE_PLAYER_SPEED,radius:TILE*.42,mouth:0};}
function makeGhost(name,tilePos,scatter,releaseDelay=0){
  const w=tileToWorld(tilePos.x,tilePos.y);
  // Tính sẵn đường ra khỏi nhà ma ngay khi tạo entity.
  const exitMap=bfsDistMap(EXIT_TILE.x,EXIT_TILE.y,true,false);
  // Tìm hướng khởi đầu tốt nhất bằng BFS thay vì hardcode "up".
  const g0={tile:{...tilePos},dir:"",x:w.x,y:w.y};
  const initDir=bestDirFromMap(g0,exitMap)||"up";
  return{name,x:w.x,y:w.y,tile:{...tilePos},startTile:{...tilePos},
    dir:initDir,nextDir:initDir,
    speed:BASE_GHOST_SPEED,radius:TILE*.4,scatter,
    released:releaseDelay<=0,releaseDelay,
    _exitMap:exitMap}; // cache sẵn, không cần tính lại
}

function resetEntities(){
  player=makePlayer(findChar("P"));
  const gTiles=[
    {x:11,y:10},
    {x:12,y:10},
    {x:13,y:10},
    {x:14,y:10},
  ];
  const sc=[
    {x:COLS-2, y:1},
    {x:1,      y:1},
    {x:COLS-2, y:NROW-2},
    {x:1,      y:NROW-2},
  ];
  const names=["blinky","pinky","inky","clyde"];
  const delays=[0, 0, 0, 10];
  ghosts=names.map((n,i)=>makeGhost(n,gTiles[i],sc[i],delays[i]));
}

// Nhà ma và ô thoát
const EXIT_TILE={x:13,y:7};
const GHOST_HOUSE_X1=10, GHOST_HOUSE_X2=17, GHOST_HOUSE_Y1=8, GHOST_HOUSE_Y2=12;
function inGhostHouse(tx,ty){return tx>=GHOST_HOUSE_X1&&tx<=GHOST_HOUSE_X2&&ty>=GHOST_HOUSE_Y1&&ty<=GHOST_HOUSE_Y2;}

// Lịch chế độ: luân phiên scatter/chase như game arcade.
// [chếĐộ, thờiLượngMs]
const MODE_SCHEDULE=[
  ["scatter",7000],["chase",20000],
  ["scatter",7000],["chase",20000],
  ["scatter",5000],["chase",20000],
  ["scatter",5000],["chase",Infinity],
];
let modeIdx=0, modeTick=0;