// Giao diá»‡n HUD.
const elHearts=document.getElementById("el-hearts");
const elTime=document.getElementById("el-time");
const ovEl=document.getElementById("overlay");
const vigEl=document.getElementById("vignette");
const cards={
  start:   document.getElementById("ov-card-start"),
  pause:   document.getElementById("ov-card-pause"),
  gameover:document.getElementById("ov-card-gameover"),
  win:     document.getElementById("ov-card-win"),
};

function updateHUD(){
  // Hiá»ƒn thá»‹ máº¡ng.
  if(elHearts){
    let h="";
    for(let i=0;i<lives;i++) h+="<span class='emoji-icon'>&#x1F420;</span>";
    for(let i=lives;i<3;i++) h+="<span class='emoji-icon' style='opacity:.2'>&#x1F420;</span>";
    elHearts.innerHTML=h;
  }
  // Hiá»ƒn thá»‹ sprinkles.
  const elSprinkleCount=document.getElementById("el-sprinkle-count");
  const elSprinkleTotal=document.getElementById("el-sprinkle-total");
  if(elSprinkleTotal) elSprinkleTotal.textContent=sprinklesTotal;
  if(elSprinkleCount){
    const prev=parseInt(elSprinkleCount.textContent)||0;
    elSprinkleCount.textContent=sprinklesEaten;
    if(sprinklesEaten!==prev){
      elSprinkleCount.classList.remove("pop-anim");
      void elSprinkleCount.offsetWidth;
      elSprinkleCount.classList.add("pop-anim");
    }
  }
  // Hiá»ƒn thá»‹ donut.
  const elDonutCount=document.getElementById("el-donut-count");
  const elDonutIcons=document.getElementById("el-donut-icons");
  if(elDonutCount){
    const prev=parseInt(elDonutCount.textContent)||0;
    elDonutCount.textContent=donutsEaten;
    if(donutsEaten!==prev){
      elDonutCount.classList.remove("pop-anim");
      void elDonutCount.offsetWidth;
      elDonutCount.classList.add("pop-anim");
    }
  }
  if(elDonutIcons){
    const wraps=elDonutIcons.querySelectorAll(".donut-ring-wrap");
    wraps.forEach((wrap,i)=>{
      const wasEaten=wrap.classList.contains("eaten");
      if(i<donutsEaten){
        if(!wasEaten){
          wrap.classList.add("just-eaten");
          wrap.addEventListener("animationend",()=>wrap.classList.remove("just-eaten"),{once:true});
        }
        wrap.classList.add("eaten");
      } else {
        wrap.classList.remove("eaten","just-eaten");
      }
    });
  }
  if(window.updateDonutHUD) window.updateDonutHUD(donutsEaten);
}

let pausedAt=0;
let accumulatedMs=0;
let frozenTimeMs=-1; // >=0 thÃ¬ khÃ³a hiá»ƒn thá»‹ timer táº¡i giÃ¡ trá»‹ nÃ y

function updateTimer(){
  if(!elTime) return;
  if(frozenTimeMs>=0){
    const mm=String(Math.floor(frozenTimeMs/60)).padStart(2,'0');
    const ss=String(frozenTimeMs%60).padStart(2,'0');
    elTime.textContent=`${mm}:${ss}`;
    return;
  }
  if(!started || paused || !gameStartTime) return;
  const elapsed=Math.floor((performance.now()-gameStartTime+accumulatedMs)/1000);
  const mm=String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss=String(elapsed%60).padStart(2,'0');
  elTime.textContent=`${mm}:${ss}`;
}


function pauseTimer(){
  if(!gameStartTime) return;
  pausedAt=performance.now();
}

function resumeTimer(){
  if(!gameStartTime) return;
  const pauseDuration=performance.now()-pausedAt;
  gameStartTime+=pauseDuration;
}
function showCard(name){
  Object.values(cards).forEach(c=>{if(c)c.style.display="none";});
  const lifeLostCard=document.getElementById("ov-card-life-lost");
  if(lifeLostCard)lifeLostCard.style.display="none";
  if(name==="life-lost"){
    const card=document.getElementById("ov-card-life-lost");
    if(card){
      card.style.display="flex";
      const heartsEl=document.getElementById("life-lost-hearts");
      if(heartsEl){
        heartsEl.innerHTML="";
        for(let i=0;i<lives;i++) heartsEl.innerHTML+="<span class='emoji-icon'>&#x1F420;</span>";
        for(let i=lives;i<3;i++) heartsEl.innerHTML+="<span class='emoji-icon' style='opacity:.25'>&#x1F420;</span>";
      }
    }
    ovEl.classList.remove("hidden");
    return;
  }

  const c=cards[name];
  if(c)c.style.display="flex";
  ovEl.classList.remove("hidden");
}
function hideOv(){ovEl.classList.add("hidden");}
function finishWin(){
  started=false;
  paused=true;
  wonGame=true;
  gameEnded=true;
  showCard("win");
}
function skipToWin(){
  finishWin();
}

