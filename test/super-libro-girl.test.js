import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { dazedTime } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(...rivals) {
  const match = createMatch(['super-libro-girl', ...rivals].map((id, slot) => ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  Object.assign(match.fighters[0], { x: 0, facing: 1 });
  return match;
}

function tick(match, frames, input = {}) {
  for (let i = 0; i < frames; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

test('SuperLibroGirl can kick, tap for a sword slash, or hold for the stronger slash', () => {
  let match = prepare('rivet');
  match.fighters[1].x = 1.71;
  tick(match, 1, { lightPressed: true });
  tick(match, 28);
  assert.equal(match.fighters[1].damage, signatureAttacks.libroHeel.damage);

  function slash(hold) {
    const match = prepare('rivet');
    match.fighters[1].x = 2.38;
    tick(match, 1, { specialPressed: true, special: true });
    if (hold) tick(match, 88, { special: true });
    tick(match, 1);
    assert.equal(match.fighters[0].attack.type, hold ? 'libroMightySlash' : 'libroSword');
    tick(match, hold ? 40 : 26);
    return match.fighters[1];
  }
  const quick = slash(false);
  const mighty = slash(true);
  assert.equal(quick.damage, 11);
  assert.equal(mighty.damage, 20);
  assert.ok(mighty.vx > quick.vx);
});

test('Blinding Light dazes every rival for three seconds, even if they are guarding or in the air', () => {
  const match = prepare('rivet', 'bramble', 'kiln');
  const [caster, rear, guarded, airborne] = match.fighters;
  Object.assign(rear, { x: -8.1, y: 3.25, grounded: match.arena.platforms[1] });
  Object.assign(guarded, { x: 8.1, y: 2.5, grounded: match.arena.platforms[2], invulnerable: .9 });
  Object.assign(airborne, { x: 3.1, y: 7.2, grounded: null });
  tick(match, 1, { superPressed: true });
  assert.equal(caster.attack, null);
  match.superstar.holder = caster;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);

  const guard = new Map([[2, { x: 0, y: 0, guard: true }]]);
  const activationTicks = Math.ceil(signatureAttacks.libroDazzle.from / rules.step);
  for (let i = 1; i < activationTicks - 1; i++) tickMatch(match, guard);
  assert.equal(guarded.guarding, true);
  guard.set(1, { x: 0, y: 0, lightPressed: true });
  tickMatch(match, guard);
  assert.equal(guarded.guarding, false);
  assert.equal(rear.attack, null);
  assert.equal(dazedTime(caster, match), 0);
  const rivals = [rear, guarded, airborne];
  assert.ok(rivals.every(rival => Math.abs(dazedTime(rival, match) - 3) < 1e-6));
  assert.ok(match.events.some(({ type }) => type === 'dazzleBurst'));

  const press = new Map(rivals.map(({ slot }) => [slot, { x: 1, y: 0, jumpPressed: true, lightPressed: true }]));
  const ticks = Math.round(3 / rules.step);
  for (let i = 0; i < ticks - 1; i++) tickMatch(match, press);
  assert.equal(rear.x, -8.1);
  assert.equal(guarded.x, 8.1);
  assert.equal(airborne.grounded?.main, true);
  assert.ok(rivals.every(rival => dazedTime(rival, match) > 0 && rival.attack === null && rival.damage === 0));
  tickMatch(match, press);
  assert.ok(rivals.every(rival => dazedTime(rival, match) === 0 && rival.attack?.type === 'light' && rival.vy > 0));
});
