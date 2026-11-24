import { clamp } from '../math.js';
import { bodyCenter, combatants } from './state.js';

export function isInvulnerable(player) {
  return Boolean(player.invulnerable || player.attack?.untouchable);
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

export function shockedTime(player, match) {
  return statusTime(player.shockedUntil, match);
}

function statusTime(until, match) {
  return until == null ? 0 : Math.max(0, match.time - until - 1e-9);
}

export function freezeFighter(player, match, duration) {
  player.frozenUntil = Math.min(player.frozenUntil ?? match.time, match.time - duration);
  interruptAttack(player);
  player.guarding = false;
  player.dodge = 0;
  player.vx = 0;
  player.vy = 0;
  match.events.push({ type: 'frost', x: player.x, y: player.y + bodyCenter(player), color: '#a8efff' });
}

export function dazeRivals(source, match, duration) {
  for (const player of combatants(match)) {
    if (player.slot === source.slot || !player.stocks || player.respawn) continue;
    player.dazedUntil = Math.min(player.dazedUntil ?? match.time, match.time - duration);
    interruptAttack(player);
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
}

export function capturingAttack(target, match) {
  return match.fighters.find(({ attack }) => attack?.capture?.target === target)?.attack;
}

export function captureProgress(attack) {
  return clamp((attack.age - attack.from) / (attack.swallowAt - attack.from), 0, 1);
}

export function interruptAttack(player) {
  player.attack = null;
  player.charge = 0;
  player.charging = false;
}
