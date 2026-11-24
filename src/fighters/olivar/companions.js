import { rules } from '../../combat/arena.js';
import { strike } from '../../combat/hits.js';
import { bodyCenter } from '../../combat/state.js';
import { assaultSeconds, companionCount, companionOrbit, returnSeconds } from './profile.js';

export function assaultRemaining(player, match) {
  return player.companionAssault ? match.time - player.companionAssault.until : 0;
}

function canTarget(owner, target) {
  return target.slot !== owner.slot && target.stocks && !target.respawn;
}

function closestRival(owner, match) {
  let target;
  let distance = Infinity;
  for (const rival of match.fighters) {
    if (!canTarget(owner, rival)) continue;
    const gap = Math.hypot(rival.x - owner.x, rival.y - owner.y);
    if (gap >= distance) continue;
    target = rival;
    distance = gap;
  }
  return target;
}

export function deployCompanions(owner, match) {
  const units = Array.from({ length: companionCount }, (_, index) => {
    const [x, y, z] = companionOrbit(index, rules.duration - match.time);
    return { x: owner.x + x * owner.fighter.size, y: owner.y + y * owner.fighter.size, z, facing: owner.facing, cooldown: index * .14 };
  });
  owner.companionAssault = { units, until: match.time - assaultSeconds, target: closestRival(owner, match), hitCooldown: 0 };
}

function moveToward(unit, x, y, speed, dt) {
  const dx = x - unit.x;
  const dy = y - unit.y;
  const distance = Math.hypot(dx, dy);
  if (distance > .001) {
    const step = Math.min(speed * dt, distance) / distance;
    unit.x += dx * step;
    unit.y += dy * step;
    if (Math.abs(dx) > .08) unit.facing = Math.sign(dx);
  }
  return distance;
}

export function advanceCompanions(owner, match, dt) {
  const assault = owner.companionAssault;
  if (!assault) return;
  const remaining = assaultRemaining(owner, match);
  if (!owner.stocks || owner.respawn || remaining <= -returnSeconds) {
    owner.companionAssault = null;
    return;
  }
  if (remaining <= 1e-9) return;
  if (!assault.target || !canTarget(owner, assault.target)) assault.target = closestRival(owner, match);
  const target = assault.target;
  assault.hitCooldown = Math.max(0, assault.hitCooldown - dt);
  for (const [index, unit] of assault.units.entries()) {
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    if (!target) {
      const [x, y] = companionOrbit(index, rules.duration - match.time);
      moveToward(unit, owner.x + x * owner.fighter.size, owner.y + y * owner.fighter.size, 9, dt);
      continue;
    }
    const angle = (assaultSeconds - remaining) * 5.1 + index * Math.PI * 2 / companionCount;
    const circling = unit.cooldown > 0 || assault.hitCooldown > 0;
    const radius = circling ? .99 + index * .17 : 0;
    const dx = target.x + Math.cos(angle) * radius;
    const dy = target.y + bodyCenter(target, match) + Math.sin(angle) * radius * .74;
    const distance = moveToward(unit, dx, dy, 8.9 + index * .55, dt);
    if (!circling && distance < .48 && strike(owner, target, { damage: 3, force: 2.7, x: unit.facing, y: .2, lift: .38 }, match)) {
      unit.cooldown = 1.4;
      assault.hitCooldown = .34;
    }
  }
}
