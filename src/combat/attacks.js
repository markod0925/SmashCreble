import { leavePlatform } from './arena.js';
import { advanceCapture, beginCapture } from './capture.js';
import { canSummonClones, canUseSuper, summonClones } from './clones.js';
import { startDance } from './dance.js';
import { strike } from './hits.js';
import { fireProjectiles } from './projectiles.js';
import { areRivals, bodyCenter, bodyContactDistance, bodyScale, combatants, scaleOf } from './state.js';
import { dazeRivals, interruptAttack } from './status.js';
import { advanceTrace, startTrace } from './trace.js';
import { signatureAttacks } from '../fighters/index.js';
import { borrowedPower, powerStealTravelTime, stolenPowerTime } from '../fighters/bomm/profile.js';
import { startAcidRain } from '../fighters/che-addominali/rain.js';
import { castWandLightning } from '../fighters/harri-potter/lightning.js';
import { advanceRubberDance } from '../fighters/luffy/dance.js';
import { assaultRemaining, deployCompanions } from '../fighters/olivar/companions.js';
import { advanceThunder } from '../fighters/nuvol/thunder.js';
import { rainbowHeight } from '../fighters/vi/profile.js';
import { advanceFrost } from '../fighters/vidarr/frost.js';
import { clamp, direction } from '../math.js';

const chargeTime = 0.72;
const superstarDelay = 12;
const secondaryMove = (fighter) => fighter.moves?.tap ?? fighter.secondary;

function scaleAttack(attack, scale) {
  if (scale < 1) {
    for (const field of ['range', 'vertical', 'offset', 'arcStart', 'lunge']) {
      if (attack[field] !== undefined) attack[field] *= scale;
    }
  }
  return attack;
}

function startAttack(player, type, input, match, borrowed = null) {
  const up = input.y > 0.55;
  const down = input.y < -0.55;
  const facing = player.facing;
  const charge = player.charge;
  let attack;

  if (type === 'special' && !up) type = secondaryMove(player.fighter);
  if (Object.hasOwn(signatureAttacks, type)) {
    const signature = signatureAttacks[type];
    attack = { type, x: signature.pull ? -facing : facing, ...signature };
    if (type === 'dash') {
      player.vx = facing * 19;
      player.vy = Math.max(player.vy, 2);
    } else if (type === 'furnace') {
      player.grounded = null;
      player.vy = 8.6;
    }
  } else if (type === 'special') {
    if (!player.grounded && player.recovered) return;
    player.recovered = !player.grounded;
    player.grounded = null;
    player.vy = 15.6;
    attack = { type: 'recovery', duration: 0.48, from: 0.05, until: 0.3, range: 1.5, vertical: 1.9, damage: 7, force: 7, x: facing * 0.25, y: 1, lift: 4, all: true };
  } else {
    const heavy = type === 'heavy';
    attack = {
      type, duration: heavy ? 0.55 : 0.31, from: heavy ? 0.15 : 0.085, until: heavy ? 0.3 : 0.19,
      range: up ? 1.42 : (heavy ? 2.15 : 1.68) * player.fighter.size,
      vertical: up ? 2.5 : 1.22, offset: up ? 1.05 : down ? -0.58 : 0,
      damage: (heavy ? 13 + charge * 9 : 6.5) * player.fighter.power,
      force: heavy ? 12 + charge * 11 : 6, x: up ? facing * 0.42 : facing,
      y: up ? 1 : down && !player.grounded ? -0.6 : 0.54, lift: up ? 5 : 3, all: up,
    };
  }
  const scale = scaleOf(player);
  scaleAttack(attack, scale);
  player.attack = { ...attack, scale, facing, age: 0, victims: new Set(), fired: false, borrowed };
  if (attack.trace67) startTrace(player, match);
  if (attack.volleyEvery) player.attack.nextVolley = attack.from;
  if (attack.takeoff && (player.grounded || attack.aerialTakeoff)) {
    player.grounded = null;
    player.vy = Math.max(player.vy, attack.takeoff);
    match.events.push({ type: 'jump', x: player.x, y: player.y + 0.06, color: player.fighter.color });
  }
  player.guarding = false;
  player.charge = 0;
  player.charging = false;
  match.events.push({ type: 'swing', x: player.x, y: player.y + 1, color: player.fighter.color });
}

function startSecondary(player, input, match) {
  const borrowed = borrowedPower(player, match);
  startAttack(player, borrowed?.move ?? secondaryMove(player.fighter), input, match, borrowed);
}

function stealPower(player, attack, match) {
  let donor;
  let distance = Infinity;
  for (const other of combatants(match)) {
    const dx = other.x - player.x;
    if (!areRivals(player, other) || !other.stocks || other.respawn || dx * attack.facing <= 0) continue;
    const gap = Math.hypot(dx, other.y - player.y);
    if (gap >= distance) continue;
    donor = other;
    distance = gap;
  }
  if (!donor) return;
  const { name, color } = donor.fighter;
  player.borrowed = {
    move: secondaryMove(donor.fighter), name, color, previousColor: borrowedPower(player, match)?.color,
    arrivesAt: match.time - powerStealTravelTime, expiresAt: match.time - stolenPowerTime,
  };
  match.events.push({ type: 'powerSteal', x: donor.x, y: donor.y + 1.9 * donor.fighter.size, target: player, color, startedAt: match.time });
}

export function advanceAttack(player, dt, match) {
  const attack = player.attack;
  if (!attack) return;
  attack.age += dt;
  if (attack.rubberDance) {
    advanceRubberDance(player, attack, match);
    return;
  }
  if (attack.age >= attack.duration) {
    player.attack = null;
    return;
  }
  if (attack.trace67) {
    advanceTrace(player, attack, match, dt);
    return;
  }
  if (attack.freezesRivals) {
    advanceFrost(player, attack, match);
    return;
  }
  if (attack.summonsThunder) {
    advanceThunder(player, attack, match);
    return;
  }
  if (attack.followUp && attack.age >= attack.followUp.from) {
    Object.assign(attack, scaleAttack({ followUp: null, ...attack.followUp, fired: false }, attack.scale));
    attack.victims.clear();
    match.events.push({ type: 'swing', x: player.x, y: player.y + 1, color: player.fighter.color });
  }
  if (attack.age < attack.from) return;
  if (!attack.fired) {
    attack.fired = true;
    if (attack.startsDance) {
      startDance(player, match);
      return;
    }
    if (attack.biteAt) beginCapture(player, attack, match);
    if (attack.summonsClones) summonClones(player, match, attack.summonsClones);
    if (attack.startsAcidRain) startAcidRain(player, attack, match);
    if (attack.refillReserve) player.reserveAmmo = attack.refillReserve;
    if (attack.dazzlesRivals) dazeRivals(player, match, attack.dazzlesRivals);
    if (attack.shrinksRivals) player.shrinkRivalsUntil = match.time - attack.shrinksRivals;
    if (attack.wandLightning) castWandLightning(player, attack, match);
    if (attack.deploysCompanions) deployCompanions(player, match);
    if (attack.stealsPower) stealPower(player, attack, match);
    if (attack.type === 'bommBurst') player.bommBurstAt = match.time;
    if (attack.lunge) player.vx = attack.capture ? 0 : attack.lunge * attack.facing;
    if (attack.diveSpeed) {
      player.grounded = null;
      player.vy = Math.min(player.vy, -attack.diveSpeed);
    }
    if (attack.travel) {
      match.events.push({ type: 'blink', x: player.x, y: player.y + 1.2, color: player.fighter.color });
      player.x += attack.travel * attack.facing;
      player.vx = 0;
      leavePlatform(player);
      match.events.push({ type: 'blink', x: player.x, y: player.y + 1.2, color: '#c5fb9e' });
    }
    if (attack.projectile && !attack.volleyEvery) fireProjectiles(player, attack, match);
    if (!attack.stealsPower && !['light', 'heavy', 'bolt', player.fighter.moves?.light].includes(attack.type)) {
      match.events.push({ type: attack.cue ?? 'special', x: player.x, y: player.y + (attack.cue === 'laser' ? 2.65 : 0.9), color: attack.borrowed?.color ?? player.fighter.color, strength: attack.range });
    }
  }
  if (attack.biteAt) {
    advanceCapture(player, attack, match);
    return;
  }
  if (attack.age >= attack.nextVolley && attack.age <= (attack.volleyUntil ?? attack.until)) {
    fireProjectiles(player, attack, match);
    attack.nextVolley += attack.volleyEvery;
  }
  if (attack.until === undefined || attack.age > attack.until) return;
  const range = attack.waveSpeed ? Math.min(attack.range, (attack.age - attack.from) * attack.waveSpeed * attack.scale) : attack.range;
  for (const target of combatants(match)) {
    if (!areRivals(player, target) || attack.victims.has(target)) continue;
    const dx = target.x - player.x;
    // Short strikes can still connect at body contact, including against wider fighters.
    if (Math.abs(dx) > range && Math.abs(dx) > bodyContactDistance(player, target, match) + 1e-9) continue;
    if (!attack.all && dx * attack.facing < -0.23 * attack.scale) continue;
    const height = target.y + bodyCenter(target, match) - player.y;
    if (attack.arcStart) {
      const progress = clamp((dx * attack.facing - attack.arcStart) / (attack.range - attack.arcStart), 0, 1);
      if (Math.abs(height - rainbowHeight(attack, progress)) > attack.vertical + .52 * bodyScale(target, match)) continue;
    } else if (Math.abs(height - bodyCenter(player, match) - (attack.offset ?? 0)) > attack.vertical) continue;
    const x = attack.all && attack.x > 0.5 && attack.type !== 'dash' ? Math.abs(attack.x) * direction(dx, attack.facing) : attack.x;
    if (strike(player, target, { ...attack, x }, match)) attack.victims.add(target);
  }
}

function signatureAttack(player, input, match, dt) {
  const superstar = match.superstar;
  const moves = player.fighter.moves;
  if (input.superPressed && canUseSuper(player, match) &&
      (!player.attack || (player.attack.type === moves.light && !player.attack.fired))) {
    superstar.holder = null;
    superstar.cooldown = superstarDelay;
    startAttack(player, moves.super, input, match);
    const cloneLimit = match.arena.definition.rivalClonesOnSuper;
    if (cloneLimit) {
      for (const rival of match.fighters) {
        if (rival !== player && rival.stocks && !rival.respawn) summonClones(rival, match, cloneLimit, true);
      }
    }
  } else if (!player.attack) {
    if (player.charging) {
      if (input.special) player.charge = clamp(player.charge + dt / chargeTime, 0, 1);
      if (player.charge >= 1) {
        const limit = signatureAttacks[moves.hold].summonsClones;
        if (!limit || canSummonClones(player, match, limit)) startAttack(player, moves.hold, input, match);
        else interruptAttack(player);
      } else if (!input.special) startSecondary(player, input, match);
    } else if (input.lightPressed) {
      startAttack(player, moves.light, input, match);
    } else if (input.specialPressed) {
      if (input.y > 0.55) startAttack(player, 'special', input, match);
      else if (assaultRemaining(player, match) > 1e-9) return;
      else if (input.special) {
        player.charging = true;
        player.charge = dt / chargeTime;
      } else startSecondary(player, input, match);
    }
  }
}

export function handleAttackInput(player, input, match, dt) {
  if (player.fighter.moves) signatureAttack(player, input, match, dt);
  else if (!player.attack) {
    if (input.heavyPressed) player.charging = true;
    if (player.charging) {
      player.charge = clamp(player.charge + dt / chargeTime, 0, 1);
      if (!input.heavy || player.charge >= 1) startAttack(player, 'heavy', input, match);
    } else if (input.lightPressed) startAttack(player, 'light', input, match);
    else if (input.specialPressed) startAttack(player, 'special', input, match);
  }
}
