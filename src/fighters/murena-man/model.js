import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { attacks } from './profile.js';

const slate = '#697b87';
const steel = '#a5b6be';
const silver = '#d6e5e8';
const ivory = '#fff3d8';
const orange = '#ec993b';
const ink = '#242736';
const ease = (value) => smoothStep(clamp(value, 0, 1));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.56, -.043], [.93, 1.32, .78], slate, [.21, 0, 0]),
  part('bevel', [0, 1.62, .23], [.685, 1.25, .47], steel, [.28, 0, 0]),
  part('bevel', [0, 1.003, -.073], [.936, .182, .782], orange),
  part('leaf', [0, 1.66, -.449], [.237, .965, .556], '#526673', [-.25, 0, 0]),
];
const upperJaw = [
  part('bevel', [0, .098, -.212], [.932, .748, .786], steel, [-.26, 0, 0]),
  part('bevel', [0, .224, .316], [.689, .419, 1.017], steel, [-.27, 0, 0]),
  part('horn', [0, .342, .805], [.63, .507, .341], silver, [1.46, 0, 0]),
  part('bevel', [0, .104, .365], [.601, .106, .948], ink, [-.24, 0, 0]),
];
const lowerJaw = [
  part('bevel', [0, -.054, .286], [.658, .226, 1.029], '#879aa5', [-.26, 0, 0]),
  part('bevel', [0, .019, .32], [.619, .085, .94], '#4c3845', [-.25, 0, 0]),
  part('bevel', [0, .062, .464], [.344, .084, .452], '#b06c76', [-.25, 0, 0]),
];
for (const side of [-1, 1]) {
  upperJaw.push(
    part('bevel', [side * .415, .262, .087], [.146, .323, .316], silver, [.13, 0, 0]),
    part('bevel', [side * .487, .273, .111], [.054, .215, .206], ink, [.18, 0, 0]),
    part('gem', [side * .516, .33, .153], [.027, .062, .062], ivory, zero, .46),
    part('bevel', [side * .246, .378, .739], [.075, .068, .129], slate, [.39, 0, 0]),
  );
  for (let i = 0; i < 4; i++) {
    const forward = .256 + .163 * i;
    upperJaw.push(part('horn', [side * (.287 - .016 * i), .06 + .04 * i, forward],
      [.134, .194 - .015 * i, .117], ivory, [Math.PI + .21, 0, side * .16]));
    if (i < 3) lowerJaw.push(part('horn', [side * (.255 - .016 * i), .097 + .045 * i, forward + .079],
      [.105, .139, .104], ivory, [-.22, 0, -side * .2]));
  }
}

const blades = [
  part('bevel', [0, -.087, 0], [.465, .437, .466], orange),
  part('bevel', [0, -.646, 0], [.434, 1.114, .228], slate),
  part('bevel', [0, -.65, .102], [.299, 1.038, .083], silver),
  part('horn', [0, -1.313, .011], [.389, .398, .208], '#bccfd5', [0, 0, Math.PI]),
];
for (const edge of [-1, 1]) {
  for (let i = 0; i < 5; i++) {
    blades.push(part('horn', [edge * (.23 - .014 * i), -.375 - .198 * i, .017],
      [.125, .254, .136], i % 2 ? silver : steel, [0, 0, -edge * 1.11]));
  }
}

const thigh = [part('tube', [0, -.247, 0], [.155, .526, .164], orange)];
const shin = [
  part('tube', [0, -.204, 0], [.133, .479, .153], orange),
  part('bevel', [0, -.449, .111], [.273, .18, .372], orange, [-.09, 0, 0]),
  part('bevel', [0, -.44, .233], [.2, .112, .137], '#ffc36a'),
];
const bomb = [
  part('bombShell', zero, one, '#52345a'),
  part('plate', [0, .1, 0], [.996, .134, .997], '#edaa57'),
  part('gem', [0, .051, .488], [.347, .391, .112], '#ffe385', zero, .46),
  part('plate', [0, .483, 0], [.287, .138, .288], steel),
  part('fuse', [0, .514, 0], [.49, .51, .48], '#d6a668'),
];

function drawBomb(renderer, matrix, time) {
  renderer.parts(bomb, matrix, false);
  const spark = .25 + .13 * Math.abs(Math.sin(time * 29));
  renderer.mesh('star', multiply(matrix, transform([.174, .713, .042], [spark, spark, spark * .64], [0, time * 5, time * 12])), '#fff0aa', 1, .93);
}

export function drawFlameJet(renderer, [mouthX, mouthY, mouthZ], originX, attack) {
  const { age, facing, from, range, scale, until, waveSpeed } = attack;
  if (age < from || age > until) return;
  const push = Math.min(range, (age - from) * waveSpeed * scale);
  const fade = ease((until - age) / .09);
  const length = Math.max(.29 * scale, push - (mouthX - originX) * facing);
  for (let i = 0; i < 8; i++) {
    const along = i / 7;
    const flicker = Math.sin(age * 49 + i * 1.7);
    renderer.object('leaf', [mouthX + facing * along * length, mouthY + along * (-.59 + .24 * flicker) * scale, mouthZ + .15 * along],
      [(.37 + along * .49) * scale, (.79 + along * .44) * scale, .26 * scale], i % 2 ? '#ff8751' : '#ffd45f',
      [0, flicker * .17, facing * (-1.32 + .43 * flicker * along)], 1, .28 + .69 * fade);
  }
}

function drawVortex(renderer, [x, y, z], scale, spinAngle, attack) {
  const { from, followUp } = attacks.murenaWhirl;
  const final = ease((attack.age - followUp.followUp.from) / .09);
  const glow = ease((attack.age - from + .05) / .08) * ease((.78 - attack.age) / .11);
  if (glow <= 0) return;
  for (const side of [0, Math.PI]) {
    for (let i = 0; i < 8; i++) {
      const segment = i / 7;
      const theta = spinAngle + side - attack.facing * (.13 + segment * 2.32);
      const radius = (2.61 + .19 * final - .49 * segment) * scale;
      renderer.object('bevel', [x + Math.cos(theta) * radius, y + (1.73 + .27 * Math.sin(theta) - segment * .57) * scale, z - Math.sin(theta) * radius * .76],
        [.99 * scale, (.13 + .09 * final) * scale, (.24 + .15 * (1 - segment)) * scale],
        i % 2 ? '#b1dcff' : '#eaf8ff', [0, theta + Math.PI / 2, .09 * Math.cos(theta)], 1, glow * (.95 - .47 * segment));
    }
  }
}

export const portrait = { heading: -.49, targetY: 1.63, fov: .53 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const biting = type === 'murenaBite';
  const biteOpen = biting ? pulse(age / .17) : 0;
  const snap = biting ? pulse((age - .105) / .24) : 0;
  const breathing = type === 'murenaFlame';
  const breath = breathing ? ease((age - .035) / .13) * ease((attack.duration - age) / .19) : 0;
  const spinning = type === 'murenaWhirl';
  const spinPrep = spinning ? pulse(age / .21) : 0;
  const spin = spinning ? ease((age - .106) / .091) * ease((.83 - age) / .125) : 0;
  const spinAngle = spinning ? facing * (3 * TAU * clamp((age - .107) / .616, 0, 1) - .83 * spinPrep) : 0;
  const throwing = type === 'murenaBombSalvo';
  const windup = throwing ? pulse(age / (attack.from + .044)) : 0;
  const toss = throwing ? pulse((age - attack.from + .068) / .34) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.4) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) : 0;
  const crouch = landing * 1.36 + (guarding ? .28 : charging ? .19 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size,
    [0, heading + spinAngle + facing * (.27 * snap + .18 * breath - .49 * windup + .33 * toss), wobble - facing * (.08 * running - .17 * toss)], attack);
  const body = joint(root, [0, Math.abs(stride) * .075 + Math.sin(time * 4.9) * .031 - crouch, .16 * snap],
    [.21 * running + .19 * snap - .27 * windup + .28 * toss - .35 * recover, 0, .17 * Math.sin(spinAngle) * spin - stride * .087]);
  renderer.parts(torso, body, flash);

  const head = joint(body, [0, 2.174, .12 + .34 * snap], [-.27 - .53 * biteOpen + .33 * snap + .24 * breath, .17 * stride, 0]);
  const jaw = joint(head, [0, -.17, -.196], [.055 + .96 * biteOpen + .58 * breath + .095 * Math.sin(time * 4.2) + .48 * recover, 0, 0]);
  renderer.parts(upperJaw, head, flash);
  renderer.parts(lowerJaw, jaw, flash);

  for (const side of [-1, 1]) {
    const leg = joint(root, [side * .273, .981 - crouch * .77, -.09],
      [airborne ? .53 * side - .65 * rise : -.89 * stride * side - .22 * spinPrep, 0, side * (.13 + .25 * spin)]);
    renderer.parts(thigh, leg, flash);
    renderer.parts(shin, joint(leg, [0, -.474, 0], [airborne ? .47 + .28 * side : .27 * Math.max(0, stride * side), 0, 0]), flash);

    const pitch = (guarding ? -1.26 : -.22) + side * stride * .74 - .58 * breath + .58 * spinPrep - 1.68 * toss - .69 * recover;
    const displaySpread = pose ? .67 + .41 * side : 0;
    const spread = side * (.48 + displaySpread + .99 * spin + .28 * breath + .27 * toss - .24 * windup);
    const shoulder = joint(body, [side * .431, 1.809, -.037], [pitch, side * (.17 + .43 * spinPrep), spread]);
    const extension = 1 + .37 * spin;
    renderer.parts(blades, multiply(shoulder, transform(zero, [1, extension, 1], zero)), flash);
  }

  if (breathing) drawFlameJet(renderer, transformPoint(head, [0, .01, .79]), position[0], attack);
  if (spinning) drawVortex(renderer, position, size, heading + spinAngle, attack);
  if (biting && age >= attack.from && age <= attack.until) {
    const mouth = transformPoint(head, [0, .02, .87]);
    const burst = (.41 + .64 * snap) * size;
    renderer.object('star', [mouth[0] + .19 * facing, mouth[1], mouth[2] + .27], [burst, burst, .15], ivory, [0, 0, age * 11], 1, .72 * snap);
  }
  if (throwing && !attack.fired && age >= .105) {
    const growth = size * (.52 + .46 * ease((age - .105) / .16));
    drawBomb(renderer, multiply(body, transform([facing * .47, 1.99, .62 + .33 * toss], [growth, growth, growth], [-.16, heading, age * 4])), time);
  }
}

export const projectiles = {
  murenaBomb(renderer, { x, y, vx, scale, remaining }, time) {
    drawBomb(renderer, transform([x, y, .62], [scale, scale, scale], [0, time * 5.5, Math.sign(vx) * remaining * 8]), time);
  },
};
