import { audioReady, playSound, toggleSound, updateDanceMusic } from './audio.js';
import { rules } from './combat/arena.js';
import { createMatch, tickMatch } from './combat/match.js';
import { fighters } from './fighters/index.js';
import { combatEdges, fighterInput, Inputs } from './input.js';
import { Graphics } from './render/scene.js';
import { handleDismiss, hideDialog, navigateDialog, renderControls, renderPause, renderResults, showDialog } from './ui/dialog.js';
import { $ } from './ui/dom.js';
import { BattleHud } from './ui/hud.js';
import { Lobby } from './ui/lobby.js';
import { createPortraits } from './ui/portraits.js';
import { createRoster } from './ui/roster.js';
import { TouchControls } from './ui/touch-controls.js';

const canvas = document.createElement('canvas');
canvas.className = 'game-canvas';
canvas.setAttribute('aria-hidden', 'true');
$('hero-world').prepend(canvas);
let graphics;
let portrait;
try {
  graphics = new Graphics(canvas);
  portrait = createPortraits(graphics);
} catch (error) {
  const message = 'The 3D renderer could not start. Open Rift Ruckus in a browser with WebGL and graphics acceleration enabled.';
  $('fatal').textContent = message;
  $('fatal').hidden = false;
  throw error;
}

let view = 'home';
let modal = null;
let match = null;
let elapsed = 0;
let controllerLabel = '';
let accumulator = 0;
const queued = new Map();
const battle = $('battle');
const rotateHint = $('touch-rotate');
const portraitViewport = window.matchMedia('(orientation: portrait)');
const touch = navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches
  ? new TouchControls($('touch-controls')) : null;
const lobby = new Lobby(portrait, (index) => changeSelection(index, true), startMatch, Boolean(touch));
const showSelection = createRoster(portrait, changeSelection);
const hud = new BattleHud(portrait);
const inputs = new Inputs(() => view === 'battle' && !modal, touch);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function syncTouchControls() {
  const touchBattle = view === 'battle' && battle.classList.contains('touch-battle');
  const waitingForRotation = touchBattle && portraitViewport.matches;
  rotateHint.hidden = !waitingForRotation;
  battle.inert = waitingForRotation;
  touch?.show(touchBattle && !waitingForRotation && !modal);
  if (waitingForRotation) {
    queued.clear();
    accumulator = 0;
  }
}

function changeSelection(index, quiet = false) {
  const next = (index + fighters.length) % fighters.length;
  if (!quiet && next !== lobby.selection) {
    audioReady();
    playSound('select');
  }
  lobby.setPrimarySelection(next);
  showSelection(next);
}

function openDialog(type, kicker, title) {
  modal = type;
  syncTouchControls();
  updateDanceMusic(null);
  showDialog(type, kicker, title);
}

function closeDialog() {
  modal = null;
  hideDialog();
  queued.clear();
  accumulator = 0;
  syncTouchControls();
}

function dismissDialog() {
  if (modal === 'pause' && lobby.missingControllers().length) return;
  if (modal === 'results') return;
  closeDialog();
}

function openControls() {
  openDialog('controls', 'INPUT GUIDE', 'Controls');
  renderControls(Boolean(touch));
}

function openLobby() {
  audioReady();
  playSound('select');
  openDialog('lobby', 'LOCAL VERSUS', 'Set up the fight');
  lobby.render(true);
}

function startMatch() {
  if (!lobby.canBegin()) return;
  audioReady();
  closeDialog();
  match = createMatch(lobby.lineup(), lobby.arena);
  graphics.resetBattle();
  view = 'battle';
  $('home').hidden = true;
  $('site-footer').hidden = true;
  battle.hidden = false;
  const useTouch = Boolean(touch && lobby.seats.some((seat) => seat?.source === 'keyboard'));
  battle.classList.toggle('touch-battle', useTouch);
  syncTouchControls();
  battle.dataset.arenaTheme = match.arena.definition.theme;
  $('arena-name').textContent = match.arena.definition.name.toUpperCase();
  battle.prepend(canvas);
  hud.reset(match);
  hud.update(match);
  if (rotateHint.hidden) playSound('countdown');
  document.activeElement?.blur();
}

function goHome() {
  closeDialog();
  match = null;
  view = 'home';
  battle.hidden = true;
  syncTouchControls();
  $('home').hidden = false;
  $('site-footer').hidden = false;
  $('hero-world').prepend(canvas);
  $('play-button').focus();
}

function openPause() {
  const disconnected = lobby.missingControllers().length;
  openDialog('pause', match.arena.definition.name.toUpperCase(), disconnected ? 'Controller disconnected' : 'Match paused');
  renderPause(disconnected, dismissDialog, goHome);
}

function showResults() {
  const { winner, timedOut } = match.result;
  playSound('finish');
  openDialog('results', timedOut ? 'TIME EXPIRED' : 'MATCH COMPLETE', winner ? `${winner.fighter.name} wins` : 'Draw');
  renderResults(match.fighters, () => {
    if (lobby.canBegin()) startMatch();
    else {
      goHome();
      openLobby();
    }
  }, goHome);
}

function handleMenu(snapshot, controllersChanged) {
  const panels = [...snapshot.pads.values()];
  const connected = panels.filter((pad) => lobby.controllerSlot(pad) >= 0);
  const key = snapshot.keyboard;
  if (modal === 'lobby') {
    if (key.startPressed || connected.some((pad) => pad.backPressed)) { dismissDialog(); return; }
    const cameIn = panels.filter((pad) => (pad.acceptPressed || pad.startPressed) && !connected.includes(pad));
    let changed = false;
    for (const pad of cameIn) changed = lobby.joinPad(pad) || changed;
    if (changed || controllersChanged) lobby.render();
    for (const pad of connected) {
      const slot = lobby.controllerSlot(pad);
      if (pad.navX && slot >= 0) lobby.chooseSeat(slot, pad.navX);
    }
    const arenaStep = key.navY || connected.find((pad) => pad.navY)?.navY;
    if (arenaStep) lobby.chooseArena(arenaStep);
    if (connected.some((pad) => pad.startPressed) || key.acceptPressed) startMatch();
    return;
  }
  if (modal) {
    if (modal === 'pause') {
      const reconnecting = panels.filter((pad) => pad.acceptPressed || pad.startPressed);
      let rebound = false;
      for (const pad of reconnecting) rebound = lobby.joinPad(pad, true) || rebound;
      if (rebound || controllersChanged) { openPause(); return; }
      if (key.startPressed || connected.some((pad) => pad.startPressed)) { dismissDialog(); return; }
    }
    if (key.startPressed || key.backPressed || panels.some((pad) => pad.backPressed)) { dismissDialog(); return; }
    for (const pad of panels) {
      navigateDialog(pad);
      if (!modal) break;
    }
    return;
  }
  if (view === 'home') {
    const nav = key.navX || panels.find((pad) => pad.navX)?.navX;
    if (nav) changeSelection(lobby.selection + nav);
    const joining = panels.filter((pad) => pad.startPressed || pad.acceptPressed);
    if (joining.length || key.acceptPressed) {
      for (const pad of joining) lobby.joinPad(pad);
      openLobby();
    }
    return;
  }
  if (key.startPressed || connected.some((pad) => pad.startPressed) || lobby.missingControllers().length) openPause();
}

function collectControls(snapshot) {
  for (const { slot, fighter } of match.fighters) {
    const seat = lobby.seats[slot];
    const state = seat?.source === 'keyboard' ? snapshot.keyboard : seat?.source === 'pad' ? lobby.padFor(seat) : null;
    if (!state) continue;
    const prior = queued.get(slot) ?? {};
    const next = fighterInput(state, fighter, seat.source === 'pad');
    for (const edge of combatEdges) next[edge] ||= prior[edge];
    queued.set(slot, next);
  }
}

function runMatch(dt, snapshot) {
  collectControls(snapshot);
  accumulator += dt;
  while (accumulator >= rules.step) {
    tickMatch(match, queued);
    for (const control of queued.values()) {
      for (const edge of combatEdges) control[edge] = false;
    }
    accumulator -= rules.step;
  }
  if (match.events.length) {
    graphics.addEffects(match.events);
    for (const effect of new Set(match.events.map(({ type }) => type))) playSound(effect);
    match.events.length = 0;
  }
  hud.update(match);
  hud.updateCountdown(match);
  if (match.result) showResults();
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const snapshot = inputs.poll();
  lobby.updateControllers(snapshot);
  const previousPadLabel = controllerLabel;
  const count = Math.min(snapshot.pads.size, 4);
  controllerLabel = `${count}:${snapshot.unsupported}:${lobby.seats.map((seat) => seat?.source === 'pad' ? Number(Boolean(lobby.padFor(seat))) : '-').join('')}`;
  if (controllerLabel !== previousPadLabel) {
    $('pad-count').textContent = `${count} / 4 CONTROLLERS`;
    $('pad-status').classList.toggle('connected', count > 0);
    $('pad-status').title = snapshot.unsupported ? `${snapshot.unsupported} device(s) without a standard controller mapping` : 'Controllers detected by this browser';
  }
  const previousModal = modal;
  handleMenu(snapshot, previousPadLabel !== controllerLabel);
  if (view === 'home') {
    elapsed += reducedMotion.matches ? 0 : dt;
    graphics.hero(fighters[lobby.selection], elapsed);
  } else if (rotateHint.hidden) {
    const live = !modal && !previousModal;
    if (live) {
      elapsed += dt;
      runMatch(dt, snapshot);
    }
    const points = graphics.battle(match, elapsed, live ? dt : 0);
    hud.updateTags(match, points);
  }
  updateDanceMusic(view === 'battle' && !modal && rotateHint.hidden ? match.dance : null);
  requestAnimationFrame(frame);
}

$('play-button').addEventListener('click', openLobby);
$('controls-button').addEventListener('click', openControls);
$('sound-button').addEventListener('click', () => {
  $('sound-button').setAttribute('aria-pressed', String(toggleSound()));
  audioReady();
  playSound('select');
});
$('pause-button').addEventListener('click', openPause);
$('touch-exit').addEventListener('click', goHome);
portraitViewport.addEventListener('change', syncTouchControls);
$('home-button').addEventListener('click', () => { if (view === 'battle') openPause(); else $('play-button').focus(); });
handleDismiss(dismissDialog);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && view === 'battle' && !modal) openPause();
});
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  if (view === 'battle' && !modal) openPause();
  $('fatal').textContent = 'The graphics context was lost. Reload the game to restart the renderer.';
  $('fatal').hidden = false;
});

$('hero-lineup').textContent = `${fighters.length} fighters across floating arenas.`;
changeSelection(0, true);
requestAnimationFrame(frame);
