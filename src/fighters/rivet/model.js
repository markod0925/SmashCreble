import { zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { buildStandardRig, drawStandard } from '../standard-model.js';

const p = { main: '#47cdb3', shade: '#218a81', trim: '#ffc967', light: '#b1f9dc', dark: '#243a49', face: '#102933' };
const details = [
  part('plate', [0, 2.61, .025], [1.12, .2, 1], p.shade),
  part('box', [0, 2.68, .245], [.29, .18, .56], p.trim, [-.06, 0, 0]),
  part('bevel', [.49, 2.37, 0], [.19, .33, .43], p.trim),
  part('tube', [.56, 2.71, -.12], [.074, .49, .075], p.dark, [0, 0, -.23]),
  part('gem', [.615, 2.97, -.12], [.14, .15, .14], p.trim, zero, .62),
  part('gem', [0, 1.67, .469], [.32, .34, .1], p.trim, [0, 0, -.18], .22),
  part('box', [-.21, 1.42, .405], [.25, .07, .052], '#f3e1b3'),
  part('bevel', [0, 1.55, -.39], [.55, .73, .53], p.shade),
];
const rig = buildStandardRig(p, details, { powerGlove: true });

export function draw(renderer, fighter, position, time, options) {
  drawStandard(rig, renderer, fighter, position, time, options);
}

export const projectiles = {
  bolt(renderer, { x, y, vx }, time) {
    renderer.object('gem', [x, y, .32], [.84, .65, .62], '#aafdeb', [0, time * 6, Math.PI / 2], .96);
    renderer.object('bevel', [x - Math.sign(vx) * .52, y, .3], [1.26, .25, .33], '#67dccc', zero, .84, .63);
  },
};
