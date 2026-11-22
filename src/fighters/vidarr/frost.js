import { strike } from '../../combat/hits.js';
import { bodyCenter, combatants } from '../../combat/state.js';
import { freezeFighter, frozenTime } from '../../combat/status.js';
import { direction } from '../../math.js';
import { frostSeconds } from './profile.js';

function freezeRivals(owner, attack, match) {
  const targets = combatants(match).filter(actor => actor.slot !== owner.slot && actor.stocks && !actor.respawn);
  for (const target of targets) freezeFighter(target, match, frostSeconds);
  attack.frostTargets = targets;
  attack.serpentEnds = [-1, 1].flatMap(side => {
    const rivals = targets.filter(target => !target.owner && direction(target.x - owner.x, owner.facing) === side)
      .sort((a, b) => b.y - a.y);
    return [6.8, 3.88, 1.49].map((height, i) => {
      const target = rivals[i];
      return target ? [target.x, target.y + bodyCenter(target) + .13] : [side * 14.3, height];
    });
  });
}

export function advanceFrost(owner, attack, match) {
  if (attack.age < attack.from) return;
  if (!attack.fired) {
    attack.fired = true;
    freezeRivals(owner, attack, match);
  }
  if (attack.age < attack.biteAt || attack.age > attack.biteUntil) return;
  for (const target of attack.frostTargets) {
    if (attack.victims.has(target) || !frozenTime(target, match)) continue;
    const hit = { damage: 24, force: 12, x: direction(target.x - owner.x, owner.facing), stationary: true };
    if (!strike(owner, target, hit, match)) continue;
    attack.victims.add(target);
    match.events.push({ type: 'frostBite', x: target.x, y: target.y + bodyCenter(target), color: '#c9f5ff' });
  }
}
