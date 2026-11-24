import { cloneScale, spawn } from './state.js';
import { interruptAttack } from './status.js';
import { signatureAttacks } from '../fighters/index.js';
import { clamp } from '../math.js';

const cloneFormations = [
  [0], [-1.58, 1.58], [-2.46, 0, 2.46], [-2.82, -1.48, 1.48, 2.82],
  [-3.4, -1.7, 0, 1.7, 3.4], [-4.38, -2.93, -1.48, 1.48, 2.93, 4.38],
];

export function vanishClone(clone, match) {
  clone.stocks = 0;
  interruptAttack(clone);
  match.events.push({ type: 'clonePop', x: clone.x, y: clone.y + .7, color: clone.fighter.id === 'vi' ? '#f3b5fc' : clone.fighter.color });
}

function livingClones(player, match) {
  return match.clones.filter((clone) => clone.owner === player && clone.stocks).length;
}

export function canUseSuper(player, match) {
  if (match.superstar?.holder !== player) return false;
  const limit = signatureAttacks[player.fighter.moves.super].summonsClones;
  return !limit || canSummonClones(player, match, limit);
}

export function canSummonClones(player, match, limit) {
  return !player.owner && livingClones(player, match) < limit;
}

export function summonClones(player, match, limit) {
  const missing = limit - livingClones(player, match);
  if (player.owner || missing <= 0) return;
  const offsets = cloneFormations[missing - 1];
  const fighter = { ...player.fighter, size: player.fighter.size * cloneScale };
  if (fighter.cloneLight) fighter.moves = { ...fighter.moves, light: fighter.cloneLight };
  const platform = player.grounded;
  const { arena } = match;
  const { side, top } = arena.definition.bounds;
  const padding = platform ? Math.min(.32, (platform.right - platform.left) / 2) : .32;
  const left = (platform?.left ?? -side) + padding;
  const right = (platform?.right ?? side) - padding;
  const spread = offsets.at(-1);
  const fit = spread ? Math.min(1, (right - left) / (2 * spread)) : 1;
  const center = clamp(player.x, left + spread * fit, right - spread * fit);
  const y = platform?.y ?? Math.min(player.y, top - .3);
  for (let i = 0; i < missing; i++) {
    const x = center + offsets[i] * fit;
    const clone = {
      ...spawn(player.slot, true, fighter, arena), slot: player.slot, fighter, owner: player, stocks: 1, cpu: true,
      x, y, facing: player.facing, grounded: platform, vy: platform ? 0 : Math.max(0, player.vy * .55), aiDelay: .08 + i * .12,
      depth: offsets[i] === 0 ? .95 : i % 2 ? .46 : -.18,
    };
    match.clones.push(clone);
    match.events.push({ type: 'cloneIn', x, y: y + .64, color: player.fighter.color });
  }
}
