import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { attacks, toothCount } from './profile.js';

const fur = '#956047';
const darkFur = '#664239';
const tan = '#c88f62';
const caramel = '#deb080';
const ivory = '#fff3d9';
const ink = '#372c32';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));

const bodyParts = [
  part('bevel', [0, 1.177, -.167], [.899, .886, 1.686], fur, [.16, 0, 0]),
  part('bevel', [0, 1.21, .532], [1.068, 1.047, .922], tan, [-.19, 0, 0]),
  part('leaf', [0, 1.14, .884], [.631, .778, .28], caramel, [Math.PI, 0, 0]),
  part('bevel', [0, 1.105, -.745], [.975, .707, .847], darkFur, [.27, 0, 0]),
  part('bevel', [0, 1.527, -.389], [.719, .323, 1.16], '#aa7454', [.13, 0, 0]),
];
const neckParts = [
  part('bevel', [0, .258, .004], [.523, .746, .524], fur, [.12, 0, 0]),
  part('bevel', [0, .235, .19], [.466, .592, .282], tan, [.12, 0, 0]),
];
const paws = [
  part('bevel', [0, -.161, 0], [.218, .434, .261], tan),
  part('bevel', [0, -.376, .089], [.327, .195, .423], caramel),
  ...[-1, 0, 1].map(toe => part('bevel', [toe * .077, -.39, .26], [.082, .095, .075], '#9e7659')),
];
const upperLeg = [part('bevel', [0, -.168, -.016], [.309, .487, .339], fur, [.11, 0, 0])];
const haunch = [part('bevel', [0, -.156, -.044], [.405, .546, .481], darkFur, [.19, 0, 0])];
const tailBase = [part('horn', [0, .143, -.257], [.232, .619, .209], darkFur, [-1.1, 0, 0])];
const tailTip = [part('horn', [0, .076, -.179], [.147, .413, .164], tan, [-1.13, 0, 0])];

const head = [
  part('bevel', [0, .084, -.031], [.771, .67, .666], tan),
  part('bevel', [0, .233, -.057], [.734, .436, .647], fur, [.08, 0, 0]),
  part('bevel', [0, -.092, .285], [.609, .298, .521], caramel, [-.09, 0, 0]),
  part('bevel', [0, .003, .526], [.245, .171, .149], ink, [0, 0, -.05]),
  part('bevel', [-.051, .045, .587], [.071, .04, .03], '#79606b'),
  part('bevel', [0, -.175, .248], [.501, .155, .408], '#624145'),
];
for (const side of [-1, 1]) {
  head.push(
    part('horn', [side * .304, .498, -.067], [.429, .78, .315], darkFur, [.12, side * .24, -side * .35]),
    part('leaf', [side * .312, .478, .053], [.251, .516, .097], '#e1a08d', [.16, side * .23, -side * .35]),
    part('bevel', [side * .196, .167, .305], [.223, .254, .149], ivory, [0, side * .19, side * -.14]),
    part('bevel', [side * .186, .162, .381], [.104, .155, .04], ink, [0, side * .19, side * -.11]),
    part('gem', [side * .183 - .016, .198, .405], [.04, .05, .023], '#fffaf0'),
    part('bevel', [side * .201, .3, .328], [.214, .063, .056], darkFur, [.05, side * .12, side * -.21]),
    part('horn', [side * .209, -.22, .421], [.107, .198, .113], ivory, [Math.PI + .18, 0, side * -.18]),
  );
}
const jawParts = [
  part('bevel', [0, -.037, .228], [.549, .185, .456], '#b17d5e'),
  part('bevel', [0, .023, .256], [.484, .079, .375], '#653f4b'),
  part('horn', [-.175, .068, .291], [.083, .136, .114], ivory, [-.18, 0, -.15]),
  part('horn', [.175, .068, .291], [.083, .136, .114], ivory, [-.18, 0, .15]),
];
const tongue = [
  part('bevel', [0, -.05, .276], [.201, .104, .381], '#e6909b', [.23, 0, 0]),
  part('bevel', [0, -.079, .413], [.176, .118, .161], '#f4a5ab', [.43, 0, 0]),
];
const jaws = [0, -1, 1];
const bites = attacks.cerberoBites;
const biteStarts = [bites.followUp.from, bites.followUp.followUp.from, bites.from];
const tooth = [
  part('horn', [0, -.028, 0], [.38, .672, .32], ivory, [0, 0, Math.PI], .64),
  part('bevel', [0, .203, 0], [.389, .226, .324], '#fff9e2', zero, .7),
  part('bevel', [0, .14, .133], [.222, .153, .088], '#e3be91', [0, 0, .08], .44),
];

function drawSitImpact(renderer, [x, y, z], size, age) {
  const progress = clamp(age / .51, 0, 1);
  if (age < 0 || progress >= 1) return;
  const radius = (.88 + 5.96 * ease(progress)) * size;
  const fade = 1 - progress;
  for (let i = 0; i < 14; i++) {
    const angle = TAU * i / 14 + .26;
    renderer.object('bevel', [x + Math.cos(angle) * radius, y + .17 + Math.sin(angle) * .075, z - Math.sin(angle) * radius * .61],
      [radius * .42, .145 * size, .38 * size], '#ffc983', [0, angle + Math.PI / 2, 0], .93, .77 * fade);
    if (i % 2 === 0) {
      const puff = (.31 + .7 * progress) * size;
      renderer.object('bombShell', [x + Math.cos(angle) * radius, y + (.27 + progress * (.95 + i * .07)) * size, z - Math.sin(angle) * radius * .64],
        [puff * 1.47, puff, puff], i % 4 ? '#e5ae81' : '#ffe3ad', [0, angle, angle], .82, .73 * fade);
    }
  }
}

export const portrait = { heading: .28, targetY: 1.65, fov: .53 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const biting = type === 'cerberoBites';
  const spray = type === 'cerberoSpray';
  const firing = type === 'cerberoTeeth';
  const stomping = type === 'cerberoGiantSit';
  const giant = stomping ? ease(age / attacks.cerberoGiantSit.growthHit.at) * ease((attack.duration - age) / .6) : 0;
  const sit = stomping ? giant * ease((age - .38) / (attack.from - .38)) : 0;
  const squash = stomping ? pulse((age - attack.from + .015) / .31) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const strike = biting ? pulse((age - attack.from + .068) / .215) : 0;
  const puff = spray ? pulse((age - .025) / .318) : 0;
  const spool = firing ? ease(age / .15) * ease((attack.duration - age) / .26) : 0;
  const shot = (attack?.teethFired ?? 0) - 1;
  const stride = Math.sin(time * 15.2) * running * (1 - giant);
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) * (1 - giant) : 0;
  const crouch = (landing * 1.32 + (guarding ? .26 : charging ? .16 : 0)) * (1 - giant);
  const [x, y, z] = position;
  const foreground = [x * (1 - .46 * giant), y * (1 - .89 * giant), z + 3.1 * giant];
  const root = fighterRoot(foreground, fighter.size * (1 + 3.17 * giant),
    [0, heading * (1 - .84 * giant) + .21 * giant + facing * (.17 * strike - .16 * puff), wobble - facing * .093 * running * (1 - giant)], attack);
  const body = joint(root, [0, Math.abs(stride) * .085 + Math.sin(time * 5.2) * .027 - crouch - .15 * sit - .17 * squash, .16 * strike - .16 * sit],
    [.12 * running * (1 - giant) + .18 * strike - .17 * rise - .31 * recover - .58 * sit, 0, -.061 * stride]);
  renderer.parts(bodyParts, body, flash);

  const wag = Math.sin(time * (6 + running * 5)) * (.41 + .29 * running + .39 * sit);
  const tail = joint(body, [0, 1.35, -.993], [.2 * rise - .21 * sit, wag, 0]);
  renderer.parts(tailBase, tail, flash);
  renderer.parts(tailTip, joint(tail, [0, .233, -.481], [.28 * Math.sin(time * 7), wag * .51, 0]), flash);
  for (const front of [-1, 1]) {
    for (const side of [-1, 1]) {
      const rear = front === -1;
      const step = Math.sin(time * 15.2 + front * side * Math.PI / 2 + front * .38) * running * (1 - giant);
      const swing = airborne ? front * .43 - .55 * rise : step * .85;
      const leg = joint(body, [side * (.313 + (rear ? .21 : .05) * sit), .985 - (rear ? .18 : -.22) * sit, front * .62],
        [swing - .37 * recover + (rear ? -1.86 * sit : (.55 - .09 * side) * sit - .32 * strike), 0, side * (.081 + (rear ? .46 : .18) * sit)]);
      renderer.parts(rear ? haunch : upperLeg, leg, flash);
      const knee = joint(leg, [0, -.462, .013], [.34 * Math.max(0, step) + .37 * Math.max(0, rise) + (rear ? 1.52 : -.14) * sit, 0, 0]);
      renderer.parts(paws, knee, flash);
    }
  }

  for (const [index, side] of jaws.entries()) {
    const biteTime = age - biteStarts[index];
    const bite = biting ? pulse((biteTime + .107) / .203) : 0;
    const snap = biting ? pulse((biteTime + .055) / .145) : 0;
    const sprayHead = spray && index === (facing === 1 ? 2 : 1) ? puff : 0;
    const recoil = firing && shot >= 0 && shot % jaws.length === index
      ? 1 - ease((age - attack.from - shot * attack.volleyEvery) / attack.volleyEvery) : 0;
    const neck = joint(body, [side * .322, 1.436 - .06 * side + .058 * squash, .525 + Math.abs(side) * .115],
      [.21 + .35 * bite - .35 * recoil - .28 * sprayHead + .27 * sit + .11 * recover, side * .28, -side * (.52 + .2 * sit)]);
    renderer.parts(neckParts, neck, flash);
    const height = index === 0 ? .73 : .461 - .105 * side;
    const headPose = joint(neck, [0, height, .176 + .46 * snap + .089 * spool - .10 * recoil],
      [-.14 + .44 * bite + .27 * recoil - .18 * sit + .052 * Math.sin(time * 4.3 + index), -.12 * side + .07 * stride, side * .16]);
    renderer.parts(head, headPose, flash);
    const opening = .24 + .11 * Math.sin(time * 5.5 + index) + .78 * bite - .54 * snap + .35 * sprayHead + .39 * spool + .49 * recoil + .23 * sit;
    const jaw = joint(headPose, [0, -.246, .049], [opening, 0, side * .05 * sit]);
    renderer.parts(jawParts, jaw, flash);
    if (!firing && bite < .31) renderer.parts(tongue, joint(jaw, [0, .015, .035], [.15, 0, .2 * Math.sin(time * 8 + index)]), flash);
    if (recoil > .16 || (snap > .71 && biteTime >= 0)) {
      const tip = transformPoint(jaw, [0, .12, .48]);
      const burst = fighter.size * (.27 + .45 * Math.max(bite, recoil)) * (shot === toothCount - 1 ? 1.41 : 1);
      renderer.object('star', tip, [burst, burst, .31 * burst], ivory, [0, time * 11, time * 14], .99, .9);
    }
  }

  if (stomping) drawSitImpact(renderer, foreground, fighter.size, age - attack.from);
}

export const projectiles = {
  cerberoMist(renderer, { x, y, vx, remaining, scale }, time) {
    const direction = Math.sign(vx);
    const age = 1 - remaining * Math.abs(vx) / attacks.cerberoSpray.range;
    const swell = (.43 + .59 * ease(age * 1.8)) * scale;
    for (let i = 0; i < 5; i++) {
      const angle = TAU * i / 5 + age * 4.1;
      renderer.object('bombShell', [x - direction * i * .21 * scale, y + Math.sin(angle) * swell * .4, .7 + Math.cos(angle) * .21],
        [swell * 1.2, swell * (.69 + i * .072), swell], i % 2 ? '#efc3f3' : '#fff0f6',
        [0, time * 7, angle], .87, .59 * (1 - age));
    }
  },
  cerberoTooth(renderer, { x, y, vx, head, last, scale }, time) {
    const direction = Math.sign(vx);
    const rotation = direction * (.75 + time * 6) + head;
    renderer.parts(tooth, transform([x, y, .78], [scale, scale, scale], [time * 4.3, time * 3.6, rotation]), false);
    renderer.object('bevel', [x - direction * .46 * scale, y, .65], [(last ? 1.29 : .78) * scale, .102 * scale, .131 * scale],
      '#ffe0a3', [0, 0, direction * .06], .94, .78);
  },
};
