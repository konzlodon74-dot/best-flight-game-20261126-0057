// Seeded value noise and the Emberline Island heightfield: one function both the
// terrain mesh and the flight model read, so the ground you see is the ground you hit.
const THREE = window.THREE;

export const WORLD = {
  size: 4200,          // island span in metres
  segments: 128,
  waterY: 0,
  peak: 260,
  runway: { x: 0, z: 900, heading: 0, length: 700, width: 34 },
};

function hash2(x, z) {
  let h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, z) {
  return smoothNoise(x, z) * 0.55 + smoothNoise(x * 2.3, z * 2.3) * 0.3 + smoothNoise(x * 5.1, z * 5.1) * 0.15;
}

/** Ground height in metres at world (x, z); 0 at and below the shoreline. */
export function heightAt(x, z) {
  const d = Math.hypot(x, z) / (WORLD.size * 0.5);
  const falloff = Math.max(0, 1 - d * d * 1.15);
  let h = Math.pow(fbm(x / 900 + 7, z / 900 + 3), 1.6) * WORLD.peak * falloff;
  // Carve a canyon the ring course threads through.
  const canyon = Math.exp(-Math.pow((z - 0.35 * x) / 260, 2)) * 90 * falloff;
  h = Math.max(0, h - canyon);
  // Flatten the airstrip bench: fully flat on the strip rectangle, blending out.
  const rx = Math.abs(x - WORLD.runway.x), rz = Math.abs(z - WORLD.runway.z);
  const outside = Math.max(rx - 46, rz - (WORLD.runway.length / 2 + 30), 0);
  const bench = Math.max(0, 1 - outside / 170);
  return h * (1 - bench) + 6 * bench;
}

function terrainColor(h, slope) {
  if (h < 2) return [0.76, 0.70, 0.52];              // sand
  if (slope > 0.55) return [0.45, 0.42, 0.40];       // rock
  if (h > 150) return [0.82, 0.84, 0.86];            // snow caps
  if (h > 80) return [0.38, 0.46, 0.30];             // high scrub
  return [0.30, 0.52, 0.28];                          // grass
}

/** Build the island mesh, water, runway, trees and hangars; returns the group. */
export function buildTerrain(scene) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, WORLD.segments, WORLD.segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const slope = Math.abs(heightAt(x + 18, z) - h) / 18 + Math.abs(heightAt(x, z + 18) - h) / 18;
    const [r, g, b] = terrainColor(h, slope);
    colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.size * 3, WORLD.size * 3),
    new THREE.MeshLambertMaterial({ color: 0x1d5f8a, transparent: true, opacity: 0.92 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WORLD.waterY - 1.5;
  group.add(water);

  group.add(buildRunway());
  group.add(buildTrees());
  group.add(buildHangars());
  scene.add(group);
  return group;
}

function buildRunway() {
  const { x, z, length, width } = WORLD.runway;
  const g = new THREE.Group();
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.4, length),
    new THREE.MeshLambertMaterial({ color: 0x3a3f45 }),
  );
  strip.position.set(x, 6.2, z);
  g.add(strip);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf5f2e6 });
  for (let i = -6; i <= 6; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 18), dashMat);
    dash.position.set(x, 6.45, z + i * 52);
    g.add(dash);
  }
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffd34d });
  for (const side of [-1, 1]) {
    for (let i = -7; i <= 7; i += 1) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 5), edgeMat);
      lamp.position.set(x + side * (width / 2 + 2), 7.2, z + i * 48);
      g.add(lamp);
    }
  }
  return g;
}

function buildTrees() {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e6b34 });
  let placed = 0;
  for (let i = 0; placed < 240 && i < 4000; i += 1) {
    const x = (hash2(i, 11) - 0.5) * WORLD.size * 0.9;
    const z = (hash2(i, 29) - 0.5) * WORLD.size * 0.9;
    const h = heightAt(x, z);
    if (h < 3 || h > 110) continue;
    if (Math.abs(x - WORLD.runway.x) < 90 && Math.abs(z - WORLD.runway.z) < 480) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 5), trunkMat);
    trunk.position.set(x, h + 2.5, z);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(3.4, 9, 7), leafMat);
    crown.position.set(x, h + 9, z);
    g.add(trunk, crown);
    placed += 1;
  }
  return g;
}

function buildHangars() {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x9aa3ab });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xb3543f });
  for (const [x, z, rot] of [[-70, 760, 0.2], [80, 1080, -0.15], [-60, 1120, 0.5]]) {
    const hut = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 18), wallMat);
    walls.position.y = 4.5;
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 27, 3, 1), roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.y = 11;
    hut.add(walls, roof);
    hut.position.set(x, heightAt(x, z), z);
    hut.rotation.y = rot;
    g.add(hut);
  }
  return g;
}
