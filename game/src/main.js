// Emberline Canyon Post: boot the scene, run the fixed-step loop, place the
// chase/cockpit cameras, and wire missions, messages and restarts together.
const THREE = window.THREE;
import { buildTerrain } from './terrain.js';
import { buildAircraft } from './aircraft.js';
import { freshState, stepFlight } from './flight.js';
import { installInput, readControls, keys } from './input.js';
import { buildMissionProps, freshMission, stepMission, scoreLanding } from './missions.js';
import { updateHud, drawPanel, showMessage } from './hud.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87bfe8);
scene.fog = new THREE.Fog(0x87bfe8, 900, 5200);
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 9000);

scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x4a6b3a, 0.95));
const sun = new THREE.DirectionalLight(0xfff2d0, 1.1);
sun.position.set(600, 900, 300);
scene.add(sun);

buildTerrain(scene);
const { plane, prop } = buildAircraft();
scene.add(plane);
const props = buildMissionProps(scene);

const world = {
  state: freshState(),
  mission: freshMission('rings'),
  props,
  cameraMode: 'chase',
  started: false,
};

let dropWasDown = false;
installInput((code) => {
  world.started = true;
  document.getElementById('title').style.display = 'none';
  if (code === 'KeyC') world.cameraMode = world.cameraMode === 'chase' ? 'cockpit' : 'chase';
  if (code === 'Digit1') world.mission = freshMission('rings');
  if (code === 'Digit2') world.mission = freshMission('drop');
  if (code === 'Digit3') world.mission = freshMission('landing');
  if (code === 'KeyR') restart();
});

function restart() {
  world.state = freshState();
  world.mission = freshMission(world.mission.kind);
  props.crate.visible = false;
}

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function placeAircraft(s) {
  plane.position.set(s.pos.x, s.pos.y, s.pos.z);
  plane.rotation.order = 'YXZ';
  plane.rotation.y = -s.heading;
  plane.rotation.x = s.pitch;
  plane.rotation.z = -s.roll;
  prop.rotation.z += 0.2 + s.throttle * 2.2;
}

function placeCamera(s) {
  const fwd = new THREE.Vector3(Math.sin(s.heading), 0, -Math.cos(s.heading));
  if (world.cameraMode === 'cockpit') {
    const eye = new THREE.Vector3(s.pos.x, s.pos.y + 1.2, s.pos.z).addScaledVector(fwd, -0.5);
    camera.position.copy(eye);
    camera.lookAt(eye.clone().add(fwd).add(new THREE.Vector3(0, Math.sin(s.pitch) * 4, 0)));
    plane.visible = false;
    document.getElementById('panel').style.display = 'block';
    drawPanel(s);
  } else {
    const back = new THREE.Vector3(s.pos.x, s.pos.y + 4.5, s.pos.z).addScaledVector(fwd, -16);
    if (shotName) camera.position.copy(back); else camera.position.lerp(back, 0.25);
    camera.lookAt(s.pos.x + fwd.x * 30, s.pos.y + 1, s.pos.z + fwd.z * 30);
    plane.visible = true;
    document.getElementById('panel').style.display = 'none';
  }
}

function handleEvents(events, s, m, now) {
  for (const e of events) {
    if (e === 'ring') showMessage(m, `Ring ${m.ringsDone} — next one lit green`, now);
    if (e === 'course-complete') showMessage(m, `Course complete in ${Math.round(s.time)}s!`, now, 6);
    if (e === 'dropped') showMessage(m, 'Crate away!', now, 2);
    if (e === 'drop-hit') showMessage(m, `Bullseye-ish! Drop score ${m.crate.score}`, now, 5);
    if (e === 'drop-miss') showMessage(m, `Missed the clearing (score ${m.crate.score}) — Space to try again`, now, 5);
    if (e === 'hard-landing') showMessage(m, 'Hard landing! Airframe damaged', now, 4);
    if (e === 'crash') showMessage(m, 'Crashed. Press R to fly again', now, 30);
    if (e === 'stall') showMessage(m, 'STALL — nose down, add power', now, 1.2);
    if (e === 'touchdown-strip' && m.kind === 'landing') {
      const score = scoreLanding(s);
      m.bestLanding = Math.max(m.bestLanding ?? 0, score);
      showMessage(m, `Touchdown! Landing score ${score} (best ${m.bestLanding})`, now, 6);
    }
    if (e === 'touchdown-rough') showMessage(m, 'Rough field landing — the strip is smoother', now, 4);
  }
}

if (shotName) {
  stageShot(shotName, world);
  document.getElementById('title').style.display = 'none';
  resize();
  placeAircraft(world.state);
  placeCamera(world.state);
  updateHud(world.state, world.mission, 0);
  renderer.render(scene, camera);
} else {
  let last = performance.now();
  let acc = 0;
  function frame(nowMs) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    const s = world.state;
    if (world.started && !s.crashed) {
      acc += dt;
      while (acc >= STEP) {
        const ctl = readControls();
        const dropPressed = !!keys.Space && !dropWasDown;
        dropWasDown = !!keys.Space;
        const ev1 = stepFlight(s, ctl, STEP);
        const ev2 = stepMission(world.mission, s, props, STEP, dropPressed);
        handleEvents([...ev1, ...ev2], s, world.mission, s.time);
        acc -= STEP;
      }
    }
    placeAircraft(s);
    placeCamera(s);
    updateHud(s, world.mission, s.time);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
