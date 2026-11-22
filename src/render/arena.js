import { drawCharacter } from './characters.js';
import { TAU, zero } from './math.js';

const rockColors = ['#2d4154', '#394254', '#4b4657', '#34374c', '#575066'];
const buttes = Array.from({ length: 18 }, (_, i) => ({
  x: (i - 9) * 5.8 + Math.sin(i * 19) * 2.6,
  y: -6.5 + Math.sin(i * 2.7) * 2.4,
  z: -14 - (i % 4) * 4,
  size: 1.6 + (Math.sin(i * 8.5) + 1) * 2.3,
  color: rockColors[i % rockColors.length],
}));

export function drawScenery(renderer, time, hero = false) {
  for (const { x, y, z, size, color } of buttes) {
    const offset = hero ? 1.5 : 0;
    renderer.object('rock', [x, y - offset, z], [size * 1.55, size * 2.2, size * 1.25], color, [.11, x, -.2], .54);
    renderer.object('gem', [x + size * .19, y + size * .95 - offset, z], [size * .32, size * .83, size * .4], x > 0 ? '#9b6e77' : '#638b96', [.12, x, .14], .55);
  }
  for (let i = 0; i < 12; i++) {
    const x = (i - 6) * 6.4 + Math.sin(time * .16 + i) * 1.4;
    const y = -6 + Math.sin(i * 13) * 1.1;
    renderer.object('bevel', [x, y, -8 - (i % 5) * 2.2], [9.2, .65, 3.7], i % 2 ? '#6b657e' : '#5c657a', [0, i, 0], .72, .44);
  }
}

export function drawHero(renderer, fighter, time) {
  const [width, height] = renderer.measure();
  renderer.begin(width, height, [5.8, 3.3, 10.6], [-.42, 1.54, 0], .397);
  drawScenery(renderer, time, true);
  renderer.object('rock', [-2.95, -1.65, -2], [3, 2.7, 2.65], '#384459', [.12, .35, .13]);
  renderer.object('rock', [3.55, -1.47, -.85], [2.8, 2.1, 2.7], '#555267', [-.16, -.58, -.29]);
  renderer.object('plate', [0, -.35, 0], [5.2, .66, 4], '#395966', [0, -.06, 0]);
  renderer.object('plate', [0, -.09, 0], [4.35, .19, 3.34], '#789091', [0, -.06, 0]);
  renderer.object('disk', [0, .016, 0], [3.86, .022, 2.96], '#b4b8a2', zero, .13);
  renderer.object('disk', [0, .033, 0], [3.66, .019, 2.79], '#51787b');
  for (let i = 0; i < 10; i++) {
    const angle = i * TAU / 10;
    renderer.object('box', [Math.sin(angle) * 1.78, .049, Math.cos(angle) * 1.36], [.23, .029, .08], i % 2 ? '#eaa66b' : '#c1bc9d', [0, angle, 0], .27);
  }
  for (const side of [-1, 1]) {
    renderer.object('gem', [side * (2.58 + .08 * Math.sin(time * 2)), .14 + .17 * Math.sin(time * 1.4 + side), -.7], [.82, 1.25, .81], side < 0 ? '#5fc9be' : '#dc9b89', [.1, time * .3, side * .48], .27);
    renderer.object('gem', [side * 3.04, -.36, -.3], [.4, .69, .55], side < 0 ? '#85a9c3' : '#fcbb8f', [0, .21, side * .33]);
  }
  renderer.object('disk', [-.12, .045, .05], [1.35, .025, .86], '#193b44', zero, .83, .49);
  drawCharacter(renderer, fighter, [0, .035, .03], time, { heading: .15 + Math.sin(time * .76) * .08, pose: true });
}

export function drawPlatform(renderer, platform) {
  const width = platform.right - platform.left;
  const x = (platform.left + platform.right) / 2;
  const y = platform.y;
  const depth = platform.main ? 5.4 : 2.65;
  const z = platform.main ? 0 : -1.03;
  renderer.object('box', [x, y - .28, z], [width, .4, depth], '#435d6b');
  renderer.object('box', [x, y - .083, z], [width, .166, depth - .14], '#708989');
  renderer.object('box', [x, y - .205, z + depth / 2], [width, .11, .13], '#e0ae68', zero, .33);
  renderer.object('box', [x, y - .052, z - depth * .37], [width - .25, .095, .12], '#92b5a7');
  for (let segment = 1; segment < Math.ceil(width / 2); segment++) {
    renderer.object('box', [platform.left + segment * 1.93, y - .006, z + .17], [.045, .019, depth * .83], '#4e686e');
  }
  for (const edge of [platform.left + .36, platform.right - .36]) {
    renderer.object('box', [edge, y - .39, z + depth / 2], [.48, .116, .23], '#71e0c7', zero, .84);
    renderer.object('box', [edge, y + .014, z + depth * .31], [.42, .034, .2], '#e4bd77', [0, .46, 0], .25);
  }
  if (platform.main) {
    renderer.object('rock', [x, -2.46, -.08], [width * .83, 4.4, 5.16], '#33445a');
    for (let i = 0; i < 5; i++) {
      const gap = (i - 2) * 3.35;
      renderer.object('bevel', [x + gap, -1.03, 2.23], [2.43, 1.04, 1.57], '#394d5e', [0, 0, gap * -.024]);
      renderer.object('box', [x + gap, -.88, 3], [1.35, .13, .13], i === 2 ? '#ffbe79' : '#5d8b93', zero, .42);
    }
    renderer.object('gem', [0, -3.42, 2.56], [2.17, 2.52, 1.55], '#508e99', [.27, .8, -.27], .28);
    renderer.object('gem', [1.41, -2.75, 2.15], [1.02, 1.53, 1.12], '#7fc7b1', [.55, -.2, -.37], .53);
  } else {
    renderer.object('plate', [x, y - .58, z], [width * .72, .55, depth * .76], '#314859');
    renderer.object('box', [x, y - .62, z + depth * .361], [width * .33, .11, .12], '#67a5a6', zero, .37);
  }
}
