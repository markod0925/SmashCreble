import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { capsBombs } from './profile.js';

const red = '#df3d47';
const coral = '#ff786b';
const ink = '#452940';
const ivory = '#fff0d6';
const gold = '#ffc15b';
const pulse = value => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = value => smoothStep(clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const shell = [
  part('bombShell', [0, 1.67, 0], [1.35, 2.83, 1.05], red),
  part('bevel', [-.423, 1.926, .251], [.168, 1.14, .142], coral, [-.096, -.43, .083], .15),
  part('bevel', [-.357, 2.583, .211], [.157, .46, .097], '#ff9c83', [.41, -.39, -.36], .18),
  part('bevel', [.458, 1.207, .217], [.17, .673, .135], '#b83148', [.31, .43, -.23]),
];
const glyphs = {
  N: [[0, 0, 0, 1], [0, 1, .73, 0], [.73, 0, .73, 1]],
  U: [[0, 1, 0, .2], [0, .2, .17, 0], [.17, 0, .58, 0], [.58, 0, .73, .2], [.73, .2, .73, 1]],
  R: [[0, 0, 0, 1], [0, 1, .66, 1], [.66, 1, .66, .51], [.66, .51, 0, .51], [.28, .51, .75, 0]],
  O: [[.11, 1, .64, 1], [.64, 1, .75, .8], [.75, .8, .75, .2], [.75, .2, .64, 0],
    [.64, 0, .11, 0], [.11, 0, 0, .2], [0, .2, 0, .8], [0, .8, .11, 1]],
  F: [[0, 0, 0, 1], [0, 1, .72, 1], [0, .55, .55, .55]],
  E: [[0, 0, 0, 1], [0, 1, .72, 1], [0, .52, .55, .52], [0, 0, .72, 0]],
};
const lettering = [...'NUROFEN'].flatMap((letter, index) => glyphs[letter].map(([ax, ay, bx, by]) => {
  const y = .845 + index * .251;
  const depth = .542 - .133 * ((y - 1.67) / .86) ** 2;
  return part('bevel', [(.5 - .5 * (ay + by)) * .284, y + (.5 * (ax + bx) - .365) * .256, depth],
    [.044, Math.hypot((bx - ax) * .256, (by - ay) * .284) + .033, .075], ink, [0, 0, Math.atan2((by - ay) * .284, (bx - ax) * .256)]);
}));
const features = [part('grin', [.022, 2.541, .433], [.213, .247, .067], ink, [0, 0, -.11])];
for (const side of [-1, 1]) {
  features.push(part('bevel', [side * .142, 2.677, .378], [.132, .148, .103], ivory, [0, side * .22, side * .13]),
    part('bevel', [side * .128, 2.678, .432], [.054, .09, .045], ink));
}

const upperArm = [part('tube', [0, -.157, 0], [.089, .398, .099], ink)];
const forearm = [part('tube', [0, -.198, .013], [.089, .438, .096], ink),
  part('bevel', [0, -.404, .028], [.196, .155, .156], '#624050')];
for (const side of [-1, 0, 1]) {
  forearm.push(part('tube', [side * .064, -.486, .025], [.045, .169, .049], '#624050', [0, 0, side * .36]));
}
const leg = [
  part('tube', [0, -.18, 0], [.12, .52, .133], ink),
  part('bevel', [0, -.43, .096], [.283, .21, .473], '#69404e'),
  part('plate', [0, -.497, .121], [.298, .08, .486], '#362535'),
  part('bevel', [0, -.371, .25], [.219, .112, .179], coral),
];

const fuse = [part('plate', [0, .456, 0], [.333, .143, .326], '#c18a71'),
  part('fuse', [0, .49, 0], [.54, .58, .54], '#d0a580')];
const mini = [part('bombShell', zero, one, '#493854'), part('bevel', [-.232, .113, .304], [.168, .219, .091], '#805d79', [.2, -.41, -.45]), ...fuse];
const mega = [part('bombShell', zero, one, '#902d45'),
  part('plate', [0, .177, 0], [.963, .085, .911], gold),
  part('plate', [0, -.149, 0], [.997, .089, .978], '#e76656'),
  part('star', [0, .013, .517], [.29, .29, .078], ivory, [0, 0, .13], .51), ...fuse];
const vitamin = [part('disk', zero, [.63, .138, .63], '#ffac42', [Math.PI / 2, 0, 0], .26),
  part('disk', [0, 0, .071], [.516, .041, .516], '#ffe29e', [Math.PI / 2, 0, 0], .4),
  ...[[-.005, .134, Math.PI / 2], [-.126, .053, .32], [-.126, -.053, -.32], [-.005, -.134, Math.PI / 2]].map(([x, y, angle]) =>
    part('bevel', [x, y, .105], [.047, .135, .021], '#a25240', [0, 0, angle]))];

export function drawCapsBomb(renderer, matrix, large, time) {
  renderer.parts(large ? mega : mini, matrix, false);
  const spark = .21 + .087 * Math.abs(Math.sin(time * 28));
  renderer.mesh('star', multiply(matrix, transform([.18, .702, .041], [spark, spark, spark * .52], [0, time * 4, time * 9])), '#ffdb84', .97);
}

export const portrait = { targetY: 1.63, fov: .46, heading: .13 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .31, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const shooting = attack?.type === 'capsVitamin';
  const shot = shooting ? pulse((age - .025) / .21) : 0;
  const bomb = capsBombs[attack?.projectile];
  const large = attack?.type === 'capsBigBomb';
  const windup = bomb ? pulse(age / attack.from) : 0;
  const toss = bomb ? pulse((age - attack.from + .098) / .33) : 0;
  const slap = attack?.type === 'capsCloneSlap' ? pulse((age - .023) / .251) : 0;
  const summon = attack?.summonsClones ? pulse(age / attack.duration) : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.7) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) : 0;
  const crouch = landing * 1.31 + (guarding ? .23 : charging ? .19 : 0);
  const bob = Math.abs(stride) * .079 + Math.sin(time * 5.2) * .026 - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.13 * shot - .64 * windup + .43 * toss + .56 * slap),
    wobble - facing * (.12 * running + .14 * shot + .21 * toss - .24 * windup)], attack);
  const body = joint(root, [0, bob + .09 * summon, .115 * shot + .17 * toss],
    [.13 * running - .28 * windup + .23 * toss - .29 * recover, 0, Math.sin(age * 36) * .12 * summon]);
  renderer.parts(shell, body, flash);
  renderer.parts(lettering, body, flash);
  renderer.parts(features, body, flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legPitch = airborne ? side * .53 - rise * .54 : stride * side * 1.02;
    renderer.parts(leg, joint(root, [side * .284, .529 - .38 * crouch, -.024],
      [legPitch - .48 * recover - (lead ? .36 * toss : -.21 * windup), 0, side * (.185 + .3 * summon)]), flash);
    const pitch = (guarding ? -1.39 : -.25 - side * stride * .66 - .39 * rise) - .7 * recover - .93 * summon +
      (lead ? -.97 * shot + (large ? .94 : .59) * windup - 1.92 * toss - 1.72 * slap : -.67 * windup + .4 * toss);
    const spread = side * (.52 + (pose ? .65 : 0) + .79 * summon + (lead ? .41 * slap : .41 * windup));
    const arm = joint(body, [side * .574, 1.595, .001], [pitch, side * (.19 + .48 * slap), spread]);
    renderer.parts(upperArm, arm, flash);
    const hand = joint(arm, [0, -.337, .023], [-.47 - .51 * shot - .52 * windup + .47 * slap, 0, -.22 * side]);
    renderer.parts(forearm, hand, flash);
    if (!lead) continue;
    if (bomb && !attack.fired && age >= attack.from * .32) {
      const grip = transformPoint(hand, [0, -.52, .105]);
      const diameter = size * bomb.scale * (.69 + .31 * ease(age / attack.from));
      drawCapsBomb(renderer, transform(grip, [diameter, diameter, diameter], [.13, heading, -.28 * facing]), large, time);
    }
    if (slap > .02 && age >= attack.from && age <= attack.until) {
      const progress = (age - attack.from) / (attack.until - attack.from);
      const [x, y, z] = transformPoint(hand, [0, -.47, .183]);
      const burst = (.35 + progress * 1.12) * size;
      renderer.object('star', [x + .29 * size * facing, y, z + .12], [burst, burst, .28 * size], gold, [0, 0, 6 * progress], 1, 1 - progress);
    }
  }

  if (summon && age < attack.from) {
    for (const [i, offset] of [-2.82, -1.48, 1.48, 2.82].entries()) {
      const progress = ease(age / attack.from);
      const brightness = (.17 + .2 * progress) * size;
      renderer.object('star', [position[0] + offset * progress, position[1] + .91 + .13 * Math.sin(i * 1.4), position[2] + .66],
        [brightness, brightness, .19], i % 2 ? coral : gold, [0, age * 16, age * 7 + i * TAU / 4], .98, .71);
    }
  }
}

function drawFlyingBomb(renderer, { kind, x, y, scale, vx, remaining }, time) {
  const matrix = transform([x, y, .67], [scale, scale, scale], [0, time * 4.3, Math.sign(vx) * remaining * 7.2]);
  drawCapsBomb(renderer, matrix, kind === 'capsMegaBomb', time);
}

export const projectiles = {
  capsMiniBomb: drawFlyingBomb,
  capsMegaBomb: drawFlyingBomb,
  capsVitaminShot(renderer, { x, y, vx, scale }, time) {
    renderer.parts(vitamin, transform([x, y, .7], [scale, scale, scale], [0, .41 * Math.sin(time * 9), time * 7]), false);
    renderer.object('bevel', [x - Math.sign(vx) * .48, y, .59], [.83 * scale, .159 * scale, .134], gold, zero, .87, .48);
  },
};
