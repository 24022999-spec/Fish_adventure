// Khởi động game.
paused=false;started=false;
initGame();
showCard("start");
// Kích hoạt resize sau khi DOM render xong để canvas nhận đúng kích thước.
requestAnimationFrame(()=>{
  window.dispatchEvent(new Event('resize'));
  requestAnimationFrame(animate);
});