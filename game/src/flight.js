// Arcade flight model: throttle sets target speed, pitch trades speed for climb,
// bank turns the nose, low speed stalls. Fuel burns with throttle; hard ground
// contact damages the airframe. State is plain data so shots can stage it.
import { heightAt } from './terrain.js';

export const PLANE = {
  minSpeed: 16,       // m/s, below this the wing stalls
  maxSpeed: 62,
  cruiseThrottle: 0.55,
  fuelBurn: 0.55,     // %/s at full throttle
};

export function freshState() {
  return {
    pos: { x: 0, y: 60, z: 1500 },   // on final for the strip, airborne start
    heading: 0,                      // radians, 0 = north (-Z), toward the strip
    pitch: 0, roll: 0,
    speed: 34, vs: 0,
    throttle: PLANE.cruiseThrottle,
    fuel: 100, damage: 0,
    airborne: true, crashed: false, landed: false,
    time: 0,
  };
}

/** Advance the aircraft one step; returns events like 'stall' | 'crash' | 'touchdown'. */
export function stepFlight(s, ctl, dt) {
  const events = [];
  s.time += dt;
  s.throttle = clamp(s.throttle + ctl.throttle * 0.5 * dt, 0, 1);
  if (s.fuel <= 0) s.throttle = 0;
  s.fuel = Math.max(0, s.fuel - PLANE.fuelBurn * s.throttle * dt);

  const authority = clamp(s.speed / 30, 0.35, 1.15);   // controls bite harder with speed
  s.pitch = clamp(s.pitch + ctl.pitch * 0.9 * authority * dt, -0.65, 0.6);
  s.roll = clamp(s.roll + ctl.roll * 1.6 * authority * dt, -1.15, 1.15);
  if (ctl.roll === 0) s.roll *= Math.pow(0.4, dt);      // wings level themselves
  if (ctl.pitch === 0) s.pitch *= Math.pow(0.55, dt);

  const stalled = s.speed < PLANE.minSpeed;
  if (stalled) { s.pitch = Math.min(s.pitch, -0.25); events.push('stall'); }

  const target = PLANE.minSpeed + s.throttle * (PLANE.maxSpeed - PLANE.minSpeed);
  s.speed += (target - s.speed) * 0.35 * dt - Math.sin(s.pitch) * 9.8 * dt;
  s.speed = clamp(s.speed, 6, PLANE.maxSpeed + 12);

  const turnRate = Math.sin(s.roll) * 0.85 * authority;
  s.heading += turnRate * dt;
  const climb = Math.sin(s.pitch) * s.speed - (stalled ? 6 : 0);
  s.vs = climb;
  const fwd = Math.cos(s.pitch) * s.speed;
  s.pos.x += Math.sin(s.heading) * fwd * dt;
  s.pos.z += -Math.cos(s.heading) * fwd * dt;
  s.pos.y += climb * dt;

  const ground = heightAt(s.pos.x, s.pos.z);
  const gearY = ground + 1.6;
  if (s.pos.y <= gearY) {
    const sink = -s.vs;
    const onStrip = Math.abs(s.pos.x) < 20 && Math.abs(s.pos.z - 900) < 360;
    if (sink > 7 || Math.abs(s.roll) > 0.55 || s.speed > 46) {
      s.damage = Math.min(100, s.damage + 45);
      events.push('hard-landing');
    }
    if (s.damage >= 100 || sink > 13) { s.crashed = true; events.push('crash'); }
    s.pos.y = gearY;
    if (s.airborne) events.push(onStrip ? 'touchdown-strip' : 'touchdown-rough');
    s.airborne = false;
    s.pitch *= 0.6; s.roll *= 0.6;
    s.speed = Math.max(0, s.speed - (s.throttle > 0.75 ? -6 * dt : 9 * dt));
    if (s.speed > PLANE.minSpeed + 2 && s.pitch > 0.08) s.airborne = true;  // rotate off again
  } else {
    s.airborne = true;
  }
  if (s.pos.y < 1.6) { s.pos.y = 1.6; s.crashed = true; events.push('crash'); }  // ditched in the sea
  return events;
}

export function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

/** Heading in degrees 0..359 for the HUD tape. */
export function headingDeg(s) {
  return Math.round(((s.heading * 180 / Math.PI) % 360 + 360) % 360);
}
