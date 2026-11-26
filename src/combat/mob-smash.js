import { fighters } from '../fighters/index.js';
import { enemyColor } from '../player-colors.js';
import { createMatch, spawn } from './state.js';

export const mobTargets = [10, 20, 50, 100];
export const mobPlayerLimit = 3;

export function createMobSmash(lineup, definition, target) {
  const humans = lineup.filter(({ cpu }) => !cpu);
  if (!humans.length || humans.length > mobPlayerLimit) throw new RangeError('Mob Smash requires one to three human players.');
  if (!mobTargets.includes(target)) throw new RangeError('Invalid Mob Smash KO target.');

  const match = createMatch(humans, definition);
  for (const player of match.fighters) player.team = 'party';
  const { spawns } = match.arena.definition;
  const positions = [...spawns].sort((a, b) => a.x - b.x);
  // Place enemies between the arena's regular player spawn points.
  const entries = positions.slice(1).map((entry, index) => ({
    platform: entry.platform, x: (entry.x + positions[index].x) / 2,
  })).sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
  match.mobSmash = {
    party: [...match.fighters], enemies: [], defeated: 0, totalEnemies: target, entries,
  };
  advanceMobSmash(match, true);
  return match;
}

export function advanceMobSmash(match, initial = false) {
  const { arena, mobSmash } = match;
  const { party, entries, totalEnemies } = mobSmash;
  const partyAlive = party.some(({ stocks }) => stocks > 0);
  if (!initial && partyAlive && mobSmash.enemies.every(({ stocks }) => stocks > 0)) return;
  const survivors = mobSmash.enemies.filter(({ stocks }) => stocks > 0);
  mobSmash.defeated += mobSmash.enemies.length - survivors.length;
  mobSmash.enemies = survivors;

  if (mobSmash.defeated === totalEnemies || !partyAlive) {
    match.result = { completed: mobSmash.defeated === totalEnemies };
  } else {
    for (const entry of entries.slice(0, party.length)) {
      const sequence = mobSmash.defeated + survivors.length;
      if (sequence === totalEnemies) break;
      if (survivors.some((enemy) => enemy.entry === entry)) continue;
      const fighter = fighters[sequence % fighters.length];
      const slot = arena.definition.spawns.length + sequence;
      const enemy = { slot, fighter, cpu: true, team: 'enemies', stocks: 1, entry,
        ...spawn(slot, initial, fighter, arena, entry) };
      survivors.push(enemy);
      if (!initial) match.events.push({ type: 'blink', x: enemy.x, y: enemy.y + 1, color: enemyColor });
    }
  }
  if (!match.superstar && arena.definition.superstar && survivors.some(({ fighter }) => fighter.moves)) {
    match.superstar = { ...arena.definition.superstar, holder: null, cooldown: 0 };
  }
  match.fighters = [...party, ...survivors];
}
