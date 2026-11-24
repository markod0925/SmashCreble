import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { Graphics } from '../src/render/scene.js';
import { drawCharacter } from '../src/render/characters.js';
import { shapes } from '../src/render/geometry.js';
import { multiply, transform } from '../src/render/math.js';
import { modelShape } from './model-detail.mjs';
import './runtime.mjs';

test('Wii battle models use at most a tenth of the source triangles in movement poses', () => {
  const poses = [
    [0, {}],
    [.1, { running: 1 }],
    [.2, { airborne: true, verticalSpeed: -3 }],
  ];
  for (const fighter of fighters) {
    for (const facing of [-1, 1]) {
      for (const [time, pose] of poses) {
        let full = 0, reduced = 0;
        const count = (shape, matrix) => {
          full += shapes[shape].length / 18;
          reduced += modelShape(shape, matrix).length / 18;
        };
        const renderer = {
          mesh: count,
          object: (shape, position, scale, _color, rotation = [0, 0, 0]) =>
            count(shape, transform(position, scale, rotation)),
          parts: (parts, root) => {
            for (const part of parts) count(part.shape, multiply(root, part.matrix));
          },
        };
        drawCharacter(renderer, fighter, [0, 0, 0], time, { heading: facing * .93, facing, ...pose });
        assert.ok(reduced > 0 && reduced * 10 <= full, `${fighter.name}: ${full} to ${reduced} triangles`);
      }
    }
  }
});

test('Wii fills vacant slots with CPU fighters that can win a match', () => {
  const draw = Graphics.prototype.battle;
  let match;
  Graphics.prototype.battle = (current) => {
    match = current;
    return current.fighters.map(({ x, y }) => [x, y, .5]);
  };
  const frame = new Float32Array(32);
  globalThis.wiiInit(new Float32Array(16).buffer, frame.buffer, new Float32Array(16).buffer);
  const tick = () => globalThis.wiiAdvance(1, rules.step);
  try {
    for (const choices of [[-1, -1, 2, -1], [0, -1, 2, -1], [0, 1, 2, -1], [0, 1, 2, 3]]) {
      globalThis.wiiStart(...choices);
      globalThis.wiiAdvance(0, 0);
      assert.deepEqual(match.fighters.map(({ slot }) => slot), [0, 1, 2, 3]);
      assert.deepEqual(match.fighters.map(({ cpu }) => cpu), choices.map((index) => index < 0));
      assert.equal(new Set(match.fighters.map(({ fighter }) => fighter)).size, 4);
      match.fighters.forEach(({ fighter, slot }) => {
        if (choices[slot] >= 0) assert.equal(fighter, fighters[choices[slot]]);
        assert.equal(frame[5 + slot * 7], rules.stocks);
      });
    }

    globalThis.wiiStart(-1, -1, 2, -1);
    globalThis.wiiAdvance(0, 0);
    match.countdown = 0;
    const cpu = match.fighters[0];
    const spawnX = cpu.x;
    tick();
    assert.notEqual(cpu.x, spawnX);
    for (const player of match.fighters) {
      if (player !== cpu) player.stocks = 0;
    }
    tick();
    assert.equal(frame[2], 1);
    assert.equal(frame[3], cpu.slot);
  } finally {
    Graphics.prototype.battle = draw;
  }
});

test('Wii controls activate and render the Web roster moves', () => {
  const draw = Graphics.prototype.battle;
  let match, meshes = 0;
  Graphics.prototype.battle = function (current, ...args) {
    match = current;
    return draw.call(this, current, ...args);
  };
  const names = Object.keys(shapes);
  const matrix = new Float32Array(16);
  globalThis.wiiMesh = (index, ...style) => {
    const shape = names[index];
    assert.ok(shape, `Unknown shape index ${index}`);
    assert.ok(matrix.every(Number.isFinite), shape);
    assert.ok(style.every(Number.isFinite), shape);
    meshes++;
  };
  const inputs = new Float32Array(16);
  globalThis.wiiInit(inputs.buffer, new Float32Array(32).buffer, matrix.buffer);
  const tick = (held = 0, pressed = 0, steps = 1) => {
    inputs.set([0, 0, held, pressed]);
    globalThis.wiiAdvance(steps, steps * rules.step);
  };
  const start = (index) => {
    globalThis.wiiStart(index, (index + 1) % fighters.length, (index + 2) % fighters.length, (index + 3) % fighters.length);
    const before = meshes;
    tick();
    assert.ok(meshes > before);
    match.countdown = 0;
    return match.fighters[0];
  };
  const light = 2, special = 4, heavy = 16;
  try {
    for (const [index, fighter] of fighters.entries()) {
      let player = start(index);
      tick(light, light);
      assert.equal(player.attack?.type, fighter.moves?.light ?? 'light', fighter.name);

      player = start(index);
      tick(special, special);
      if (fighter.moves) tick();
      assert.equal(player.attack?.type, fighter.moves?.tap ?? fighter.secondary, fighter.name);
      tick(0, 0, Math.ceil((signatureAttacks[player.attack.type]?.from ?? 0) / rules.step));

      player = start(index);
      const charge = fighter.moves ? special : heavy;
      tick(charge, charge);
      for (let remaining = Math.ceil(1 / rules.step); !player.attack && remaining > 0; remaining--) tick(charge);
      assert.equal(player.attack?.type, fighter.moves?.hold ?? 'heavy', fighter.name);
      tick(0, 0, Math.ceil((player.attack.from ?? 0) / rules.step));

      if (!fighter.moves) continue;
      player = start(index);
      match.superstar.holder = player;
      tick(light | special, light | special);
      assert.equal(player.attack?.type, fighter.moves.super, fighter.name);
      assert.equal(match.superstar.holder, null);
      tick(0, 0, Math.ceil((player.attack.from ?? 0) / rules.step));
    }
  } finally {
    Graphics.prototype.battle = draw;
    delete globalThis.wiiMesh;
  }
});
