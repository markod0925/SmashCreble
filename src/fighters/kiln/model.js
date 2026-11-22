import { zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { buildStandardRig, drawStandard } from '../standard-model.js';

const p = { main: '#e9874c', shade: '#a34830', trim: '#f4ca73', light: '#ffdf9b', dark: '#4b302e', face: '#312628' };
const details = [
  part('bevel', [0, 2.66, -.04], [.85, .25, .7], p.shade),
  part('tube', [-.46, 2.5, -.28], [.25, .73, .27], p.dark, [0, 0, .17]),
  part('tube', [.42, 2.52, -.33], [.27, .88, .27], p.dark, [0, 0, -.16]),
  part('box', [0, 1.61, .452], [.48, .39, .12], p.face),
];
for (let i = 0; i < 3; i++) details.push(part('box', [(i - 1) * .127, 1.61, .522], [.069, .288, .025], i === 1 ? p.light : p.trim, zero, .93));
const rig = buildStandardRig(p, details, { heavy: true, wide: 1.14 });

export function draw(renderer, fighter, position, time, options) {
  drawStandard(rig, renderer, fighter, position, time, options);
}
