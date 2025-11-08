import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

let players = {};

io.on("connection", (socket) => {
  console.log("새 유저 접속:", socket.id);
  
  // 새로운 플레이어 등록
  players[socket.id] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
  };

  // 현재 플레이어 목록 전송
  socket.emit("currentPlayers", players);

  // 다른 유저들에게 새 플레이어 추가 알림
  socket.broadcast.emit("newPlayer", { id: socket.id, ...players[socket.id] });

  // 플레이어 이동
  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit("playerMoved", { id: socket.id, x: data.x, y: data.y });
    }
  });

  // 연결 종료
  socket.on("disconnect", () => {
    console.log("유저 나감:", socket.id);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
  });
});

server.listen(3000, () => console.log("✅ 서버 실행 중: http://localhost:3000"));
