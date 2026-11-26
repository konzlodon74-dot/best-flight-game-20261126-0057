// HUD: DOM readouts (altitude, speed, heading tape, throttle/fuel bars, mission
// line) plus the cockpit instrument panel — artificial horizon, airspeed and
// altimeter dials drawn on a 2D canvas, lit like real gauges.
import { headingDeg } from './flight.js';
import { heightAt } from './terrain.js';
import { missionTitle } from './missions.js';

const $ = (id) => document.getElementById(id);
const FT = 3.28084, KT = 1.94384;

export function updateHud(s, m, now) {
  $('alt').textContent = Math.round(s.pos.y * FT);
  $('agl').textContent = Math.max(0, Math.round((s.pos.y - heightAt(s.pos.x, s.pos.z)) * FT));
  $('spd').textContent = Math.round(s.speed * KT);
  $('vs').textContent = Math.round(s.vs * FT * 60);
  $('dmg').textContent = Math.round(s.damage);
  $('tape').textContent = `HDG ${String(headingDeg(s)).padStart(3, '0')}°`;
  $('thrbar').firstElementChild.style.width = `${Math.round(s.throttle * 100)}%`;
  $('fuelbar').firstElementChild.style.width = `${Math.round(s.fuel)}%`;
  const t = Math.floor(s.time);
  $('clock').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('mission').textContent = `Mission: ${missionTitle(m)}`;
  $('message').textContent = now < m.messageUntil ? m.message : '';
  $('status').textContent = `Altitude ${Math.round(s.pos.y * FT)} feet, speed ${Math.round(s.speed * KT)} knots, heading ${headingDeg(s)}`;
}

export function showMessage(m, text, now, seconds = 3) {
  m.message = text;
  m.messageUntil = now + seconds;
}

function dial(ctx, cx, cy, r, label, value, min, max, unit) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#10151b'; ctx.fill();
  ctx.strokeStyle = '#8fb8d8'; ctx.lineWidth = 2; ctx.stroke();
  const a = Math.PI * 0.75 + ((value - min) / (max - min)) * Math.PI * 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#cfe8ff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + r - 14);
  ctx.fillText(`${Math.round(value)}${unit}`, cx, cy + 16);
}

/** Draw the cockpit panel: horizon ball in the middle, speed and altitude dials. */
export function drawPanel(s) {
  const cv = $('gauges');
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const cx = cv.width / 2, cy = 69, r = 58;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-s.roll);
  const pitchPx = s.pitch * 90;
  ctx.fillStyle = '#3f8fd2'; ctx.fillRect(-r * 2, -r * 2 + pitchPx, r * 4, r * 2);
  ctx.fillStyle = '#7a5a33'; ctx.fillRect(-r * 2, pitchPx, r * 4, r * 2);
  ctx.fillStyle = '#fff'; ctx.fillRect(-r * 2, pitchPx - 1, r * 4, 2);
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#8fb8d8'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffd34d';
  ctx.fillRect(cx - 26, cy - 2, 18, 4); ctx.fillRect(cx + 8, cy - 2, 18, 4); ctx.fillRect(cx - 2, cy - 2, 4, 4);
  dial(ctx, 110, cy, 52, 'AIRSPEED', s.speed * KT, 0, 140, 'kt');
  dial(ctx, cv.width - 110, cy, 52, 'ALTIMETER', (s.pos.y * FT) % 1000, 0, 1000, 'ft');
  dial(ctx, 220, cy, 40, 'FUEL', s.fuel, 0, 100, '%');
  dial(ctx, cv.width - 220, cy, 40, 'THROTTLE', s.throttle * 100, 0, 100, '%');
}
