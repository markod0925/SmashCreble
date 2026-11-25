import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { advanceProjectiles } from '../src/combat/projectiles.js';
import { idleInput } from '../src/combat/state.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function setup(...positions) {
  const lineup = ['ho-ho-ho', 'rivet', 'kiln', 'vi'].slice(0, positions.length + 1).map((id, slot) => ({
    slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false,
  }));
  const match = createMatch(lineup);
  match.countdown = 0;
  match.superstar.cooldown = 60;
  const [rider, ...rivals] = match.fighters;
  Object.assign(rider, { x: 0, facing: 1 });
  rivals.forEach((rival, i) => { rival.x = positions[i]; });
  return { match, rider, rivals };
}

function step(match, frames, input = idleInput) {
  const controls = new Map([[0, input]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

function chargeSleighs(match) {
  step(match, 1, { ...idleInput, specialPressed: true, special: true });
  step(match, 89, { ...idleInput, special: true });
}

test('Ho-Ho-Ho punches and kicks up close and tosses one gift on tap', () => {
  const melee = setup(1.6);
  const combo = signatureAttacks.hoHoHoCombo;
  step(melee.match, 1, { ...idleInput, lightPressed: true });
  step(melee.match, Math.ceil(combo.followUp.from / rules.step));
  assert.equal(melee.rivals[0].damage, combo.damage + combo.followUp.damage);

  const { match, rider, rivals: [rival] } = setup(-4.8);
  rider.facing = -1;
  step(match, 1, { ...idleInput, specialPressed: true, special: true });
  step(match, Math.ceil(signatureAttacks.hoHoHoGift.from / rules.step));
  assert.equal(match.projectiles.length, 1);
  const [gift] = match.projectiles;
  assert.equal(gift.kind, 'hoHoHoPresent');
  assert.ok(gift.vx < 0);
  step(match, 60);
  assert.equal(rival.damage, gift.hit.damage);
  assert.equal(match.events.filter(event => event.type === 'giftPop').length, 1);
});

test('Holding special sends exactly one sleigh forward', () => {
  for (const facing of [-1, 1]) {
    const { match, rider, rivals: [ahead, behind] } = setup(4.6 * facing, -4.6 * facing);
    rider.facing = facing;
    chargeSleighs(match);
    assert.equal(rider.attack.type, 'hoHoHoSleighRide');
    const sleighs = new Set();
    for (let i = 0; i < 160; i++) {
      step(match, 1);
      for (const projectile of match.projectiles) sleighs.add(projectile);
    }
    const [sleigh] = sleighs;
    assert.equal(sleighs.size, 1);
    assert.equal(sleigh.kind, 'hoHoHoSleigh');
    assert.equal(Math.sign(sleigh.vx), facing);
    assert.equal(sleigh.vy, 0);
    assert.equal(ahead.damage, sleigh.hit.damage);
    assert.equal(behind.damage, 0);
  }
});

test('A sleigh passes through multiple rivals and hits each one once', () => {
  const { match, rivals } = setup(3.8, 6.7);
  chargeSleighs(match);
  step(match, Math.ceil(signatureAttacks.hoHoHoSleighRide.from / rules.step));
  assert.equal(match.projectiles.length, 1);
  const [sleigh] = match.projectiles;
  const frames = Math.ceil(sleigh.remaining / rules.step);
  for (let i = 0; i <= frames; i++) {
    for (const rival of rivals) rival.invulnerable = 0;
    advanceProjectiles(match, rules.step);
  }
  assert.deepEqual([...sleigh.victims], rivals);
  assert.deepEqual(rivals.map(rival => rival.damage), [sleigh.hit.damage, sleigh.hit.damage]);
  assert.equal(match.projectiles.length, 0);
});

test('Sleigh Storm spends the Superstar and hits opponents to both sides and above', () => {
  const { match, rider, rivals: [left, right, above] } = setup(-6, 6, 0);
  const upper = match.arena.platforms.find(platform => platform.id === 'upper');
  Object.assign(above, { y: upper.y, grounded: upper });
  const superMove = signatureAttacks.hoHoHoSleighStorm;
  step(match, 1, { ...idleInput, superPressed: true });
  assert.equal(rider.attack, null);
  match.superstar.holder = rider;
  step(match, 1, { ...idleInput, superPressed: true });
  assert.equal(match.superstar.holder, null);
  step(match, Math.ceil(superMove.from / rules.step) - 1);
  assert.equal(match.projectiles.length, 3);
  const lanes = match.projectiles.map(({ vx, vy }) => [Math.sign(vx), Math.sign(vy)]);
  assert.deepEqual(lanes, [[-1, 0], [1, 0], [0, 1]]);
  const expectedDamage = match.projectiles[0].hit.damage;
  step(match, 38);
  assert.deepEqual([left.damage, right.damage, above.damage], [expectedDamage, expectedDamage, expectedDamage]);
});
