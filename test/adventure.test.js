import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdventure, defeatedEnemies, encounterGate } from '../src/combat/adventure.js';
import { rules } from '../src/combat/arena.js';
import { canSummonClones } from '../src/combat/clones.js';
import { strike } from '../src/combat/hits.js';
import { tickMatch } from '../src/combat/match.js';
import { bodySize } from '../src/combat/state.js';
import { fighters } from '../src/fighters/index.js';

const controls = new Map();
const hit = { damage: 1, force: 0, x: 1, y: 0, lift: 0, stationary: true };

function startAdventure(count) {
  const lineup = fighters.slice(0, count).map((fighter, slot) => ({ slot, fighter, cpu: false }));
  const match = createAdventure(lineup);
  match.countdown = 0;
  return match;
}

function reachEncounter(match) {
  const { trigger, platform } = match.arena.definition.encounters[match.adventure.encounter];
  const deck = match.arena.platforms.find(({ id }) => id === platform);
  Object.assign(match.fighters[0], { x: trigger, y: deck.y, grounded: deck, vx: 0, vy: 0 });
  tickMatch(match, controls);
  return match.adventure.enemies;
}

test('the adventure sends every roster fighter once, in capped waves, and ends on the giant', () => {
  for (const count of [1, 2, 3, 4]) {
    const match = startAdventure(count);
    const roster = [];
    match.time = .002;
    tickMatch(match, controls);
    assert.equal(match.result, null);
    assert.equal(match.adventure.enemies.length, 0);
    while (!match.result) {
      const enemies = reachEncounter(match);
      assert.ok(enemies.length > 0 && enemies.length <= count);
      for (const enemy of enemies) {
        roster.push(enemy.fighter);
        const last = roster.length === fighters.length;
        assert.equal(bodySize(enemy, match), enemy.fighter.size * (last ? 1.5 : 1));
        if (last) assert.equal(enemies.length, 1);
        assert.equal(canSummonClones(enemy, match, 2), false);
        assert.equal(strike(match.fighters[0], enemy, { ...hit, damage: 99 }, match), true);
        assert.equal(enemy.stocks, 1);
        enemy.invulnerable = 0;
        assert.equal(strike(match.fighters[0], enemy, hit, match), true);
        assert.equal(enemy.stocks, 0);
      }
      tickMatch(match, controls);
      assert.equal(defeatedEnemies(match.adventure), roster.length);
      assert.equal(Boolean(match.result), roster.length === fighters.length);
    }
    assert.deepEqual(roster, fighters);
    assert.deepEqual(match.result, { completed: true });
  }
});

test('pits clear enemies and cost human stocks, with respawns at the cleared section', () => {
  const match = startAdventure(2);
  const [player, ally] = match.fighters;
  const [enemy, other] = reachEncounter(match);
  assert.equal(strike(player, ally, hit, match), false);
  assert.equal(strike(enemy, other, hit, match), false);
  const gate = encounterGate(match);
  Object.assign(enemy, { x: gate + 1, y: 3, grounded: null });
  tickMatch(match, controls);
  assert.ok(enemy.x < gate);
  for (const opponent of [enemy, other]) {
    Object.assign(opponent, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  }
  tickMatch(match, controls);
  assert.equal(defeatedEnemies(match.adventure), 2);
  assert.ok(encounterGate(match) > gate);

  Object.assign(player, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  tickMatch(match, controls);
  assert.equal(player.stocks, rules.stocks - 1);
  tickMatch(match, controls, player.respawn);
  assert.equal(player.x, match.arena.platforms.find(({ id }) => id === 'trail-0').left + 8);
  assert.equal(player.damage, 0);
});

test('the starting spikes damage players and a jump clears the first pit', () => {
  const match = startAdventure(1);
  const [player] = match.fighters;
  const [arrival] = match.arena.platforms;
  const [spikes] = match.arena.definition.spikes;
  player.x = spikes.left;
  tickMatch(match, controls);
  assert.ok(player.damage > 0 && player.vy > 0);
  Object.assign(player, { x: arrival.right - .3, y: arrival.y, vx: player.fighter.speed, vy: 0, grounded: arrival, hitstun: 0 });
  tickMatch(match, new Map([[player.slot, { x: 1, y: 0, jumpPressed: true }]]));
  for (let step = 0; step < 110; step++) tickMatch(match, new Map([[player.slot, { x: 1, y: 0 }]]));
  assert.equal(player.grounded?.id, 'trail-0');
  assert.equal(match.adventure.enemies.length, 1);
});
