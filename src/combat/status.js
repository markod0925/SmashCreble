import { clamp } from '../math.js';
import { areRivals, bodyCenter, combatants } from './state.js';
import { checkDamageKnockout } from './knockout.js';

export function isInvulnerable(player) {
  return Boolean(player.invulnerable || player.attack?.untouchable);
}

export function isSuperAttacking(player) {
  return Boolean(player.attack && player.attack.type === player.fighter.moves?.super);
}

export function isZombie(player, match) {
  return player.zombieUntil != null && match.time - player.zombieUntil > 1e-9;
}

export function boundTime(player, match) {
  return statusTime(player.boundUntil, match);
}

export function frozenTime(player, match) {
  return statusTime(player.frozenUntil, match);
}

export function dazedTime(player, match) {
  return statusTime(player.dazedUntil, match);
}

export function sleepTime(player, match) {
  return statusTime(player.sleepUntil, match);
}

export function slowTime(player, match) {
  return statusTime(player.slowUntil, match);
}

export function resizeScale(player, match) {
  return statusTime(player.resizeUntil, match) ? player.resizeScale : 1;
}

export function shockedTime(player, match) {
  return statusTime(player.shockedUntil, match);
}

export function crushedTime(player, match) {
  return statusTime(player.crushedUntil, match);
}

function statusTime(until, match) {
  return until == null ? 0 : Math.max(0, match.time - until - 1e-9);
}

export function freezeFighter(player, match, duration) {
  if (!interruptAttack(player)) return;
  player.frozenUntil = Math.min(player.frozenUntil ?? match.time, match.time - duration);
  player.guarding = false;
  player.dodge = 0;
  player.vx = 0;
  player.vy = 0;
  match.events.push({ type: 'frost', x: player.x, y: player.y + bodyCenter(player, match), color: '#a8efff' });
}

export function dazeRivals(source, match, duration) {
  for (const player of combatants(match)) {
    if (!areRivals(source, player) || !player.stocks || player.respawn) continue;
    if (!interruptAttack(player)) continue;
    player.dazedUntil = Math.min(player.dazedUntil ?? match.time, match.time - duration);
    player.guarding = false;
    player.dodge = 0;
  }
}

export function advancePoison(player, match) {
  const { poison } = player;
  if (!poison || !player.stocks || player.respawn) return;
  while (poison.next >= poison.until - 1e-9 && poison.next >= match.time - 1e-9) {
    if (!player.attack?.untouchable) player.damage += 2;
    poison.next -= 1;
  }
  if (match.time <= poison.until + 1e-9) player.poison = null;
  checkDamageKnockout(player, match);
}

export function capturingAttack(target, match) {
  return match.fighters.find(({ attack }) => attack?.capture?.target === target || attack?.captures?.some(capture => capture.target === target))?.attack;
}

export function captureProgress(attack) {
  return clamp((attack.age - attack.from) / (attack.swallowAt - attack.from), 0, 1);
}

export function captureTarget(attack, target) {
  const capture = { target, x: target.x, y: target.y };
  if (attack.captureAll) (attack.captures ??= []).push(capture);
  else attack.capture = capture;
  interruptAttack(target);
  target.vx = 0;
  target.vy = 0;
  target.grounded = null;
}

export function releaseCapture(attack, target) {
  if (attack.captures) attack.captures = attack.captures.filter(capture => capture.target !== target);
  else attack.capture = null;
}

export function interruptAttack(player) {
  if (isSuperAttacking(player)) return false;
  player.attack = null;
  player.charge = 0;
  player.charging = false;
  return true;
}
