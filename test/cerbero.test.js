import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { summonClones } from '../src/combat/clones.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { dazedTime } from '../src/combat/status.js';
import { sitDazeSeconds, toothCount } from '../src/fighters/cerbero/profile.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(...positions) {
  const match = createMatch(['cerbero', 'rivet', 'vi', 'kiln'].slice(0, positions.length + 1)
    .map((id, slot) => ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  match.fighters.forEach((player, i) => { player.x = i ? positions[i - 1] : 0; });
  match.fighters[0].facing = 1;
  return match;
}

function tick(match, frames, input = {}) {
  const controls = new Map([[0, { x: 0, y: 0, ...input }]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

test('Cerbero bites three times and sprays a short-range cloud on tap', () => {
  const melee = prepare(1.67);
  const [dog, target] = melee.fighters;
  tick(melee, 1, { lightPressed: true });
  let damage = 0;
  for (let beat = signatureAttacks.cerberoBites; beat; beat = beat.followUp) {
    tick(melee, Math.ceil((beat.from - dog.attack.age) / rules.step) + 1);
    damage += beat.damage;
    assert.equal(target.damage, damage);
  }
  const ranged = prepare(3.5, -3.5);
  tick(ranged, 1, { specialPressed: true, special: true });
  tick(ranged, 1);
  tick(ranged, Math.ceil(signatureAttacks.cerberoSpray.from / rules.step));
  const [cloud] = ranged.projectiles;
  assert.equal(cloud.kind, 'cerberoMist');
  tick(ranged, 27);
  assert.equal(ranged.fighters[1].damage, cloud.hit.damage);
  assert.equal(ranged.fighters[2].damage, 0);
});

test('Tooth Barrage fires successive shots from all three mouths when special is held', () => {
  const match = prepare(-4.7, 5.5);
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  const [dog, rear, front] = match.fighters;
  assert.equal(dog.attack.type, 'cerberoTeeth');
  const seen = new Set();
  for (let i = 0; i < Math.ceil(signatureAttacks.cerberoTeeth.duration / rules.step); i++) {
    tick(match, 1);
    for (const projectile of match.projectiles) seen.add(projectile);
  }
  const volleys = [...seen];
  assert.equal(volleys.length, toothCount);
  assert.ok(volleys.every((tooth, index) => tooth.kind === 'cerberoTooth' && tooth.head === index % 3));
  assert.equal(volleys.at(-1).last, true);
  assert.equal(match.events.filter(({ type }) => type === 'toothShot').length, toothCount);
  assert.ok(front.damage > 2.6);
  assert.equal(rear.damage, 0);
});

test('Giant Sit damages every active rival once at full size, then dazes them for three seconds', () => {
  const match = prepare(-9.7, 9, 5.3);
  const [dog, rear, far, air] = match.fighters;
  Object.assign(air, { y: 9, vy: 2.4, grounded: null });
  summonClones(far, match, 1);
  const [clone] = match.clones;
  tick(match, 1, { superPressed: true });
  assert.equal(dog.attack, null);
  match.superstar.holder = dog;
  tick(match, 1, { superPressed: true });
  assert.equal(dog.attack.type, 'cerberoGiantSit');
  assert.equal(match.superstar.holder, null);
  const guard = new Map([[2, { x: 0, y: 0, guard: true }]]);
  const rivalControls = new Map([[2, { x: -1, y: 0, lightPressed: true }]]);
  const rivals = [rear, far, air];
  const { growthHit, from: sitAt } = signatureAttacks.cerberoGiantSit;
  while (dog.attack.age < growthHit.at - rules.step) tickMatch(match, guard);
  assert.ok(rivals.every(player => player.damage === 0));
  while (dog.attack.age < growthHit.at) tickMatch(match, guard);
  assert.ok(rivals.every(player => player.damage === growthHit.damage));
  assert.equal(clone.stocks, 0);
  assert.equal(dog.damage, 0);
  assert.ok(rivals.every(player => dazedTime(player, match) === 0));
  assert.equal(far.guarding, true);
  while (dog.attack.age < sitAt) tickMatch(match, guard);
  assert.ok(rivals.every(player => Math.abs(dazedTime(player, match) - sitDazeSeconds) < 1e-7));
  assert.equal(far.guarding, false);
  assert.equal(dazedTime(dog, match), 0);
  const farX = far.x;
  for (let i = 1; i < Math.round(sitDazeSeconds / rules.step); i++) tickMatch(match, rivalControls);
  assert.equal(dog.attack, null);
  assert.equal(far.x, farX);
  assert.ok(rivals.every(player => player.attack === null && player.damage === growthHit.damage));
  tickMatch(match, rivalControls);
  assert.equal(dazedTime(far, match), 0);
  assert.ok(far.attack);
});
