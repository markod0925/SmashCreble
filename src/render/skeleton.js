import { zero } from './math.js';

const ivory = '#e3f6ff';
const shadow = '#241e47';

function bone(renderer, [ax, ay], [bx, by], z, width, glow) {
  const angle = Math.atan2(by - ay, bx - ax);
  renderer.object('bevel', [(ax + bx) * .5, (ay + by) * .5, z], [Math.hypot(bx - ax, by - ay) + width * .3, width, width * .8],
    ivory, [0, 0, angle], glow);
}

function skull(renderer, x, y, z, width, size, glow) {
  renderer.object('bevel', [x, y, z], [width, .59 * size, .36 * size], ivory, zero, glow);
  renderer.object('bevel', [x, y - .264 * size, z + .061 * size], [width * .68, .242 * size, .259 * size], '#c8edff', zero, glow);
  for (const side of [-1, 1]) {
    renderer.object('bevel', [x + side * width * .227, y + .001 * size, z + .183 * size],
      [width * .257, .181 * size, .076 * size], shadow, [0, 0, side * .14], .3);
  }
  renderer.object('gem', [x, y - .118 * size, z + .198 * size], [.082 * size, .101 * size, .042 * size], shadow, zero, .32);
  for (const offset of [-.13, 0, .13]) {
    renderer.object('box', [x + offset * width, y - .273 * size, z + .207 * size], [.027 * size, .112 * size, .031 * size],
      shadow, zero, .29);
  }
}

function quadruped(renderer, x, y, z, size, facing, glow) {
  bone(renderer, [x - 1.02 * size, y + 1.43 * size], [x + 1.02 * size, y + 1.43 * size], z, .117 * size, glow);
  for (let i = 0; i < 4; i++) {
    const ribX = x + (i - 1.5) * .254 * size;
    bone(renderer, [ribX, y + 1.46 * size], [ribX, y + 1.045 * size], z + .12, .104 * size, glow);
    const legX = x + ([-.85, -.51, .49, .84][i] * size);
    bone(renderer, [legX, y + 1.2 * size], [legX - .07 * size, y + .64 * size], z, .111 * size, glow);
    bone(renderer, [legX - .07 * size, y + .6 * size], [legX + .055 * size, y + .207 * size], z + .022, .096 * size, glow);
  }
  bone(renderer, [x + facing * .7 * size, y + 1.43 * size], [x + facing * 1.18 * size, y + 2.04 * size], z, .141 * size, glow);
  skull(renderer, x + facing * 1.24 * size, y + 2.15 * size, z + .077, .71 * size, size, glow);
  bone(renderer, [x + facing * 1.27 * size, y + 2.43 * size], [x + facing * 1.53 * size, y + 2.81 * size], z, .099 * size, glow);
}

function upright(renderer, x, y, z, fighter, size, shiver, glow) {
  const floating = fighter.id === 'nuvol';
  const short = floating || fighter.id === 'packman' || fighter.id === 'bomm';
  const torsoX = x + shiver * .079 * size;
  const hip = short ? .67 : .87;
  const neck = short ? 1.58 : 2.14;
  const shoulder = (short ? .52 : .57) * size;
  skull(renderer, torsoX, y + (neck + .46) * size, z + .078, (short ? .85 : .72) * size, size, glow);
  bone(renderer, [x, y + hip * size], [torsoX, y + neck * size], z, .129 * size, glow);
  for (let i = 0; i < 4; i++) {
    const rib = neck - .18 - i * (short ? .128 : .194);
    const sweep = (.39 - Math.abs(i - 1.25) * .048) * size;
    for (const side of [-1, 1]) {
      bone(renderer, [torsoX, y + (rib - .07) * size],
        [torsoX + side * sweep, y + rib * size], z + .13, .091 * size, glow);
    }
  }
  bone(renderer, [x - shoulder * .53, y + hip * size], [x + shoulder * .53, y + hip * size], z + .112, .15 * size, glow);
  for (const side of [-1, 1]) {
    const elbow = [torsoX + side * (shoulder + .236 * size), y + (neck - .41) * size];
    bone(renderer, [torsoX + side * shoulder * .45, y + (neck - .115) * size], elbow, z + .113, .114 * size, glow);
    bone(renderer, elbow, [elbow[0] + side * (.067 + shiver * .074) * size, y + (neck - .78) * size], z + .144, .102 * size, glow);
    if (floating) continue;
    const knee = [x + side * (.358 + shiver * .048) * size, y + .49 * size];
    bone(renderer, [x + side * .225 * size, y + hip * size], knee, z + .07, .126 * size, glow);
    bone(renderer, knee, [x + side * .31 * size, y + .164 * size], z + .09, .115 * size, glow);
  }
}

export function drawShockSkeleton(renderer, fighter, [x, y, z], facing, remaining) {
  const size = fighter.size;
  const shiver = Math.sin(remaining * 36);
  const glow = .73 + shiver * .17;
  const horse = fighter.id === 'vi';
  renderer.object('bevel', [x, y + (horse ? 1.36 : 1.51) * size, z + .59],
    [(horse ? 2.92 : 2.13) * size, (horse ? 2.48 : 3.15) * size, .769 * size],
    '#27254e', [0, -.14 * facing, .069 * shiver], .63, .6);
  renderer.object('gem', [x - (.87 + .13 * shiver) * size, y + 1.72 * size, z + .91], [.159, .295, .134],
    '#9dddff', [0, remaining * 16, .46], .99, .73);
  if (horse) quadruped(renderer, x, y, z + .95, size, facing, glow);
  else upright(renderer, x, y, z + .95, fighter, size, shiver, glow);
}
