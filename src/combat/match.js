import { advanceArena, carryRider, rules } from './arena.js';
import { advanceAdventure, constrainToEncounter, hitSpikes } from './adventure.js';
import { advanceAttack } from './attacks.js';
import { separateBodies } from './bodies.js';
import { vanishClone } from './clones.js';
import { cpuInput } from './cpu.js';
import { advanceDance } from './dance.js';
import { crushDeckRiders } from './deck-crush.js';
import { knockOut } from './knockout.js';
import { move } from './movement.js';
import { advanceProjectiles } from './projectiles.js';
import { combatants, idleInput, spawn } from './state.js';
import { advancePoison, capturingAttack } from './status.js';
import { advanceAcidRain } from '../fighters/che-addominali/rain.js';
import { mirrorTime, restoreOriginalForm } from '../fighters/mimora/mirror.js';
import { advanceCompanions } from '../fighters/olivar/companions.js';

export { createMatch } from './state.js';

function checkResult(match) {
  if (match.adventure) {
    advanceAdventure(match);
    return;
  }
  const alive = match.fighters.filter((fighter) => fighter.stocks > 0);
  if (alive.length > 1 && match.time > 0) return;
  let winner = alive[0];
  if (alive.length > 1) {
    alive.sort((a, b) => b.stocks - a.stocks || a.damage - b.damage);
    winner = alive[0].stocks === alive[1].stocks && alive[0].damage === alive[1].damage ? null : alive[0];
  }
  match.result = { winner: winner ?? null, timedOut: match.time <= 0 };
}

function advanceSuperstar(match, dt) {
  const star = match.superstar;
  if (!star || star.holder) return;
  star.cooldown = Math.max(0, star.cooldown - dt);
  if (star.cooldown) return;
  const collector = match.fighters.find((player) => player.fighter.moves && player.stocks && !player.respawn &&
    Math.abs(player.x - star.x) < 0.85 && Math.abs(player.y + 1 - star.y) < 1.15 && !capturingAttack(player, match));
  if (!collector) return;
  star.holder = collector;
  match.events.push({ type: 'superstar', x: star.x, y: star.y, color: '#ffde78' });
}

export function tickMatch(match, controls, dt = rules.step) {
  if (match.result) return;
  if (match.countdown > 0) {
    match.countdown = Math.max(0, match.countdown - dt);
    return;
  }
  match.time -= dt;
  if (!match.adventure) match.time = Math.max(0, match.time);
  for (const player of match.fighters) {
    if (!player.mirror || mirrorTime(player, match) > 0) continue;
    restoreOriginalForm(player);
    match.events.push({ type: 'blink', x: player.x, y: player.y + 1.1, color: player.fighter.color });
  }
  for (const player of match.fighters) advancePoison(player, match);
  advanceAcidRain(match);
  const { arena } = match;
  const previousCycle = arena.environment?.cycle;
  const actors = combatants(match);
  if (!match.dance || arena.definition.platforms.some(({ rotation }) => rotation)) {
    advanceArena(arena, dt);
    for (const player of actors) {
      if (player.stocks && !player.respawn && player.owner?.stocks !== 0) carryRider(player);
    }
  }
  if (match.dance) {
    advanceDance(match, dt);
    if (match.adventure || !match.dance) checkResult(match);
    return;
  }

  const { side, top, bottom } = arena.definition.bounds;
  const movement = new Map();
  for (const player of actors) {
    if (!player.stocks || player.owner?.stocks === 0) continue;
    if (player.respawn > 0) {
      player.respawn -= dt;
      if (player.respawn <= 0) Object.assign(player, spawn(player.slot, false, player.fighter, arena, match.adventure?.checkpoint?.[player.slot]));
      continue;
    }
    const x = player.x;
    const landingFrom = move(player, player.cpu ? cpuInput(player, match, dt) : controls.get(player.slot) ?? idleInput, dt, match);
    movement.set(player, { x, landingFrom });
  }
  separateBodies(actors, match, movement);
  if (arena.definition.deckCrush && arena.environment.cycle !== previousCycle) crushDeckRiders(match, actors);
  for (const player of movement.keys()) {
    if (match.adventure) constrainToEncounter(player, match);
    if (player.y < bottom || (!match.adventure && (Math.abs(player.x) > side || player.y > top))) {
      if (player.owner) {
        vanishClone(player, match);
        continue;
      }
      knockOut(player, match);
    } else if (match.adventure) {
      hitSpikes(player, match);
    }
  }

  advanceSuperstar(match, dt);
  for (const clone of match.clones) {
    if (clone.stocks && !clone.owner.stocks) vanishClone(clone, match);
  }
  for (const player of actors) {
    if (player.stocks && !player.respawn) advanceAttack(player, dt, match);
    if (match.dance) break;
  }
  separateBodies(combatants(match), match);
  if (match.adventure) {
    for (const player of combatants(match)) {
      if (player.stocks && !player.respawn) constrainToEncounter(player, match);
    }
  }
  if (match.dance) return;
  for (const player of match.fighters) advanceCompanions(player, match, dt);
  advanceProjectiles(match, dt);
  match.clones = match.clones.filter(({ stocks }) => stocks > 0);
  checkResult(match);
}
