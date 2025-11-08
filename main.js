// 랜덤 닉네임 생성
let nickname = localStorage.getItem("nickname");
if (!nickname) {
  nickname = "Player_" + Math.floor(Math.random() * 10000);
  localStorage.setItem("nickname", nickname);
}
document.getElementById("nickname").textContent = nickname;

// THREE.js 기본 세팅
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-container").appendChild(renderer.domElement);

// 바닥, 조명
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// 플레이어 시작 위치
camera.position.set(0, 2, 5);

// 총알 저장
const bullets = [];

// 조이스틱 이동 제어
let joystick = document.getElementById("joystick");
let stick = document.getElementById("stick");
let moveX = 0, moveY = 0;
let dragging = false;
let startX, startY;

joystick.addEventListener("touchstart", (e) => {
  dragging = true;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

joystick.addEventListener("touchmove", (e) => {
  if (!dragging) return;
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  const dist = Math.min(Math.sqrt(dx*dx + dy*dy), 40);
  const angle = Math.atan2(dy, dx);
  stick.style.left = 30 + dist * Math.cos(angle) + "px";
  stick.style.top = 30 + dist * Math.sin(angle) + "px";
  moveX = Math.cos(angle) * (dist / 40);
  moveY = Math.sin(angle) * (dist / 40);
});

joystick.addEventListener("touchend", () => {
  dragging = false;
  stick.style.left = "30px";
  stick.style.top = "30px";
  moveX = moveY = 0;
});

// 발사 버튼
document.getElementById("shootBtn").addEventListener("click", shoot);

function shoot() {
  const geometry = new THREE.SphereGeometry(0.1, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const bullet = new THREE.Mesh(geometry, material);
  bullet.position.copy(camera.position);
  bullet.velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(0.5);
  bullets.push(bullet);
  scene.add(bullet);
}

// 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  // 이동
  camera.position.x += moveX * 0.1;
  camera.position.z += moveY * 0.1;

  // 총알 이동
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.add(b.velocity);
    if (b.position.length() > 100) {
      scene.remove(b);
      bullets.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
