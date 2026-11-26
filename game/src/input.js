// Keyboard and mouse state: arrows/WASD pitch and roll, W/S or Shift/Ctrl throttle,
// mouse position steers when moved. One plain object the flight model reads each step.
export const keys = {};
export const mouse = { x: 0, y: 0, active: false };

export function installInput(onKey) {
  addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    onKey(e.code);
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
    mouse.active = true;
  });
  addEventListener('mousedown', () => onKey('Click'));
}

/** Control deflections in [-1, 1]: pitch (nose up +), roll (right bank +), throttle delta. */
export function readControls() {
  let pitch = 0, roll = 0, throttle = 0;
  if (keys.ArrowUp) pitch -= 1;
  if (keys.ArrowDown) pitch += 1;
  if (keys.ArrowLeft || keys.KeyA) roll -= 1;
  if (keys.ArrowRight || keys.KeyD) roll += 1;
  if (keys.KeyW || keys.ShiftLeft || keys.ShiftRight) throttle += 1;
  if (keys.KeyS || keys.ControlLeft || keys.ControlRight) throttle -= 1;
  if (mouse.active && pitch === 0 && roll === 0) {
    pitch = -mouse.y * 0.8;
    roll = mouse.x * 0.9;
  }
  return { pitch, roll, throttle };
}
