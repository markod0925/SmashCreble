import assert from 'node:assert/strict';
import { test } from 'node:test';
import { strike } from '../src/combat/hits.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

function prepare(positions) {
  const ids = ['nurofen-caps', 'rivet', 'bramble'];
  const match = createMatch(positions.map((_, slot) => ({ slot, fighter: fighters.find(({ id }) => id === ids[slot]), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  positions.forEach((x, slot) => { match.fighters[slot].x = x; });
  return match;
}

function tick(match, frames, input = {}) {
  for (let i = 0; i < frames; i++) tickMatch(match, new Map([[0, { x: 0, y: 0, ...input }]]));
}

test('Nurofen Caps fires vitamin C with the light attack and launches different bombs on tap and hold', () => {
  const match = prepare([-4, 0]);
  tick(match, 1, { lightPressed: true });
  tick(match, 15);
  assert.equal(match.projectiles[0]?.kind, 'capsVitaminShot');
  tick(match, 45);
  assert.equal(match.fighters[1].damage, 5);

  function detonate(hold) {
    const match = prepare([-4, 0, 1.98]);
    tick(match, 1, { specialPressed: true, special: true });
    if (hold) tick(match, 88, { special: true });
    tick(match, 1);
    assert.equal(match.fighters[0].attack.type, hold ? 'capsBigBomb' : 'capsBomb');
    tick(match, hold ? 38 : 21);
    const [bomb] = match.projectiles;
    assert.equal(bomb.kind, hold ? 'capsMegaBomb' : 'capsMiniBomb');
    tick(match, 105);
    const explosions = match.events.filter(({ type }) => type === 'explosion');
    assert.equal(explosions.length, 1);
    assert.equal(match.projectiles.length, 0);
    assert.equal(match.fighters[0].damage, 0);
    assert.equal(match.fighters[1].damage, bomb.hit.damage);
    assert.equal(match.fighters[2].damage, hold ? bomb.hit.damage : 0);
    return { size: bomb.scale, radius: explosions[0].strength };
  }

  const small = detonate(false);
  const big = detonate(true);
  assert.ok(big.size > small.size && big.radius > small.radius);
});

test('Clone Squad makes four half-size CPU fighters that slap, vanish when hit, and can be replaced', () => {
  const match = prepare([-4, .75]);
  const [owner, rival] = match.fighters;
  tick(match, 1, { superPressed: true });
  assert.equal(owner.attack, null);
  match.superstar.holder = owner;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  tick(match, 38);
  assert.equal(match.clones.length, 4);
  assert.ok(match.clones.every(clone => clone.cpu && clone.owner === owner && clone.fighter.size === owner.fighter.size * .5));
  assert.ok(match.clones.every(clone => clone.fighter.moves.light === 'capsCloneSlap'));
  assert.equal(owner.fighter.moves.light, 'capsVitamin');

  tick(match, 91);
  assert(rival.damage >= 4.5);
  assert.equal(match.projectiles.length, 0);
  match.superstar.holder = owner;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, owner);

  assert(strike(rival, match.clones[0], {}, match));
  tick(match, 1);
  assert.equal(match.clones.length, 3);
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  tick(match, 38);
  assert.equal(match.clones.length, 4);
});
