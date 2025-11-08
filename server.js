import express from "express";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 경로
app.use(express.static(path.join(__dirname, "public")));

let players = {};

io.on("connection", (socket) => {
  console.log("🎮 플레이어 접속:", socket.id);

  // 새 플레이어 초기화
  players[socket.id] = { x: 250, y: 250, color: randomColor() };

  // 기존 플레이어 목록 전송
  socket.emit("currentPlayers", players);

  // 새 플레이어 접속 알림
  socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

  // 움직임 처리
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit("playerMoved", { id: socket.id, x: data.x, y: data.y });
    }
  });

  // 연결 종료 처리
  socket.on("disconnect", () => {
    console.log("❌ 플레이어 퇴장:", socket.id);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

function randomColor() {
  const colors = ["#ff4757", "#1e90ff", "#2ed573", "#ffa502", "#a55eea"];
  return colors[Math.floor(Math.random() * colors.length)];
}

server.listen(3000, () => console.log("✅ 서버 실행 중: http://localhost:3000"));
