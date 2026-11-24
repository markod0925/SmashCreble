import { defaultArena } from '../arenas/index.js';
import { createArena, platformCenter, platformHeight, rules } from './arena.js';
import { bommBurstScale } from '../fighters/bomm/profile.js';
import { shrinkScale } from '../fighters/zunchy/profile.js';

export const cloneScale = 0.5;
export const scaleOf = (player) => player.owner ? cloneScale : player.sizeMultiplier ?? 1;
export const bodyScale = (player, match) => scaleOf(player) * shrinkScale(player, match);
export const bodyCenter = (player, match) => 1.05 * bodyScale(player, match);
export const bodySize = (player, match) => player.fighter.size * (player.sizeMultiplier ?? 1) * bommBurstScale(player, match) * shrinkScale(player, match);
export const bodyHalfWidth = (player, size) => (player.fighter.bodyHalfWidth ?? .55) * size;

export function bodyContactDistance(a, b, match) {
  return bodyHalfWidth(a, bodySize(a, match)) + bodyHalfWidth(b, bodySize(b, match));
}

export function spawn(slot, initial, fighter, arena, entry = arena.definition.spawns[slot]) {
  const platform = arena.platforms.find(({ id }) => id === entry.platform);
  const x = platformCenter(platform) + entry.x * Math.cos(platform.angle);
  return {
    x, y: platformHeight(platform, x) + (initial ? 0 : arena.definition.respawnHeight), vx: 0, vy: 0, facing: entry.facing ?? (x < 0 ? 1 : -1),
    grounded: initial ? platform : null, jumps: fighter.airJumps ?? 2, recovered: false,
    damage: 0, hitstun: 0, invulnerable: initial ? 0 : 1.5, respawn: 0,
    attack: null, shield: 1, guarding: false, dodge: 0, drop: 0, charge: 0, charging: false,
    aiDelay: 0, aiJump: 0, landing: 0, stagger: 0, zombieUntil: null, boundUntil: null, boundStyle: null,
    frozenUntil: null, dazedUntil: null, shockedUntil: null, poison: null, bommBurstAt: null, companionAssault: null, reserveAmmo: 0,
  };
}

export function createMatch(lineup, definition = defaultArena) {
  const arena = createArena(definition);
  return {
    arena, time: rules.duration, countdown: 3, fighters: lineup.map(({ slot, fighter, cpu }) => ({
      slot, fighter, cpu, stocks: rules.stocks, ...spawn(slot, true, fighter, arena),
    })), clones: [], projectiles: [], acidRain: [], dance: null, result: null, events: [],
    superstar: definition.superstar && lineup.some(({ fighter }) => fighter.moves)
      ? { ...definition.superstar, holder: null, cooldown: 0 } : null,
  };
}

export const idleInput = Object.freeze({ x: 0, y: 0 });

export function areRivals(a, b) {
  return a.slot !== b.slot && (a.team === undefined || a.team !== b.team);
}

export function combatants(match) {
  return [...match.fighters, ...match.clones];
}
