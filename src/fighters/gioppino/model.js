import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';

const brainParts = [
  part('bevel', [0, 0, 0], [.94, .78, .79], '#bf6e9a'),
  part('bevel', [-.248, .174, .09], [.463, .586, .731], '#ffacd0'),
  part('bevel', [.242, .159, .098], [.456, .567, .723], '#f597c5'),
  part('bevel', [-.238, -.19, .131], [.41, .29, .613], '#df80b4'),
  part('bevel', [.242, -.172, .133], [.416, .29, .614], '#e68cbb'),
  part('box', [0, .16, .442], [.049, .442, .028], '#894e7a'),
  part('box', [-.264, .151, .456], [.176, .047, .033], '#bf6e9a', [0, 0, -.41]),
  part('box', [.265, .102, .45], [.173, .049, .034], '#bf6e9a', [0, 0, .45]),
];

function buildGioppinoRig() {
  const skin = '#a6bc78';
  const shade = '#6a8f62';
  const cloth = '#649452';
  const patch = '#86a95d';
  const seam = '#3f594d';
  const hair = '#2d2e38';
  const torso = [
    part('plate', [0, 1.457, 0], [1.14, 1.155, .735], cloth),
    part('bevel', [0, 1.743, -.014], [1.22, .417, .744], '#789d54'),
    part('bevel', [0, 1.104, -.052], [.813, .275, .607], seam),
    part('plate', [-.213, 1.547, .382], [.43, .469, .096], patch, [0, -.12, .13]),
    part('plate', [.21, 1.295, .354], [.458, .456, .127], '#557f4e', [0, .18, -.13]),
    part('tube', [0, 1.999, .023], [.361, .281, .377], shade),
  ];
  for (const [x, y, angle] of [[-.28, 1.72, -.18], [.265, 1.551, .26], [-.155, 1.32, -.28], [.268, 1.148, .2]]) {
    torso.push(part('box', [x, y, .445], [.029, .158, .034], seam, [0, 0, -.69 + angle]),
      part('box', [x, y, .451], [.029, .156, .035], seam, [0, 0, .63 + angle]));
  }
  const head = [
    part('bevel', [0, .333, .018], [.811, .884, .719], skin),
    part('bevel', [-.025, .297, .34], [.666, .55, .148], '#b5c886'),
    part('plate', [-.095, .69, .036], [.868, .294, .799], hair, [-.096, 0, .24]),
    part('bevel', [.255, .623, .349], [.414, .225, .172], '#3a3845', [0, -.27, -.63]),
    part('leaf', [.361, .587, .225], [.217, .464, .276], hair, [0, -.3, -2.4]),
    part('box', [-.155, .495, .434], [.193, .067, .028], '#758761', [0, -.15, .11]),
    part('box', [.155, .456, .434], [.192, .062, .03], '#758761', [0, .12, -.19]),
    part('bevel', [-.159, .399, .439], [.083, .134, .06], '#334638'),
    part('bevel', [.144, .368, .441], [.098, .125, .06], '#334638'),
    part('box', [-.144, .426, .473], [.03, .037, .016], '#e1dbb3', zero, .43),
    part('box', [.159, .393, .473], [.034, .033, .016], '#e1dbb3', zero, .43),
  ];
  const jaw = [
    part('bevel', [0, -.08, .041], [.455, .224, .41], skin),
    part('bevel', [0, -.021, .251], [.314, .074, .105], '#aa4e58', [0, 0, -.11]),
    part('box', [.092, .012, .302], [.068, .061, .022], '#fff0cc', [0, 0, -.09]),
  ];
  const arm = [
    part('bevel', [0, -.122, -.016], [.377, .428, .362], cloth),
    part('bevel', [0, -.393, .022], [.252, .493, .278], shade),
    part('plate', [0, -.571, .064], [.299, .262, .338], skin),
  ];
  const leg = [
    part('bevel', [0, -.316, 0], [.354, .704, .407], '#638c57'),
    part('bevel', [0, -.554, .045], [.367, .363, .39], patch),
    part('box', [0, -.508, .244], [.219, .035, .029], seam, [0, 0, .19]),
    part('bevel', [0, -.78, .134], [.402, .242, .545], '#d6d2b0'),
    part('bevel', [0, -.879, .128], [.384, .081, .54], '#59645c'),
  ];
  for (const finger of [-1, 0, 1]) {
    arm.push(part('bevel', [finger * .086, -.708, .1], [.082, .182 - Math.abs(finger) * .034, .099], skin, [-.19, 0, finger * .16]));
  }
  return { torso, head, jaw, arm, leg };
}

const rig = buildGioppinoRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const phase = attack ? attack.age / attack.duration : 0;
  const combo = attack?.type === 'gioppinoCombo';
  const punch = combo ? pulse(attack.age / .21) : 0;
  const firstKick = combo ? pulse((attack.age - .185) / .195) : 0;
  const lastKick = combo ? pulse((attack.age - .365) / .245) : 0;
  const biting = attack?.type === 'gioppinoBite';
  const lunge = biting ? pulse((attack.age - .039) / .38) : 0;
  const jaws = biting ? pulse(attack.age / (attack.from + .058)) : 0;
  const throwing = attack?.type === 'gioppinoBrains';
  const toss = throwing ? pulse(Math.pow(phase, .64)) : 0;
  const clones = attack?.type === 'gioppinoClones' ? pulse(phase) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const stride = Math.sin(time * 12) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 8)) : 0;
  const crouch = landing * 1.22 + (guarding ? .21 : charging ? .15 : 0);
  const bob = Math.abs(stride) * .118 + Math.sin(time * 4.1) * .023 - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (punch * .37 - firstKick * .18 + lastKick * .26),
    wobble - facing * (.09 * running + .12 * lunge) + stride * .07], attack);
  const upper = multiply(root, transform([0, bob, .13 * lunge], one, [.23 * lunge + .15 * running - .14 * lastKick, 0, -.12 * punch]));
  renderer.parts(rig.torso, upper, flash);
  const head = multiply(upper, transform([0, 2.01, .023], one, [.12 * lunge - .17 * jaws - .31 * recovery, 0, (pose ? -.11 : -.071) + stride * .085]));
  renderer.parts(rig.head, head, flash);
  if (jaws > .06) {
    const mouth = multiply(head, transform([0, .151 - jaws * .061, .36], [.453, .12 + jaws * .2, .157], zero));
    renderer.mesh('bevel', mouth, '#42293b');
  }
  const jaw = multiply(head, transform([0, .126 - jaws * .14, .155], one, [jaws * .37, 0, 0]));
  renderer.parts(rig.jaw, jaw, flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const kicking = lead ? firstKick : lastKick;
    const legPitch = airborne ? side * .34 - rise * .34 : stride * side * (lead ? .64 : .82);
    const leg = multiply(root, transform([side * .247, .923 - crouch * .34, kicking * .13], one, [legPitch - kicking * 1.69 - recovery * .27, .043 * side, side * .11]));
    renderer.parts(rig.leg, leg, flash);
    const shamble = running * .42 + (pose ? .72 : .14) - side * .122;
    const armPitch = guarding ? -1.23 : -shamble - stride * side * .29 - rise * .35 - lunge * .65 - recovery * 1.24 - clones * .68 - (lead ? punch * 1.67 + toss * 1.46 : 0);
    const arm = multiply(upper, transform([side * .566, 1.813, .031], one, [armPitch, side * .075, side * (.25 + clones * .65 + (pose ? .54 : 0))]));
    renderer.parts(rig.arm, arm, flash);
    if (lead && throwing && attack.age < attack.from) {
      renderer.parts(brainParts, multiply(arm, transform([.011, -.79, .156], [.43, .43, .43], [.21, time, -.27])), flash);
    }
  }

  if (biting && attack.age >= attack.from && attack.age <= attack.until) zombieSnap(renderer, position, facing, attack);
  if (clones) {
    const [x, y, z] = position;
    for (let i = 0; i < 6; i++) {
      const angle = i * TAU / 6 + phase * TAU;
      renderer.object('gem', [x + Math.cos(angle) * 1.29, y + 1.04 + clones * 1.36, z + Math.sin(angle) * .75],
        [.18, .39, .18], i % 2 ? '#d7f0a5' : '#94d973', [0, angle, angle * .91], .88, clones * .84);
    }
  }
}

export function zombieSnap(renderer, [x, y, z], facing, attack) {
  const phase = (attack.age - attack.from) / (attack.until - attack.from);
  for (const direction of [-1, 1]) {
    renderer.object('leaf', [x + facing * (1.17 + phase * .42) * attack.scale, y + (1.65 + direction * (.37 - phase * .26)) * attack.scale, z + .6],
      [.22 * attack.scale, .61 * attack.scale, .16], '#def6ad', [0, 0, facing * (1.57 + direction * (.53 - phase * .4))], .91, .83 * (1 - phase));
  }
}

export const projectiles = {
  brain(renderer, { x, y, vx, scale = 1 }, time) {
    const width = .66 * scale;
    const brain = transform([x, y, .69], [width, width, width], [.55 + time * 6, time * 7, Math.sign(vx) * time * 8]);
    renderer.parts(brainParts, brain, false);
  },
};
