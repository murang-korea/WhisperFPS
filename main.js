import * as THREE from "three";
import { createClient } from "@supabase/supabase-js";

// 🧩 Supabase 설정
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🎮 기본 설정
const canvas = document.getElementById("gameCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 🌍 간단한 바닥
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 💡 조명
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// 👤 플레이어
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: 0x4f46e5 })
);
player.position.y = 1;
scene.add(player);
camera.position.set(0, 2, 5);

// 🔄 리사이즈 대응
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 🔫 키보드 이동
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// 👥 실시간 위치 업데이트 (익명 플레이어)
const playerId = Math.random().toString(36).substring(2, 10);
let players = {};

async function updatePosition(x, z) {
  await supabase.from("players").upsert({ id: playerId, x, z });
}

// 실시간 구독
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

// 🧭 루프
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
animate();
