import { drawCharacter } from './characters.js';
import { drawGdmrPlatform, drawGdmrScenery } from './gdmr.js';
import { TAU, zero } from './math.js';

const rockColors = ['#2d4154', '#394254', '#4b4657', '#34374c', '#575066'];
const buttes = Array.from({ length: 18 }, (_, i) => ({
  x: (i - 9) * 5.8 + Math.sin(i * 19) * 2.6,
  y: -6.5 + Math.sin(i * 2.7) * 2.4,
  z: -14 - (i % 4) * 4,
  size: 1.6 + (Math.sin(i * 8.5) + 1) * 2.3,
  color: rockColors[i % rockColors.length],
}));

function drawFoundryScenery(renderer, time, hero = false) {
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
  drawFoundryScenery(renderer, time, true);
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

function drawFoundryPlatform(renderer, platform) {
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
    renderer.object('rock', [x, y - 2.46, -.08], [width * .83, 4.4, 5.16], '#33445a');
    for (let i = 0; i < 5; i++) {
      const gap = (i - 2) * Math.min(3.35, width / 6);
      renderer.object('bevel', [x + gap, y - 1.03, 2.23], [2.43, 1.04, 1.57], '#394d5e', [0, 0, gap * -.024]);
      renderer.object('box', [x + gap, y - .88, 3], [1.35, .13, .13], i === 2 ? '#ffbe79' : '#5d8b93', zero, .42);
    }
    renderer.object('gem', [x, y - 3.42, 2.56], [2.17, 2.52, 1.55], '#508e99', [.27, .8, -.27], .28);
    renderer.object('gem', [x + 1.41, y - 2.75, 2.15], [1.02, 1.53, 1.12], '#7fc7b1', [.55, -.2, -.37], .53);
  } else {
    renderer.object('plate', [x, y - .58, z], [width * .72, .55, depth * .76], '#314859');
    renderer.object('box', [x, y - .62, z + depth * .361], [width * .33, .11, .12], '#67a5a6', zero, .37);
  }
}

function drawStormScenery(renderer, { environment, elapsed }) {
  const { left, right, bottom, top, gust, travel } = environment;
  const intensity = Math.abs(gust);
  for (let i = 0; i < 11; i++) {
    const x = (i - 5) * 4.7;
    const height = 5 + (i * 7 % 5) * 1.8;
    const z = -13 - (i % 3) * 3;
    renderer.object('bevel', [x, height / 2 - 8, z], [2.8, height, 3.4], '#333b61', [0, i, 0], .46);
    renderer.object('gem', [x, height - 7.6, z], [1.1, 2, 1.1], '#7b9fe7', [0, elapsed * .55 + i, 0], .65);
  }
  for (const x of [left, right]) {
    const z = -5.7;
    renderer.object('bevel', [x, (top + bottom) / 2 - 1.2, z], [.64, top - bottom + 2.4, .9], '#4d5481');
    renderer.object('gem', [x, top, z], [1.07, 1.46, 1.07], '#99dcff', [0, elapsed * 1.2, 0], .52 + intensity * .42);
  }
  const width = right - left;
  for (let i = 0; i < 18; i++) {
    const phase = ((i * 2.37 + travel) % width) / width;
    const x = left + phase * width;
    const y = bottom + ((i * 7 % 19) + 1) / 20 * (top - bottom);
    const length = .25 + .83 * intensity;
    const fade = Math.min(1, phase * 9, (1 - phase) * 9);
    renderer.object('bevel', [x, y, -2.6 - (i % 4) * .5], [length, .052, .058], '#a7e6ff', zero, .87,
      fade * (.16 + intensity * .66));
  }
}

function drawStormPlatform(renderer, { left, right, y, main }) {
  const x = (left + right) / 2;
  const width = right - left;
  const depth = main ? 5.2 : 2.75;
  const z = main ? 0 : -.85;
  renderer.object('box', [x, y - .12, z], [width, .24, depth], '#8390b4');
  renderer.object('bevel', [x, y - .48, z], [width, .57, depth], '#3e456b');
  renderer.object('box', [x, y - .28, z + depth * .5], [width * .9, .075, .1], '#8ce1f6', zero, .86);
  renderer.object('plate', [x, y - (main ? 1.6 : .71), z], [width * .78, main ? 2 : .5, depth * .78], '#2c3459');
  for (const edge of [left + width * .1, right - width * .1]) {
    renderer.object('gem', [edge, y - .57, z + depth * .45], [.36, .42, .32], '#b7b0ff', [0, 0, .48], .75);
  }
}

const arenaViews = {
  foundry: { drawScenery: (renderer, arena, time) => drawFoundryScenery(renderer, time), drawPlatform: drawFoundryPlatform },
  storm: { drawScenery: drawStormScenery, drawPlatform: drawStormPlatform },
  gdmr: { drawScenery: (renderer, arena, time) => drawGdmrScenery(renderer, time), drawPlatform: drawGdmrPlatform },
};

export function drawBattleArena(renderer, arena, time) {
  const view = arenaViews[arena.definition.theme] ?? arenaViews.foundry;
  view.drawScenery(renderer, arena, time);
  for (const platform of arena.platforms) view.drawPlatform(renderer, platform);
}
