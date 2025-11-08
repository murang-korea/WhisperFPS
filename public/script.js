const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let players = {};
let myId = null;
const speed = 4;

socket.on("connect", () => {
  myId = socket.id;
});

// 기존 플레이어 표시
socket.on("currentPlayers", (serverPlayers) => {
  players = serverPlayers;
  draw();
});

// 새 플레이어 추가
socket.on("newPlayer", (player) => {
  players[player.id] = player;
  draw();
});

// 플레이어 이동 업데이트
socket.on("playerMoved", (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
    draw();
  }
});

// 플레이어 퇴장
socket.on("playerDisconnected", (id) => {
  delete players[id];
  draw();
});

document.addEventListener("keydown", (e) => {
  if (!players[myId]) return;
  let { x, y } = players[myId];
  if (e.key === "ArrowUp") y -= speed;
  if (e.key === "ArrowDown") y += speed;
  if (e.key === "ArrowLeft") x -= speed;
  if (e.key === "ArrowRight") x += speed;
  players[myId].x = x;
  players[myId].y = y;
  socket.emit("move", { x, y });
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const id in players) {
    const { x, y, color } = players[id];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    if (id === myId) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
