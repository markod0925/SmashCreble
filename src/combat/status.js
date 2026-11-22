import { clamp } from '../math.js';

export function isZombie(player, match) {
  return player.zombieUntil != null && match.time - player.zombieUntil > 1e-9;
}

export function boundTime(player, match) {
  return player.boundUntil == null ? 0 : Math.max(0, match.time - player.boundUntil - 1e-9);
}

export function advancePoison(player, match) {
  const { poison } = player;
  if (!poison || !player.stocks || player.respawn) return;
  while (poison.next >= poison.until - 1e-9 && poison.next >= match.time - 1e-9) {
    player.damage += 2;
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
