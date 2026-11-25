import { platformCenter, platformHeight } from '../combat/arena.js';
import { zero } from './math.js';

const amber = '#ffce78';
const mint = '#8aead1';
const brass = '#aa8163';
const steel = '#444d60';

function drawWeight(renderer, { x, y }, time, settled = false) {
  const color = settled ? mint : amber;
  renderer.object('tube', [x, y, .25], [1.44, 1.42, 1.42], brass, [Math.PI / 2, 0, 0], .26);
  renderer.object('tube', [x, y, .99], [1.15, .12, 1.15], steel, [Math.PI / 2, 0, 0]);
  for (const angle of [-.55, .55]) {
    renderer.object('box', [x, y, 1.06], [.21, .93, .08], color, [0, 0, angle], .42);
  }
  if (!settled) renderer.object('horn', [x, y + 1.46 + Math.sin(time * 4) * .1, .98], [.55, .59, .55], color, [0, 0, Math.PI], .85);
}

export function drawGdmrBalance(renderer, campaign, time, { x, radius }) {
  const { deck, weight } = campaign.state;
  const center = platformCenter(deck);
  if (Math.abs(center - x) > radius + deck.width / 2) return;
  const docked = campaign.opened || deck.angle <= -.07;
  const dockColor = docked ? mint : amber;
  const training = campaign.objective.type === 'reach';
  renderer.object('bevel', [center, .48, -.35], [3.1, 1, 2.4], steel);
  renderer.object('tube', [center, deck.y - .12, 1.32], [1.31, .34, 1.31], brass, [Math.PI / 2, 0, 0], .35);
  for (const socket of [deck.left + .7, deck.right - .7]) {
    renderer.object('box', [socket, .13, 1.24], [1.45, .26, .39], steel);
    renderer.object('bevel', [socket, .33, 1.24], [1.25, .18, .32], dockColor, zero, .55);
  }
  const markerX = training ? campaign.objective.x : deck.right - 2;
  const markerY = platformHeight(deck, markerX);
  for (const offset of [-.75, 0, .75]) {
    const x = markerX + offset;
    renderer.object('box', [x, platformHeight(deck, x) + .036, .85], [.36, .064, .9], dockColor, [0, 0, deck.angle], .63);
  }
  if (training) {
    renderer.object('box', [center, deck.y + .47, -1.52], [deck.width - 1, .12, .15], brass, [0, 0, deck.angle], .22);
    for (const fraction of [-.43, -.22, 0, .22, .43]) {
      const x = center + (deck.right - deck.left) * fraction;
      renderer.object('box', [x, platformHeight(deck, x) + .22, -1.52], [.12, .48, .15], brass, zero, .22);
    }
    if (!campaign.opened) renderer.object('horn', [markerX, markerY + .86, .94], [.37, .49, .37], dockColor, [0, 0, Math.PI], .66);
  }
  drawWeight(renderer, weight, time, campaign.opened || weight.targetX === weight.x && docked);
}

export function drawGdmrLoad(renderer, campaign, time, { x, radius }, arena) {
  const { objective, opened } = campaign;
  if (Math.abs(objective.x - x) > radius + 3 && Math.abs(objective.stop - x) > radius + 3) return;
  const rail = arena.platforms.find(({ id }) => id === 'rail');
  const color = opened ? mint : amber;
  const y = platformHeight(rail, objective.stop);
  renderer.object('bevel', [objective.stop, y + .12, .9], [2.3, .23, .75], steel, [0, 0, rail.angle], .35);
  renderer.object('bevel', [objective.stop + .97, y + .49, .7], [.27, .8, 1.49], color, [0, 0, rail.angle], .53);
  for (const z of [-.55, .92]) {
    renderer.object('box', [platformCenter(rail), rail.y + .043, z], [rail.width, .086, .12], brass, [0, 0, rail.angle], .4);
  }
  drawWeight(renderer, objective, time, opened);
}
