import { platformCenter } from './arena.js';
import { canSummonClones, canUseSuper } from './clones.js';
import { bodyContactDistance, combatants, idleInput, scaleOf } from './state.js';
import { boundTime, dazedTime, frozenTime } from './status.js';
import { signatureAttacks } from '../fighters/index.js';
import { borrowedPower } from '../fighters/bomm/profile.js';
import { assaultRemaining } from '../fighters/olivar/companions.js';
import { direction } from '../math.js';

function recoveryPlatform(player, arena) {
  if (player.grounded?.main) return player.grounded;
  let nearest;
  let distance = Infinity;
  for (const platform of arena.platforms) {
    if (!platform.main) continue;
    const gap = Math.max(0, platform.left - player.x, player.x - platform.right);
    const candidate = Math.hypot(gap, player.y - platform.y);
    if (candidate >= distance) continue;
    nearest = platform;
    distance = candidate;
  }
  return nearest;
}

export function cpuInput(player, match, dt) {
  if (boundTime(player, match) || dazedTime(player, match) || frozenTime(player, match)) return idleInput;
  let target;
  for (const other of combatants(match)) {
    if (other.slot === player.slot || !other.stocks || other.respawn) continue;
    if (!target || Math.abs(other.x - player.x) < Math.abs(target.x - player.x)) target = other;
  }
  player.aiDelay -= dt;
  player.aiJump -= dt;
  const floor = recoveryPlatform(player, match.arena);
  const edgeMargin = floor ? Math.min(.6, (floor.right - floor.left) / 4) : 0;
  const offstage = floor && (!player.grounded || player.grounded.main) &&
    (player.x < floor.left + edgeMargin || player.x > floor.right - edgeMargin || player.y < floor.y - .7);
  if (offstage) {
    const moving = direction(platformCenter(floor) - player.x);
    const jumpPressed = player.y < floor.y + 1 && player.vy < 2 && player.aiJump <= 0 && player.jumps > 0;
    if (jumpPressed) player.aiJump = 0.44;
    return { x: moving, y: 1, jumpPressed, specialPressed: player.y < floor.y - 1.4 && player.vy < 0 && !player.recovered && !player.jumps };
  }
  if (!target) return idleInput;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const close = Math.abs(dy) < 1.25 && (Math.abs(dx) < (player.owner ? 1.06 : 1.65) ||
    Math.abs(dx) <= bodyContactDistance(player, target, match) + 1e-9);
  const x = Math.abs(dx) > 0.75 * scaleOf(player) ? direction(dx) : direction(dx) * 0.35;
  const jumpPressed = dy > 1.5 && player.aiJump <= 0 && (player.grounded || (player.jumps && player.vy < 3));
  if (jumpPressed) player.aiJump = 0.64;
  const active = close && player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger;
  const guard = !player.owner && close && target.attack && player.aiDelay > 0.35;
  if (active) player.aiDelay = 0.6 + Math.random() * 0.42;
  if (player.owner && player.fighter.cloneLight) return { x, y: 0, jumpPressed, lightPressed: active };
  if (player.fighter.moves) {
    const star = match.superstar;
    if (!player.owner && star && !star.holder && star.cooldown <= 0 && !close && !player.charging && Math.abs(star.x - player.x) > 0.45) {
      return { x: direction(star.x - player.x), y: 0 };
    }
    if (player.charging) return { x, y: 0, special: true };
    const shark = player.fighter.id === 'shark-67';
    const inga = player.fighter.id === 'inga-inga';
    const olivar = player.fighter.id === 'olivar';
    const packman = player.fighter.id === 'packman';
    const ciclope = player.fighter.id === 'ciclope';
    const vidarr = player.fighter.id === 'vidarr';
    const kings = player.fighter.id === 'funny-kings';
    const nuvol = player.fighter.id === 'nuvol';
    const duelist = player.fighter.id === 'ii';
    const dragonball = player.fighter.id === 'dragonball';
    const budino = player.fighter.id === 'budino';
    const murena = player.fighter.id === 'murena-man';
    const harri = player.fighter.id === 'harri-potter';
    const deployed = assaultRemaining(player, match) > 1e-9;
    const summonLimit = signatureAttacks[player.fighter.moves.hold].summonsClones;
    const roomToSummon = summonLimit && canSummonClones(player, match, summonLimit);
    const superMove = signatureAttacks[player.fighter.moves.super];
    const superInRange = shark || vidarr || nuvol || budino || superMove.rubberDance || superMove.dazzlesRivals || superMove.wandLightning || player.fighter.cloneLight ||
      (inga && Math.hypot(dx, dy) < signatureAttacks.ingaBladeStorm.range * .83) ||
      (summonLimit && !dragonball && Math.abs(dx) < 5.9) || (olivar && Math.hypot(dx, dy) < 5.5) || (packman && Math.abs(target.x) < 6.25) ||
      (ciclope && Math.abs(dx) < signatureAttacks.ciclopeLaser.range * .84 && Math.abs(dy) < 1.6) ||
      (kings && Math.hypot(dx, dy) < signatureAttacks.kingsFinale.range * .86) ||
      (duelist && Math.abs(dx) < 3.65 && dy < 1.08 && dy > -2.1) ||
      (dragonball && Math.abs(dx) < signatureAttacks.dragonBallBacteria.range * .83 && Math.abs(dy) < 1.65) ||
      (player.fighter.id === 'maestra' && Math.abs(dx) < signatureAttacks.maestraShove.range * .87 && Math.abs(dy) < 1.05) ||
      (player.fighter.id === 'pinco-palino' && Math.abs(dx) < 7 && Math.abs(dy) < 4.7) ||
      (murena && Math.abs(dx) < superMove.range * .92 && dy > -2.3 && dy < 4) ||
      (player.fighter.id === 'che-addominali' && Math.abs(dx) < signatureAttacks.absAcidRain.range && Math.abs(dy) < 3.5);
    if ((active || (superInRange && !player.attack && !player.hitstun)) && canUseSuper(player, match)) return { x, y: 0, superPressed: true };
    if (olivar && !deployed && !close && Math.abs(dx) < 5.9 && Math.abs(dy) < 2.3 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = 1.05;
      return { x: 0, y: 0, specialPressed: true, special: true };
    }
    if (roomToSummon && Math.abs(dx) >= 2.3 && Math.abs(dx) < 6.3 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = 1.05;
      return { x: 0, y: 0, specialPressed: true, special: true };
    }
    if (ciclope && !close && Math.abs(dx) < signatureAttacks.ciclopeLasso.range * .87 && Math.abs(dy) < .75 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = .85;
      return { x, y: 0, lightPressed: true };
    }
    if (murena && !close && Math.abs(dx) < signatureAttacks.murenaFlame.range * .9 && Math.abs(dy) < .85 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = .96;
      return { x, y: 0, specialPressed: true, special: Math.abs(dx) < signatureAttacks.murenaWhirl.range * .84 };
    }
    if (harri && !close && Math.abs(dx) < signatureAttacks.harriBombs.range * .86 && Math.abs(dy) < 1.75 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      const boltRange = signatureAttacks.harriBolt.range * .85;
      player.aiDelay = .98;
      return { x, y: 0, specialPressed: true, special: Math.abs(dx) >= boltRange || Math.abs(dy) > .72 };
    }
    const rangedCharge = ['vi', 'gioppino', 'huuuuu', 'shark-67', 'packman', 'vidarr', 'funny-kings', 'nuvol', 'luffy', 'maestra', 'nurofen-caps', 'pinco-palino', 'budino', 'super-libro-girl'].includes(player.fighter.id);
    if (rangedCharge && !close && Math.abs(dx) < signatureAttacks[player.fighter.moves.hold].range * scaleOf(player) && Math.abs(dy) < 0.9 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = 0.96;
      return { x, y: 0, specialPressed: true, special: (!shark && !vidarr && !budino) || Math.abs(dx) > 4 };
    }
    if (inga && !close && Math.abs(dx) < signatureAttacks.ingaLance.range * .86 && Math.abs(dy) < .76 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = .93;
      return { x, y: 0, specialPressed: true, special: Math.abs(dx) >= signatureAttacks.ingaSword.range * .94 };
    }
    if (player.fighter.id === 'bomm' && !close && Math.abs(dx) < 5.5 && Math.abs(dy) < 1.3 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = 1.03;
      return { x, y: 0, specialPressed: true, special: !borrowedPower(player, match) && Math.random() < .56 };
    }
    if (dragonball && !close && Math.abs(dx) < signatureAttacks.dragonBallNavelLaser.range * scaleOf(player) * .9 && Math.abs(dy) < .68 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = .91;
      return { x, y: 0, specialPressed: true };
    }
    const eid = player.fighter.id === 'eid';
    if ((eid || player.fighter.id === 'gangar') && !close && Math.abs(dx) < 5 && Math.abs(dy) < 0.9 &&
        player.aiDelay <= 0 && !player.attack && !player.hitstun && !player.stagger) {
      player.aiDelay = 0.9;
      return { x, y: 0, specialPressed: true, special: !eid || Math.random() < 0.48 };
    }
    const lightPressed = active && (deployed || Math.random() < 0.56);
    const specialPressed = active && !lightPressed;
    const canCharge = !summonLimit || roomToSummon;
    const chargeChance = inga ? 0.65 : 0.35;
    return { x, y: 0, jumpPressed, lightPressed, specialPressed, special: !eid && canCharge && specialPressed && Math.random() < chargeChance, guard };
  }
  return { x, y: dy < -2.3 ? -1 : 0, jumpPressed, lightPressed: active && Math.random() < 0.64, specialPressed: active, guard };
}
