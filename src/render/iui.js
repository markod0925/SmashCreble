import { platformCenter } from '../combat/arena.js';
import { zero } from './math.js';

const timber = ['#a3673e', '#c18b58', '#b67b49'];
const distantPines = Array.from({ length: 30 }, (_, i) => ({
  x: (i - 14.5) * 3.25 + Math.sin(i * 5.2) * 1.2,
  z: -17 - (i % 4) * 3.8,
  height: 5.6 + (i * 7 % 13) * .56,
}));

export function drawIuiScenery(renderer) {
  for (const [i, { x, z, height }] of distantPines.entries()) {
    const y = -13 + Math.sin(i * .24) * 3;
    renderer.object('box', [x, y + height * .32, z], [.45, height * .65, .45], '#4b4642', zero, .42);
    const color = i % 2 ? '#4f6761' : '#57716a';
    renderer.object('horn', [x, y + height * .74, z], [height * .4, height * .65, height * .38], color, zero, .46);
    renderer.object('horn', [x, y + height, z], [height * .34, height * .58, height * .31], color, zero, .46);
  }
}

export function drawIuiPlatform(renderer, platform, arena) {
  const { width, main, falling } = platform;
  const warning = !falling && platform.id === arena.definition.platformCycle.platformId ? arena.platformWarning ?? 0 : 0;
  const shake = Math.min(1, warning * 5);
  const phase = arena.elapsed * 56 + platform.left;
  const x = platformCenter(platform) + Math.sin(phase) * .14 * shake;
  const y = platform.y + Math.cos(phase * 1.06) * .065 * shake;
  const depth = main ? 4.8 : 2.8;
  const z = main ? 0 : -.55;
  renderer.object('bevel', [x, y - .65, z], [width * .99, .72, depth], '#634430');
  for (let i = 0; i < timber.length; i++) {
    const laneZ = z + (i - 1) * depth / timber.length;
    renderer.object('box', [x, y - .15, laneZ], [width, .3, depth / timber.length - .046], timber[i], zero, .12);
  }
  for (let i = 0; i < (main ? 14 : 5); i++) {
    const grainX = x + Math.sin(i * 5.7 + 1) * width * .4;
    const length = width * (.055 + i % 4 * .035);
    const grainZ = z + (i % 7 - 3) * depth * .13;
    renderer.object('box', [grainX, y + .004, grainZ], [length, .011, .04], i % 3 ? '#815335' : '#d3a277', zero, .27);
  }
  for (const offset of [-.36, .36]) {
    const braceX = x + width * offset;
    renderer.object('box', [braceX, y - .56, z], [.36, .89, depth + .12], '#533b32');
    renderer.object('tube', [braceX, y - .33, z + depth * .5 + .056], [.18, .09, .18],
      shake ? '#f8c57f' : '#ad927a', [Math.PI / 2, 0, 0], shake * (.7 + .29 * Math.sin(phase)));
  }
}
