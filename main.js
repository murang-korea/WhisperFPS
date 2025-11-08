import * as THREE from "three";
import { createClient } from "@supabase/supabase-js";

// Supabase 설정
const SUPABASE_URL = "https://zlhrotxaqvtedtxgvtjp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaHJvdHhhcXZ0ZWR0eGd2dGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MjM0MTAsImV4cCI6MjA3ODA5OTQxMH0.u5hTaGUf4NwTZ6hKO1gSpZV3SHTTbgQrTd-3ThGl0_A";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 기본 요소
const canvas = document.getElementById("gameCanvas");
const startBtn = document.getElementById("startBtn");
const ui = document.getElementById("ui");

// Three.js 세팅
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 조명 + 바닥
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 플레이어 생성
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x4f46e5 })
);
player.position.y = 1;
scene.add(player);
camera.position.set(0, 2, 5);

// 리사이즈 대응
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 이동 관련
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Supabase Realtime
const playerId = Math.random().toString(36).substring(2, 10);
let players = {};

async function updatePosition(x, z) {
  await supabase.from("players").upsert({ id: playerId, x, z });
}

supabase
  .channel("realtime:players")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "players" },
    (payload) => {
      players[payload.new.id] = payload.new;
    }
  )
  .subscribe();

// 게임 루프
function animate() {
  requestAnimationFrame(animate);

  if (keys["w"]) player.position.z -= 0.1;
  if (keys["s"]) player.position.z += 0.1;
  if (keys["a"]) player.position.x -= 0.1;
  if (keys["d"]) player.position.x += 0.1;

  updatePosition(player.position.x, player.position.z);
  camera.lookAt(player.position);
  renderer.render(scene, camera);
}

// 💡 “게임 시작” 버튼 클릭 시 실행
startBtn.addEventListener("click", () => {
  ui.style.display = "none"; // 시작 화면 숨기기
  canvas.style.display = "block"; // 게임화면 표시
  animate();
});
