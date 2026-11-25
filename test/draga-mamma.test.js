import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { knockOut } from '../src/combat/knockout.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { bodyCenter, bodySize, idleInput } from '../src/combat/state.js';
import { isZombie, resizeScale, sleepTime, slowTime } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function setup(x = 1.65, facing = 1) {
  const match = createMatch(['draga-mamma', 'rivet', 'kiln'].map((id, slot) => ({
    slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false,
  })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  const [witch, rival, other] = match.fighters;
  Object.assign(witch, { x: 0, facing });
  rival.x = x * facing;
  other.x = -8 * facing;
  return { match, witch, rival, other };
}

function step(match, frames, witchInput = idleInput, rivalInput = idleInput) {
  const controls = new Map([[0, witchInput], [1, rivalInput]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

function servePotion(match, witch, rivalInput = idleInput) {
  match.superstar.holder = witch;
  step(match, 1, { ...idleInput, superPressed: true }, rivalInput);
  const frames = Math.ceil(signatureAttacks.dragaPotion.from / rules.step);
  step(match, frames - 1, idleInput, rivalInput);
  assert.equal(match.superstar.holder, null);
}

test('Draga Mamma wipes at close range and casts one or two spells with tap or hold', () => {
  const melee = setup(1.65, -1);
  step(melee.match, 1, { ...idleInput, lightPressed: true });
  step(melee.match, Math.ceil(signatureAttacks.dragaFaceWipe.from / rules.step));
  assert.equal(melee.rival.damage, signatureAttacks.dragaFaceWipe.damage);

  for (const charged of [false, true]) {
    const { match, witch, rival } = setup(4.8, -1);
    step(match, 1, { ...idleInput, specialPressed: true, special: true });
    if (charged) step(match, Math.ceil(.72 / rules.step), { ...idleInput, special: true });
    const projectiles = new Set();
    for (let i = 0; i < 140; i++) {
      step(match, 1);
      for (const projectile of match.projectiles) projectiles.add(projectile);
    }
    assert.equal(projectiles.size, charged ? 2 : 1);
    assert.ok([...projectiles].every(p => p.kind === 'dragaSpark' && p.owner === witch && p.vx < 0));
    assert.equal(rival.damage, [...projectiles].reduce((damage, p) => damage + p.hit.damage, 0));
  }
});

test('Mystery Potion chooses exactly one of six effects and healing bottoms out at zero', t => {
  const random = t.mock.method(Math, 'random');
  const effects = [
    { damage: 26 }, { damage: 0 }, { asleep: true }, { scale: .5 }, { scale: 1.5 }, { slowed: true },
  ];
  for (const [index, expected] of effects.entries()) {
    random.mock.mockImplementation(() => (index + .5) / effects.length);
    const { match, witch, rival, other } = setup();
    rival.damage = 10;
    other.x = 2.8;
    const initialSize = bodySize(rival, match);
    const initialCenter = bodyCenter(rival, match);
    servePotion(match, witch);
    assert.equal(rival.damage, expected.damage ?? 10);
    assert.equal(sleepTime(rival, match) > 0, Boolean(expected.asleep));
    assert.equal(slowTime(rival, match) > 0, Boolean(expected.slowed));
    assert.equal(isZombie(rival, match), false);
    assert.equal(resizeScale(rival, match), expected.scale ?? 1);
    assert.equal(bodySize(rival, match), initialSize * (expected.scale ?? 1));
    assert.equal(bodyCenter(rival, match), initialCenter * (expected.scale ?? 1));
    step(match, Math.ceil((signatureAttacks.dragaPotion.until - signatureAttacks.dragaPotion.from) / rules.step));
    assert.equal(match.events.filter(e => e.type === 'potion').length, 1);
    assert.equal(other.damage, 0);
    assert.equal(sleepTime(other, match) + slowTime(other, match), 0);
    assert.equal(resizeScale(other, match), 1);
  }
  assert.equal(random.mock.callCount(), effects.length);
});

test('Mystery Potion respects shields and range before choosing a result', t => {
  const random = t.mock.method(Math, 'random', () => .4);
  const guarded = setup();
  servePotion(guarded.match, guarded.witch, { ...idleInput, guard: true });
  assert.ok(guarded.rival.shield < 1);
  assert.equal(guarded.rival.damage, 0);
  assert.equal(sleepTime(guarded.rival, guarded.match), 0);
  const distant = setup(7);
  servePotion(distant.match, distant.witch);
  step(distant.match, 30);
  assert.equal(random.mock.callCount(), 0);
});

test('Potion sleep blocks controls for five seconds and slowing uses Gioppino’s movement penalty', t => {
  const random = t.mock.method(Math, 'random', () => 2.5 / 6);
  const { match, witch, rival } = setup();
  servePotion(match, witch);
  const frames = Math.round(5 / rules.step);
  const controls = { x: 1, y: 0, jumpPressed: true, lightPressed: true, guard: true };
  const start = rival.x;
  step(match, frames - 1, idleInput, controls);
  assert.equal(rival.x, start);
  assert.equal(rival.attack, null);
  assert.equal(rival.guarding, false);
  assert.ok(rival.grounded);
  assert.ok(sleepTime(rival, match) > 0);
  step(match, 1, idleInput, { ...controls, guard: false });
  assert.equal(sleepTime(rival, match), 0);
  assert.ok(rival.attack && rival.vy > 0);

  random.mock.mockImplementation(() => 5.5 / 6);
  const slowed = setup();
  servePotion(slowed.match, slowed.witch);
  const zombie = setup();
  zombie.rival.zombieUntil = zombie.match.time - 5;
  for (const current of [slowed, zombie]) step(current.match, 30, idleInput, { x: 1, y: 0 });
  assert.equal(slowed.rival.vx, zombie.rival.vx);
  assert.ok(slowed.rival.vx > 0 && slowed.rival.vx < slowed.rival.fighter.speed);
  step(slowed.match, frames - 31);
  assert.ok(slowTime(slowed.rival, slowed.match) > 0);
  step(slowed.match, 1);
  assert.equal(slowTime(slowed.rival, slowed.match), 0);
});

test('Potion resizing expires after five seconds and resets when a fighter respawns', t => {
  t.mock.method(Math, 'random', () => 4.5 / 6);
  const { match, witch, rival } = setup();
  servePotion(match, witch);
  const frames = Math.round(5 / rules.step);
  step(match, frames - 1);
  assert.equal(resizeScale(rival, match), 1.5);
  step(match, 1);
  assert.equal(resizeScale(rival, match), 1);

  servePotion(match, witch);
  assert.equal(resizeScale(rival, match), 1.5);
  knockOut(rival, match);
  step(match, Math.ceil(1 / rules.step));
  assert.equal(rival.respawn, 0);
  assert.equal(resizeScale(rival, match), 1);
});
