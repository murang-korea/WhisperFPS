// --- Supabase 연결 ---
const SUPABASE_URL = "https://wtifzpbzjkyfosffamrx.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentPlayer = null;
let playersMap = {}; // { playerId: { mesh, username } }

// ---------------------
// 닉네임 설정
// ---------------------
function setNickname() {
  const name = prompt("닉네임 입력 (최대 20자):")?.trim();
  if (!name) return setNickname();
  currentPlayer = { username: name.substring(0,20) };
  upsertPlayer(0,0,0,0);
}

document.getElementById("nicknameBtn").onclick = setNickname;

// ---------------------
// Three.js 초기화
// ---------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0,2,5);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(0,10,5);
scene.add(light);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshStandardMaterial({color:0x555555}));
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// ---------------------
// 플레이어 생성
// ---------------------
function createPlayerMesh(color=0x00ff00) {
  const geometry = new THREE.BoxGeometry(1,2,1);
  const material = new THREE.MeshStandardMaterial({color});
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

// 내 플레이어
const myMesh = createPlayerMesh(0x0000ff);

// ---------------------
// 키 입력
// ---------------------
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let playerPos = {x:0,y:1,z:0, rot_y:0};
function movePlayer() {
  const speed = 0.1;
  if (keys['w']) { playerPos.z -= speed; }
  if (keys['s']) { playerPos.z += speed; }
  if (keys['a']) { playerPos.x -= speed; }
  if (keys['d']) { playerPos.x += speed; }
  myMesh.position.set(playerPos.x,playerPos.y,playerPos.z);
  upsertPlayer(playerPos.x, playerPos.y, playerPos.z, playerPos.rot_y);
}

// ---------------------
// Supabase Realtime
// ---------------------
async function upsertPlayer(x,y,z,rot_y){
  if(!currentPlayer) return;
  await supabase.from("players").upsert([{
    username: currentPlayer.username,
    x,y,z,rot_y
  }]);
}

// 구독
supabase.from("players").on("INSERT", payload => addOrUpdatePlayer(payload.new)).subscribe();
supabase.from("players").on("UPDATE", payload => addOrUpdatePlayer(payload.new)).subscribe();
supabase.from("players").on("DELETE", payload => removePlayer(payload.old)).subscribe();

function addOrUpdatePlayer(data){
  if(!currentPlayer || data.username === currentPlayer.username) return;
  let p = playersMap[data.username];
  if(!p) {
    const mesh = createPlayerMesh(0xff0000);
    p = { mesh, username:data.username };
    playersMap[data.username] = p;
  }
  p.mesh.position.set(data.x,data.y,data.z);
}

function removePlayer(data){
  if(playersMap[data.username]){
    scene.remove(playersMap[data.username].mesh);
    delete playersMap[data.username];
  }
}

// ---------------------
// 렌더링
// ---------------------
function animate(){
  requestAnimationFrame(animate);
  if(currentPlayer) movePlayer();
  renderer.render(scene,camera);
}
animate();
