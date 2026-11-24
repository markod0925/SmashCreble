import { multiply, one, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';

function buildDragonRig() {
  const green = '#4aa961';
  const shade = '#287849';
  const belly = '#b7df87';
  const skin = '#f3c28b';
  const claw = '#fff2d4';
  const orange = '#f58344';
  const torso = [
    part('bevel', [0, 1.46, -.02], [.94, 1.19, .73], green),
    part('bevel', [0, 1.46, .29], [.67, .92, .27], belly),
    part('bevel', [0, 1.98, .01], [.48, .37, .49], shade),
  ];
  for (let row = 0; row < 4; row++) {
    const y = 1.14 + row * .21;
    for (const column of [-1, 0, 1]) {
      const x = column * .235 + (row % 2 ? .05 : -.05);
      torso.push(part('leaf', [x, y, .452 - Math.abs(x) * .34], [.3, .28, .11], column ? '#79b76b' : belly, [Math.PI, column * .25, 0]));
    }
    torso.push(part('leaf', [0, y, -.44], [.24, .42, .24], orange, [-1.02, 0, 0]));
  }
  const head = [
    part('bevel', [0, .32, -.03], [1.06, 1.01, .94], skin),
    part('bevel', [0, .14, .40], [.79, .39, .48], skin),
    part('gem', [0, .25, .645], [.19, .14, .09], '#b57753'),
    part('box', [0, .074, .65], [.18, .054, .04], '#66382b'),
    part('box', [0, .084, .674], [.148, .026, .02], claw),
  ];
  for (const side of [-1, 1]) {
    head.push(
      part('bevel', [side * .252, .38, .437], [.244, .274, .15], claw, [0, side * .24, side * -.13]),
      part('bevel', [side * .225, .372, .524], [.101, .165, .05], '#183a28'),
      part('box', [side * .208, .41, .55], [.043, .045, .019], '#ffffff', zero, .76),
      part('bevel', [side * .24, .53, .481], [.29, .071, .075], '#56362d', [0, side * .25, side * .33]),
      part('box', [side * .161, .101, .648], [.17, .053, .04], '#66382b', [0, side * .18, side * .31]),
      part('box', [side * .25, .151, .609], [.107, .051, .049], '#66382b', [0, side * .55, side * .58]),
      part('leaf', [side * .311, .126, .57], [.082, .146, .085], claw, [Math.PI, 0, side * .18]),
      part('leaf', [side * .245, .744, -.166], [.196, .31, .2], orange, [-.3, 0, side * -.42]),
    );
  }
  for (let i = 0; i < 4; i++) {
    const angle = i * .52;
    head.push(part('leaf', [0, .36 + Math.cos(angle) * .49, -.03 - Math.sin(angle) * .49], [.25, .36, .28], orange, [-angle, 0, 0]));
  }
  const jaw = [
    part('bevel', [0, -.018, .32], [.71, .19, .54], skin),
    part('bevel', [0, .076, .37], [.62, .086, .46], '#562d27'),
    part('bevel', [0, .09, .51], [.42, .062, .22], '#e89179'),
  ];
  const arm = [
    part('bevel', [0, -.25, 0], [.31, .62, .35], green),
    part('bevel', [0, -.51, .055], [.32, .29, .34], shade),
    part('bevel', [0, -.62, .099], [.32, .24, .31], skin),
  ];
  const leg = [
    part('bevel', [0, -.36, 0], [.38, .74, .41], shade),
    part('bevel', [0, -.57, .045], [.39, .4, .39], green),
    part('bevel', [0, -.772, .161], [.44, .26, .6], green),
  ];
  for (const finger of [-1, 0, 1]) {
    arm.push(part('leaf', [finger * .097, -.747, .127], [.09, .21, .1], claw, [Math.PI - .18, 0, finger * .14]));
    leg.push(part('leaf', [finger * .132, -.815, .445], [.103, .234, .12], claw, [Math.PI / 2, 0, 0]));
  }
  const tail = [0.58, 0.51, 0.43, 0.35].map((length, i) => ({ length, parts: [
    part('bevel', [0, 0, -length / 2], [.37 - i * .061, .35 - i * .058, length + .09], i % 2 ? green : shade),
    part('leaf', [0, .15 - i * .028, -length * .57], [.13, .23 - i * .033, .13], orange, [-.46, 0, 0]),
  ] }));
  tail.at(-1).parts.push(part('leaf', [0, 0, -.4], [.43, .43, .17], green, [-Math.PI / 2, 0, 0]));
  return { torso, head, jaw, arm, leg, tail };
}

const rig = buildDragonRig();

export function draw(renderer, fighter, position, time, options) {
  const { torso, head, jaw, arm, leg, tail } = rig;
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const pulse = (progress) => Math.sin(Math.PI * Math.max(0, Math.min(1, progress)));
  const phase = attack ? attack.age / attack.duration : 0;
  const kickStart = attack?.followUp?.from ?? attack?.from;
  const claw = attack?.type === 'dragonClaw' ? pulse(attack.age / kickStart) : 0;
  const kick = attack?.type === 'dragonClaw' ? pulse((attack.age - kickStart + .07) / (attack.duration - kickStart + .07)) : 0;
  const breath = attack?.type === 'dragonFlame' ? pulse(phase) : 0;
  const spines = attack?.type === 'dragonSpines' ? pulse(Math.pow(phase, .66)) : 0;
  const burst = attack?.type === 'dragonScales' ? pulse(Math.pow(phase, .67)) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const stride = Math.sin(time * 16) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 8)) : 0;
  const crouch = (guarding ? .22 : charging ? .2 : 0) + landing * 1.1 + spines * .18;
  const hop = Math.sin(time * 5) * .035 + Math.abs(stride) * .09;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading - facing * (spines * 2.32 + burst * .34), wobble - facing * (running * .1 + breath * .13)], attack);
  const upper = multiply(root, transform([0, hop - crouch + recovery * .15, 0], one, [running * .16 + breath * .22 + spines * .59 - burst * .24, claw * -.72 + kick * .39, claw * -.2]));
  renderer.parts(torso, upper, flash);
  const headRoot = multiply(upper, transform([0, 1.99, .03], one, [-breath * .27 - recovery * .38 + charging * -.11, claw * .34, pose ? -.1 : 0]));
  renderer.parts(head, headRoot, flash);
  renderer.parts(jaw, multiply(headRoot, transform([0, .04, .02], one, [(breath * .87 + burst * .31) - .08, 0, 0])), flash);

  for (const side of [-1, 1]) {
    const strikeArm = side === -1 ? claw : 0;
    const kickLeg = side === 1 ? kick : 0;
    const legSwing = airborne ? rise * -.31 + side * .38 : stride * side * .79;
    const legRoot = multiply(root, transform([side * .24, .91 - crouch * .3, kickLeg * .13], one, [legSwing - kickLeg * 1.7 - recovery * .42, 0, side * .1]));
    renderer.parts(leg, legRoot, flash);
    const armSwing = guarding ? -1.18 : -stride * side * .71 + rise * -.45 + side * .09;
    const armRoot = multiply(upper, transform([side * .47, 1.84, 0], one, [armSwing - strikeArm * 1.86 - recovery * 1.3 + spines * .64, strikeArm * .63, side * (.28 + burst * 1.52 + (pose ? .51 : 0)) - strikeArm * .58]));
    renderer.parts(arm, armRoot, flash);
  }

  let tailRoot = multiply(upper, transform([0, 1.11, -.24], one, [-.25 - rise * .36 + kick * .42, -.56, 0]));
  for (const [i, segment] of tail.entries()) {
    renderer.parts(segment.parts, tailRoot, flash);
    tailRoot = multiply(tailRoot, transform([0, 0, -segment.length], one, [.22 + burst * .24, Math.sin(time * (5 + running * 5) - i * .65) * (.15 + running * .23) - .31, 0]));
  }

  if (!attack || !(attack.age >= attack.from && attack.age <= attack.until)) return;
  const [x, y, z] = position;
  if (attack.type === 'dragonFlame') {
    flameEffect(renderer, position, facing, attack);
  } else if (attack.type === 'dragonClaw') {
    const kicking = !attack.followUp;
    for (let i = 0; i < (kicking ? 1 : 3); i++) {
      renderer.object('leaf', [x + facing * ((kicking ? 1.55 : 1.08) + i * .18), y + (kicking ? 1.1 : 1.62 - i * .14), z + .83],
        [.16, kicking ? 1.36 : .8, .13], '#e3ffad', [0, 0, -facing * (kicking ? 1.32 : .61)], .9, .8);
    }
  }
}

export function flameEffect(renderer, [x, y, z], facing, attack) {
  const front = .57 + (attack.range - .57) * Math.min(1, (attack.age - attack.from) * 19 + .22);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const flicker = Math.sin(attack.age * 72 + i * 2.1);
    renderer.object('gem', [x + facing * (.57 + t * (front - .57)), y + 1.98 - t * .43 + flicker * t * .19, z + .42],
      [.68 + t * .48, .34 + t * .59, .36 + t * .46], i % 2 ? '#ff8e35' : '#ffdc67', [0, flicker * .4, -facing * 1.78], .94, .88 - t * .25);
  }
}

export const projectiles = {
  spine(renderer, { x, y, vx, vy }, time) {
    renderer.object('leaf', [x, y, .62], [.35, .98, .34], '#ff994d', [0, time * 10, Math.atan2(vy, vx) - Math.PI / 2], .76);
  },
  scale(renderer, { x, y, vx, vy }, time) {
    renderer.object('leaf', [x, y, .62 + Math.sin(vx) * .3], [.36, .59, .18], '#c5f599', [time * 12, vx, Math.atan2(vy, vx)], .75);
  },
};
