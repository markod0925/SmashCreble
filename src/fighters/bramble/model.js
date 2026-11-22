import { zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { buildStandardRig, drawStandard } from '../standard-model.js';

const p = { main: '#8ba953', shade: '#515e37', trim: '#e4ad5f', light: '#d9ef87', dark: '#46372d', face: '#262921' };
const details = [
  part('gem', [0, 1.66, .446], [.47, .44, .22], p.trim, zero, .1),
  part('leaf', [-.48, 2.36, -.01], [.32, .63, .31], p.shade, [0, -.18, .93]),
  part('leaf', [.49, 2.37, -.01], [.36, .72, .31], p.light, [0, .23, -.87]),
  part('leaf', [-.29, 2.71, .02], [.43, .94, .24], p.light, [0, -.42, .57]),
  part('leaf', [.29, 2.68, -.19], [.5, .76, .29], p.main, [.34, .3, -.6]),
  part('leaf', [0, 2.83, -.26], [.42, .96, .31], p.shade, [-.49, 0, -.11]),
  part('gem', [.56, 1.72, -.29], [.48, .6, .55], p.main, [0, 0, -.63]),
  part('leaf', [-.43, 1.74, -.36], [.49, 1.02, .29], p.shade, [0, .25, .66]),
];
const rig = buildStandardRig(p, details, { forest: true });

export function draw(renderer, fighter, position, time, options) {
  drawStandard(rig, renderer, fighter, position, time, options);
}
