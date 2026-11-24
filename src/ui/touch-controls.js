export class TouchControls {
  constructor(element) {
    this.element = element;
    this.dpad = element.querySelector('.touch-dpad');
    this.buttons = new Map([...element.querySelectorAll('[data-action]')].map((button) => [button.dataset.action, button]));
    this.pointers = new Map();
    this.pending = new Set();
    this.directionPointer = null;
    this.x = 0;
    this.y = 0;

    element.addEventListener('pointerdown', (event) => {
      if (element.hidden || event.button !== 0) return;
      const button = event.target.closest('[data-action]');
      const onPad = this.dpad.contains(event.target) && this.directionPointer === null;
      if (!button && !onPad) return;
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
    const { left, top, width, height } = this.dpad.getBoundingClientRect();
    const direction = (offset, size) => Math.max(-1, Math.min(1, Math.floor(3 * offset / size) - 1));
    this.setDirection(direction(event.clientX - left, width), -direction(event.clientY - top, height));
  }

  setDirection(x, y) {
    if (this.x === x && this.y === y) return;
    this.dpad.children[(1 - this.y) * 3 + 1 + this.x].classList.remove('held');
    this.x = x;
    this.y = y;
    if (x || y) this.dpad.children[(1 - y) * 3 + 1 + x].classList.add('held');
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
    input.x = this.x || input.x;
    input.y = this.y || input.y;
    for (const action of this.buttons.keys()) {
      const pressed = this.pending.has(action);
      // Preserve taps that begin and end between animation frames.
      input[action] ||= this.isHeld(action) || pressed;
      if (action !== 'guard') input[`${action}Pressed`] ||= pressed;
    }
    this.pending.clear();
  }
}
