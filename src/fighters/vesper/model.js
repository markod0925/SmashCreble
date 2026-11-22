import { zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { buildStandardRig, drawStandard } from '../standard-model.js';

const p = { main: '#9f7bcc', shade: '#63538a', trim: '#ef935e', light: '#e5d2fa', dark: '#33304f', face: '#231f36' };
const details = [
  part('leaf', [-.33, 2.66, -.08], [.33, .87, .38], p.main, [.3, 0, .32]),
  part('leaf', [.33, 2.66, -.08], [.33, .87, .38], p.main, [.3, 0, -.32]),
  part('bevel', [0, 1.98, .15], [.95, .235, .85], p.trim),
  part('leaf', [.49, 1.72, -.39], [.41, 1.24, .18], p.trim, [.36, -.18, .89]),
  part('leaf', [.59, 1.46, -.52], [.23, .8, .12], '#c45e58', [.58, -.18, .92]),
  part('box', [0, 2.31, .478], [.39, .046, .041], p.trim, zero, .75),
];
const rig = buildStandardRig(p, details, { wide: .87 });

export function draw(renderer, fighter, position, time, options) {
  drawStandard(rig, renderer, fighter, position, time, options);
}

export const portrait = { heading: -.24 };
