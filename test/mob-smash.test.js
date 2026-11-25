import assert from 'node:assert/strict';
import test from 'node:test';
import { arenas } from '../src/arenas/index.js';
import { rules } from '../src/combat/arena.js';
import { summonClones } from '../src/combat/clones.js';
import { isDancing, startDance } from '../src/combat/dance.js';
import { strike } from '../src/combat/hits.js';
import { tickMatch } from '../src/combat/match.js';
import { createMobSmash, mobTargets } from '../src/combat/mob-smash.js';
import { fighters } from '../src/fighters/index.js';
import { Lobby } from '../src/ui/lobby.js';

const controls = new Map();
const hit = { damage: 10, force: 0, x: 1, stationary: true };
const lineup = (count) => fighters.slice(0, count).map((fighter, slot) => ({ slot, fighter, cpu: false }));

function fall(player, match) {
  Object.assign(player, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
}

test('Mob Smash admits up to three controllers while the standard lobby can admit four', () => {
  const lobby = Object.assign(Object.create(Lobby.prototype), {
    mobSmash: true, seats: [null, null, null, null], selection: 0,
    snapshot: { pads: new Map() },
  });
  const pads = Array.from({ length: 4 }, (_, index) => ({ id: `Controller ${index}`, index }));
  lobby.updateControllers({ pads: new Map(pads.map((pad) => [pad.index, pad])) });
  assert.deepEqual(pads.map((pad) => lobby.joinPad(pad)), [true, true, true, false]);
  assert.equal(lobby.lineup().length, 3);
  assert.throws(() => createMobSmash(lineup(4), arenas[0], 10), RangeError);

  lobby.mobSmash = false;
  assert.equal(lobby.joinPad(pads[3]), true);
  lobby.mobSmash = true;
  assert.equal(lobby.controllerSlot(pads[3]), -1);
  assert.equal(lobby.lineup().length, 3);
});

test('each Mob Smash target keeps the selected arena and replaces CPUs up to exactly the KO target', () => {
  for (const target of mobTargets) {
    for (const count of [1, 2, 3]) {
      const arena = arenas[(mobTargets.indexOf(target) + count) % arenas.length];
      const match = createMobSmash(lineup(count), arena, target);
      const { mobSmash } = match;
      const seen = new Map();
      match.countdown = 0;
      match.time = rules.step / 2;
      assert.equal(match.arena.definition, arena);
      tickMatch(match, controls);
      assert.ok(match.time < 0);
      assert.equal(match.result, null);
      while (!match.result) {
        assert.equal(mobSmash.enemies.length, Math.min(count, target - mobSmash.defeated));
        for (const enemy of mobSmash.enemies) {
          assert.equal(enemy.cpu, true);
          assert.equal(enemy.stocks, 1);
          if (seen.has(enemy.slot)) assert.equal(seen.get(enemy.slot), enemy);
          seen.set(enemy.slot, enemy);
        }
        const [enemy] = mobSmash.enemies;
        fall(enemy, match);
        const expected = mobSmash.defeated + 1;
        tickMatch(match, controls);
        assert.equal(mobSmash.defeated, expected);
        assert.ok(!match.fighters.includes(enemy));
      }
      assert.equal(seen.size, target);
      assert.equal(mobSmash.defeated, target);
      assert.deepEqual(match.result, { completed: true });
    }
  }
});

test('Mob Smash ends only when the last player loses their final stock and retains the KO count', () => {
  const match = createMobSmash(lineup(2), arenas[0], 20);
  match.countdown = 0;
  const [player, ally] = match.mobSmash.party;
  player.stocks = 1;
  fall(player, match);
  fall(match.mobSmash.enemies[0], match);
  tickMatch(match, controls);
  assert.equal(player.stocks, 0);
  assert.equal(match.mobSmash.defeated, 1);
  assert.equal(match.result, null);
  assert.equal(match.mobSmash.enemies.length, 2);

  ally.stocks = 1;
  fall(ally, match);
  tickMatch(match, controls);
  assert.deepEqual(match.result, { completed: false });
  assert.equal(match.mobSmash.defeated, 1);
});

test('Mob Smash players and clones cannot hit each other but can hit CPU opponents', () => {
  const match = createMobSmash(lineup(2), arenas[0], 10);
  const [first, second] = match.mobSmash.party;
  const [enemy, otherEnemy] = match.mobSmash.enemies;
  summonClones(first, match, 1);
  summonClones(second, match, 1);
  const [firstClone, secondClone] = match.clones;
  for (const attacker of [first, firstClone]) {
    for (const ally of [first, second, firstClone, secondClone]) {
      assert.equal(strike(attacker, ally, hit, match), false);
    }
  }
  assert.equal(strike(enemy, otherEnemy, hit, match), false);
  assert.equal(strike(firstClone, enemy, hit, match), true);
  assert.equal(strike(otherEnemy, secondClone, hit, match), true);
  assert.equal(secondClone.stocks, 0);
  assert.equal(match.mobSmash.defeated, 0);
});

test('an allied Snake Dance leaves teammates and their clones in control', () => {
  const shark = fighters.find(({ id }) => id === 'shark-67');
  const match = createMobSmash([{ slot: 0, fighter: shark }, lineup(2)[1]], arenas[0], 10);
  match.countdown = 0;
  const [owner, ally] = match.mobSmash.party;
  const [enemy] = match.mobSmash.enemies;
  summonClones(ally, match, 1);
  const [clone] = match.clones;
  const x = ally.x;
  startDance(owner, match);
  assert.equal(isDancing(owner, match), true);
  assert.equal(isDancing(enemy, match), true);
  assert.equal(isDancing(ally, match), false);
  assert.equal(isDancing(clone, match), false);
  tickMatch(match, new Map([[ally.slot, { x: 1, y: 0 }]]));
  assert.ok(ally.x > x);
});
