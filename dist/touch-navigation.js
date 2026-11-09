export const compactViewport = matchMedia('(max-width: 720px), (max-width: 1000px) and (max-height: 520px)');

// Keep movement and camera look on separate pointer IDs so two thumbs can work together.
export function createTouchNavigation({joystick, knob, liftButtons, lookSurface, canLook, onLookStart, onLook, onInput}) {
  let moveId = null, lookId = null, lastX = 0, lastY = 0;
  let x = 0, z = 0;
  let lift = 0;
  const lifts = new Map();

  function updateStick(event) {
    const {left, top, width, height} = joystick.getBoundingClientRect();
    const radius = width * .32;
    if (!radius) return;
    const dx = (event.clientX - left - width / 2) / radius;
    const dz = (event.clientY - top - height / 2) / radius;
    const length = Math.hypot(dx, dz);
    const travel = Math.max(1, length);
    const speed = Math.max(0, (Math.min(1, length) - .12) / .88);
    x = length ? dx / length * speed : 0;
    z = length ? dz / length * speed : 0;
    knob.style.transform = `translate(${dx / travel * radius}px, ${dz / travel * radius}px)`;
  }

  function centerStick() {
    moveId = null;
    x = z = 0;
    knob.style.transform = '';
    joystick.classList.remove('held');
  }

  joystick.addEventListener('pointerdown', event => {
    if (moveId !== null || event.button !== 0) return;
    event.preventDefault();
    joystick.setPointerCapture(event.pointerId);
    moveId = event.pointerId;
    joystick.classList.add('held');
    updateStick(event);
    onInput();
  });
  joystick.addEventListener('pointermove', event => {
    if (event.pointerId === moveId) updateStick(event);
  });

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    joystick.addEventListener(type, event => {
      if (event.pointerId === moveId) centerStick();
    });
  }

  for (const button of liftButtons) {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      if (lifts.has(event.pointerId)) return;
      const direction = Number(button.dataset.lift);
      lifts.set(event.pointerId, direction);
      lift += direction;
      onInput();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => {
        lift -= lifts.get(event.pointerId) || 0;
        lifts.delete(event.pointerId);
      });
    }
  }

  lookSurface.addEventListener('pointerdown', event => {
    if (!canLook() || lookId !== null || event.button !== 0) return;
    lookSurface.setPointerCapture(event.pointerId);
    lookId = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    onLookStart(event);
  });
  lookSurface.addEventListener('pointermove', event => {
    if (event.pointerId !== lookId) return;
    onLook(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    lookSurface.addEventListener(type, event => {
      if (event.pointerId === lookId) lookId = null;
    });
  }

  return {
    get x() { return x; },
    get z() { return z; },
    get lift() { return Math.sign(lift); },
    reset() {
      centerStick();
      lookId = null;
      lift = 0;
      lifts.clear();
    },
  };
}
