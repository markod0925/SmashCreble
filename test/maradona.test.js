import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { idleInput } from '../src/combat/state.js';
import { capturingAttack } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { drawCharacter } from '../src/render/characters.js';

function setup(x = 1.6) {
  const match = createMatch(['maradona', 'rivet', 'kiln', 'vi'].map((id, slot) => ({
    slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false,
  })));
  const [striker, rival, other, ally] = match.fighters;
  match.countdown = 0;
  match.superstar.cooldown = 60;
  Object.assign(striker, { x: 0, facing: 1, team: 'party' });
  Object.assign(ally, { x: -10, team: striker.team });
  rival.x = x;
  other.x = 12;
  return { match, striker, rival, other, ally };
}

function step(match, frames, input = idleInput) {
  const controls = new Map([[0, input]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

function startSuper(match, striker) {
  match.superstar.holder = striker;
  step(match, 1, { ...idleInput, superPressed: true });
  assert.equal(match.superstar.holder, null);
  assert.equal(striker.attack.type, 'maradonaFireShots');
}

test('Maradona has a two-punch combo, a close hug, and a charged football kick', () => {
  const punches = setup();
  const combo = signatureAttacks.maradonaPunches;
  step(punches.match, 1, { ...idleInput, lightPressed: true });
  step(punches.match, Math.ceil(combo.followUp.from / rules.step));
  assert.equal(punches.rival.damage, combo.damage + combo.followUp.damage);

  const { match, striker, rival } = setup();
  const hug = signatureAttacks.maradonaHug;
  step(match, 1, { ...idleInput, specialPressed: true, special: true });
  step(match, Math.ceil(hug.from / rules.step));
  assert.equal(capturingAttack(rival, match), striker.attack);
  assert.equal(rival.damage, 0);
  step(match, Math.ceil((hug.biteAt - hug.from) / rules.step));
  assert.equal(capturingAttack(rival, match), undefined);
  assert.equal(rival.damage, hug.damage);

  const kick = setup(5);
  kick.striker.facing = -1;
  kick.rival.x *= -1;
  step(kick.match, 1, { ...idleInput, specialPressed: true, special: true });
  step(kick.match, 90, { ...idleInput, special: true });
  assert.equal(kick.striker.attack.type, 'maradonaKick');
  step(kick.match, Math.ceil(signatureAttacks.maradonaKick.from / rules.step));
  const [ball] = kick.match.projectiles;
  assert.equal(ball.kind, 'maradonaBall');
  assert.ok(ball.vx < 0);
  step(kick.match, 35);
  assert.equal(kick.rival.damage, ball.hit.damage);
});

test('Fire Shots summons a fixed goal and reaims all three shots at the nearest active rival', () => {
  const { match, striker, rival, other, ally } = setup(-6);
  const { from, volleyEvery, duration } = signatureAttacks.maradonaFireShots;
  other.x = 9;
  ally.x = -2;
  startSuper(match, striker);
  const { goal } = striker.attack;
  const posts = [];
  const renderer = {
    object(shape, [x], size, color) {
      if (shape === 'box' && color === '#fff1d4' && size[1] > 1) posts.push(x);
    },
    parts() {},
  };

  step(match, Math.ceil(from / rules.step));
  const [first] = match.projectiles;
  assert.equal(first.kind, 'maradonaFireball');
  assert.ok(first.vx < 0);
  assert.equal(striker.facing, -1);
  drawCharacter(renderer, striker.fighter, [striker.x + 1, striker.y, .21], .4, { attack: striker.attack });
  assert.equal(posts.length, 2);
  assert.equal((posts[0] + posts[1]) / 2, goal.x);

  Object.assign(rival, { x: -13, invulnerable: 2 });
  Object.assign(other, { x: 4, y: 4.2, grounded: null, vy: 3 });
  step(match, Math.ceil(volleyEvery / rules.step));
  const second = match.projectiles.at(-1);
  assert.notEqual(second, first);
  assert.ok(second.vx > 0 && second.vy > 0);
  assert.equal(striker.facing, 1);

  Object.assign(other, { respawn: 2 });
  rival.x = -7;
  step(match, Math.ceil(volleyEvery / rules.step));
  const third = match.projectiles.at(-1);
  assert.notEqual(third, second);
  assert.ok(third.vx < 0);
  step(match, Math.ceil(duration / rules.step));
  assert.equal(striker.attack, null);
  assert.equal(match.events.filter(event => event.type === 'fireKick').length, 3);
  assert.equal(ally.damage, 0);
});

test('A flaming football hits harder and launches farther than the charged kick', () => {
  const kick = setup(4.5);
  step(kick.match, 1, { ...idleInput, specialPressed: true, special: true });
  step(kick.match, 100, { ...idleInput, special: true });
  for (let i = 0; i < 60 && !kick.rival.damage; i++) step(kick.match, 1);
  assert.ok(kick.rival.damage > 0);

  const { match, striker, rival, other } = setup(4.5);
  other.x = -8;
  startSuper(match, striker);
  const frames = Math.ceil(signatureAttacks.maradonaFireShots.from / rules.step);
  step(match, frames);
  const [fireball] = match.projectiles;
  for (let i = 0; i < 24 && !rival.damage; i++) step(match, 1);
  assert.equal(rival.damage, fireball.hit.damage);
  assert.ok(rival.damage > kick.rival.damage);
  assert.ok(rival.vx > kick.rival.vx && rival.vy > kick.rival.vy);
});
