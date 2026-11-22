import { arena, rules } from './arena.js';
import { advanceAttack } from './attacks.js';
import { vanishClone } from './clones.js';
import { cpuInput } from './cpu.js';
import { advanceDance } from './dance.js';
import { move } from './movement.js';
import { advanceProjectiles } from './projectiles.js';
import { combatants, idleInput, spawn } from './state.js';
import { advancePoison, capturingAttack } from './status.js';
import { advanceCompanions } from '../fighters/olivar/companions.js';
import { clamp } from '../math.js';

export { createMatch } from './state.js';

function checkResult(match) {
  const alive = match.fighters.filter((fighter) => fighter.stocks > 0);
  if (alive.length > 1 && match.time > 0) return;
  let winner = alive[0];
  if (alive.length > 1) {
    alive.sort((a, b) => b.stocks - a.stocks || a.damage - b.damage);
    winner = alive[0].stocks === alive[1].stocks && alive[0].damage === alive[1].damage ? null : alive[0];
  }
  match.result = { winner: winner ?? null, timedOut: match.time <= 0 };
}

function advanceSuperstar(match, dt) {
  const star = match.superstar;
  if (!star || star.holder) return;
  star.cooldown = Math.max(0, star.cooldown - dt);
  if (star.cooldown) return;
  const collector = match.fighters.find((player) => player.fighter.moves && player.stocks && !player.respawn &&
    Math.abs(player.x - star.x) < 0.85 && Math.abs(player.y + 1 - star.y) < 1.15 && !capturingAttack(player, match));
  if (!collector) return;
  star.holder = collector;
  match.events.push({ type: 'superstar', x: star.x, y: star.y, color: '#ffde78' });
}

export function tickMatch(match, controls, dt = rules.step) {
  if (match.result) return;
  if (match.countdown > 0) {
    match.countdown = Math.max(0, match.countdown - dt);
    return;
  }
  match.time = Math.max(0, match.time - dt);
  for (const player of match.fighters) advancePoison(player, match);
  if (match.dance) {
    advanceDance(match, dt);
    if (!match.dance) checkResult(match);
    return;
  }

  const actors = combatants(match);
  for (const player of actors) {
    if (!player.stocks || player.owner?.stocks === 0) continue;
    if (player.respawn > 0) {
      player.respawn -= dt;
      if (player.respawn <= 0) Object.assign(player, spawn(player.slot, false, player.fighter));
      continue;
    }
    move(player, player.cpu ? cpuInput(player, match, dt) : controls.get(player.slot) ?? idleInput, dt, match);
    const { side, top, bottom } = arena.bounds;
    if (Math.abs(player.x) > side || player.y > top || player.y < bottom) {
      if (player.owner) {
        vanishClone(player, match);
        continue;
      }
      player.stocks -= 1;
      player.respawn = 0.87;
      player.attack = null;
      if (match.superstar?.holder === player) match.superstar.holder = null;
      match.events.push({ type: 'ko', x: clamp(player.x, -14, 14), y: clamp(player.y, -3, 9), color: player.fighter.color });
    }
  }

  advanceSuperstar(match, dt);
  for (const clone of match.clones) {
    if (clone.stocks && !clone.owner.stocks) vanishClone(clone, match);
  }
  for (const player of actors) {
    if (player.stocks && !player.respawn) advanceAttack(player, dt, match);
    if (match.dance) return;
  }
  for (const player of match.fighters) advanceCompanions(player, match, dt);
  advanceProjectiles(match, dt);
  match.clones = match.clones.filter(({ stocks }) => stocks > 0);
  checkResult(match);
}
