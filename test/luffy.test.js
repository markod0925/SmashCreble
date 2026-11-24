import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { summonClones } from '../src/combat/clones.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { frozenTime } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';

function prepare(...ids) {
  const match = createMatch(['luffy', ...ids].map((id, slot) => ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  Object.assign(match.fighters[0], { x: 0, facing: 1 });
  return match;
}

function tick(match, count, input = {}) {
  for (let i = 0; i < count; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

test('Luffy kicks, punches, headbutts, and reaches a distant opponent with Gum-Gum Punch', () => {
  let match = prepare('rivet');
  match.fighters[1].x = 1.3;
  tick(match, 1, { lightPressed: true });
  tick(match, 47);
  assert.equal(match.fighters[1].damage, 10.5);

  match = prepare('rivet');
  match.fighters[1].x = 1.9;
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 1);
  assert.equal(match.fighters[0].attack.type, 'luffyHeadbutt');
  tick(match, 30);
  assert.equal(match.fighters[1].damage, 10);

  for (const facing of [-1, 1]) {
    match = prepare('rivet', 'vesper');
    match.fighters[0].facing = facing;
    match.fighters[1].x = 5.9 * facing;
    match.fighters[2].x = -2 * facing;
    tick(match, 1, { specialPressed: true, special: true });
    tick(match, 88, { special: true });
    assert.equal(match.fighters[0].attack.type, 'luffyGumGum');
    tick(match, 35);
    assert.equal(match.fighters[1].damage, 16);
    assert.equal(match.fighters[2].damage, 0);
  }
});

test('Rubber Dance freezes distant, airborne, and rear opponents for three seconds and strikes each of them', () => {
  const match = prepare('vi', 'bramble', 'kiln');
  const [luffy, vi, bramble, kiln] = match.fighters;
  Object.assign(vi, { x: -8.6, facing: 1 });
  Object.assign(bramble, { x: 8.1, y: 2.5, grounded: match.arena.platforms[2] });
  Object.assign(kiln, { x: 3.7, y: 6.4, grounded: null });
  summonClones(vi, match, 2);
  tick(match, 1, { superPressed: true });
  assert.equal(luffy.attack, null);

  match.superstar.holder = luffy;
  tick(match, 1, { superPressed: true });
  assert.equal(luffy.attack?.type, 'luffyRubberDance');
  assert.equal(match.superstar.holder, null);
  tick(match, Math.ceil(signatureAttacks.luffyRubberDance.from / rules.step) - 1);
  assert.equal(luffy.attack.fired, true);
  const frozen = [vi, bramble, kiln];
  const positions = frozen.map(({ x, y }) => [x, y]);
  for (const rival of [...frozen, ...match.clones]) assert.ok(Math.abs(frozenTime(rival, match) - 3) < 1e-6);
  assert.equal(frozenTime(luffy, match), 0);
  assert.equal(luffy.attack.untouchable, true);

  const ticks = Math.round(3 / rules.step);
  const opposingInput = new Map(match.fighters.map(({ slot }) => [slot, { x: 1, y: 0, jumpPressed: true, lightPressed: true }]));
  for (let i = 0; i < ticks - 1; i++) tickMatch(match, opposingInput);
  assert.deepEqual(frozen.map(({ x, y }) => [x, y]), positions);
  assert.deepEqual(frozen.map(({ damage }) => damage), [24, 24, 24]);
  assert.equal(match.clones.length, 0);
  assert.equal(luffy.x, 0);
  assert.equal(luffy.y, 0);
  assert.ok(frozen.every(rival => frozenTime(rival, match) > 0));

  tickMatch(match, opposingInput);
  assert.ok(frozen.every(rival => frozenTime(rival, match) === 0));
  assert.equal(luffy.attack, null);
  assert.ok(vi.y > positions[0][1]);
});
