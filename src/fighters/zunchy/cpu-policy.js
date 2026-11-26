import { platformCenter } from '../../combat/arena.js';
import { canUseSuper } from '../../combat/clones.js';
import { isInvulnerable, resizeScale } from '../../combat/status.js';
import { clamp } from '../../math.js';
import { attacks, shrinkTime } from './profile.js';

export const actions = Object.freeze(['wait', 'light', 'tap', 'hold', 'super']);
export const featureNames = Object.freeze([
  'horizontalGap', 'heightGap', 'closingSpeed', 'facingTarget', 'samePlatform',
  'grounded', 'rivalGrounded', 'rivalAttacking', 'rivalGuarding', 'rivalInvulnerable',
  'rivalHitstun', 'rivalStagger', 'ownEdgeDistance', 'rivalTowardEdge',
  'ownDamage', 'rivalDamage', 'hasSuperstar', 'rivalShrunk',
]);

export function observeZunchy(player, target, match, { floor, dx, dy }) {
  if (player.owner || player.fighter.moves?.super !== 'zunchyShrink') return;
  const reach = attacks.zunchyBombs.range * resizeScale(player, match);
  if (Math.abs(dx) > reach) return;
  const hasSuperstar = canUseSuper(player, match);
  const edgeDistance = floor ? Math.min(player.x - floor.left, floor.right - player.x) : reach;
  const relativeSpeed = (player.vx - target.vx) * Math.sign(dx);
  return {
    legal: hasSuperstar ? actions : actions.slice(0, -1),
    features: [
      Math.abs(dx) / reach,
      clamp(dy / reach, -1, 1),
      clamp(relativeSpeed / player.fighter.speed, -1, 1),
      Number(dx * player.facing >= 0),
      Number(Boolean(player.grounded && player.grounded === target.grounded)),
      Number(Boolean(player.grounded)),
      Number(Boolean(target.grounded)),
      Number(Boolean(target.attack)),
      Number(Boolean(target.guarding)),
      Number(isInvulnerable(target)),
      Number(target.hitstun > 0),
      Number(target.stagger > 0),
      clamp(edgeDistance / reach, -1, 1),
      Number(Boolean(floor && dx * (player.x - platformCenter(floor)) > 0)),
      clamp(player.damage / 100, 0, 1),
      clamp(target.damage / 100, 0, 1),
      Number(hasSuperstar),
      Number(shrinkTime(player, match) > 0),
    ],
  };
}

export function zunchyActionInput(action, player, { x, jumpPressed }) {
  if (action === 'wait') player.aiDelay = .24;
  else if (player.aiDelay <= 0) player.aiDelay = .96;
  if (action === 'super') return { x, y: 0, superPressed: true };
  return {
    x, y: 0, jumpPressed,
    lightPressed: action === 'light',
    specialPressed: action === 'tap' || action === 'hold',
    special: action === 'hold',
  };
}

export function affine(row, inputs) {
  let sum = row[inputs.length];
  for (let i = 0; i < inputs.length; i++) sum += row[i] * inputs[i];
  return sum;
}

export function actionScores(model, features) {
  const inputs = model.hidden.length ? model.hidden.map(row => Math.tanh(affine(row, features))) : features;
  return model.output.map(row => affine(row, inputs));
}

export function bestZunchyAction(model, { features, legal }) {
  const scores = actionScores(model, features);
  return legal.reduce((best, action) => scores[actions.indexOf(action)] > scores[actions.indexOf(best)] ? action : best);
}

export function zunchyAttackPolicy(model) {
  return (player, target, match, context) => {
    const observation = observeZunchy(player, target, match, context);
    if (observation) return zunchyActionInput(bestZunchyAction(model, observation), player, context);
  };
}
