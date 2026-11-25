import { vanishClone } from './clones.js';
import { strike } from './hits.js';
import { areRivals, combatants } from './state.js';
import { captureProgress, captureTarget, capturingAttack, isInvulnerable, isSuperAttacking, releaseCapture } from './status.js';
import { clamp } from '../math.js';

function catchRival(attack, target, match) {
  if (target.owner) vanishClone(target, match);
  else captureTarget(attack, target);
}

export function beginCapture(player, attack, match) {
  let target;
  let nearest = Infinity;
  for (const other of combatants(match)) {
    if (!areRivals(player, other) || !other.stocks || other.respawn || isInvulnerable(other) || isSuperAttacking(other) ||
        other.dodge || other.guarding || capturingAttack(other, match)) continue;
    const dx = other.x - player.x;
    const dy = other.y - player.y;
    if (dx * attack.facing < -0.23 || Math.abs(dx) > attack.range || Math.abs(dy) > attack.vertical) continue;
    if (attack.captureAll) {
      catchRival(attack, other, match);
      continue;
    }
    const distance = Math.hypot(dx, dy);
    if (distance >= nearest) continue;
    target = other;
    nearest = distance;
  }
  if (target) catchRival(attack, target, match);
}

export function advanceCapture(player, attack, match) {
  const captures = attack.captures ?? (attack.capture ? [attack.capture] : []);
  for (const [index, capture] of captures.entries()) advanceCaughtRival(player, attack, match, capture, index);
}

function advanceCaughtRival(player, attack, match, { target, x, y }, index) {
  if (!target.stocks || target.respawn) {
    releaseCapture(attack, target);
    return;
  }
  if (!attack.sarcophagus) {
    const progress = captureProgress(attack);
    const mouth = (attack.age >= attack.biteAt ? attack.releaseMouth : undefined) ?? attack.mouth;
    const { reach = 0.52, height = 1.8 } = mouth ?? {};
    target.x = x + (player.x + attack.facing * reach - x) * progress;
    target.y = y + (player.y + height - y) * progress;
    if (attack.gulpSpit) {
      const { side, top, bottom } = match.arena.definition.bounds;
      target.x = clamp(target.x, -side + .25, side - .25);
      target.y = clamp(target.y, bottom + .4, top - .65);
    }
  }
  if (attack.age < attack.biteAt) return;
  releaseCapture(attack, target);
  const hit = attack.spitSpread ? { ...attack, lift: attack.lift + Math.min(index, 4) * attack.spitSpread } : attack;
  if (strike(player, target, hit, match)) {
    const hug = attack.captureStyle === 'hug';
    const cape = attack.captureStyle === 'cape';
    const type = attack.sarcophagus ? 'coffinBurst' : hug ? 'hugSqueeze' : cape ? 'capeSnare' : 'chomp';
    const height = attack.sarcophagus ? 1.35 : hug || cape ? 1.05 : 0;
    const color = attack.sarcophagus ? '#c1f6ff' : hug ? '#ffd27e' : cape ? '#a4ed94' : '#ebc4ff';
    match.events.push({ type, x: target.x, y: target.y + height, color });
  }
}
