import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(rivalPositions, facing = 1) {
  const match = createMatch(['murena-man', 'rivet', 'bramble', 'kiln'].slice(0, rivalPositions.length + 1)
    .map((id, slot) => ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  match.fighters.forEach((player, index) => { player.x = index ? rivalPositions[index - 1] : 0; });
  match.fighters[0].facing = facing;
  return match;
}

function tick(match, count, input = {}) {
  const controls = new Map([[0, { x: 0, y: 0, ...input }]]);
  for (let i = 0; i < count; i++) tickMatch(match, controls);
}

test('Blade Vortex hits on both sides while facing left and launches the victims away on the third hit', () => {
  const match = prepare([-2.42, 2.42, -4.2], -1);
  const [murena, left, right, distant] = match.fighters;
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  const first = signatureAttacks.murenaWhirl;
  const second = first.followUp;
  const third = second.followUp;
  assert.equal(murena.attack.type, 'murenaWhirl');

  let damage = 0;
  for (const beat of [first, second, third]) {
    tick(match, Math.ceil((beat.from - murena.attack.age) / rules.step) + 1);
    damage += beat.damage;
    assert.equal(left.damage, damage);
    assert.equal(right.damage, damage);
    assert.equal(distant.damage, 0);
  }
  assert.ok(left.vx < 0 && right.vx > 0);
  assert.ok(left.vy > 0 && right.vy > 0);
});

test('Flame Jet reaches a medium-range rival in front after the flame travels', () => {
  const match = prepare([-3.8, 3.8], -1);
  const [murena, front, rear] = match.fighters;
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 1);
  const flame = signatureAttacks.murenaFlame;
  assert.equal(murena.attack.type, 'murenaFlame');
  tick(match, Math.ceil((flame.from + .05) / rules.step));
  assert.equal(front.damage, 0);
  tick(match, Math.ceil(.11 / rules.step));
  assert.equal(front.damage, flame.damage);
  assert.equal(rear.damage, 0);
});

test('Atomic Salvo consumes the Superstar and throws three bombs that explode on both sides', () => {
  const match = prepare([-6.7, 6.25]);
  const [murena, left, right] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(murena.attack, null);
  match.superstar.holder = murena;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  assert.equal(murena.attack.type, 'murenaBombSalvo');
  tick(match, Math.ceil(signatureAttacks.murenaBombSalvo.from / rules.step));
  assert.equal(match.projectiles.length, 3);
  const bombDamage = match.projectiles[0].hit.damage;
  assert.ok(match.projectiles.every(bomb => bomb.kind === 'murenaBomb' && bomb.owner === murena));
  tick(match, Math.ceil(1 / rules.step));
  assert.equal(match.projectiles.length, 0);
  assert.equal(match.events.filter(({ type }) => type === 'explosion').length, 3);
  assert.equal(left.damage, bombDamage);
  assert.equal(right.damage, bombDamage);
  assert.equal(murena.damage, 0);
});
