// Three sorties with different goals: thread the canyon ring course in order,
// drop a supply crate into the marked clearing, or grease a precision landing
// on the strip. Each tracks its own progress and reports a score.
const THREE = window.THREE;
import { heightAt } from './terrain.js';

export const RING_COURSE = [
  [-300, 150, 900], [-650, 130, 420], [-900, 170, -60], [-620, 210, -520],
  [-180, 190, -760], [260, 160, -560], [520, 130, -120], [380, 110, 380],
];
export const DROP_ZONE = { x: 700, z: -900, radius: 90 };

export function buildMissionProps(scene) {
  const rings = RING_COURSE.map(([x, y, z], i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(26, 1.6, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xff8c3a }),
    );
    ring.position.set(x, y, z);
    const next = RING_COURSE[(i + 1) % RING_COURSE.length];
    ring.lookAt(next[0], next[1], next[2]);
    scene.add(ring);
    return ring;
  });
  const dz = new THREE.Mesh(
    new THREE.CircleGeometry(DROP_ZONE.radius, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.55 }),
  );
  dz.rotation.x = -Math.PI / 2;
  dz.position.set(DROP_ZONE.x, heightAt(DROP_ZONE.x, DROP_ZONE.z) + 1.5, DROP_ZONE.z);
  scene.add(dz);
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.2, 2.2),
    new THREE.MeshLambertMaterial({ color: 0xc9a24d }),
  );
  crate.visible = false;
  scene.add(crate);
  return { rings, dz, crate };
}

export function freshMission(kind) {
  return {
    kind,            // 'rings' | 'drop' | 'landing'
    nextRing: 0, ringsDone: 0,
    crate: null,     // {x,y,z,vy,landed,score}
    drops: 0,
    bestLanding: null,
    message: '', messageUntil: 0,
  };
}

export function missionTitle(m) {
  if (m.kind === 'rings') return `Ring Run — ring ${Math.min(m.nextRing + 1, RING_COURSE.length)} of ${RING_COURSE.length}`;
  if (m.kind === 'drop') return 'Cargo Drop — Space over the yellow clearing';
  return 'Precision Landing — touch down soft and centred on the strip';
}

/** Per-step mission logic; returns score events for the HUD. */
export function stepMission(m, s, props, dt, dropPressed) {
  const events = [];
  props.rings.forEach((ring, i) => {
    ring.material.color.setHex(m.kind === 'rings' && i === m.nextRing ? 0x53ff7a : 0xff8c3a);
    ring.visible = m.kind === 'rings';
  });
  props.dz.visible = m.kind === 'drop';

  if (m.kind === 'rings' && m.nextRing < RING_COURSE.length) {
    const [x, y, z] = RING_COURSE[m.nextRing];
    const d = Math.hypot(s.pos.x - x, s.pos.y - y, s.pos.z - z);
    if (d < 30) {
      m.nextRing += 1; m.ringsDone += 1;
      events.push(m.nextRing >= RING_COURSE.length ? 'course-complete' : 'ring');
    }
  }

  if (m.kind === 'drop') {
    if (dropPressed && !m.crate && s.airborne) {
      m.crate = { x: s.pos.x, y: s.pos.y - 2, z: s.pos.z, vy: 0, landed: false };
      m.drops += 1;
      props.crate.visible = true;
      events.push('dropped');
    }
    if (m.crate && !m.crate.landed) {
      m.crate.vy -= 9.8 * dt;
      m.crate.y += m.crate.vy * dt;
      const g = heightAt(m.crate.x, m.crate.z) + 1.1;
      if (m.crate.y <= g) {
        m.crate.y = g; m.crate.landed = true;
        const off = Math.hypot(m.crate.x - DROP_ZONE.x, m.crate.z - DROP_ZONE.z);
        m.crate.score = Math.max(0, Math.round(100 - off));
        events.push(off <= DROP_ZONE.radius ? 'drop-hit' : 'drop-miss');
      }
      props.crate.position.set(m.crate.x, m.crate.y, m.crate.z);
    }
  }
  return events;
}

/** Score a touchdown on the strip: soft, slow and centred wins. */
export function scoreLanding(s) {
  const centre = Math.abs(s.pos.x);
  const sink = Math.max(0, -s.vs);
  return Math.max(0, Math.round(100 - centre * 2 - sink * 6 - Math.max(0, s.speed - 26) * 1.5));
}
