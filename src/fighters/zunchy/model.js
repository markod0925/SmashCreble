import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const turquoise = '#54bcd6';
const blue = '#458dbf';
const violet = '#ac77d4';
const orchid = '#d8a2ed';
const pink = '#e894ae';
const ink = '#382b48';
const cream = '#fff3df';
const green = '#a4ef96';
const lime = '#dcffbd';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));

const bodyParts = [
  part('bevel', [0, 1.438, .022], [.958, 1.16, .759], turquoise, [.1, 0, 0]),
  part('bevel', [0, 1.844, .007], [.928, .69, .807], '#968bd6', [.17, 0, -.065]),
  part('bevel', [0, 1.64, .335], [.668, .817, .269], '#84ccdf', [.092, 0, 0]),
  part('bevel', [0, 1.544, .478], [.585, .605, .115], '#419f75', [0, 0, .07]),
  part('bevel', [0, 1.547, .533], [.492, .509, .056], '#8fdb83', [0, 0, .07]),
  part('leaf', [0, 1.096, -.258], [.38, .427, .436], blue, [.05, 0, 0]),
];
let previous = [.229, 0];
for (let i = 1; i <= 19; i++) {
  const angle = TAU * 1.65 * i / 19;
  const radius = .23 * (1 - i / 20);
  const next = [radius * Math.cos(angle), radius * Math.sin(angle)];
  const dx = next[0] - previous[0];
  const dy = next[1] - previous[1];
  bodyParts.push(part('bevel', [(next[0] + previous[0]) / 2, 1.547 + (next[1] + previous[1]) / 2, .568],
    [Math.hypot(dx, dy) + .025, .038, .026], '#36724e', [0, 0, Math.atan2(dy, dx)], .12));
  previous = next;
}

const headParts = [
  part('bevel', [0, .215, -.185], [.875, 1.056, .609], violet, [-.19, 0, .065]),
  part('bevel', [0, .438, .167], [.859, .535, .852], orchid, [-.22, 0, .044]),
  part('horn', [0, .587, .547], [.708, .607, .451], '#c48bde', [1.19, 0, .027]),
  part('bevel', [0, .267, .308], [.739, .152, .873], ink, [-.17, 0, 0]),
  part('bevel', [0, .222, .457], [.64, .083, .59], '#b96d99', [-.18, 0, 0]),
];
const lowerJaw = [
  part('bevel', [0, -.061, .264], [.744, .32, .774], violet, [-.21, 0, 0]),
  part('bevel', [0, .073, .275], [.655, .102, .694], '#774a73', [-.17, 0, 0]),
  part('bevel', [.022, .12, .309], [.366, .091, .495], pink, [-.16, 0, .037]),
  part('horn', [0, -.029, .672], [.687, .344, .29], orchid, [1.33, 0, 0]),
];
for (const side of [-1, 1]) {
  headParts.push(
    part('bevel', [side * .426, .445, .154], [.117, .296, .286], '#b875d0', [.19, side * .05, 0]),
    part('bevel', [side * .484, .464, .191], [.047, .194, .176], ink, [.24, side * .05, 0]),
    part('gem', [side * .503, .518, .227], [.031, .057, .054], cream, zero, .58),
  );
  for (let i = 0; i < 4; i++) {
    headParts.push(part('horn', [side * (.321 - i * .024), .183 + .035 * i, .256 + .133 * i],
      [.125, .162 + .023 * i, .114], cream, [Math.PI + .13, 0, -.17 * side]));
    lowerJaw.push(part('horn', [side * (.305 - i * .025), .139 + .024 * i, .23 + .124 * i],
      [.10, .126 + .014 * i, .105], '#f6e2e1', [-.21, 0, .15 * side]));
  }
}

const arm = [
  part('horn', [0, -.258, -.013], [.169, .642, .182], ink, [0, 0, Math.PI]),
  part('bevel', [0, -.506, .034], [.126, .254, .147], '#514063', [-.18, 0, 0]),
  part('gem', [0, -.617, .049], [.144, .165, .135], ink),
];
const thigh = [
  part('bevel', [0, -.203, .007], [.365, .596, .407], turquoise),
  part('plate', [0, -.357, .005], [.404, .101, .441], pink, [0, 0, -.12]),
];
const shin = [
  part('bevel', [0, -.171, .022], [.337, .518, .361], turquoise),
  part('bevel', [0, -.454, .118], [.377, .179, .477], blue, [-.16, 0, 0]),
  part('bevel', [0, -.427, .245], [.303, .117, .215], '#80d9e5', [-.12, 0, 0]),
  part('plate', [0, -.073, .016], [.377, .106, .399], pink, [0, 0, .13]),
  part('plate', [0, -.295, .031], [.377, .101, .393], '#f5a1ba', [0, 0, -.15]),
];
const bomb = [
  part('bombShell', zero, one, '#4774ad'),
  part('plate', [0, .101, 0], [.999, .083, .999], '#80c3ee'),
  part('plate', [0, .473, 0], [.388, .147, .385], '#6d8bb8'),
  part('fuse', [0, .511, 0], [.47, .44, .47], '#aebae1'),
  part('gem', [0, .028, .509], [.373, .439, .126], '#253956'),
  part('star', [0, .026, .582], [.306, .341, .08], '#ffe178', [0, 0, .14], .77),
];

function drawBomb(renderer, matrix, time) {
  renderer.parts(bomb, matrix, false);
  const spark = .186 + .125 * Math.abs(Math.sin(time * 29));
  renderer.mesh('star', multiply(matrix, transform([.166, .683, .052], [spark, spark, .55 * spark], [0, time * 4, time * 9])), cream, .96);
}

export function drawStompCracks(renderer, [x, y, z], size, attack) {
  const progress = (attack.age - attack.from) / .36;
  if (progress < 0 || progress >= 1) return;
  const fade = 1 - progress;
  const radius = size * (1.06 + 1.53 * ease(progress * 3));
  for (let i = 0; i < 8; i++) {
    const angle = TAU * i / 8 + .19;
    const width = (.57 + .15 * Math.sin(i * 4.1)) * radius;
    renderer.object('bevel', [x + Math.cos(angle) * radius * .51, y + .052, z + .55 - Math.sin(angle) * radius * .55],
      [width, .079, width * .171], '#393044', [0, angle, 0], .45, .93 * fade);
    renderer.object('bevel', [x + Math.cos(angle + .13) * radius * .77, y + .058, z + .55 - Math.sin(angle + .13) * radius * .78],
      [width * .79, .09, width * .10], '#ecb0ea', [0, angle + .28, 0], .89, .89 * fade);
    renderer.object('gem', [x + Math.cos(angle) * radius, y + (.12 + .64 * pulse(progress)) * size, z + .62 - Math.sin(angle) * radius * .42],
      [.21 * size, .26 * size, .251 * size], i % 2 ? '#a7b9d7' : '#e3c1e5', [angle, progress * 5, angle], .8, fade);
  }
}

function drawSpiralWave(renderer, [x, y, z], facing, size, attack, wide) {
  const progress = (attack.age - attack.from) / (wide ? .42 : attack.until - attack.from);
  if (progress < 0 || progress >= 1) return;
  const radius = (wide ? 1.05 + progress * 4.4 : .37 + progress * .71) * size;
  const reach = wide ? 0 : Math.min(attack.range, progress * (attack.until - attack.from) * attack.waveSpeed * attack.scale);
  for (let i = 0; i < 16; i++) {
    const angle = TAU * i / 16 + progress * 4.3;
    const edge = radius * (.8 + .22 * i / 15);
    const rangeX = wide ? 1.54 : .44;
    renderer.object('leaf', [x + facing * (.16 + reach) + Math.cos(angle) * edge * rangeX, y + 1.52 * size + Math.sin(angle) * edge * (wide ? .58 : 1), z + .93],
      [.115 * size, (wide ? .42 : .32) * size, .13 * size], i % 2 ? green : lime, [0, 0, angle + progress], .94, (1 - progress) * .86);
  }
}

export const portrait = { heading: -.18, targetY: 1.69, fov: .53 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .32, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0, hungry = false } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const hypnotizing = type === 'zunchyHypnosis';
  const shrink = type === 'zunchyShrink';
  const stomping = type === 'zunchyStomp';
  const throwing = type === 'zunchyBombs';
  const swallowing = type === 'zunchyGulp';
  const spell = hypnotizing || shrink ? pulse((age - .027) / (attack.duration - .095)) : 0;
  const raise = stomping ? pulse((age - .012) / attack.from) : 0;
  const impact = stomping ? pulse((age - attack.from + .036) / .248) : 0;
  const windup = throwing ? pulse(age / attack.from) : 0;
  const toss = throwing ? pulse((age - attack.from + .073) / .31) : 0;
  const gulp = swallowing ? ease(age / .075) * ease((attack.swallowAt - age) / .105) : 0;
  const full = swallowing && age >= attack.swallowAt && age < attack.biteAt ? 1 : 0;
  const spit = swallowing ? pulse((age - attack.biteAt + .067) / .23) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.7) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.3, -1, 1) : 0;
  const crouch = landing * 1.39 + (guarding ? .25 : charging ? .19 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.18 * spell - .52 * windup + .36 * toss - .15 * gulp),
    wobble + facing * (-.1 * running - .21 * impact + .22 * raise - .11 * spit)], attack);
  const body = joint(root, [0, Math.abs(stride) * .083 + Math.sin(time * 5) * .035 - crouch - .09 * impact, .136 * gulp + .17 * spit],
    [.16 * running - .25 * spell - .3 * windup + .26 * toss + .24 * gulp + .39 * spit - .25 * recover, 0, .105 * stride]);
  const belly = multiply(body, transform(zero, [1 + full * .21 + .09 * spell, 1, 1 + full * .29], zero));
  renderer.parts(bodyParts, belly, flash);
  if (hungry || spell > .12) {
    const glimmer = .2 + .16 * spell + .105 * Math.sin(time * 14);
    renderer.mesh('star', multiply(belly, transform([.002, 1.547, .612], [glimmer, glimmer, .047], [0, 0, time * 3])), lime, .91);
  }

  const head = joint(body, [0, 2.162 - .11 * impact, .064 + .26 * gulp + .28 * spit],
    [-.24 - .26 * spell - .24 * raise + .12 * impact + .12 * toss - .28 * gulp - .35 * spit, .1 * stride, Math.sin(time * 29) * full * .075]);
  renderer.parts(headParts, head, flash);
  const opening = .26 + .091 * Math.sin(time * 4.2) + .33 * spell + .8 * gulp + .94 * spit + .21 * recover - .27 * full;
  const jaw = joint(head, [0, -.185, -.106], [opening, 0, .07 * full * Math.sin(time * 31)]);
  renderer.parts(lowerJaw, jaw, flash);
  if (spit > .04 && age >= attack.biteAt) {
    const mouth = transformPoint(jaw, [0, .17, .57]);
    for (let i = 0; i < 4; i++) {
      renderer.object('leaf', [mouth[0] + facing * (.23 + i * .21) * size, mouth[1] + (i - 1.5) * .18 * size, mouth[2] + .11],
        [.19 * size, .59 * size, .12 * size], i % 2 ? lime : cream, [0, 0, -facing * (1.53 + (i - 1.5) * .24)], 1, spit);
    }
  }

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const foot = lead ? raise : 0;
    const pitch = airborne ? side * .47 - .62 * rise : side * stride * .97;
    const leg = joint(root, [side * .237, 1.052 - crouch * .65, -.018],
      [pitch - (lead ? foot * 1.98 : -.24 * raise) + .33 * impact - .34 * recover, 0, side * (.16 + .4 * raise + .17 * spell)]);
    renderer.parts(thigh, leg, flash);
    renderer.parts(shin, joint(leg, [0, -.489, .015], [airborne ? .36 + side * .23 : .22 * Math.max(0, -side * stride) + .73 * foot, 0, 0]), flash);

    const armPitch = (guarding ? -1.32 : -.28 - .58 * side * stride - .26 * rise) - .82 * spell - .76 * gulp - 1.09 * spit - .59 * recover + .46 * raise +
      (lead ? .94 * windup - 1.84 * toss : -.48 * windup + .31 * toss);
    const hand = joint(body, [side * .421, 1.748, -.066], [armPitch, side * .17, side * (.62 + (pose ? .57 : 0) + .54 * spell + .27 * toss)]);
    renderer.parts(arm, hand, flash);
    if (lead && throwing && !attack.fired && age >= .066) {
      const grip = transformPoint(hand, [0, -.671, .06]);
      const scale = size * (.43 + .66 * ease((age - .066) / .19));
      drawBomb(renderer, transform(grip, [scale, scale, scale], [.14, heading, age * 3.6]), time);
    }
  }

  if (stomping) drawStompCracks(renderer, position, size, attack);
  if (hypnotizing || shrink) drawSpiralWave(renderer, position, facing, size, attack, shrink);
}

export const projectiles = {
  zunchyBomb(renderer, { x, y, vx, scale, remaining }, time) {
    drawBomb(renderer, transform([x, y, .69], [scale, scale, scale], [0, time * 4.7, Math.sign(vx) * remaining * 7.4]), time);
  },
};
