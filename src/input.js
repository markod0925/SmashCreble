const keyboardMapping = {
  jump: ['Space'], light: ['KeyJ'], heavy: ['KeyK'], special: ['KeyL'], guard: ['ShiftLeft', 'ShiftRight'],
  dodge: ['KeyI'], start: ['Escape'], accept: ['Enter'], back: ['Backspace'],
};

const directions = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'];
const captured = new Set([...directions, ...Object.values(keyboardMapping).flat()]);
const digital = (negative, positive) => Number(positive) - Number(negative);
const axis = (value = 0) => Math.abs(value) < .22 ? 0 : Math.sign(value) * Math.min(1, (Math.abs(value) - .22) / .78);

export const combatEdges = ['jumpPressed', 'lightPressed', 'heavyPressed', 'specialPressed', 'superPressed', 'dodgePressed'];

export function fighterInput(state, fighter, controller) {
  if (!fighter.moves) return { ...state };
  const input = { ...state };
  if (controller) {
    // Fighters with a Superstar move use A to attack and X to jump during combat.
    input.jump = state.light;
    input.jumpPressed = state.lightPressed;
    input.lightPressed = state.jumpPressed;
    input.light = state.jump;
  }
  input.superPressed = input.light && input.special && (input.lightPressed || input.specialPressed);
  return input;
}

function edges(current, previous = {}) {
  const snapshot = { ...current };
  for (const key of ['jump', 'light', 'heavy', 'special', 'dodge', 'start', 'accept', 'back']) {
    snapshot[`${key}Pressed`] = Boolean(current[key] && !previous[key]);
  }
  snapshot.navX = Math.abs(current.x) > .54 && Math.abs(previous.x ?? 0) <= .54 ? Math.sign(current.x) : 0;
  snapshot.navY = Math.abs(current.y) > .54 && Math.abs(previous.y ?? 0) <= .54 ? Math.sign(current.y) : 0;
  return snapshot;
}

export class Inputs {
  constructor(isFighting, touch = null) {
    this.keys = new Set();
    this.keyboard = {};
    this.pads = new Map();
    this.touch = touch;
    window.addEventListener('keydown', (event) => {
      if (!captured.has(event.code) || event.altKey || event.ctrlKey || event.metaKey) return;
      const focusedButton = event.target instanceof HTMLButtonElement;
      if (!isFighting() && focusedButton && ['Space', 'Enter'].includes(event.code)) return;
      event.preventDefault();
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  poll() {
    const has = (...codes) => codes.some((code) => this.keys.has(code));
    const keyboard = Object.fromEntries(Object.entries(keyboardMapping).map(([action, codes]) => [action, has(...codes)]));
    keyboard.x = digital(has('ArrowLeft', 'KeyA'), has('ArrowRight', 'KeyD'));
    keyboard.y = digital(has('ArrowDown', 'KeyS'), has('ArrowUp', 'KeyW'));
    const keyState = edges(keyboard, this.keyboard);
    this.keyboard = keyboard;
    this.touch?.merge(keyState);

    let gamepads = [];
    try {
      gamepads = Array.from(navigator.getGamepads?.() ?? []).filter((pad) => pad?.connected);
    } catch {
      // The browser can deny Gamepad API access. The keyboard remains available.
    }
    const padStates = new Map();
    const nextPads = new Map();
    for (const pad of gamepads) {
      if (pad.mapping !== 'standard') continue;
      const button = (i) => Boolean(pad.buttons[i]?.pressed || pad.buttons[i]?.value > .55);
      const current = {
        x: digital(button(14), button(15)) || axis(pad.axes[0]),
        y: digital(button(13), button(12)) || -axis(pad.axes[1]),
        jump: button(0), light: button(2), heavy: button(3), special: button(1),
        guard: button(6) || button(7), dodge: button(4) || button(5), start: button(9),
        accept: button(0), back: button(1),
      };
      const previous = this.pads.get(pad.index);
      padStates.set(pad.index, { id: pad.id, index: pad.index, ...edges(current, previous?.id === pad.id ? previous.current : undefined) });
      nextPads.set(pad.index, { id: pad.id, current });
    }
    this.pads = nextPads;
    return { keyboard: keyState, pads: padStates, unsupported: gamepads.length - padStates.size };
  }
}
