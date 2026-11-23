import { defaultArena } from '../src/arenas/index.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { rules } from '../src/combat/arena.js';
import { fighters } from '../src/fighters/index.js';
import { Graphics } from '../src/render/scene.js';
import { shapes } from '../src/render/geometry.js';
import { multiply, transform } from '../src/render/math.js';
import { clonePoseIndex } from './clone-poses.mjs';

let input, frame, modelMatrix, match, elapsed = 0;
const controls = new Map();
const shapeIndices = new Map(Object.keys(shapes).map((shape, index) => [shape, index]));
const renderer = {
  clones: new Set(),
  zombie: 0,
  lowDetail: false,
  measure: () => [640, 480],
  begin() {},
  project: (x, y, z) => [x, y, z],
  setZombie(amount) { this.zombie = amount; },
  drawClone(fighter, position, time, options) {
    if (!this.clones.has(fighter) || options.attack || options.flash || options.wobble ||
        options.danceTime != null || options.zombie || options.guarding || options.charging) return false;
    const pose = clonePoseIndex(fighter.id, options.facing, options.airborne, options.running, time);
    if (pose < 0) return false;
    globalThis.wiiDrawClone(pose, ...position);
    return true;
  },
  mesh(shape, matrix, color, glow = 0, alpha = 1, lowDetail = this.lowDetail) {
    modelMatrix.set(matrix);
    globalThis.wiiMesh(shapeIndices.get(shape) ?? -1, parseInt(color.slice(1), 16), glow, alpha, this.zombie, Number(lowDetail));
  },
  object(shape, position, scale, color, angles = [0, 0, 0], glow = 0, alpha = 1) {
    this.mesh(shape, transform(position, scale, angles), color, glow, alpha);
  },
  parts(parts, root, flash) {
    for (const part of parts) this.mesh(part.shape, multiply(root, part.matrix), flash ? '#ffffff' : part.color, flash ? .8 : part.glow);
  },
};
const graphics = Object.assign(Object.create(Graphics.prototype), { renderer });

globalThis.wiiInit = (controlsBuffer, frameBuffer, matrixBuffer) => {
  input = new Float32Array(controlsBuffer);
  frame = new Float32Array(frameBuffer);
  modelMatrix = new Float32Array(matrixBuffer);
};

globalThis.wiiStart = (...choices) => {
  const lineup = choices.flatMap((index, slot) => index < 0 ? [] : [{ slot, fighter: fighters[index], cpu: false }]);
  match = createMatch(lineup, defaultArena);
  elapsed = 0;
  graphics.resetBattle();
};

function controlFor(slot, first) {
  const i = slot * 4;
  const held = input[i + 2];
  const pressed = first ? input[i + 3] : 0;
  const jump = 1, light = 2, special = 4, guard = 8, heavy = 16, dodge = 32;
  return {
    x: input[i], y: input[i + 1],
    jump: Boolean(held & jump), jumpPressed: Boolean(pressed & jump),
    light: Boolean(held & light), lightPressed: Boolean(pressed & light),
    special: Boolean(held & special), specialPressed: Boolean(pressed & special),
    guard: Boolean(held & guard), heavy: Boolean(held & heavy), heavyPressed: Boolean(pressed & heavy),
    dodgePressed: Boolean(pressed & dodge),
    superPressed: ((held | pressed) & (light | special)) === (light | special) && Boolean(pressed & (light | special)),
  };
}

globalThis.wiiAdvance = (steps, dt) => {
  for (let step = 0; step < steps; step++) {
    for (const player of match.fighters) controls.set(player.slot, controlFor(player.slot, step === 0));
    tickMatch(match, controls);
    if (match.fighters.length === 1 && match.fighters[0].stocks && match.time > 0) match.result = null;
  }
  if (steps) elapsed += dt;
  if (match.events.length) {
    graphics.addEffects(match.events);
    match.events.length = 0;
  }
  renderer.clones = new Set(match.clones.map(({ fighter }) => fighter));
  const tags = graphics.battle(match, elapsed, steps ? dt : 0);
  frame.fill(0);
  frame.set([match.time, match.countdown, Number(Boolean(match.result)), match.result?.winner?.slot ?? -1]);
  match.fighters.forEach((player, index) => {
    const tag = tags[index];
    const i = 4 + player.slot * 7;
    frame.set([player.damage, player.stocks, player.shield, tag && player.stocks && player.respawn <= 0 ? 1 : 0,
      tag?.[0] ?? 0, tag?.[1] ?? 0, player.guarding ? 1 : 0], i);
  });
};
