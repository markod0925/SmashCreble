import { boundTime, captureTarget, capturingAttack, dazedTime, frozenTime, interruptAttack, isSuperAttacking, resizeScale, sleepTime } from '../../combat/status.js';
import { bodyCenter, scaleOf } from '../../combat/state.js';
import { direction } from '../../math.js';
import { attacks, shrinkTime } from './profile.js';

export function tryGulp(caster, victim, hit, match) {
  if (caster.fighter.id !== 'zunchy' || hit.gulpSpit || !shrinkTime(caster, match) || !caster.stocks || caster.respawn ||
      caster.hitstun || caster.dodge || caster.attack?.capture || capturingAttack(caster, match) || isSuperAttacking(victim) ||
      boundTime(caster, match) || dazedTime(caster, match) || frozenTime(caster, match) || sleepTime(caster, match)) return false;
  if (!interruptAttack(caster)) return false;
  const facing = direction(victim.x - caster.x, caster.facing);
  caster.facing = facing;
  caster.guarding = false;
  caster.attack = { ...attacks.zunchyGulp, type: 'zunchyGulp', age: 0, fired: true, facing, x: facing, scale: scaleOf(caster) * resizeScale(caster, match) };
  captureTarget(caster.attack, victim);
  match.events.push({ type: 'chomp', x: caster.x, y: caster.y + bodyCenter(caster, match), color: '#a3f6b4' });
  return true;
}
