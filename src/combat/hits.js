import { vanishClone } from './clones.js';
import { checkDamageKnockout } from './knockout.js';
import { areRivals, bodyCenter, combatants } from './state.js';
import { boundTime, captureProgress, capturingAttack, freezeFighter, frozenTime, interruptAttack, isInvulnerable, releaseCapture } from './status.js';
import { clamp } from '../math.js';
import { tryGulp } from '../fighters/zunchy/swallow.js';

export function damageRivals(attacker, damage, match) {
  for (const rival of combatants(match)) {
    if (!areRivals(attacker, rival) || !rival.stocks || rival.respawn) continue;
    if (rival.owner) {
      vanishClone(rival, match);
      continue;
    }
    rival.damage += damage;
    match.events.push({ type: 'hit', x: rival.x, y: rival.y + bodyCenter(rival, match), color: attacker.fighter.color, strength: damage });
    checkDamageKnockout(rival, match);
  }
}

export function strike(attacker, victim, hit, match) {
  if (!areRivals(attacker, victim) || isInvulnerable(victim) || victim.dodge || victim.respawn || !victim.stocks) return false;
  if (victim.owner) {
    if (hit.shockDuration) {
      match.events.push({ type: 'shockEcho', x: victim.x, y: victim.y, depth: victim.depth, facing: victim.facing, fighter: victim.fighter });
    }
    vanishClone(victim, match);
    return true;
  }
  const capture = capturingAttack(victim, match);
  if (capture && captureProgress(capture) >= 1) return false;
  const { damage, force, x, y, lift } = hit;
  const defending = victim.attack;
  const window = defending?.guardWindow;
  const raisedShield = window && defending.age >= window.from && defending.age <= window.until &&
    (attacker.x - victim.x) * defending.facing >= 0;
  if (victim.guarding || raisedShield) {
    victim.shield = Math.max(0, victim.shield - damage * 0.043);
    victim.vx = x * (2 + force * 0.09);
    if (!victim.shield) {
      victim.guarding = false;
      if (raisedShield) interruptAttack(victim);
      victim.hitstun = 1.12;
      match.events.push({ type: 'break', x: victim.x, y: victim.y + 1, color: victim.fighter.color });
    } else {
      match.events.push({ type: 'block', x: victim.x, y: victim.y + 1, color: '#a7efff' });
    }
    return true;
  }
  if (capture) releaseCapture(capture, victim);
  else if (tryGulp(attacker, victim, hit, match)) return true;
  if (hit.applyEffect?.(victim, match)) return true;
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
  if (hit.shockDuration) {
    victim.shockedUntil = match.time - hit.shockDuration;
  }
  const launch = Math.min(hit.maxLaunch ?? Infinity, (force + victim.damage * 0.145) * attacker.fighter.power / victim.fighter.weight);
  if (interruptAttack(victim)) {
    if (hit.bindDuration) {
      if (!boundTime(victim, match)) {
        victim.boundUntil = match.time - hit.bindDuration;
        victim.boundStyle = hit.bindStyle ?? null;
        const serpents = hit.bindStyle === 'serpents';
        match.events.push({ type: serpents ? 'serpentBind' : 'bandageBind', x: victim.x, y: victim.y + 1.4, color: serpents ? '#a9f2a1' : '#dcf8ff' });
      }
      victim.vx = 0;
      victim.vy = Math.min(0, victim.vy);
    } else if (hit.freezeDuration) {
      if (!frozenTime(victim, match)) freezeFighter(victim, match, hit.freezeDuration);
    } else if (hit.stagger) {
      victim.stagger = Math.max(victim.stagger, hit.stagger);
    } else if (!hit.stationary) {
      victim.vx = x * launch;
      victim.vy = y * launch + lift;
      victim.grounded = null;
      victim.hitstun = clamp(launch * 0.024, 0.15, 0.79);
    }
  }
  victim.invulnerable = 0.12;
  match.events.push({ type: 'hit', x: victim.x, y: victim.y + 1, color: attacker.fighter.color, xDir: x, strength: launch });
  checkDamageKnockout(victim, match);
  return true;
}
