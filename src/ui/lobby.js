import { $, button, node } from './dom.js';
import { arenas } from '../arenas/index.js';
import { fighters } from '../fighters/index.js';
import { playerColors } from '../player-colors.js';
import { audioReady, playSound } from '../audio.js';

export class Lobby {
  constructor(portrait, onPrimarySelection, startMatch, hasTouch = false) {
    this.content = $('dialog-content');
    this.portrait = portrait;
    this.onPrimarySelection = onPrimarySelection;
    this.startMatch = startMatch;
    this.keyboardLabel = hasTouch ? 'Touch / Keyboard' : 'Keyboard';
    this.selection = 0;
    this.arenaIndex = 0;
    this.snapshot = { pads: new Map(), unsupported: 0 };
    this.seats = [
      { source: 'keyboard', selection: 0, automatic: true },
      { source: 'cpu', selection: 1, automatic: true },
      null,
      null,
    ];
  }

  setPrimarySelection(selection) {
    this.selection = selection;
    const primary = this.seats.find((seat) => seat && seat.source !== 'cpu');
    if (primary) primary.selection = selection;
  }

  controllerSlot(pad) {
    return this.seats.findIndex((seat) => seat?.source === 'pad' && seat.id === pad.id && seat.index === pad.index);
  }

  updateControllers(snapshot) {
    this.snapshot = snapshot;
  }

  lineup() {
    return this.seats.flatMap((seat, slot) => seat ? [{ slot, fighter: fighters[seat.selection], cpu: seat.source === 'cpu' }] : []);
  }

  get arena() {
    return arenas[this.arenaIndex];
  }

  chooseArena(step) {
    this.arenaIndex = (this.arenaIndex + step + arenas.length) % arenas.length;
    this.arenaLabel.textContent = this.arena.name;
    audioReady();
    playSound('select');
  }

  padFor(seat) {
    const pad = this.snapshot.pads.get(seat.index);
    return pad?.id === seat.id ? pad : null;
  }

  missingControllers() {
    return this.seats.filter((seat) => seat?.source === 'pad' && !this.padFor(seat));
  }

  joinPad(pad, reconnectOnly = false) {
    if (this.controllerSlot(pad) >= 0) return false;
    const disconnected = this.seats.findIndex((seat) => seat?.source === 'pad' && !this.padFor(seat) && seat.id === pad.id);
    if (disconnected >= 0) {
      this.seats[disconnected].index = pad.index;
      return true;
    }
    if (reconnectOnly) return false;
    const replaceable = this.seats.findIndex((seat) => seat?.automatic);
    const empty = this.seats.indexOf(null);
    const cpu = this.seats.findIndex((seat) => seat?.source === 'cpu');
    const slot = replaceable >= 0 ? replaceable : empty >= 0 ? empty : cpu;
    if (slot < 0) return false;
    this.seats[slot] = { source: 'pad', id: pad.id, index: pad.index, selection: this.seats[slot]?.selection ?? (this.selection + slot) % fighters.length };
    return true;
  }

  chooseSeat(slot, step) {
    const seat = this.seats[slot];
    seat.selection = (seat.selection + step + fighters.length) % fighters.length;
    audioReady();
    playSound('select');
    if (seat === this.seats.find((item) => item && item.source !== 'cpu')) this.onPrimarySelection(seat.selection);
    this.render();
  }

  seatRow(seat, slot) {
    const row = node('div', `lobby-slot${seat ? '' : ' slot-empty'}`);
    row.style.setProperty('--player', playerColors[slot]);
    row.append(node('span', 'slot-label', `P${slot + 1}`));
    if (!seat) {
      row.append(node('span', '', 'Open seat'), node('span', '', 'Press A or Start to join'));
      return row;
    }
    const source = seat.source === 'cpu' ? 'CPU' : seat.source === 'keyboard' ? this.keyboardLabel : this.padFor(seat) ? 'Controller' : 'Disconnected';
    const fighter = fighters[seat.selection];
    const pick = node('div', 'slot-pick');
    const prev = button('‹', () => this.chooseSeat(slot, -1), '');
    const next = button('›', () => this.chooseSeat(slot, 1), '');
    const remove = button('×', () => { this.seats[slot] = null; this.render(); }, 'slot-remove');
    for (const [el, action] of [[prev, 'Previous fighter for'], [next, 'Next fighter for'], [remove, 'Remove']]) {
      el.setAttribute('aria-label', `${action} player ${slot + 1}`);
      el.dataset.focus = `${action}-${slot}`;
    }
    pick.append(prev, this.portrait(fighter), node('strong', '', fighter.name), next);
    row.append(node('span', 'slot-source', source), pick, remove);
    return row;
  }

  canBegin() {
    return this.seats.filter(Boolean).length >= 2 && this.seats.some((seat) => seat && seat.source !== 'cpu') && !this.missingControllers().length;
  }

  render(focusStart = false) {
    const focusKey = document.activeElement?.dataset.focus;
    const rows = node('div', 'lobby-slots');
    this.seats.forEach((seat, i) => rows.append(this.seatRow(seat, i)));
    const arena = button('', () => this.chooseArena(1), 'text-button lobby-arena');
    arena.dataset.focus = 'arena';
    this.arenaLabel = node('strong', '', this.arena.name);
    this.arenaLabel.setAttribute('aria-live', 'polite');
    const arrow = node('span', '', '↻');
    arrow.setAttribute('aria-hidden', 'true');
    arena.append(node('span', '', 'Arena'), this.arenaLabel, arrow);
    const note = node('p', 'dialog-note', 'Press A or Start to join. On a controller, left and right pick a fighter. Up and down change the arena. Press Start to fight.');
    const actions = node('div', 'dialog-actions');
    const fight = button('Start fight', this.startMatch, 'primary-button');
    fight.dataset.focus = 'start';
    fight.disabled = !this.canBegin();
    const addCPU = button('Add CPU', () => this.addSeat('cpu'));
    addCPU.dataset.focus = 'cpu';
    addCPU.disabled = !this.seats.includes(null);
    const addKey = button(`Add ${this.keyboardLabel.toLowerCase()}`, () => this.addSeat('keyboard'));
    addKey.dataset.focus = 'keyboard';
    addKey.disabled = this.seats.some((seat) => seat?.source === 'keyboard') || !this.seats.some((seat) => !seat || seat.source === 'cpu');
    actions.append(fight, addCPU, addKey);
    if (!this.canBegin()) note.textContent = this.missingControllers().length ? 'Reconnect or remove disconnected controllers to start.' : 'Choose at least two fighters, including a human player.';
    else if (this.snapshot.unsupported) note.textContent += ' A controller without a standard browser mapping was detected.';
    this.content.replaceChildren(rows, arena, note, actions);
    const prior = [...this.content.querySelectorAll('button')].find((el) => el.dataset.focus === focusKey && !el.disabled);
    if (prior) prior.focus();
    else if (focusStart && !fight.disabled) fight.focus();
  }

  addSeat(source) {
    const empty = this.seats.indexOf(null);
    const slot = empty >= 0 ? empty : this.seats.findIndex((seat) => seat?.source === 'cpu');
    if (slot < 0) return;
    this.seats[slot] = { source, selection: source === 'keyboard' ? this.selection : (this.selection + slot) % fighters.length };
    this.render();
  }
}
