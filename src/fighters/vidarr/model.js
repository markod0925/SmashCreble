import { clamp } from '../../math.js';
import { multiply, one, smoothStep, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const green = '#4dae83';
const mint = '#a3dfaa';
const jade = '#347a67';
const emerald = '#287359';
const purple = '#834fa0';
const lilac = '#ba77b6';
const dusk = '#53375d';
const hair = '#303540';
const skin = '#e5b7a1';
const pulse = t => Math.sin(Math.PI * clamp(t, 0, 1));
const mix = (a, b, t) => a + (b - a) * t;
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.528, -.026], [.92, .783, .653], green),
  part('bevel', [0, 1.48, .248], [.699, .535, .204], '#6fbe94'),
  part('plate', [0, 1.254, .007], [.784, .132, .689], lilac),
  part('gem', [0, 1.257, .38], [.213, .176, .077], '#f0acba', [0, 0, -.065], .46),
  part('tube', [0, 1.963, .01], [.358, .271, .359], skin),
];
for (let i = 0; i < 3; i++) {
  for (const side of [-1, 1]) {
    torso.push(part('box', [side * .13, 1.434 + i * .118, .373], [.161, .042, .025],
      i % 2 ? '#9ed8aa' : dusk, [0, 0, side * -.49]));
  }
}

const gown = [
  part('bevel', [0, .837, -.026], [.898, .867, .663], purple, [.08, 0, 0]),
  part('bevel', [0, .494, -.103], [1.14, .639, .746], purple),
  part('leaf', [0, .561, .348], [.535, .911, .085], lilac, [Math.PI - .071, .03, .107]),
  part('bevel', [0, .27, -.077], [1.15, .286, .742], dusk, [.023, -.025, .032]),
];
for (const [i, x] of [-.43, -.24, -.018, .22, .443].entries()) {
  gown.push(part('leaf', [x, .253 - i % 2 * .045, .297], [.271, .405, .254],
    i % 2 ? '#a766ab' : purple, [Math.PI + .11, x * .28, x * .76]));
}

const head = [
  part('bevel', [0, .369, -.131], [1.035, .927, .742], hair),
  part('bevel', [0, .278, .189], [.763, .759, .543], skin),
  part('bevel', [0, .194, .373], [.591, .349, .184], '#f0c2a9', [-.07, .03, 0]),
  part('bevel', [0, .295, .441], [.138, .111, .096], '#d89a85', [0, .03, -.08]),
  part('bevel', [0, .131, .459], [.157, .137, .039], '#673c52'),
  part('leaf', [.064, .713, .003], [.361, .583, .466], '#4d4354', [.17, -.16, -.63]),
];
for (const side of [-1, 1]) {
  head.push(
    part('leaf', [side * .36, .687, -.086], [.391, .722, .43], hair, [.08, side * .26, -side * .81]),
    part('leaf', [side * .429, .365, -.046], [.334, .593, .398], '#45404d', [Math.PI -.21, side * -.19, side * .37]),
    part('bevel', [side * .155, .369, .411], [.206, .112, .062], '#f3dcc7', [0, side * .29, -side * .19]),
    part('box', [side * .137, .365, .447], [.065, .068, .029], hair, [0, side * .25, -side * .17]),
    part('box', [side * .16, .435, .425], [.224, .042, .04], hair, [0, side * .28, -side * .27]),
  );
}
const arm = [
  part('bevel', [0, -.22, 0], [.234, .543, .281], jade),
  part('bevel', [0, -.483, .046], [.209, .352, .246], '#70bd92'),
  part('plate', [0, -.594, .03], [.239, .111, .271], lilac),
  part('bevel', [0, -.668, .051], [.208, .18, .243], skin),
];

const snakeHead = [
  part('bevel', [.064, .047, 0], [.494, .303, .335], green, [0, 0, -.062]),
  part('bevel', [.241, .037, .019], [.29, .201, .288], '#76cd91'),
  part('box', [.158, .11, .169], [.147, .137, .042], '#357459', [0, 0, -.1]),
  part('bevel', [.193, .108, .196], [.087, .081, .039], '#f0eea4', zero, .71),
  part('box', [.219, .108, .218], [.029, .062, .021], '#253448', zero, .24),
  part('leaf', [.306, -.075, .136], [.067, .138, .064], '#f0efd2', [Math.PI, 0, .04]),
];
const jaw = [
  part('bevel', [.16, -.09, .002], [.394, .109, .278], mint),
  part('box', [.354, -.079, .015], [.14, .021, .048], '#dc777e', zero, .16),
];

function drawSnakeHead(renderer, [x, y, z], angle, scale, bite) {
  const root = transform([x, y, z], [scale, scale, scale], [0, x < 0 ? -.075 : .075, angle]);
  renderer.parts(snakeHead, root, false);
  renderer.parts(jaw, joint(root, [-.031, -.031, 0], [0, 0, -.55 * bite]), false);
}

function strand(renderer, start, end, size, phase, bite, index) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const distance = Math.hypot(dx, dy);
  const length = Math.max(.001, distance);
  const amplitude = Math.min(distance * .33, .6 * size + distance * .031);
  const count = clamp(Math.ceil(distance / .61), 5, 31);
  let previous = start;
  let heading = 0;
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const ripple = Math.sin(t * (distance > 4 ? 8.9 : 4.4) - phase + index * .61) * Math.sin(t * Math.PI) * amplitude;
    const x = start[0] + dx * t - dy * ripple / length;
    const y = start[1] + dy * t + dx * ripple / length;
    const z = mix(start[2], end[2], t);
    const thickness = (.23 - t * .066) * size;
    heading = Math.atan2(y - previous[1], x - previous[0]);
    renderer.object('tube', [(x + previous[0]) * .5, (y + previous[1]) * .5, (z + previous[2]) * .5],
      [thickness, Math.hypot(x - previous[0], y - previous[1]) + thickness * .7, thickness],
      (i + index) % 4 <= 1 ? green : jade, [0, 0, heading - Math.PI / 2], .32);
    previous = [x, y, z];
  }
  drawSnakeHead(renderer, end, heading, size, bite);
}

const hairTips = [[1.24, 2.8], [1.56, 2.1], [1.36, 1.4]];

function drawHair(renderer, [x, y, z], size, time, attack, facing, bob) {
  const age = attack?.age ?? 0;
  const close = attack?.type === 'vidarrBites' ? pulse((age - .026) / .31) : 0;
  const frost = attack?.serpentEnds;
  const extension = frost ? smoothStep(clamp((age - attack.extendsAt) / (attack.biteAt - attack.extendsAt), 0, 1)) *
    (1 - smoothStep(clamp((age - attack.biteUntil) / (attack.duration - attack.biteUntil), 0, 1))) : 0;
  for (const [sideIndex, side] of [-1, 1].entries()) {
    for (const [i, [width, height]] of hairTips.entries()) {
      const index = sideIndex * hairTips.length + i;
      const detached = attack?.fired && side === facing &&
        (attack.type === 'vidarrHeads' && age < .48 || attack.type === 'vidarrCoils' && i < 2 && age < .58);
      const start = [x + side * (.182 + i * .125) * size, y + (2.62 - i * .167 + bob) * size, z - .135];
      if (detached) {
        renderer.object('tube', start, [.177 * size, .4 * size, .174 * size], jade, [0, 0, -side * 1.39], .21);
        continue;
      }
      const reach = width + close * .58 * Number(side === facing);
      const idle = [
        x + side * (reach + Math.sin(time * 4.2 + index) * .11) * size,
        y + (height + bob + Math.cos(time * 4.1 + index * .92) * .148) * size,
        z + .5 + .05 * i,
      ];
      const end = extension ? [mix(idle[0], frost[index][0], extension), mix(idle[1], frost[index][1], extension),
        mix(idle[2], 1.48 + i * .16, extension)] : idle;
      const bite = close + (extension ? .8 * pulse((age - attack.biteAt + .11) / .32) : 0);
      strand(renderer, start, end, size * mix(.83, 1.29, extension), time * 5.4, bite, index);
    }
  }
}

export const portrait = { targetY: 1.74, fov: .5, heading: .14 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .3, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const strike = attack?.type === 'vidarrBites' ? pulse(age / attack.duration) : 0;
  const throwPose = attack?.projectile === 'vidarrHeads' || attack?.projectile === 'vidarrCoils' ? pulse(age / attack.duration) : 0;
  const frost = attack?.freezesRivals;
  const cast = frost ? pulse(age / attack.duration) : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.08 + (guarding ? .19 : charging ? .17 : 0);
  const bob = Math.sin(time * 5) * (.071 + running * .021) - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * strike * .39,
    wobble - facing * (running * .142 + throwPose * .16)]);
  const body = joint(root, [0, bob, throwPose * .09], [.08 * running + strike * .21 - recover * .25, 0, cast * .074]);
  renderer.parts(gown, joint(body, [0, 0, -.015], [.128 * rise + .103 * Math.sin(time * 4), 0, -.085 * running * facing]), flash);
  renderer.parts(torso, body, flash);
  renderer.parts(head, joint(body, [0, 1.98, .014], [-.12 * cast - recover * .34, 0, pose ? -.11 : .07 * Math.sin(time * 5)]), flash);
  for (const side of [-1, 1]) {
    const reach = .35 + cast * .97 + (pose ? .27 : 0);
    const pitch = guarding ? -1.15 : -.36 - side * Math.sin(time * 11) * running * .51 - rise * .36 - throwPose * 1.28 - recover * .98 - cast * 1.09;
    renderer.parts(arm, joint(body, [side * .426, 1.761, .004], [pitch, 0, side * reach]), flash);
  }
  const [x, y, z] = position;
  renderer.object('disk', [x, y + .052, z - .04], [1.0 * size, .039, .68 * size], '#d184a6', [0, time, 0], .62, .43);
  drawHair(renderer, position, size, time, attack, facing, bob);
  if (frost && cast > 0) {
    for (let i = 0; i < 5; i++) {
      const angle = i * TAU / 5 + age * 2.7;
      renderer.object('gem', [x + Math.cos(angle) * 1.07, y + 1.86 + i * .16, z + Math.sin(angle) * .93], [.24, .392, .21],
        '#b8f4f6', [0, angle, -.48], .82, cast * .9);
    }
  }
}

function projectileHead(renderer, { x, y, vx, vy, index, remaining }, time) {
  const z = .76 + index * .13;
  const angle = Math.atan2(vy, vx);
  drawSnakeHead(renderer, [x, y, z], angle, 1.06, .58 + Math.sin(time * 22) * .38);
  renderer.object('leaf', [x - Math.sign(vx) * .53, y - vy * .023, z - .04], [.203, .71, .11],
    '#a8e888', [0, 0, angle - Math.PI / 2], .87, clamp(remaining * 3.4, .25, .67));
}

function projectileCoils(renderer, { x, y, vx }, time) {
  const direction = Math.sign(vx);
  for (const side of [-1, 1]) {
    const index = side > 0 ? 3 : 1;
    strand(renderer, [x - direction * 1.11, y - side * .31, .72],
      [x + direction * .068, y + side * .24, .86 + side * .12], .86, time * 13, .85, index);
  }
}

export const projectiles = { vidarrHeads: projectileHead, vidarrCoils: projectileCoils };

export function drawSerpentBind(renderer, [x, y, z], size, time) {
  const radius = .68 * size;
  const ringPoint = index => {
    const angle = index / 8 * TAU + .21 * Math.sin(time * 8);
    return [x + Math.sin(angle) * radius, y + (.47 + index * .113) * size, z + .18 + Math.cos(angle) * radius];
  };
  const width = .22 * size;
  for (let i = 0; i < 18; i++) {
    const [ax, ay, az] = ringPoint(i);
    const [bx, by, bz] = ringPoint(i + 1);
    renderer.object('bevel', [(ax + bx) * .5, (ay + by) * .5, (az + bz) * .5],
      [Math.hypot(bx - ax, by - ay, bz - az) + width, width, width], i % 3 ? green : emerald,
      [0, -Math.atan2(bz - az, Math.hypot(bx - ax, by - ay)), Math.atan2(by - ay, bx - ax)], .53);
  }
  drawSnakeHead(renderer, ringPoint(16), -.31, .74 * size, .5 + Math.sin(time * 15) * .44);
}

export function drawIce(renderer, [x, y, z], size, remaining) {
  const opacity = clamp(remaining * 2.6, 0, 1);
  renderer.object('bevel', [x, y + 1.53 * size, z + .17], [2.06 * size, 3.22 * size, 1.66 * size],
    '#7fcdf7', [0, -.1, .047], .82, opacity * .34);
  renderer.object('leaf', [x - .64 * size, y + 1.68 * size, z + .92 * size], [.31 * size, 2.37 * size, .13 * size],
    '#d8f8ff', [0, .22, -.084], .96, opacity * .58);
  renderer.object('leaf', [x + .64 * size, y + 1.15 * size, z + .94 * size], [.31 * size, 1.68 * size, .143 * size],
    '#c0f3ff', [0, -.12, .23], .92, opacity * .48);
  for (const [i, offset] of [-.76, -.39, .42, .81].entries()) {
    renderer.object('gem', [x + offset * size, y + (.32 + i % 2 * .18) * size, z + 1.01 * size],
      [.366 * size, (.52 + (i % 2) * .29) * size, .283 * size], i % 2 ? '#8dcffe' : '#b8e9ff',
      [0, i * .36, offset * -.55], .76, opacity * .74);
  }
}
