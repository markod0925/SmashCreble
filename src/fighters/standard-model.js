import { multiply, one, transform, zero } from '../render/math.js';
import { part } from '../render/parts.js';

export function buildStandardRig(p, details, { heavy = false, forest = false, wide = 1, powerGlove = false } = {}) {
  const torso = [
    part('bevel', [0, 1.58, 0], [1.04 * wide, .99, .74], p.main),
    part('plate', [0, 1.65, .36], [.83 * wide, .53, .17], p.shade),
    part('box', [0, 1.12, 0], [.72 * wide, .23, .53], p.dark),
    part('box', [0, 1.13, .29], [.21, .17, .1], p.trim),
    part(forest ? 'gem' : 'bevel', [0, 2.28, .018], [1.05 * wide, forest ? 1.01 : .87, .88], p.main),
    part(forest ? 'plate' : 'bevel', [0, 2.28, .405], [.79 * wide, forest ? .31 : .42, .135], p.face, [0, 0, forest ? -.13 : 0]),
  ];
  for (const side of [-1, 1]) {
    if (heavy) torso.push(part('box', [side * .161, 2.3, .472], [.2, .065, .037], p.light, [0, 0, side * .22], .9));
    else torso.push(part(forest ? 'gem' : 'box', [side * .17 * wide, 2.31, .466], [.135, .119, .04], p.light, [0, 0, side * .065], .9));
    torso.push(part('box', [side * .323 * wide, 1.78, .427], [.084, .08, .045], p.trim));
  }
  torso.push(...details);

  const arms = [-1, 1].map((side) => {
    const glove = heavy || (powerGlove && side === -1);
    const parts = [
      part('bevel', [0, -.055, 0], [glove ? .48 : .39, .4, .48], p.main),
      part('bevel', [0, -.33, .015], [glove ? .65 : .32, glove ? .61 : .48, glove ? .67 : .38], glove ? p.shade : p.dark),
      part('bevel', [0, -.51, .115], [glove ? .57 : .31, .32, glove ? .52 : .42], glove ? p.main : p.shade),
    ];
    if (glove) {
      parts.push(part('plate', [0, -.36, .32], [.44, .39, .106], p.trim, [0, 0, .11]));
      parts.push(part('box', [0, -.37, .387], [.259, .08, .03], p.light, [0, 0, .1], .75));
    }
    return parts;
  });
  const legs = [-1, 1].map(() => [
    part('bevel', [0, -.24, 0], [.4 * wide, .58, .48], p.dark),
    part('plate', [0, -.501, .081], [.4 * wide, .47, .41], p.shade),
    part('bevel', [0, -.733, .114], [.49 * wide, .31, .7], p.main),
    part('box', [0, -.827, .157], [.45 * wide, .13, .63], p.dark),
    part('box', [0, -.61, .412], [.217 * wide, .085, .06], p.trim, zero, .19),
  ]);
  return { torso, arms, legs, wide };
}

export function drawStandard(rig, renderer, fighter, position, time, options) {
  const { heading = .42, running = 0, airborne = false, guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const step = Math.sin(time * 15) * running;
  const crouch = guarding ? .22 : charging ? .14 : 0;
  const bob = Math.abs(step) * .075 + Math.sin(time * 3.8) * .023 - crouch;
  const weight = fighter.size;
  const turn = attack ? Math.sin(Math.min(1, attack.age / attack.duration) * Math.PI) * 1.3 : 0;
  const root = transform(position, [weight, weight, weight], [0, heading - turn * .15, wobble - running * .08 * Math.sign(heading)]);
  const upper = multiply(root, transform([0, bob, 0], one, [guarding ? .1 : 0, -turn * .08, 0]));
  renderer.parts(rig.torso, upper, flash);
  for (const [i, side] of [-1, 1].entries()) {
    const legAngle = airborne ? side * .43 + .29 : step * side * .74 + (pose ? side * .075 : 0);
    const leg = multiply(root, transform([side * .245 * rig.wide, .9 - crouch * .35, 0], one, [legAngle, side * .1, side * .065]));
    renderer.parts(rig.legs[i], leg, flash);
    const punch = i === 0 ? turn : turn * .43;
    const zombieReach = options.zombie && !attack ? .83 : 0;
    const armAngle = guarding ? -1.15 : charging ? .48 : -step * side * .63 - punch - (pose && i === 0 ? .53 : .03) - zombieReach;
    const arm = multiply(upper, transform([side * .65 * rig.wide, 1.86, 0], one, [armAngle, side * .12, side * (pose ? .28 : .2) - side * punch * .28]));
    renderer.parts(rig.arms[i], arm, flash);
  }
}
