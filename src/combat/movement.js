import { crossedPlatform, leavePlatform, platformHeight, rules, stopAtWall } from './arena.js';
import { handleAttackInput } from './attacks.js';
import { bodyCenter, idleInput } from './state.js';
import { boundTime, capturingAttack, dazedTime, frozenTime, isZombie } from './status.js';
import { bommBurstAge, bommBurstRecovery } from '../fighters/bomm/profile.js';
import { approach, clamp, direction } from '../math.js';

export function move(player, input, dt, match) {
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.hitstun = Math.max(0, player.hitstun - dt);
  player.drop = Math.max(0, player.drop - dt);
  player.dodge = Math.max(0, player.dodge - dt);
  player.landing = Math.max(0, player.landing - dt);
  player.stagger = Math.max(0, player.stagger - dt);
  if (frozenTime(player, match)) {
    player.vx = 0;
    player.vy = 0;
    return;
  }
  if (player.attack?.trace67 || capturingAttack(player, match)) return;
  if (player.attack?.rubberDance && player.attack.fired) input = idleInput;
  const bound = boundTime(player, match) > 0;
  const free = !player.hitstun && !player.dodge && !bound && !dazedTime(player, match);
  const mobility = player.attack ? 0.54 : player.charging ? 0.36 : 1;
  player.guarding = Boolean(free && input.guard && player.grounded && player.shield > 0.09 && !player.attack && !player.charging);
  player.shield = clamp(player.shield + dt * (player.guarding ? -0.22 : 0.29), 0, 1);

  if (free) {
    if (Math.abs(input.x) > 0.23 && !player.attack && !player.charging) player.facing = direction(input.x);
    if (player.guarding && (input.jumpPressed || input.dodgePressed)) {
      player.dodge = 0.27;
      player.vx = direction(input.x, -player.facing) * 12;
      player.guarding = false;
    } else if (!player.guarding) {
      const jump = input.jumpPressed && player.jumps > 0;
      const drop = player.grounded && !player.grounded.main && (input.dropPressed || (jump && input.y < -0.55));
      if (jump || drop) {
        if (drop) {
          player.drop = 0.23;
          player.y -= 0.08;
          player.vy = -2;
        } else {
          if (!player.grounded || player.fighter.airJumps === undefined) player.jumps -= 1;
          player.vy = player.fighter.jump * (player.grounded ? 1 : 0.88);
          match.events.push({ type: 'jump', x: player.x, y: player.y + 0.06, color: player.fighter.color });
        }
        player.grounded = null;
      }
      if (!player.stagger) handleAttackInput(player, input, match, dt);
      if (player.attack?.trace67) return;
    }
    if (!player.dodge && player.attack?.type !== 'dash') {
      const condition = player.stagger ? 0.58 : isZombie(player, match) ? 0.74 : 1;
      const burstAge = bommBurstAge(player, match) + 1e-9;
      const { smallAt, duration, speed: slowSpeed } = bommBurstRecovery;
      const slow = burstAge >= smallAt && burstAge < smallAt + duration;
      const speed = (player.guarding ? 1.4 : player.fighter.speed * mobility * condition) * (slow ? slowSpeed : 1);
      player.vx = approach(player.vx, input.x * speed, dt * (player.grounded ? 65 : 32));
    }
  } else if (bound && !player.hitstun) {
    player.vx = 0;
  } else {
    player.vx *= Math.pow(player.dodge ? 0.12 : 0.51, dt);
  }

  const from = { x: player.x, y: player.y };
  const { arena } = match;
  player.x += player.vx * dt;
  stopAtWall(player, from.x, arena);
  leavePlatform(player);
  if (player.grounded) return;
  const drift = arena.definition.airDrift?.({ x: player.x, y: player.y + bodyCenter(player, match) }, arena.environment) ?? 0;
  player.x += drift * dt;
  player.vy = Math.max(-25, player.vy - dt * rules.gravity);
  player.y += player.vy * dt;
  landOnPlatform(player, from, arena);
  return from;
}

export function landOnPlatform(player, from, arena) {
  if (player.grounded || player.drop) return;
  const surface = crossedPlatform(arena, from, player);
  if (surface) {
    player.landing = 0.15;
    player.y = platformHeight(surface, player.x);
    player.vy = 0;
    player.grounded = surface;
    player.jumps = player.fighter.airJumps ?? 2;
    player.recovered = false;
  }
}
