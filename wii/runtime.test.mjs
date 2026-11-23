import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { Graphics } from '../src/render/scene.js';
import { shapes } from '../src/render/geometry.js';
import './runtime.mjs';

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
    globalThis.wiiStart(index, (index + 1) % fighters.length, -1, -1);
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
