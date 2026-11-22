import { arena, rules } from './arena.js';

const spawns = [-6, 6, -1.8, 1.8];
export const cloneScale = 0.5;
export const scaleOf = (player) => player.owner ? cloneScale : 1;
export const bodyCenter = (player) => 1.05 * scaleOf(player);

export function spawn(slot, initial) {
  return {
    x: spawns[slot], y: initial ? 0 : 7.8, vx: 0, vy: 0, facing: spawns[slot] < 0 ? 1 : -1,
    grounded: initial ? arena.platforms[0] : null, jumps: 2, recovered: false,
    damage: 0, hitstun: 0, invulnerable: initial ? 0 : 1.5, respawn: 0,
    attack: null, shield: 1, guarding: false, dodge: 0, drop: 0, charge: 0, charging: false,
    aiDelay: 0, aiJump: 0, landing: 0, stagger: 0, zombieUntil: null, boundUntil: null, poison: null, bommBurstAt: null, companionAssault: null,
  };
}

export function createMatch(lineup) {
  return {
    time: rules.duration, countdown: 3, fighters: lineup.map(({ slot, fighter, cpu }) => ({
      slot, fighter, cpu, stocks: rules.stocks, ...spawn(slot, true),
    })), clones: [], projectiles: [], dance: null, result: null, events: [],
    superstar: lineup.some(({ fighter }) => fighter.moves) ? { x: 0, y: 1.35, holder: null, cooldown: 0 } : null,
  };
}

export const idleInput = Object.freeze({ x: 0, y: 0 });

export function combatants(match) {
  return [...match.fighters, ...match.clones];
}
