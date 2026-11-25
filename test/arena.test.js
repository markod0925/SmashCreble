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
const iui = arenas.find(({ id }) => id === 'iui');
const frittata = arenas.find(({ id }) => id === 'spiaccica-frittata');
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

test('IUI! warns every 15 seconds before replacing only the lower deck', () => {
  const { arena } = createMatch(lineup, iui);
  const [deck, ...ledges] = arena.platforms;
  const floorHeights = arena.platforms.map(({ y }) => y);
  const woodTops = [];
  const renderer = {
    object(shape, position, size) {
      if (shape === 'box' && size[1] === .3) woodTops.push(position);
    },
  };
  drawBattleArena(renderer, arena, 0);
  const stillTops = woodTops.splice(0);
  assert.equal(stillTops.length, 9);

  advanceArena(arena, 14.99);
  assert.equal(arena.platformWarning, 0);
  advanceArena(arena, .26);
  assert.ok(arena.platformWarning > 0);
  assert.equal(arena.platforms[0], deck);
  drawBattleArena(renderer, arena, 0);
  const warningTops = woodTops.splice(0);
  assert.notDeepEqual(warningTops.slice(0, 3), stillTops.slice(0, 3));
  assert.deepEqual(warningTops.slice(3), stillTops.slice(3));

  advanceArena(arena, 2.74);
  assert.equal(arena.platforms[0], deck);
  advanceArena(arena, .01);
  assert.equal(arena.fallingPlatform, deck);
  assert.equal(arena.platformWarning, 0);
  assert.equal(arena.platforms.length, 3);
  const [replacement] = arena.platforms;
  assert.notEqual(replacement, deck);
  advanceArena(arena, .5);
  assert.ok(replacement.y > floorHeights[0] && replacement.y < replacement.previousY);
  assert.ok(deck.falling && deck.y < deck.previousY);
  for (const [index, ledge] of ledges.entries()) {
    assert.equal(arena.platforms[index + 1], ledge);
    assert.equal(ledge.y, floorHeights[index + 1]);
  }
  drawBattleArena(renderer, arena, 0);
  assert.equal(woodTops.length, 12);
  assert.deepEqual(woodTops.slice(6), stillTops.slice(3));

  advanceArena(arena, 10);
  assert.equal(arena.fallingPlatform, null);
  assert.deepEqual(arena.platforms.map(({ y }) => y), floorHeights);
  advanceArena(arena, 1.5);
  assert.ok(arena.platformWarning > 0);
  advanceArena(arena, 3);
  assert.equal(arena.fallingPlatform, replacement);
});

test('IUI! carries idle deck riders out while raised platforms stay safe', () => {
  const match = createMatch([...lineup, { slot: 2, fighter: fighters[2] }], iui);
  match.countdown = 0;
  const [jumper, idle, ledgeRider] = match.fighters;
  const [deck, ledge] = match.arena.platforms;
  jumper.x = 0;
  Object.assign(ledgeRider, { x: -10, y: ledge.y, grounded: ledge });
  advanceArena(match.arena, 18 - rules.step);
  const jump = new Map([[jumper.slot, { x: 0, y: 0, jumpPressed: true }]]);
  tickMatch(match, jump);
  for (let i = 0; i < 53; i++) tickMatch(match, controls);
  assert.equal(idle.grounded, deck);
  assert.equal(idle.y, deck.y);
  assert.ok(idle.y < 0);
  assert.equal(jumper.grounded, null);
  tickMatch(match, jump);
  for (let i = 0; i < 125; i++) tickMatch(match, controls);
  assert.equal(idle.stocks, rules.stocks - 1);
  assert.equal(jumper.stocks, rules.stocks);
  assert.equal(jumper.grounded, match.arena.platforms[0]);
  assert.equal(ledgeRider.grounded, ledge);
  assert.equal(ledgeRider.y, ledge.y);
  assert.equal(ledgeRider.stocks, rules.stocks);
});

test('Spiaccica Frittata crushes low fighters every 15 seconds and keeps them on the deck', () => {
  const seats = [0, 1, 2, 3].map((slot) => ({ slot, fighter: fighters[slot] }));
  const match = createMatch(seats, frittata);
  match.countdown = 0;
  const [standing, jumping, low, below] = match.fighters;
  const [deck] = match.arena.platforms;
  const { damage, clearance } = frittata.deckCrush;
  advanceArena(match.arena, 14.75);
  tickMatch(match, new Map([[jumping.slot, { x: 0, y: 0, jumpPressed: true }]]));
  for (let i = 0; i < 28; i++) tickMatch(match, controls);
  assert.ok(match.arena.environment.warning > 0);
  assert.equal(standing.damage, 0);
  assert.ok(jumping.y > deck.y + clearance);

  Object.assign(low, { grounded: null, y: deck.y + clearance / 2, vy: 0 });
  Object.assign(below, { grounded: null, y: deck.y - 2, vy: 0 });
  tickMatch(match, new Map([[standing.slot, { x: 0, y: 0, guard: true }]]));
  assert.equal(match.arena.environment.fold, 1);
  for (const rider of [standing, low]) {
    assert.equal(rider.damage, damage);
    assert.equal(rider.grounded, deck);
    assert.equal(rider.y, deck.y);
    assert.equal(rider.vx, 0);
    assert.equal(rider.vy, 0);
    assert.equal(rider.stocks, rules.stocks);
  }
  assert.equal(jumping.damage, 0);
  assert.equal(below.damage, 0);
  for (let i = 0; i < 24; i++) tickMatch(match, controls);
  assert.equal(standing.damage, damage);

  advanceArena(match.arena, 30 - rules.step - match.arena.elapsed);
  tickMatch(match, controls);
  assert.equal(standing.damage, damage * 2);
  assert.equal(standing.grounded, deck);
});

test('Spiaccica Frittata scrolls mountains and folds one wing over the fixed deck', () => {
  const { arena } = createMatch(lineup, frittata);
  const [deck] = arena.platforms;
  const angles = [];
  const summits = [];
  const renderer = {
    object(shape, position, size, color, rotation) {
      if (shape === 'horn') summits.push(position);
      if (shape === 'box' && size[0] === deck.width) angles.push(rotation[0]);
    },
  };
  drawBattleArena(renderer, arena, 0);
  const originalSummits = summits.splice(0);
  assert.deepEqual(angles.splice(0), [0, 0]);
  advanceArena(arena, 15);
  drawBattleArena(renderer, arena, 0);
  assert.notDeepEqual(summits, originalSummits);
  assert.deepEqual(angles.splice(0), [0, Math.PI]);
  assert.equal(arena.platforms[0], deck);
  assert.equal(deck.y, 0);
  advanceArena(arena, 1);
  drawBattleArena(renderer, arena, 0);
  assert.deepEqual(angles, [0, 0]);
});
