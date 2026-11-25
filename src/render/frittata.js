import { platformCenter } from '../combat/arena.js';
import { zero } from './math.js';

const mountainLayers = [
  { z: -35, base: -14, speed: 1.6, spacing: 11.4, color: '#889ab2', count: 12 },
  { z: -22, base: -12, speed: 3.2, spacing: 9.4, color: '#926b65', count: 12 },
];

export function drawFrittataScenery(renderer, { elapsed }) {
  for (const { z, base, speed, spacing, color, count } of mountainLayers) {
    const span = spacing * count;
    const scroll = elapsed * speed % span;
    for (let i = 0; i < count; i++) {
      const x = (i * spacing + span - scroll) % span - span / 2;
      const peak = base + 10 + (1 + Math.sin(i * 2.1 + z)) * 6;
      const foot = base - 12;
      renderer.object('horn', [x, (peak + foot) / 2, z + Math.cos(i) * 2.4], [spacing * 2.4, peak - foot, 8],
        color, [0, i * .85, (i % 3 - 1) * .12], .45);
    }
  }
}

function drawWing(renderer, platform, angle, side, warning) {
  const x = platformCenter(platform);
  const { y, width } = platform;
  const hingeHeight = .49;
  const hingeZ = -1.2;
  const halfDepth = 3.9;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const rotation = [angle, 0, 0];
  const place = (along, height, depth) => [x + along, y + hingeHeight + (height - hingeHeight) * cos - depth * sin,
    hingeZ + (height - hingeHeight) * sin + depth * cos];
  const center = halfDepth * side / 2;
  renderer.object('box', place(0, -.27, center), [width, .54, halfDepth], '#a8373d', rotation, .2);
  renderer.object('box', place(0, -.07, center), [width - .18, .14, halfDepth - .14], '#d1544d', rotation, .25);
  renderer.object('box', place(0, -.34, halfDepth * side), [width - .45, .14, .14], '#f7a871', rotation, .56);
  for (let i = -5; i <= 5; i++) {
    const along = i * width / 12;
    renderer.object('box', place(along, .006, center), [.045, .02, halfDepth * .96], '#853238', rotation);
  }
  for (const along of [-.39, -.13, .13, .39]) {
    renderer.object('box', place(along * width, -.19, side * (halfDepth + .04)), [.75, .16, .11],
      warning ? '#ffc15c' : '#e57959', rotation, .28 + warning * .7);
  }
}

export function drawFrittataPlatform(renderer, platform, { environment, elapsed }) {
  const x = platformCenter(platform);
  const { y, width } = platform;
  const warning = environment.warning * (.65 + .35 * Math.sin(elapsed * 31));
  drawWing(renderer, platform, 0, 1, warning);
  drawWing(renderer, platform, Math.PI * environment.fold, -1, warning);
  renderer.object('tube', [x, y + .49, -1.2], [.35, width, .35], '#713941', [0, 0, Math.PI / 2], .26);
  for (const offset of [-.33, .33]) {
    const engineX = x + offset * width;
    renderer.object('bevel', [engineX, y - .77, .8], [3.1, .83, 2.8], '#65363c');
    renderer.object('box', [engineX, y - .83, 2.21], [2.24, .15, .08], '#ffc08a', zero, .58);
  }
}
