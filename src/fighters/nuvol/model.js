import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';
import { boltBottom, boltTop } from './thunder.js';

const graphite = '#3d465c';
const slate = '#5a657a';
const gray = '#7b8699';
const dark = '#263349';
const silver = '#b3c5d8';
const glint = '#d9f6ff';
const pulse = phase => Math.sin(Math.PI * clamp(phase, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const puffs = [
  part('bombShell', [-.74, 1.318, -.08], [.973, 1.051, .932], slate, [.03, -.34, -.27]),
  part('bombShell', [.67, 1.4, -.014], [1.233, 1.11, .993], slate, [-.05, .14, .26]),
  part('bombShell', [-.431, 1.921, -.11], [1.201, 1.171, 1.021], gray, [0, .21, -.31]),
  part('bombShell', [.291, 2.081, -.189], [1.362, 1.261, 1.031], gray, [-.13, -.17, .34]),
  part('bombShell', [.482, 1.68, .174], [.973, .995, .819], '#68778d', [0, -.15, -.21]),
  part('bombShell', [-.805, 1.299, .132], [.884, .72, .762], '#4e596d'),
  part('bombShell', [-.215, 1.168, .015], [1.563, .831, 1.02], graphite, [.1, .2, -.07]),
  part('bombShell', [.48, 1.119, .052], [1.228, .814, .958], graphite, [0, -.26, -.145]),
  part('bombShell', [-.114, 1.624, .384], [1.434, 1.087, .758], slate, [-.1, -.11, .19]),
];
const fringe = [
  part('leaf', [-.66, 1.86, .367], [.192, .55, .077], '#929fb2', [.17, -.45, 1.04]),
  part('leaf', [.552, 2.13, .301], [.227, .588, .079], '#9faec3', [0, .55, 1.14]),
];
const eyes = [];
for (const side of [-1, 1]) {
  eyes.push(
    part('bevel', [side * .294, .024, -.016], [.43, .257, .151], dark, [0, side * .23, side * .27]),
    part('bevel', [side * .288, .014, .065], [.272, .133, .044], glint, [0, side * .23, side * .27], .84),
    part('box', [side * .258, .018, .099], [.051, .117, .025], '#3588b7', [0, side * .24, side * .25], .46),
  );
}
const mouth = [
  part('grin', [-.021, .07, .03], [.374, .489, .093], dark, [0, 0, -.12]),
  part('box', [.111, .06, .074], [.11, .034, .037], silver, [0, .13, .274]),
];

export const portrait = { targetY: 1.61, fov: .423, heading: .19 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .3, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const raining = attack?.type === 'nuvolRain';
  const rain = raining ? pulse(age / attack.duration) : 0;
  const hail = attack?.type === 'nuvolHail' ? pulse(age / attack.duration) : 0;
  const ice = attack?.type === 'nuvolFreeze' ? pulse(age / attack.duration) : 0;
  const storm = attack?.summonsThunder;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.35 + (guarding ? .21 : charging ? .13 : 0);
  const bob = Math.sin(time * 5.37) * (.07 + running * .07) - crouch + recover * .08;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading * .69 + hail * facing * .19,
    wobble - facing * (running * .15 + hail * .17 - ice * .083)], attack);
  const shape = multiply(root, transform([0, bob, hail * .137], [1 + rain * .13 + crouch * .21, 1 - crouch * .24 + ice * .12 + rise * .047, 1],
    [.104 * running - recover * .31, 0, pose ? .045 : Math.sin(time * 4) * .036]));
  renderer.parts(puffs, shape, flash);
  renderer.parts(fringe, shape, flash);
  renderer.parts(eyes, joint(shape, [0, 1.566, .724], [ice * .146, hail * -.13, -.07 * rain]), flash);
  renderer.parts(mouth, joint(shape, [hail * .066, 1.239 - rain * .078, .745], [rain * .13, 0, facing * .081]), flash);
  const [x, y, z] = position;
  if (!airborne) renderer.object('disk', [x, y + .052, z - .015], [1.28 * size, .031, .69 * size], '#8293b3', zero, .33, .32);

  if (raining && age >= attack.from - .05 && age < attack.until + .115) {
    const fade = clamp((attack.until + .115 - age) * 10, 0, 1);
    for (let i = 0; i < 13; i++) {
      const fall = ((age - attack.from + .05) * 5.9 + i * .236) % 1;
      const a = (i / 12 - .5) * (2.8 + fall * .78);
      renderer.object('leaf', [x + (a + fall * facing * .22) * size, y + (1.42 - fall * 2.4) * size, z + .47 + i % 3 * .18],
        [(.067 + i % 3 * .021) * size, .47 * size, .064], i % 3 === 0 ? glint : '#79b9ed',
        [Math.PI, 0, -.173 * facing], .83, fade * .77);
    }
  }
  if (ice || storm) {
    const intensity = storm ? .7 + Math.sin(age * 23) * .24 : ice;
    for (let i = 0; i < 4; i++) {
      const angle = age * 9 + i * TAU / 4;
      renderer.object('gem', [x + Math.cos(angle) * (1.02 + intensity * .26) * size, y + (1.56 + Math.sin(angle) * .69) * size, z + .69],
        [.17, .24, .14], '#b7e9ff', [0, angle, -.72], 1, intensity * .84);
    }
  }
  if (attack?.thunderWave?.columns) {
    const progress = clamp((age - attack.thunderWave.startsAt) / attack.warning, 0, 1);
    for (const column of attack.thunderWave.columns) {
      renderer.object('disk', [column, .072, .31], [1.12 + progress * .69, .054, .62], '#89bfff',
        [0, age * 4.1, 0], .95, .42 + progress * .32);
      renderer.object('box', [column, 3.7, .79], [.04 + progress * .082, 7.35, .046], '#8db5ff',
        zero, .98, .31 + progress * .25);
    }
  }
}

function drawHail(renderer, { x, y, index, remaining }, time) {
  const size = [.386, .465, .534][index];
  renderer.object('rock', [x, y, .83 + index * .11], [size, size * .94, size], index % 2 ? '#a7d8f5' : '#c5e6f8',
    [time * 7.3, time * 6.3 + index, remaining * 11], .74);
}

function drawFrostProjectile(renderer, { x, y, vx, remaining }, time) {
  const side = Math.sign(vx);
  renderer.object('gem', [x, y, .87], [.53, .51, .349], '#c7f6ff', [time * 4, time * 8.9, -.43 * side], .95);
  for (let i = 0; i < 4; i++) {
    const phase = time * 9 + i * TAU / 4;
    renderer.object('leaf', [x - side * (.33 + i * .149), y + Math.sin(phase) * .267, .87 + Math.cos(phase) * .178],
      [.154, .48 - i * .039, .102], i % 2 ? '#69bcfd' : '#93e4ff',
      [0, 0, -side * 1.37], .95, clamp(remaining * 3.7, .27, .78));
  }
}

export const projectiles = { nuvolHail: drawHail, nuvolIce: drawFrostProjectile };

function drawArc(renderer, [ax, ay], [bx, by], z, width, color, opacity) {
  const angle = Math.atan2(by - ay, bx - ax);
  renderer.object('box', [(ax + bx) * .5, (ay + by) * .5, z], [Math.hypot(bx - ax, by - ay) + width, width, .074],
    color, [0, 0, angle], 1, opacity);
}

export function drawThunderbolt(renderer, { x, seed, age, lifetime }) {
  const fade = clamp(1 - age / lifetime, 0, 1);
  const count = 13;
  let previous = [x + .26, boltTop];
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const offset = Math.sin(i * 4.9 + seed * 1.59) * (.41 + Math.sin(t * Math.PI) * .21);
    const point = [x + offset, boltTop + t * (boltBottom - boltTop)];
    drawArc(renderer, previous, point, 1.39, .345, '#569dff', .6 * fade);
    drawArc(renderer, previous, point, 1.49, .148, '#dbf8ff', .94 * fade);
    if (i % 3 === 0) {
      const fork = i % 2 ? -1 : 1;
      const elbow = [point[0] + fork * .75, point[1] + .26];
      drawArc(renderer, point, elbow, 1.31, .11, '#abceff', fade * .65);
      drawArc(renderer, elbow, [elbow[0] + fork * .63, elbow[1] - 1.02], 1.31, .079, '#8dbbff', fade * .63);
    }
    previous = point;
  }
}
