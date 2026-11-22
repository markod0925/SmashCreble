import { vanishClone } from './clones.js';
import { boundTime, captureProgress, capturingAttack, interruptAttack } from './status.js';
import { clamp } from '../math.js';

export function strike(attacker, victim, hit, match) {
  if (attacker.slot === victim.slot || victim.invulnerable || victim.dodge || victim.respawn || !victim.stocks) return false;
  if (victim.owner) {
    vanishClone(victim, match);
    return true;
  }
  const capture = capturingAttack(victim, match);
  if (capture && captureProgress(capture) >= 1) return false;
  const { damage, force, x, y, lift } = hit;
  if (victim.guarding) {
    victim.shield = Math.max(0, victim.shield - damage * 0.043);
    victim.vx = x * (2 + force * 0.09);
    if (!victim.shield) {
      victim.guarding = false;
      victim.hitstun = 1.12;
      match.events.push({ type: 'break', x: victim.x, y: victim.y + 1, color: victim.fighter.color });
    } else {
      match.events.push({ type: 'block', x: victim.x, y: victim.y + 1, color: '#a7efff' });
    }
    return true;
  }
  if (capture) capture.capture = null;
  victim.damage += damage;
  if (hit.zombieDuration) {
    victim.zombieUntil = match.time - hit.zombieDuration;
    match.events.push({ type: 'zombieBite', x: victim.x, y: victim.y + 1.45, color: '#c3e777' });
  }
  if (hit.poisonDuration) {
    victim.poison ??= { next: match.time - 1 };
    victim.poison.until = match.time - hit.poisonDuration;
    match.events.push({ type: 'poison', x: victim.x, y: victim.y + 1.15, color: '#91ed6e' });
  }
  const launch = (force + victim.damage * 0.145) * attacker.fighter.power / victim.fighter.weight;
  if (hit.bindDuration) {
    if (!boundTime(victim, match)) {
      victim.boundUntil = match.time - hit.bindDuration;
      match.events.push({ type: 'bandageBind', x: victim.x, y: victim.y + 1.4, color: '#dcf8ff' });
    }
    victim.vx = 0;
    victim.vy = Math.min(0, victim.vy);
  } else if (hit.stagger) {
    victim.stagger = Math.max(victim.stagger, hit.stagger);
  } else if (!hit.stationary) {
    victim.vx = x * launch;
    victim.vy = y * launch + lift;
    victim.grounded = null;
    victim.hitstun = clamp(launch * 0.024, 0.15, 0.79);
  }
  victim.invulnerable = 0.12;
  interruptAttack(victim);
  match.events.push({ type: 'hit', x: victim.x, y: victim.y + 1, color: attacker.fighter.color, xDir: x, strength: launch });
  return true;
}
