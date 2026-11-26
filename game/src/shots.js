// Screenshot staging behind ?shot=cover|cockpit|landing|drop. Each scene puts the
// real aircraft and mission state in a flying pose and renders one true frame:
// cover = chase view over the canyon with a ring ahead; cockpit = panel view on
// approach; landing = low over the strip; drop = crate away over the clearing.
import { freshState } from './flight.js';
import { freshMission, RING_COURSE, DROP_ZONE } from './missions.js';
import { heightAt } from './terrain.js';

export function stageShot(name, world) {
  const s = world.state;
  Object.assign(s, freshState());
  world.mission = freshMission('rings');
  world.cameraMode = 'chase';
  world.started = true;

  if (name === 'cockpit') {
    s.pos = { x: 0, y: 60, z: 1500 };
    s.heading = 0; s.pitch = -0.08; s.speed = 30; s.throttle = 0.45;
    world.mission = freshMission('landing');
    world.cameraMode = 'cockpit';
    return;
  }
  if (name === 'landing') {
    s.pos = { x: -6, y: 48, z: 1420 };
    s.heading = 0; s.pitch = -0.12; s.speed = 27; s.throttle = 0.3;
    world.mission = freshMission('landing');
    return;
  }
  if (name === 'drop') {
    s.pos = { x: DROP_ZONE.x - 260, y: heightAt(DROP_ZONE.x, DROP_ZONE.z) + 190, z: DROP_ZONE.z + 180 };
    s.heading = Math.atan2(DROP_ZONE.x - s.pos.x, -(DROP_ZONE.z - s.pos.z));
    s.pitch = 0.02; s.roll = 0.18; s.speed = 36; s.throttle = 0.6;
    world.mission = freshMission('drop');
    world.mission.crate = { x: s.pos.x + 40, y: s.pos.y - 45, z: s.pos.z - 30, vy: -8, landed: false };
    world.props.crate.visible = true;
    world.props.crate.position.set(world.mission.crate.x, world.mission.crate.y, world.mission.crate.z);
    return;
  }
  // cover (default): banked over the canyon, first ring dead ahead, island behind.
  const [rx, ry, rz] = RING_COURSE[0];
  s.pos = { x: rx + 210, y: ry + 12, z: rz + 260 };
  s.heading = Math.atan2(rx - s.pos.x, -(rz - s.pos.z));
  s.pitch = -0.05; s.roll = 0.35; s.speed = 40; s.throttle = 0.72;
}
