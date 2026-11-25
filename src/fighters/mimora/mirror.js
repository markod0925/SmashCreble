import { areRivals } from '../../combat/state.js';
import { fighter, mirrorSeconds } from './profile.js';

export const fighterIdentity = (player) => player.mirror?.original ?? player.fighter;
export const mirrorTime = (player, match) => Math.max(0, match.time - (player.mirror?.until ?? match.time) - 1e-9);

export function mirrorRival(player, match) {
  let nearest;
  let distance = Infinity;
  for (const rival of match.fighters) {
    if (!areRivals(player, rival) || !rival.stocks || rival.respawn || rival.fighter.id === fighter.id) continue;
    const gap = Math.hypot(rival.x - player.x, rival.y - player.y);
    if (gap >= distance) continue;
    nearest = rival.fighter;
    distance = gap;
  }
  if (!nearest) return;
  const moves = nearest.moves ?? { light: 'light', tap: nearest.secondary, hold: 'heavy' };
  player.mirror = { original: player.fighter, until: match.time - mirrorSeconds };
  player.fighter = { ...nearest, moves: { ...moves, super: fighter.moves.super } };
  player.jumps = Math.min(player.jumps, nearest.airJumps ?? 2);
}

export function restoreOriginalForm(player) {
  if (!player.mirror) return;
  player.fighter = player.mirror.original;
  player.mirror = null;
  player.attack = null;
  player.charge = 0;
  player.charging = false;
  player.borrowed = null;
  player.companionAssault = null;
  player.jumps = Math.min(player.jumps, player.fighter.airJumps ?? 2);
}
