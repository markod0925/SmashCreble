import { createAdventureTrail } from '../arenas/adventure.js';
import { fighters } from '../fighters/index.js';
import { direction } from '../math.js';
import { platformCenter } from './arena.js';
import { strike } from './hits.js';
import { bodyHalfWidth, bodySize, createMatch, spawn } from './state.js';

export const enemyColor = '#ff896f';

const spikeSource = { fighter: { power: 1, color: enemyColor } };

export function createAdventure(lineup) {
  const humans = lineup.filter(({ cpu }) => !cpu);
  if (!humans.length) throw new RangeError('Adventure requires a human player.');
  const adventureTrail = createAdventureTrail(Math.ceil((fighters.length - 1) / humans.length) + 1);
  const match = createMatch(humans, adventureTrail);
  for (const player of match.fighters) player.team = 'party';
  match.adventure = {
    party: [...match.fighters], encounter: 0, enemies: [], defeated: 0, totalEnemies: fighters.length, damageLimit: 100,
    checkpoint: null,
  };
  return match;
}

export function hitSpikes(player, match) {
  const size = bodySize(player, match);
  const halfWidth = bodyHalfWidth(player, size);
  const spike = match.arena.definition.spikes.find(({ left, right, y, height }) =>
    player.x + halfWidth > left && player.x - halfWidth < right && player.y < y + height && player.y + 2.1 * size > y);
  if (!spike) return;
  if (strike(spikeSource, player, { damage: 14, force: 5, x: direction(player.x - platformCenter(spike), -player.facing), y: .65, lift: 4 }, match)) {
    player.invulnerable = .8;
  }
}

export function encounterGate(match) {
  const { campaign } = match.adventure;
  if (campaign) return campaign.opened ? undefined : campaign.objective?.gate ?? campaign.level.gate;
  return match.arena.definition.encounters[match.adventure.encounter]?.gate;
}

export function constrainToEncounter(player, match) {
  if (match.adventure.campaign) {
    const left = match.arena.platforms[0].left + .45;
    if (player.x < left) {
      player.x = left;
      player.vx = Math.max(0, player.vx);
    }
  }
  const gate = encounterGate(match);
  if (gate === undefined || player.x < gate - .35) return;
  player.x = gate - .35;
  player.vx = Math.min(0, player.vx);
}

function startEncounter(match, encounter) {
  const { arena, adventure } = match;
  const platform = arena.platforms.find(({ id }) => id === encounter.platform);
  const lastRival = adventure.totalEnemies - 1;
  const end = adventure.defeated === lastRival ? adventure.totalEnemies : Math.min(lastRival, adventure.defeated + adventure.party.length);
  const roster = fighters.slice(adventure.defeated, end);
  adventure.enemies = roster.map((fighter, index) => {
    const position = { platform: platform.id, x: encounter.spawnX - platformCenter(platform) + index * 1.8, facing: -1 };
    const slot = arena.definition.spawns.length * (adventure.encounter + 1) + index;
    const sizeMultiplier = adventure.defeated + index === lastRival ? 1.5 : 1;
    return { slot, fighter, cpu: true, team: 'enemies', stocks: 1, sizeMultiplier, ...spawn(slot, true, fighter, arena, position), aiDelay: .3 + index * .15 };
  });
  match.fighters.push(...adventure.enemies);
  for (const enemy of adventure.enemies) {
    match.events.push({ type: 'blink', x: enemy.x, y: enemy.y + 1, color: enemyColor });
  }
}

export function advanceAdventure(match) {
  const { adventure, arena } = match;
  const { party, enemies } = adventure;
  const { encounters } = arena.definition;
  if (enemies.length && enemies.every(({ stocks }) => !stocks)) {
    const platform = arena.platforms.find(({ id }) => id === encounters[adventure.encounter].platform);
    adventure.checkpoint = party.reduce((positions, player, index) => {
      positions[player.slot] = { platform: platform.id, x: platform.left - platformCenter(platform) + 8 + index * 2, facing: 1 };
      return positions;
    }, []);
    adventure.defeated += enemies.length;
    adventure.encounter++;
    adventure.enemies = [];
    match.fighters = [...party];
    if (adventure.defeated === adventure.totalEnemies) {
      match.result = { completed: true };
      return;
    }
    if (match.superstar) Object.assign(match.superstar, encounters[adventure.encounter].star);
  }
  const survivors = party.filter(({ stocks }) => stocks > 0);
  if (!survivors.length) {
    match.result = { completed: false };
    return;
  }
  const encounter = encounters[adventure.encounter];
  if (!adventure.enemies.length && survivors.some(({ x, y, respawn }) => !respawn && x >= encounter.trigger && y >= 0)) {
    startEncounter(match, encounter);
  }
}

export function defeatedEnemies({ defeated, enemies }) {
  return defeated + enemies.filter(({ stocks }) => !stocks).length;
}
