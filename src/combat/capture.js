import { vanishClone } from './clones.js';
import { strike } from './hits.js';
import { combatants } from './state.js';
import { captureProgress, capturingAttack, interruptAttack, isInvulnerable } from './status.js';

export function beginCapture(player, attack, match) {
  let target;
  let nearest = Infinity;
  for (const other of combatants(match)) {
    if (other.slot === player.slot || !other.stocks || other.respawn || isInvulnerable(other) || other.dodge || other.guarding || capturingAttack(other, match)) continue;
    const dx = other.x - player.x;
    const dy = other.y - player.y;
    if (dx * attack.facing < -0.23 || Math.abs(dx) > attack.range || Math.abs(dy) > attack.vertical) continue;
    const distance = Math.hypot(dx, dy);
    if (distance >= nearest) continue;
    target = other;
    nearest = distance;
  }
  if (!target) return;
  if (target.owner) {
    vanishClone(target, match);
    return;
  }
  attack.capture = { target, x: target.x, y: target.y };
  interruptAttack(target);
  target.vx = 0;
  target.vy = 0;
  target.grounded = null;
}

export function advanceCapture(player, attack, match) {
  const { capture } = attack;
  if (!capture) return;
  const { target, x, y } = capture;
  if (!target.stocks || target.respawn) {
    attack.capture = null;
    return;
  }
  if (!attack.sarcophagus) {
    const progress = captureProgress(attack);
    const { reach = 0.52, height = 1.8 } = attack.mouth ?? {};
    target.x = x + (player.x + attack.facing * reach - x) * progress;
    target.y = y + (player.y + height - y) * progress;
  }
  if (attack.age < attack.biteAt) return;
  attack.capture = null;
  if (strike(player, target, attack, match)) {
    const type = attack.sarcophagus ? 'coffinBurst' : 'chomp';
    match.events.push({ type, x: target.x, y: target.y + (attack.sarcophagus ? 1.35 : 0), color: attack.sarcophagus ? '#c1f6ff' : '#ebc4ff' });
  }
}
