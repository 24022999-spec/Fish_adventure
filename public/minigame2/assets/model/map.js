// LOGIC CỐT LÕI CỦA GAME
// Dữ liệu bản đồ và các hằng số dùng chung.
// ----------------------------------------
const TILE=40, SNAP=3, POWER_MS=7000;
function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v));}
const BASE_PLAYER_SPEED=168, BASE_GHOST_SPEED=136, FRIGHTENED_SPEED=58;
// IQ 90/100: ma chọn đúng hướng 90% thời gian, 10% đi ngẫu nhiên.
const ROWS=[
  "############################",
  "#o...........##...........o#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.#####    #####.######",
  "######.##    --    ##.######",
  "######.## # GG   # ##.######",
  "######.## # GG   # ##.######",
  "######.## #      # ##.######",
  "######.## ######## ##.######",
  "######.##    P     ##.######",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o..##................##..o#",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];
const COLS=ROWS[0].length, NROW=ROWS.length;

const DIRS={
  left:{x:-1,y:0,angle:Math.PI},right:{x:1,y:0,angle:0},
  up:{x:0,y:-1,angle:Math.PI*1.5},down:{x:0,y:1,angle:Math.PI/2}
};
const DIR_KEYS=Object.keys(DIRS);
const OPPOSITE={left:"right",right:"left",up:"down",down:"up"};

let wonGame=false;
let gameEnded=false;
let donutsLeft=4; // 4 power pellet trên bản đồ
let donutsEaten=0; // số donut đã ăn
let sprinklesTotal=0;
let sprinklesEaten=0;

function buildMap(){return ROWS.map(r=>r.split(""));}
function tileAt(x,y){if(y<0||y>=NROW||x<0||x>=COLS)return"#";return map[y][x];}
function isWalkable(x,y,fg){const t=tileAt(x,y);if(t==="#")return false;if(t==="-")return!!fg;return true;}
function findChar(ch,idx=0){let s=0;for(let y=0;y<NROW;y++)for(let x=0;x<COLS;x++)if(ROWS[y][x]===ch){if(s++===idx)return{x,y};}throw new Error(ch+" not found");}
function countDots(){return map.flat().filter(c=>c==="."||c==="o").length;}
function countSprinkles(){return map.flat().filter(c=>c===".").length;}
function tileToWorld(tx,ty){return{x:tx*TILE+TILE/2,y:ty*TILE+TILE/2};}
function worldToTile(wx,wy){return{x:Math.round((wx-TILE/2)/TILE),y:Math.round((wy-TILE/2)/TILE)};}
function atCentre(e){const c=tileToWorld(e.tile.x,e.tile.y);return Math.abs(e.x-c.x)<=SNAP&&Math.abs(e.y-c.y)<=SNAP;}
function snapToTile(e){const c=tileToWorld(e.tile.x,e.tile.y);e.x=c.x;e.y=c.y;}
function syncTile(e){const t=worldToTile(e.x,e.y);e.tile.x=t.x;e.tile.y=t.y;}
function wrapX(e){const mw=COLS*TILE;if(e.x<-TILE/2)e.x=mw+TILE/2;if(e.x>mw+TILE/2)e.x=-TILE/2;}
