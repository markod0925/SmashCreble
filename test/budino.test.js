import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

function prepare(gap, facing = 1) {
  const match = createMatch(['budino', 'rivet'].map((id, slot) => ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  Object.assign(match.fighters[0], { x: -3, facing });
  match.fighters[1].x = -3 + gap * facing;
  return match;
}

function tick(match, frames, input = {}) {
  for (let i = 0; i < frames; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

function fire(match, heavy) {
  tick(match, 1, { special: true, specialPressed: true });
  if (heavy) tick(match, 87, { special: true });
  tick(match, 1);
  tick(match, heavy ? 29 : 18);
}

test('Budino chains a punch and kick and fires distinct pulses with tap and hold', () => {
  let match = prepare(1.32);
  tick(match, 1, { lightPressed: true });
  tick(match, 43);
  assert.equal(match.fighters[1].damage, 10);

  for (const facing of [-1, 1]) {
    match = prepare(4.65, facing);
    fire(match, false);
    assert.equal(match.projectiles.length, 1);
    assert.equal(match.projectiles[0].kind, 'budinoPulse');
    assert.equal(Math.sign(match.projectiles[0].vx), facing);
    tick(match, 60);
    assert.equal(match.fighters[1].damage, 8);

    match = prepare(7.7, facing);
    fire(match, true);
    assert.equal(match.projectiles.length, 1);
    assert.equal(match.projectiles[0].kind, 'budinoBurst');
    tick(match, 90);
    assert.equal(match.fighters[1].damage, 15);
  }
});

test('Budino loads 800 rounds, spends them on wider bursts, and loses the reserve on respawn', () => {
  const match = prepare(4.2);
  const [budino, rival] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(budino.reserveAmmo, 0);
  match.superstar.holder = budino;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  tick(match, 110);
  assert.equal(budino.reserveAmmo, 800);

  fire(match, false);
  assert.equal(budino.reserveAmmo, 760);
  assert.equal(match.projectiles.length, 3);
  assert.ok(match.projectiles.every(({ boosted }) => boosted));
  tick(match, 83);
  assert.equal(rival.damage, 12);

  fire(match, true);
  assert.equal(budino.reserveAmmo, 680);
  assert.equal(match.projectiles.length, 5);
  tick(match, 115);

  budino.reserveAmmo = 40;
  fire(match, true);
  assert.equal(budino.reserveAmmo, 0);
  assert.equal(match.projectiles.length, 3);
  tick(match, 105);
  fire(match, false);
  assert.equal(match.projectiles.length, 1);
  assert.equal(match.projectiles[0].boosted, false);

  budino.reserveAmmo = 800;
  budino.x = match.arena.definition.bounds.side + 1;
  tick(match, 110);
  assert.equal(budino.stocks, 2);
  assert.equal(budino.reserveAmmo, 0);
});
