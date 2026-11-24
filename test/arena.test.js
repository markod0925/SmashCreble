import assert from 'node:assert/strict';
import test from 'node:test';
import { arenas, defaultArena } from '../src/arenas/index.js';
import { advanceArena, platformCenter, platformHeight, rules } from '../src/combat/arena.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { landOnPlatform } from '../src/combat/movement.js';
import { advanceProjectiles } from '../src/combat/projectiles.js';
import { fighters } from '../src/fighters/index.js';
import { drawBattleArena } from '../src/render/arena.js';
import { shapes } from '../src/render/geometry.js';
import { transform, transformPoint } from '../src/render/math.js';

const storm = arenas.find(({ id }) => id === 'stormcoil-array');
const gdmr = arenas.find(({ id }) => id === 'gdmr');
const lineup = [0, 1].map((slot) => ({ slot, fighter: fighters[slot] }));
const controls = new Map();

function liveStorm() {
  const match = createMatch(lineup, storm);
  match.countdown = 0;
  return match;
}

test('the default layout stays fixed and moving platforms belong to each match', () => {
  const foundry = createMatch(lineup);
  const first = liveStorm();
  const second = liveStorm();
  const [, lift] = first.arena.platforms;
  const [, otherLift] = second.arena.platforms;
  assert.equal(foundry.arena.definition, defaultArena);
  assert.deepEqual(foundry.fighters.map(({ x, y }) => [x, y]), [[-6, 0], [6, 0]]);
  assert.notEqual(first.fighters[0].x, foundry.fighters[0].x);

  tickMatch(foundry, controls, 1);
  tickMatch(first, controls, 1);
  assert.equal(foundry.arena.elapsed, 0);
  assert.equal(second.arena.elapsed, 0);
  assert.notEqual(lift.left, otherLift.left);
  assert.notEqual(lift.y, otherLift.y);
  assert.equal(lift, first.arena.platforms[1]);

  const originalLayout = foundry.arena.platforms.map(({ left, right, y }) => [left, right, y]);
  foundry.countdown = 0;
  tickMatch(foundry, controls);
  assert.deepEqual(foundry.arena.platforms.map(({ left, right, y }) => [left, right, y]), originalLayout);
});

test('a lift carries its rider until they drop through it', () => {
  const match = liveStorm();
  const [rider] = match.fighters;
  const [, lift] = match.arena.platforms;
  Object.assign(rider, { x: platformCenter(lift), y: lift.y, grounded: lift });

  tickMatch(match, controls);
  assert.equal(rider.grounded, lift);
  assert.ok(Math.abs(rider.x - platformCenter(lift)) < 1e-9);
  assert.equal(rider.y, lift.y);

  tickMatch(match, new Map([[rider.slot, { x: 0, y: -1, jumpPressed: true }]]));
  assert.equal(rider.grounded, null);
  assert.ok(rider.y < lift.y);
});

test('a rising lift can catch a fighter or projectile from above', () => {
  const match = liveStorm();
  const [player] = match.fighters;
  advanceArena(match.arena, rules.step);
  const [, lift] = match.arena.platforms;
  const x = platformCenter(lift);
  const y = (lift.previousY + lift.y) / 2;
  const start = { x, y };

  Object.assign(player, { x, y, vy: 0, grounded: null });
  landOnPlatform(player, start, match.arena);
  assert.equal(player.grounded, lift);
  assert.equal(player.y, lift.y);

  Object.assign(player, { x, y: lift.previousY - .01, vy: 0, grounded: null });
  landOnPlatform(player, player, match.arena);
  assert.equal(player.grounded, null);
  Object.assign(player, { x: -7.4, y: .35, grounded: match.arena.platforms[0] });

  let impacts = 0;
  match.projectiles.push({ x, y, vx: 0, vy: 0, gravity: 1, remaining: 1, owner: player, onImpact: () => impacts++ });
  advanceProjectiles(match, rules.step);
  assert.equal(impacts, 1);
  assert.equal(match.projectiles.length, 0);
});

test('the current drifts airborne fighters and reverses direction', () => {
  const match = liveStorm();
  const [player] = match.fighters;
  advanceArena(match.arena, 1);
  Object.assign(player, { x: 0, y: 2, grounded: null });
  tickMatch(match, controls);
  assert.ok(player.x > 0);

  advanceArena(match.arena, 4);
  Object.assign(player, { x: 0, y: 2, vy: 0 });
  tickMatch(match, controls);
  assert.ok(player.x < 0);

  const [deck] = match.arena.platforms;
  Object.assign(player, { x: 0, y: deck.y, vy: 0, grounded: deck });
  tickMatch(match, controls);
  assert.equal(player.x, 0);
});

test('knockouts and respawns use the selected arena', () => {
  const match = liveStorm();
  const [player] = match.fighters;
  Object.assign(player, { x: (storm.bounds.side + defaultArena.bounds.side) / 2, y: 4, grounded: null });
  tickMatch(match, controls);
  assert.equal(player.stocks, rules.stocks - 1);
  tickMatch(match, controls, player.respawn);
  assert.equal(player.x, storm.spawns[0].x);
  assert.equal(player.y, match.arena.platforms[0].y + storm.respawnHeight);
  assert.equal(player.grounded, null);
});

test('the storm renderer draws a platform at its current collision position', () => {
  const match = liveStorm();
  tickMatch(match, controls, 1);
  const [, lift] = match.arena.platforms;
  const platformTop = [platformCenter(lift), lift.y - .12, -.85];
  const positions = [];
  const renderer = {
    object(shape, position, size) {
      assert.ok(Object.hasOwn(shapes, shape));
      assert.ok([...position, ...size].every(Number.isFinite));
      if (shape === 'box') positions.push(position);
    },
  };
  drawBattleArena(renderer, match.arena, 1);
  assert.ok(positions.some((position) => position.every((value, i) => value === platformTop[i])));
  drawBattleArena(renderer, createMatch(lineup).arena, 0);
});

test('GDMR rocks one rigid platform and keeps both riders on its surface', () => {
  const match = createMatch(lineup, gdmr);
  match.countdown = 0;
  const [deck] = match.arena.platforms;
  assert.equal(match.arena.platforms.length, 1);
  assert.equal(deck.angle, -Math.PI / 6);
  const anchor = (rider) => (rider.x - platformCenter(deck)) / Math.cos(deck.angle);
  const initialAnchors = match.fighters.map(anchor);
  const renderer = {
    object(shape, position, size, color, rotation) {
      if (shape !== 'box' || size[0] !== deck.width || size[1] !== .36) return;
      const matrix = transform(position, size, rotation);
      for (const end of [-.5, .5]) {
        const [x, y] = transformPoint(matrix, [end, .5, 0]);
        assert.ok(Math.abs(x - (end < 0 ? deck.left : deck.right)) < 1e-9);
        assert.ok(Math.abs(y - platformHeight(deck, x)) < 1e-9);
      }
      this.checked = true;
    },
  };
  drawBattleArena(renderer, match.arena, 0);
  assert.ok(renderer.checked);
  for (let i = 0; i < 8 / rules.step; i++) {
    tickMatch(match, controls);
    for (const [slot, rider] of match.fighters.entries()) {
      assert.equal(rider.grounded, deck);
      assert.ok(Math.abs(anchor(rider) - initialAnchors[slot]) < 1e-8);
      assert.equal(rider.y, platformHeight(deck, rider.x));
    }
    assert.ok(Math.abs(deck.angle) <= Math.PI / 6);
    if (i + 1 === 4 / rules.step) assert.equal(deck.angle, Math.PI / 6);
  }
  assert.equal(deck.angle, -Math.PI / 6);

  const [rider] = match.fighters;
  tickMatch(match, new Map([[rider.slot, { x: 0, y: 0, jumpPressed: true }]]));
  assert.equal(rider.grounded, null);
  for (let i = 0; i < 1.5 / rules.step && !rider.grounded; i++) tickMatch(match, controls);
  assert.equal(rider.grounded, deck);
  assert.equal(rider.y, platformHeight(deck, rider.x));
});

test('GDMR grants two arena clones to each active rival when a Superstar move starts', () => {
  const caster = fighters.find(({ id }) => id === 'harri-potter');
  const seats = [{ slot: 0, fighter: caster }, ...[1, 2, 3].map((slot) => ({ slot, fighter: fighters[slot] }))];
  const match = createMatch(seats, gdmr);
  match.countdown = 0;
  const [owner, ...rivals] = match.fighters;
  match.superstar.holder = owner;
  tickMatch(match, new Map([[owner.slot, { x: 0, y: 0, superPressed: true }]]));
  assert.equal(owner.attack.type, caster.moves.super);
  assert.equal(match.superstar.holder, null);
  assert.deepEqual(rivals.map((rival) => match.clones.filter(({ owner }) => owner === rival).length), [2, 2, 2]);
  assert.equal(match.clones.length, 6);
  for (const clone of match.clones) {
    assert.equal(clone.grounded, match.arena.platforms[0]);
    assert.equal(clone.y, platformHeight(clone.grounded, clone.x));
  }
});
