import assert from 'node:assert/strict';
import { test } from 'node:test';
import { arenas } from '../src/arenas/index.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { traceDigits, tracePosition } from '../src/fighters/packman/path.js';
import { kickCenter, layoutKickTrace } from '../src/fighters/pinco-palino/path.js';
import { BattleEffects } from '../src/render/effects.js';

function prepare(id = 'pinco-palino') {
  const match = createMatch([id, 'rivet', 'bramble'].map((name, slot) => ({ slot, fighter: fighters.find(({ id }) => id === name), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  return match;
}

function tick(match, count, input = {}) {
  for (let i = 0; i < count; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

test('Pinco Palino uses a headbutt, a medium-range tongue, and an attack-blocking flash', () => {
  let match = prepare();
  Object.assign(match.fighters[1], { x: -4.22 });
  tick(match, 1, { lightPressed: true });
  tick(match, 37);
  assert.equal(match.fighters[1].damage, signatureAttacks.pincoHeadbutt.damage);

  match = prepare();
  match.fighters[1].x = -2.3;
  match.fighters[2].x = -8.2;
  tick(match, 1, { special: true, specialPressed: true });
  tick(match, 1);
  assert.equal(match.fighters[0].attack.type, 'pincoTongue');
  tick(match, 40);
  assert.equal(match.fighters[1].damage, signatureAttacks.pincoTongue.damage);
  assert.equal(match.fighters[2].damage, 0);

  match = prepare();
  match.fighters[1].x = -3.5;
  match.fighters[2].x = -8.2;
  tick(match, 1, { special: true, specialPressed: true });
  tick(match, 88, { special: true });
  assert.equal(match.fighters[0].attack.type, 'pincoFlash');
  tick(match, 32);
  assert.ok(match.fighters.slice(1).every(rival => rival.stagger > 0));
  const input = new Map([[1, { x: 0, y: 0, lightPressed: true }]]);
  tickMatch(match, input);
  assert.equal(match.fighters[1].attack, null);
  tick(match, 210);
  tickMatch(match, input);
  assert.equal(match.fighters[1].attack?.type, 'light');
});

test('Flying 67 starts at the activation point and hits a rival on its route', () => {
  const match = prepare();
  const [pinco, rival, other] = match.fighters;
  const platform = match.arena.platforms[2];
  Object.assign(pinco, { x: 6.4, facing: 1 });
  Object.assign(rival, { x: 6.24, y: platform.y, grounded: platform });
  other.x = -9.25;
  const origin = [pinco.x, pinco.y + kickCenter];
  tick(match, 1, { superPressed: true });
  assert.equal(pinco.attack, null);
  match.superstar.holder = pinco;
  tick(match, 1, { superPressed: true });
  assert.equal(pinco.attack?.type, 'pincoFlying67');
  assert.equal(match.superstar.holder, null);
  assert.deepEqual(pinco.attack.origin, origin);
  assert.deepEqual(tracePosition(0, origin, pinco.attack.tracePath), origin);
  assert.ok(Math.abs(pinco.x - origin[0]) < .2 && pinco.y > 0 && pinco.y < .22);
  const event = match.events.find(({ type }) => type === 'pincoTrace');
  assert.deepEqual(event.tracePath.leadIn.first, origin);
  assert.deepEqual(event.colors, signatureAttacks.pincoFlying67.trace67.colors);
  tick(match, 360);
  assert.equal(rival.damage, signatureAttacks.pincoFlying67.trace67.hit.damage);
  assert.equal(other.damage, 0);
  assert.equal(pinco.stocks, 3);
});

test('the green digits fit at either edge, and Packman keeps its fixed blue trace', () => {
  for (const definition of arenas) {
    const arena = createMatch([], definition).arena;
    const deck = arena.platforms.find(({ main }) => main);
    for (const facing of [-1, 1]) {
      const origin = [facing * (definition.bounds.side - .1), definition.bounds.top + kickCenter - .1];
      const { digits, leadIn } = layoutKickTrace(origin, arena, facing);
      assert.deepEqual(leadIn.first, origin);
      assert.deepEqual(leadIn.last, digits[0].first);
      assert.ok(digits.flatMap(({ points }) => points).every(([x, y]) => Math.abs(x) < definition.bounds.side && y > deck.y + kickCenter && y < definition.bounds.top));
      assert.ok(digits[0].end < digits[1].start);
    }
  }

  const match = prepare('packman');
  match.superstar.holder = match.fighters[0];
  tick(match, 1, { superPressed: true });
  const event = match.events.find(({ type }) => type === 'packmanTrace');
  assert.equal(event.tracePath.digits, traceDigits);
  assert.equal(event.tracePath.leadIn, undefined);
  const effects = new BattleEffects();
  effects.add([event]);
  const colors = new Set();
  effects.draw({ object: (_shape, _position, _size, color) => colors.add(color) }, { time: event.startedAt - 2.9 }, 0, 0);
  assert.deepEqual([...colors], ['#369aff', '#91dcff', '#e6fcff']);
});
