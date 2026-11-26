// The bush plane, built from primitives: fuselage, high wing, tail, spinning prop,
// lit cabin windows and nav lights, so it reads as an aircraft from chase and cockpit.
const THREE = window.THREE;

const BODY = new THREE.MeshLambertMaterial({ color: 0xd86a2c });
const CREAM = new THREE.MeshLambertMaterial({ color: 0xf2e8d5 });
const DARK = new THREE.MeshLambertMaterial({ color: 0x2b3138 });
const GLASS = new THREE.MeshLambertMaterial({ color: 0x9fd8f0, emissive: 0x2c5a72 });

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

/** Build the aircraft group; the prop is returned separately so the loop can spin it. */
export function buildAircraft() {
  const plane = new THREE.Group();
  // Fuselage: tapered cylinder along -Z (nose at -Z), cabin block, engine cowl.
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.85, 7.5, 10), BODY);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.z = 0.4;
  plane.add(fuselage);
  plane.add(box(1.5, 1.1, 2.6, CREAM, 0, 0.45, -0.6));            // cabin
  plane.add(box(1.3, 0.5, 1.6, GLASS, 0, 0.95, -1.1));            // windscreen band
  plane.add(box(1.1, 1.0, 1.2, DARK, 0, 0.1, -3.6));              // cowl
  // High wing with struts and cream tips.
  plane.add(box(11, 0.22, 1.7, BODY, 0, 1.15, -0.4));
  plane.add(box(1.4, 0.24, 1.7, CREAM, -5.2, 1.15, -0.4));
  plane.add(box(1.4, 0.24, 1.7, CREAM, 5.2, 1.15, -0.4));
  for (const s of [-1, 1]) {
    const strut = box(0.12, 1.6, 0.12, DARK, s * 1.6, 0.35, -0.4);
    strut.rotation.z = s * 0.5;
    plane.add(strut);
  }
  // Tail: horizontal stabiliser, fin, rudder stripe.
  plane.add(box(3.6, 0.16, 1.1, BODY, 0, 0.35, 3.9));
  plane.add(box(0.16, 1.7, 1.3, BODY, 0, 1.0, 3.9));
  plane.add(box(0.18, 0.7, 1.3, CREAM, 0, 1.6, 3.9));
  // Fixed gear with wheel spats.
  for (const s of [-1, 1]) {
    plane.add(box(0.14, 1.1, 0.14, DARK, s * 0.9, -0.9, -1.2));
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), DARK);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(s * 0.9, -1.45, -1.2);
    plane.add(wheel);
  }
  const tailWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 8), DARK);
  tailWheel.rotation.z = Math.PI / 2;
  tailWheel.position.set(0, -0.55, 4.2);
  plane.add(tailWheel);
  // Nav lights: red left, green right, white tail — lit, so the plane reads at a glance.
  const lamp = (color, x, y, z) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshBasicMaterial({ color }));
    m.position.set(x, y, z);
    return m;
  };
  plane.add(lamp(0xff4444, -5.5, 1.15, -0.4));
  plane.add(lamp(0x44ff77, 5.5, 1.15, -0.4));
  plane.add(lamp(0xffffff, 0, 0.4, 4.6));
  // Propeller: two blades + spinner, spins with throttle.
  const prop = new THREE.Group();
  prop.add(box(0.18, 2.6, 0.06, DARK, 0, 0, 0));
  const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 8), CREAM);
  spinner.rotation.x = -Math.PI / 2;
  prop.add(spinner);
  prop.position.set(0, 0.1, -4.35);
  plane.add(prop);
  return { plane, prop };
}
