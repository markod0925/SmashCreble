const stickDeadZone = 0.22;
const verticalThreshold = 0.55;

export class TouchControls {
  constructor(element) {
    this.element = element;
    this.stick = element.querySelector('.touch-stick');
    this.thumb = this.stick.querySelector('.touch-stick-thumb');
    this.buttons = new Map([...element.querySelectorAll('[data-action]')].map((button) => [button.dataset.action, button]));
    this.pointers = new Map();
    this.pending = new Set();
    this.directionPointer = null;
    this.x = 0;
    this.y = 0;

    element.addEventListener('pointerdown', (event) => {
      if (element.hidden || event.button !== 0) return;
      const button = event.target.closest('[data-action]');
      const onStick = this.stick.contains(event.target) && this.directionPointer === null;
      if (!button && !onStick) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      if (button) {
        const { action } = button.dataset;
        if (!this.isHeld(action)) this.pending.add(action);
        this.pointers.set(event.pointerId, action);
        button.classList.add('held');
      } else {
        this.directionPointer = event.pointerId;
        this.move(event);
      }
    });
    element.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.directionPointer) this.move(event);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      element.addEventListener(type, (event) => this.release(event.pointerId));
    }
    element.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('blur', () => this.clear());
    window.addEventListener('resize', () => this.clear());
  }

  show(visible) {
    this.element.hidden = !visible;
    if (!visible) this.clear();
  }

  isHeld(action) {
    return [...this.pointers.values()].includes(action);
  }

  move(event) {
    const { left, top, width, height } = this.stick.getBoundingClientRect();
    const radius = (width - this.thumb.offsetWidth) / 2;
    if (radius <= 0) return;
    const dx = event.clientX - left - width / 2;
    const dy = event.clientY - top - height / 2;
    const distance = Math.hypot(dx, dy);
    const travel = Math.min(1, radius / (distance || 1));
    const magnitude = Math.max(0, (Math.min(distance / radius, 1) - stickDeadZone) / (1 - stickDeadZone));
    const scale = magnitude / (distance || 1);
    const y = -dy * scale;
    if (y > verticalThreshold && this.y <= verticalThreshold) this.pending.add('jump');
    if (y < -verticalThreshold && this.y >= -verticalThreshold) this.pending.add('drop');
    this.setDirection(dx * scale, y, dx * travel, dy * travel);
  }

  setDirection(x, y, dx = 0, dy = 0) {
    this.x = x;
    this.y = y;
    this.thumb.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  release(pointerId) {
    if (pointerId === this.directionPointer) {
      this.directionPointer = null;
      this.setDirection(0, 0);
    }
    const action = this.pointers.get(pointerId);
    this.pointers.delete(pointerId);
    if (action && !this.isHeld(action)) this.buttons.get(action).classList.remove('held');
  }

  clear() {
    for (const pointerId of [...this.pointers.keys(), this.directionPointer]) {
      if (pointerId !== null && this.element.hasPointerCapture(pointerId)) this.element.releasePointerCapture(pointerId);
    }
    this.pointers.clear();
    this.pending.clear();
    this.directionPointer = null;
    this.setDirection(0, 0);
    for (const button of this.buttons.values()) button.classList.remove('held');
  }

  merge(input) {
    if (this.directionPointer !== null) {
      input.x = this.x;
      input.y = this.y;
    }
    const shield = this.isHeld('guard') || this.pending.has('guard');
    const attackPressed = this.pending.has('light');
    const specialPressed = this.pending.has('special');
    const attack = this.isHeld('light') || attackPressed;
    const special = this.isHeld('special') || specialPressed;
    const heavy = attack && special && !shield;
    input.heavy ||= heavy;
    input.heavyPressed ||= heavy && (attackPressed || specialPressed);
    input.dodgePressed ||= shield && attackPressed;
    input.jumpPressed ||= this.pending.has('jump') && !special;
    input.dropPressed = this.pending.has('drop');
    for (const action of this.buttons.keys()) {
      const pressed = this.pending.has(action);
      // Preserve taps that begin and end between animation frames.
      input[action] ||= this.isHeld(action) || pressed;
      if (action !== 'guard') input[`${action}Pressed`] ||= pressed && !shield;
    }
    this.pending.clear();
  }
}
