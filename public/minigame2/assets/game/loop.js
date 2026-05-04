// Vòng lặp chính.
let lastT=0;


// Hướng đi sang góc xoay của cá (cá nhìn về +X khi đi sang phải).
const FISH_ROT={left:Math.PI,right:0,up:Math.PI/2,down:-Math.PI/2};
const FISH_ROT_GHOST={left:Math.PI,right:0,up:Math.PI/2,down:-Math.PI/2};

function animate(ts){
  requestAnimationFrame(animate);
  if(!lastT||tabHidden){lastT=ts;tabHidden=false;}
  const dt=Math.min((ts-lastT)/1000,0.033);lastT=ts;

  if(!paused&&started){
    updatePlayer(dt);
    updateGhosts(dt,ts);
    checkCollisions();
    updateTimer();
  }

  const now=performance.now();
  const isFright=now<frightenedUntil;
  vigEl.classList.toggle("fright",isFright);

  // Đồng bộ clownfish.
  // Mesh nằm trên mặt phẳng XZ, đầu hướng +X. Camera nhìn từ trên theo Y.
  // rotation.y xoay cá trái/phải trong mặt phẳng XZ.
  fishMesh.position.set(player.x, 30+Math.sin(now*.004)*5, player.y);
  const facing=player.dir||player.nextDir||"right";
  const targetRot=FISH_ROT[facing]??0;
  let diff=targetRot-fishMesh.rotation.y;
  while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
  fishMesh.rotation.y+=diff*0.22;

  // Đồng bộ cá ma.
  ghostFishMeshes.forEach((gm,i)=>{
    if(i>=ghosts.length)return;
    const g=ghosts[i];

    if(paused){
      // Khi tạm dừng, cho trôi theo hướng đang đi và không lerp rotation.
      if(g._vx===undefined){g._vx=g.x;g._vy=g.y;}
      const d=DIRS[g.dir];
      if(d){g._vx+=d.x*22*dt;g._vy+=d.y*22*dt;}
      gm.position.set(g._vx,28+Math.sin(now*.003+i*1.7)*6,g._vy);
    }else{
      g._vx=g.x;g._vy=g.y;
      gm.position.set(g.x,28+Math.sin(now*.003+i*1.7)*6,g.y);
      // Khi đang sợ hãi, khóa hướng xoay tại thời điểm bắt đầu.
      if(g.dir){
        if(isFright){
          // Lưu rotation lúc bắt đầu sợ hãi và giữ nguyên.
          if(gm.userData.frightRotLocked===undefined){
            gm.userData.frightRotLocked=gm.rotation.y; // khóa tại vị trí hiện tại
          }
          gm.rotation.y=gm.userData.frightRotLocked;
        } else {
          gm.userData.frightRotLocked=undefined; // reset khi hết sợ hãi
          const gr=FISH_ROT_GHOST[g.dir]??gm.rotation.y;
          let gd=gr-gm.rotation.y;while(gd>Math.PI)gd-=Math.PI*2;while(gd<-Math.PI)gd+=Math.PI*2;
          gm.rotation.y+=gd*0.18;
        }
      }
    }

    // Khi sợ hãi: đổi màu toàn bộ thân ma sang xanh, trừ mắt.
    if(gm.userData.bodyMats){
      const blinkOn=isFright&&frightenedUntil-now<2000&&Math.floor(now/150)%2===0;
      const frightHex=blinkOn?0xffffff:0x1e40ff;
      gm.userData.bodyMats.forEach((mat,i)=>{
        const origHex=gm.userData.origColors[i].getHex();
        mat.color.setHex(isFright?frightHex:origHex);
        mat.emissive.setHex(isFright?(blinkOn?0xffffff:0x1e40ff):0x000000);
        mat.emissiveIntensity=isFright?.7:0;
      });
    }
  });

  // Animate các group donut GLB bằng bob lên/xuống.
  donutGroups.forEach(({group,baseX,baseZ},k)=>{
    if(!group.visible) return;
    const col=parseInt(k.split(",")[0]);
    group.position.y=12+Math.sin(now*.004+col*0.3)*4;
  });

  // Mặt nước: chỉ pulse opacity nhẹ mỗi 4 frame.
  if(Math.floor(ts/16)%4===0){
    waterSurfMat.opacity=0.05+Math.sin(now*.0008)*0.015;
  }

  // Đã bỏ hiệu ứng caustic.

  // Bong bóng: cập nhật mỗi 2 frame.
  if(Math.floor(ts/16)%2===0){
    const bp=bubbleGeo.attributes.position;
    for(let i=0;i<NUM_BUBBLES;i++){
      bp.setY(i, bp.getY(i)+0.7+Math.sin(bPhase[i]+now*.001)*0.2); // tăng nhanh hơn vì bỏ qua frame
      bp.setX(i, bp.getX(i)+Math.sin(bPhase[i]+now*.0008)*0.3);
      if(bp.getY(i)>290){bp.setY(i,-10+Math.random()*20);bp.setX(i,Math.random()*COLS*TILE);bp.setZ(i,Math.random()*NROW*TILE);}
    }
    bp.needsUpdate=true;
  }

  // Rong biển: mesh gộp tĩnh, không cần update mỗi frame.

  // Camera: cố định nhìn từ trên, không cần di chuyển.

  // Đồng bộ renderer/camera theo kích thước CSS thực của canvas mỗi frame.
  {
    const cw=canvas.clientWidth, ch=canvas.clientHeight;
    if(canvas.width!==cw||canvas.height!==ch){
      renderer.setSize(cw,ch,false);
      const a=cw/ch;
      const PAD=20;
      let hw=MAP_W/2+PAD, hh=hw/a;
      if(hh < MAP_H/2+PAD){ hh=MAP_H/2+PAD; hw=hh*a; }
      hw*=SCALE_DOWN; hh*=SCALE_DOWN;
      camera.left=-hw;camera.right=hw;camera.top=hh;camera.bottom=-hh;
      camera.updateProjectionMatrix();
    }
  }

  renderer.render(scene,camera);
}

