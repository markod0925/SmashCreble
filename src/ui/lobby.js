import { $, button, node } from './dom.js';
import { arenas } from '../arenas/index.js';
import { fighters } from '../fighters/index.js';
import { playerColors } from '../player-colors.js';
import { audioReady, playSound } from '../audio.js';
import { mobPlayerLimit, mobTargets } from '../combat/mob-smash.js';

export class Lobby {
  constructor(portrait, onPrimarySelection, startMatch, hasTouch = false) {
    this.content = $('dialog-content');
    this.portrait = portrait;
    this.onPrimarySelection = onPrimarySelection;
    this.startMatch = startMatch;
    this.keyboardLabel = hasTouch ? 'Touch / Keyboard' : 'Keyboard';
    this.selection = 0;
    this.arenaIndex = 0;
    this.adventure = false;
    this.campaignLevel = null;
    this.mobSmash = false;
    this.mobTarget = mobTargets[0];
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
    return this.seatSlots.find((slot) => {
      const seat = this.seats[slot];
      return seat?.source === 'pad' && seat.id === pad.id && seat.index === pad.index;
    }) ?? -1;
  }

  updateControllers(snapshot) {
    this.snapshot = snapshot;
  }

  lineup() {
    return this.seatSlots.flatMap((slot) => {
      const seat = this.seats[slot];
      return seat && (!(this.adventure || this.mobSmash) || seat.source !== 'cpu')
        ? [{ slot, fighter: fighters[seat.selection], cpu: seat.source === 'cpu' }] : [];
    });
  }

  get seatSlots() {
    const slots = this.seats.map((_, slot) => slot);
    if (!this.mobSmash) return slots;
    const isHuman = (slot) => this.seats[slot] && this.seats[slot].source !== 'cpu';
    return [...slots.filter(isHuman), ...slots.filter((slot) => !isHuman(slot))]
      .slice(0, mobPlayerLimit).sort((a, b) => a - b);
  }

  chooseMobTarget(target) {
    this.mobTarget = target;
    audioReady();
    playSound('select');
    this.render();
  }

  cycleMobTarget() {
    this.chooseMobTarget(mobTargets[(mobTargets.indexOf(this.mobTarget) + 1) % mobTargets.length]);
  }

  get arena() {
    return arenas[this.arenaIndex];
  }

  chooseArena(step) {
    if (this.adventure) return;
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
    return this.seatSlots.map((slot) => this.seats[slot]).filter((seat) => seat?.source === 'pad' && !this.padFor(seat));
  }

  joinPad(pad, reconnectOnly = false) {
    if (this.controllerSlot(pad) >= 0) return false;
    const slots = this.seatSlots;
    const disconnected = slots.find((slot) => {
      const seat = this.seats[slot];
      return seat?.source === 'pad' && !this.padFor(seat) && seat.id === pad.id;
    });
    if (disconnected !== undefined) {
      this.seats[disconnected].index = pad.index;
      return true;
    }
    if (reconnectOnly) return false;
    const slot = slots.find((index) => this.seats[index]?.automatic)
      ?? slots.find((index) => !this.seats[index])
      ?? slots.find((index) => this.seats[index]?.source === 'cpu');
    if (slot === undefined) return false;
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
    const lineup = this.lineup();
    return (this.adventure || this.mobSmash || lineup.length >= 2) &&
      lineup.some(({ cpu }) => !cpu) && !this.missingControllers().length;
  }

  render(focusStart = false) {
    const focusKey = document.activeElement?.dataset.focus;
    const rows = node('div', 'lobby-slots');
    const slots = this.seatSlots;
    for (const slot of slots) {
      const seat = this.seats[slot];
      rows.append(this.seatRow((this.adventure || this.mobSmash) && seat?.source === 'cpu' ? null : seat, slot));
    }
    let arena;
    if (!this.adventure) {
      arena = button('', () => this.chooseArena(1), 'text-button lobby-arena');
      arena.dataset.focus = 'arena';
      this.arenaLabel = node('strong', '', this.arena.name);
      this.arenaLabel.setAttribute('aria-live', 'polite');
      const arrow = node('span', '', '↻');
      arrow.setAttribute('aria-hidden', 'true');
      arena.append(node('span', '', 'Arena'), this.arenaLabel, arrow);
    }
    let targets;
    if (this.mobSmash) {
      targets = node('div', 'mob-targets');
      targets.setAttribute('role', 'group');
      targets.setAttribute('aria-label', 'KO target');
      targets.append(node('span', '', 'KO target'));
      for (const target of mobTargets) {
        const control = button(String(target), () => this.chooseMobTarget(target));
        control.dataset.focus = `target-${target}`;
        control.setAttribute('aria-pressed', String(target === this.mobTarget));
        targets.append(control);
      }
    }
    const note = node('p', 'dialog-note', this.campaignLevel
      ? `${this.campaignLevel.introduction} Press A or Start to join.` : this.adventure
      ? 'Press A or Start to join. Travel right and defeat the roster. Knock enemies into pits or deal 100% damage to open the way.'
      : this.mobSmash ? 'Up to three players. Press A or Start to join. Use LB or RB to change the KO target.'
      : 'Press A or Start to join. On a controller, left and right pick a fighter. Up and down change the arena. Press Start to fight.');
    const actions = node('div', 'dialog-actions');
    const fight = button(this.campaignLevel ? 'Start level' : this.adventure || this.mobSmash ? 'Start challenge' : 'Start fight', this.startMatch, 'primary-button');
    fight.dataset.focus = 'start';
    fight.disabled = !this.canBegin();
    const addCPU = button('Add CPU', () => this.addSeat('cpu'));
    addCPU.dataset.focus = 'cpu';
    addCPU.disabled = !this.seats.includes(null);
    const addKey = button(`Add ${this.keyboardLabel.toLowerCase()}`, () => this.addSeat('keyboard'));
    addKey.dataset.focus = 'keyboard';
    addKey.disabled = this.seats.some((seat) => seat?.source === 'keyboard') ||
      !slots.some((slot) => !this.seats[slot] || this.seats[slot].source === 'cpu');
    actions.append(fight);
    if (!this.adventure && !this.mobSmash) actions.append(addCPU);
    actions.append(addKey);
    if (!this.canBegin()) note.textContent = this.missingControllers().length ? 'Reconnect or remove disconnected controllers to start.' : this.adventure || this.mobSmash
      ? 'Choose at least one human player.' : 'Choose at least two fighters, including a human player.';
    else if (this.snapshot.unsupported) note.textContent += ' A controller without a standard browser mapping was detected.';
    this.content.replaceChildren(rows, ...(arena ? [arena] : []), ...(targets ? [targets] : []), note, actions);
    const prior = [...this.content.querySelectorAll('button')].find((el) => el.dataset.focus === focusKey && !el.disabled);
    if (prior) prior.focus();
    else if (focusStart && !fight.disabled) fight.focus();
  }

  addSeat(source) {
    const slots = this.seatSlots;
    const slot = slots.find((index) => !this.seats[index]) ?? slots.find((index) => this.seats[index]?.source === 'cpu');
    if (slot === undefined) return;
    this.seats[slot] = { source, selection: source === 'keyboard' ? this.selection : (this.selection + slot) % fighters.length };
    this.render();
  }
}
