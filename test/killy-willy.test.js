import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { strike } from '../src/combat/hits.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { captureProgress, capturingAttack } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(positions, facing = 1) {
  const match = createMatch(['killy-willy', 'rivet', 'vi', 'kiln'].slice(0, positions.length + 1).map((id, slot) =>
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

function activateGulp(match) {
  const [caster] = match.fighters;
  match.superstar.holder = caster;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  assert.equal(caster.attack.type, 'killyGulp');
  tick(match, Math.ceil(signatureAttacks.killyGulp.from / rules.step));
  return caster.attack;
}

test('KillyWilly scratches on light and slashes on special tap', () => {
  const melee = prepare([1.64]);
  tick(melee, 1, { lightPressed: true });
  tick(melee, 20);
  assert.equal(melee.fighters[1].damage, signatureAttacks.killyScratch.damage);

  const slash = prepare([2.27]);
  tick(slash, 1, { specialPressed: true, special: true });
  tick(slash, 1);
  tick(slash, 30);
  assert.equal(slash.fighters[1].damage, signatureAttacks.killyClaws.damage);
});

test('Air Blades fires three diverging blades only forward when special is held', () => {
  const match = prepare([-4.3, 4.3], -1);
  const [caster, front, rear] = match.fighters;
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  assert.equal(caster.attack.type, 'killyAirBlades');
  tick(match, Math.ceil(signatureAttacks.killyAirBlades.from / rules.step));
  const blades = [...match.projectiles];
  assert.equal(blades.length, 3);
  assert.ok(blades.every(blade => blade.kind === 'killyWindBlade' && blade.vx < 0));
  assert.ok(blades[0].vy < blades[1].vy && blades[1].vy < blades[2].vy);
  tick(match, 42);
  assert.equal(front.damage, blades[0].hit.damage);
  assert.equal(rear.damage, 0);
});

test('Gulp & Spit swallows multiple front rivals and spits them forward together', () => {
  const match = prepare([2.4, 5.7, -2.4]);
  const [caster, near, far, rear] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(caster.attack, null);
  const attack = activateGulp(match);
  assert.equal(capturingAttack(near, match), attack);
  assert.equal(capturingAttack(far, match), attack);
  assert.equal(capturingAttack(rear, match), undefined);

  const { swallowAt, biteAt, damage } = signatureAttacks.killyGulp;
  while (attack.age < swallowAt) tick(match, 1);
  assert.equal(captureProgress(attack), 1);
  assert.ok(near.x < 2.4 && far.x < 5.7);
  while (attack.age < biteAt) tick(match, 1);
  assert.equal(attack.captures.length, 0);
  assert.equal(near.damage, damage);
  assert.equal(far.damage, damage);
  assert.equal(rear.damage, 0);
  assert.ok(near.vx > 0 && far.vx > 0 && far.vy > near.vy);
});

test('A hit from another rival frees only the target it hits during the pull', () => {
  const match = prepare([2.4, 4.7, -2.4]);
  const [, near, far, rear] = match.fighters;
  const attack = activateGulp(match);
  assert.equal(capturingAttack(near, match), attack);
  assert.equal(capturingAttack(far, match), attack);
  assert.ok(strike(rear, near, { damage: 2, force: 4, x: 1, y: .25, lift: 1 }, match));
  assert.equal(capturingAttack(near, match), undefined);
  assert.equal(capturingAttack(far, match), attack);
  while (attack.age < attack.biteAt) tick(match, 1);
  assert.equal(near.damage, 2);
  assert.equal(far.damage, attack.damage);
});
