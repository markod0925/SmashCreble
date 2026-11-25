import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { captureProgress, capturingAttack } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(positions, facing = 1) {
  const match = createMatch(['markok', 'rivet', 'vi', 'kiln'].slice(0, positions.length + 1).map((id, slot) =>
    ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  match.fighters.forEach((player, i) => { player.x = i ? positions[i - 1] : 0; });
  match.fighters[0].facing = facing;
  return match;
}

function tick(match, frames, input = {}) {
  const controls = new Map([[0, { x: 0, y: 0, ...input }]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

test('Markok punches then kicks, and taps special for a longer staff strike', () => {
  const close = prepare([1.62]);
  const combo = signatureAttacks.markokCombo;
  tick(close, 1, { lightPressed: true });
  tick(close, 20);
  assert.equal(close.fighters[1].damage, combo.damage);
  tick(close, 19);
  assert.equal(close.fighters[1].damage, combo.damage + combo.followUp.damage);

  const medium = prepare([2.48]);
  tick(medium, 1, { specialPressed: true, special: true });
  tick(medium, 1);
  assert.equal(medium.fighters[0].attack.type, 'markokStaff');
  tick(medium, 28);
  assert.equal(medium.fighters[1].damage, signatureAttacks.markokStaff.damage);
});

test('Fire Tornado travels forward and hits each rival in its path once', () => {
  const match = prepare([-2.67, -6.2, 3.6], -1);
  const [markok, close, distant, rear] = match.fighters;
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  assert.equal(markok.attack.type, 'markokTornado');
  tick(match, Math.ceil(signatureAttacks.markokTornado.from / rules.step));
  const [tornado] = match.projectiles;
  assert.equal(tornado.kind, 'markokFireVortex');
  assert.ok(tornado.vx < 0);
  assert.equal(distant.damage, 0);
  tick(match, 110);
  assert.equal(close.damage, tornado.hit.damage);
  assert.equal(distant.damage, tornado.hit.damage);
  assert.equal(rear.damage, 0);
});

test('Cape Snare spends the Superstar, holds the nearest front rival and flings them forward', () => {
  const match = prepare([-2.24, -4.03, 2.38], -1);
  const [markok, caught, farther, rear] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(markok.attack, null);
  match.superstar.holder = markok;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  const cape = markok.attack;
  assert.equal(cape.type, 'markokCape');
  while (cape.age < cape.from) tick(match, 1);
  assert.equal(capturingAttack(caught, match), cape);
  assert.equal(capturingAttack(farther, match), undefined);
  assert.equal(capturingAttack(rear, match), undefined);

  const controls = new Map([[1, { x: 1, y: 0, jumpPressed: true, lightPressed: true }]]);
  while (cape.age < cape.swallowAt) tickMatch(match, controls);
  assert.equal(captureProgress(cape), 1);
  assert.equal(caught.x, markok.x - cape.mouth.reach);
  assert.equal(caught.attack, null);
  assert.equal(caught.damage, 0);
  while (cape.age < cape.biteAt) tickMatch(match, controls);
  assert.equal(capturingAttack(caught, match), undefined);
  assert.equal(caught.damage, cape.damage);
  assert.ok(caught.vx < 0 && caught.vy > 0);
  assert.equal(farther.damage + rear.damage, 0);
});
