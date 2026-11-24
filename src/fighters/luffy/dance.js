import { strike } from '../../combat/hits.js';
import { combatants } from '../../combat/state.js';
import { freezeFighter, frozenTime, interruptAttack } from '../../combat/status.js';
import { direction } from '../../math.js';
import { rubberDanceBeat, rubberDanceImpact, rubberDanceSeconds } from './profile.js';

export function advanceRubberDance(owner, attack, match) {
  if (attack.age + 1e-9 < attack.from) return;
  if (!attack.fired) {
    attack.fired = true;
    attack.untouchable = true;
    attack.danceEndsAt = match.time - rubberDanceSeconds;
    attack.danceTargets = combatants(match).filter(target => target.slot !== owner.slot && target.stocks && !target.respawn);
    for (const target of attack.danceTargets) freezeFighter(target, match, rubberDanceSeconds);
    owner.vx = 0;
    match.events.push({ type: 'special', x: owner.x, y: owner.y + 1.4, color: '#fff3e4' });
  }

  const remaining = match.time - attack.danceEndsAt;
  if (remaining <= 1e-9) {
    interruptAttack(owner);
    return;
  }
  const elapsed = attack.danceElapsed = Math.max(0, rubberDanceSeconds - remaining);
  const beat = Math.floor(elapsed / rubberDanceBeat);
  if (beat === attack.lastDanceStrike || elapsed - beat * rubberDanceBeat + 1e-9 < rubberDanceImpact) return;
  attack.lastDanceStrike = beat;
  for (const target of attack.danceTargets) {
    if (!target.stocks || target.respawn || !frozenTime(target, match)) continue;
    const x = direction(target.x - owner.x, owner.facing);
    strike(owner, target, { damage: 4, force: 4.6, x, stationary: true }, match);
  }
}
