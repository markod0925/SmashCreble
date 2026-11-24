import { platformCenter } from '../combat/arena.js';
import { zero } from './math.js';

export function drawGdmrScenery(renderer, time) {
  // The two silhouettes share one shoreline behind the continuous fighting surface.
  for (const side of [-1, 1]) {
    const x = side * 11.6;
    renderer.object('rock', [x, -12, -10], [21, 15, 7], '#674747', [0, side * .55, side * .1], .17);
    renderer.object('rock', [x, -8.4, -10], [13.4, 10.5, 6.6], '#856052', [0, side * .7, side * .28], .22);
    renderer.object('bombShell', [x, .7, -11], [13.4, 14.4, 6.8], '#d7c8af', [0, side * .45, side * .13], .42);
    renderer.object('rock', [x - side * 3.1, -2.8, -9.1], [4, 5, 2.4], '#b9a389', [.15, side * .65, side * .51], .28);
  }

  for (let i = 0; i < 3; i++) {
    renderer.object('bombShell', [8.2 + i * 3.15, 6.9 + i * .33, -11.6], [3.7, 4.4, 3.4], '#c3b69f', [0, 0, -.32], .4);
  }

  renderer.object('box', [0, -11.8, -15], [160, .5, 36], '#355b68', zero, .34);
  for (let i = 0; i < 16; i++) {
    const x = (i - 7.5) * 4.3;
    const z = -14 + (i % 5) * 2.8;
    renderer.object('box', [x + .65 * Math.sin(time * .7 + i), -11.52, z], [1.8 + (i % 4) * .8, .024, .19], '#9fc3c3', zero, .59, .46);
  }
}

export function drawGdmrPlatform(renderer, platform) {
  const { y, angle, width } = platform;
  const x = platformCenter(platform);
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const tilt = [0, 0, angle];
  const place = (along, above, z) => [x + along * cos - above * sin, y + along * sin + above * cos, z];
  renderer.object('box', place(0, -.18, 0), [width, .36, 4.6], '#a97961', tilt, .23);
  renderer.object('bevel', place(0, -.62, 0), [width, .58, 4.5], '#513c39', tilt);
  renderer.object('box', place(0, -.25, 2.3), [width, .08, .12], '#dfad7d', tilt, .53);
  for (let i = 1; i < 12; i++) {
    renderer.object('box', place(width * (i / 12 - .5), .008, 0), [.048, .016, 4.42], '#815d4e', tilt);
  }
  renderer.object('tube', [x, y - .12, 2.36], [.76, .28, .76], '#ccac86', [Math.PI / 2, 0, 0], .31);
}
