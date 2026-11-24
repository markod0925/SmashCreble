import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { interruptAttack } from '../src/combat/status.js';
import { fighters } from '../src/fighters/index.js';
import { barrageTimes } from '../src/fighters/che-addominali/profile.js';

function prepare(positions) {
  const ids = ['che-addominali', 'rivet', 'bramble'];
  const match = createMatch(positions.map((x, slot) => ({ slot, fighter: fighters.find(({ id }) => id === ids[slot]), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  positions.forEach((x, slot) => { match.fighters[slot].x = x; });
  match.fighters[0].facing = 1;
  return match;
}

function tick(match, frames, input = {}) {
  for (let i = 0; i < frames; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

test('Che Addominali! taps for one simultaneous triple strike and holds for six sequential hits', () => {
  let match = prepare([-3, -1.66]);
  tick(match, 1, { lightPressed: true });
  tick(match, 44);
  assert.equal(match.fighters[1].damage, 8.5);

  match = prepare([-3, -.82]);
  tick(match, 1, { special: true, specialPressed: true });
  tick(match, 1);
  assert.equal(match.fighters[0].attack?.type, 'absTriple');
  tick(match, 68);
  assert.equal(match.fighters[1].damage, 13.5);
  assert.equal(match.events.filter(({ type }) => type === 'hit').length, 1);

  match = prepare([-3, -1.64]);
  tick(match, 1, { special: true, specialPressed: true });
  tick(match, 87, { special: true });
  const [boxer, rival] = match.fighters;
  const hits = [];
  for (let i = 0; boxer.attack && i < 160; i++) {
    const before = rival.damage;
    tick(match, 1);
    if (rival.damage > before) hits.push({ age: boxer.attack.age, damage: rival.damage - before });
  }
  assert.deepEqual(hits.map(({ damage }) => damage), [3, 3, 3, 3, 3, 7]);
  assert.ok(hits.every(({ age }, i) => age >= barrageTimes[i] && age < barrageTimes[i] + rules.step));
  assert.ok(rival.vx > 0);
});

test('Acid Rain lasts five seconds at the casting location and hits rivals inside its area', () => {
  const match = prepare([-3, -1.15, 5.25]);
  const [boxer, inside, outside] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(boxer.attack, null);
  match.superstar.holder = boxer;
  tick(match, 1, { superPressed: true });
  tick(match, 38);
  assert.equal(match.superstar.holder, null);
  const [rain] = match.acidRain;
  assert.equal(rain.x, -3);
  assert.equal(rain.time - rain.until, 5);
  assert.equal(inside.damage, 0);
  boxer.x = 3;
  interruptAttack(boxer);

  tick(match, Math.round(5 / rules.step) - 1);
  assert.equal(match.acidRain.length, 1);
  assert.equal(inside.damage, 20);
  assert.equal(outside.damage, 0);
  assert.equal(boxer.damage, 0);
  tick(match, 1);
  assert.equal(match.acidRain.length, 0);
  tick(match, 130);
  assert.equal(inside.damage, 20);
});
