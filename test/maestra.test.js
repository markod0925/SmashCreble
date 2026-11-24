import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(positions, facing = 1) {
  const ids = ['maestra', 'rivet', 'vesper'];
  const match = createMatch(positions.map((_, slot) => ({ slot, fighter: fighters.find(({ id }) => id === ids[slot]), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  positions.forEach((x, slot) => { match.fighters[slot].x = x; });
  match.fighters[0].facing = facing;
  return match;
}

function tick(match, count, input = {}) {
  for (let i = 0; i < count; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

test('Maestra pulls hair toward her in either direction and taps special for the ruler strike', () => {
  for (const facing of [-1, 1]) {
    const match = prepare([0, facing * 1.8], facing);
    tick(match, 1, { lightPressed: true });
    tick(match, 19);
    const rival = match.fighters[1];
    assert.equal(rival.damage, signatureAttacks.maestraHairPull.damage);
    assert.equal(Math.sign(rival.vx), -facing);
  }

  const match = prepare([-3, -.67]);
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 1);
  assert.equal(match.fighters[0].attack.type, 'maestraRuler');
  tick(match, 32);
  assert.equal(match.fighters[1].damage, signatureAttacks.maestraRuler.damage);
});

test('Sonic Shout hits a distant rival only after the sound reaches them', () => {
  const { from, waveSpeed, damage } = signatureAttacks.maestraShout;
  const gap = 5.6;
  for (const facing of [-1, 1]) {
    const match = prepare([0, facing * gap, -facing * 2.9], facing);
    const [maestra, rival, behind] = match.fighters;
    tick(match, 1, { specialPressed: true, special: true });
    tick(match, 88, { special: true });
    assert.equal(maestra.attack.type, 'maestraShout');
    const beforeImpact = Math.floor((from + gap / waveSpeed - maestra.attack.age) / rules.step);
    tick(match, beforeImpact);
    assert.ok(match.events.some(event => event.type === 'shout'));
    assert.equal(rival.damage, 0);
    tick(match, 2);
    assert.equal(rival.damage, damage);
    assert.equal(behind.damage, 0);
    tick(match, 70);
    assert.equal(rival.damage, damage);
  }
});

test('Mighty Shove consumes the Superstar and can launch a rival offstage without taking a stock on contact', () => {
  const match = prepare([8.1, 10.16, 5.5]);
  const [maestra, rival, behind] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(maestra.attack, null);

  match.superstar.holder = maestra;
  tick(match, 1, { superPressed: true });
  assert.equal(maestra.attack.type, 'maestraShove');
  assert.equal(match.superstar.holder, null);
  tick(match, 37);
  assert.equal(rival.damage, signatureAttacks.maestraShove.damage);
  assert.equal(rival.stocks, rules.stocks);
  assert.ok(rival.vx > signatureAttacks.maestraShove.force * .8);
  assert.ok(rival.vx > rival.vy * 2);
  assert.equal(behind.damage, 0);
  tick(match, 100);
  assert.equal(rival.stocks, rules.stocks - 1);
});
