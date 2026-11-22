import { arena } from './arena.js';
import { strike } from './hits.js';
import { bodyCenter, combatants, scaleOf } from './state.js';
import { isInvulnerable } from './status.js';
import { projectileLaunchers } from '../fighters/index.js';
import { direction } from '../math.js';

export function fireProjectiles(player, attack, match) {
  projectileLaunchers[attack.projectile](player, attack, match);
}

function projectileTouches(projectile, target) {
  const scale = scaleOf(target);
  const projectileScale = projectile.scale ?? 1;
  return target.slot !== projectile.owner.slot && !projectile.victims?.has(target) &&
    Math.abs(target.x - projectile.x) <= .2 * projectileScale + .45 * scale && Math.abs(target.y + bodyCenter(target) - projectile.y) <= .3 * projectileScale + .52 * scale;
}

function detonateBomb(projectile, targets, match) {
  const { owner, x, y, vx, blast, hit, victims } = projectile;
  for (const target of targets) {
    if (target.slot === owner.slot || victims.has(target)) continue;
    const dx = target.x - x;
    const dy = target.y + bodyCenter(target) - y;
    if (Math.hypot(dx, dy * .78) > blast) continue;
    if (strike(owner, target, { ...hit, x: direction(dx, direction(vx)) }, match)) victims.add(target);
  }
  projectile.remaining = 0;
  match.events.push({ type: 'explosion', x, y, color: projectile.blastColor ?? '#ffad69', strength: blast });
}

export function advanceProjectiles(match, dt) {
  const targets = combatants(match);
  for (const projectile of match.projectiles) {
    projectile.remaining -= dt;
    const previousY = projectile.y;
    const tethered = Boolean(projectile.advance);
    if (tethered) {
      if (projectile.remaining <= 0 || !projectile.owner.stocks || projectile.owner.respawn) {
        projectile.remaining = 0;
        continue;
      }
      projectile.advance(projectile, dt);
    } else {
      projectile.x += projectile.vx * dt;
      projectile.vy -= (projectile.gravity ?? 0) * dt;
      projectile.y += projectile.vy * dt;
    }
    const lands = projectile.gravity && projectile.vy < 0 && arena.platforms.some(({ left, right, y }) =>
      projectile.x >= left && projectile.x <= right && previousY >= y && projectile.y <= y);
    if (projectile.blast) {
      if (lands || projectile.remaining <= 0 || targets.some((target) => target.stocks && !target.respawn && !isInvulnerable(target) && !target.dodge && projectileTouches(projectile, target))) {
        detonateBomb(projectile, targets, match);
      }
      continue;
    }
    if (projectile.recalling) continue;
    for (const target of targets) {
      if (!projectileTouches(projectile, target)) continue;
      if (strike(projectile.owner, target, projectile.hit, match)) {
        projectile.victims?.add(target);
        projectile.onImpact?.(projectile, match, target);
        if (!tethered) {
          projectile.remaining = 0;
          break;
        }
        if (projectile.recallOnHit) {
          projectile.recalling = true;
          break;
        }
      }
    }
    if (lands) {
      if (projectile.remaining > 0) projectile.onImpact?.(projectile, match);
      projectile.remaining = 0;
    }
  }
  match.projectiles = match.projectiles.filter(({ remaining }) => remaining > 0);
}
