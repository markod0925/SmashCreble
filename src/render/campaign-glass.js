import { zero } from './math.js';

const frame = '#3f7778';
const plant = '#6ed5a0';
const glass = '#84d8d9';
const warning = '#f7c279';

function targetArrow(renderer, x, y, time) {
  renderer.object('horn', [x, y + Math.sin(time * 4) * .13, .9], [.55, .7, .55], warning, [0, 0, Math.PI], .8);
}

function drawGlassPanel(renderer, panel, ready, time) {
  const { left, right, x, y } = panel;
  const width = right - left;
  const center = (left + right) / 2;
  renderer.object('box', [center, y - .16, 0], [width, .32, 3.9], glass, zero, .35);
  renderer.object('box', [center, y - .11, 1.9], [width, .14, .12], '#c7fcf0', zero, .7);
  for (const edge of [left + .12, right - .12]) {
    renderer.object('box', [edge, y - .04, 0], [.16, .18, 3.91], frame, zero, .4);
  }
  const crack = [[-.8, -1.55], [-.36, -.7], [-.54, -.2], [.14, .38], [-.04, .94], [.65, 1.86]];
  for (let i = 1; i < crack.length; i++) {
    const [x0, z0] = crack[i - 1];
    const [x1, z1] = crack[i];
    renderer.object('box', [x + (x0 + x1) / 2, y + .016, (z0 + z1) / 2],
      [Math.hypot(x1 - x0, z1 - z0), .034, .11], '#265265', [0, -Math.atan2(z1 - z0, x1 - x0), 0], .5);
  }
  renderer.object('bevel', [x, y + .12, 1.28], [.72, .22, .72], ready ? warning : '#c7e3e8', [0, .12, 0], .65);
  if (ready) targetArrow(renderer, x, y + 2.35, time);
}

function drawGreenhouse(renderer, visible) {
  for (const x of [0, 9, 18, 27, 36, 43]) {
    if (!visible(x)) continue;
    renderer.object('box', [x, 2.55, -5.7], [.21, 7.8, .22], frame, zero, .49);
    renderer.object('box', [x + 1.27, 7.05, -5.7], [2.85, .15, .22], frame, [0, 0, .45], .48);
    renderer.object('gem', [x, 6.5, -5.45], [.45, .69, .43], glass, zero, .58);
  }
}

function drawBeds(renderer, arena, visible) {
  for (const { left, right, y, id } of arena.platforms) {
    if (!id.endsWith('bed')) continue;
    for (let x = left + 1; x < right - .6; x += 2.65) {
      if (!visible(x)) continue;
      renderer.object('leaf', [x, y + .38, -1.66], [.58, .85, .49], plant, [0, 0, -.39], .49);
      renderer.object('leaf', [x + .29, y + .31, -1.61], [.46, .66, .44], '#4aab8a', [0, 0, -.82], .45);
      renderer.object('gem', [x - .11, y + .75, -1.65], [.33, .28, .36], '#d9a3e9', zero, .52);
    }
  }
}

function drawDrone(renderer, drone, time) {
  const { x, left, right, lane, phase } = drone;
  const y = 5.3 + Math.sin(time * 2.3) * .21;
  const alert = phase === 'warning' || phase === 'fire';
  const eye = alert ? warning : '#aeeced';
  renderer.object('bevel', [x, y, -.1], [1.57, .85, 1.01], '#617497', [0, .2, 0], .5);
  renderer.object('box', [x - .23, y, .43], [.61, .25, .11], eye, zero, .74);
  renderer.object('box', [x, y + .58, -.1], [1.72, .07, .2], '#befbf7', [0, time * 10, 0], .66);
  for (const offset of [-.69, .69]) {
    renderer.object('tube', [x + offset, y - .32, -.12], [.31, .35, .35], frame, zero, .45);
  }
  if (!alert) return;

  const laneY = lane === 'upper' ? 4.55 : 1.1;
  if (phase === 'fire') {
    renderer.object('box', [(left + right) / 2, laneY, .92], [right - left, .22, .2], '#ffac77', zero, .8, .78);
    return;
  }
  for (let laneX = left + .55; laneX < right; laneX += 1.6) {
    renderer.object('box', [laneX, laneY, .92], [1.02, .12, .16], warning, zero, .68, .75);
  }
  renderer.object('horn', [x, laneY + .85, .95], [.38, .71, .38], warning, [0, 0, Math.PI], .8);
}

function drawKeeper(renderer, keeper, broken) {
  const { x, y, phase, destination, home } = keeper;
  const settled = broken || phase === 'rest';
  const height = y + (settled ? 1.02 : 1.32);
  const light = phase === 'warning' || phase === 'charge' ? warning : '#a2f1da';
  renderer.object('bevel', [x, height, -.16], [2.11, 1.85, 1.59], '#678394', [0, .15, phase === 'charge' ? .31 : 0], .5);
  renderer.object('box', [x - .46, height + .38, .61], [.75, .35, .12], settled ? '#7ca6ad' : light, zero, .68);
  for (const offset of [-.83, .83]) renderer.object('box', [x + offset, y + .24, -.13], [.63, .5, 1.31], frame, zero, .5);
  renderer.object('leaf', [x + .24, height + 1.08, .07], [.56, .62, .47], plant, [0, 0, -.52], .59);
  if (phase !== 'warning' || broken) return;
  const laneStart = Math.min(destination, home);
  for (let laneX = laneStart + .45; laneX < home; laneX += 1.1) {
    renderer.object('box', [laneX, y + .025, .7], [.63, .06, 1.9], warning, zero, .74, .61);
  }
}

function drawSluice(renderer, campaign, time) {
  const lever = campaign.level.steps[1];
  const { x, y } = lever;
  const { opened } = campaign;
  const leverColor = opened ? '#8aebc7' : warning;
  renderer.object('box', [x, y - .8, -.1], [1.38, .53, 1.32], frame, zero, .43);
  renderer.object('tube', [x, y - .27, .27], [.22, 1.03, .22], '#9ebfbd', [0, 0, opened ? -.54 : .52], .53);
  renderer.object('gem', [x + (opened ? .28 : -.28), y + .17, .26], [.56, .51, .55], leverColor, zero, .71);
  if (!opened) {
    targetArrow(renderer, x, y + 1.58, time);
    return;
  }
  renderer.object('box', [x + 5.5, y - .96, -1.64], [10.6, .1, 1.43], '#6ed3e0', zero, .67, .84);
  for (let i = 0; i < 6; i++) {
    const ripple = (time * 1.6 + i * 1.7) % 10;
    renderer.object('box', [x + .4 + ripple, y - .9, -1.65], [.51, .028, .64], '#b9f7f1', zero, .76, .7);
  }
}

export function drawGlassGardens(renderer, campaign, time, { x, radius }, arena) {
  const { panel, drone, keeper } = campaign.state;
  const visible = (worldX) => Math.abs(worldX - x) < radius + 4;
  drawGreenhouse(renderer, visible);
  drawBeds(renderer, arena, visible);
  if (!panel.broken && visible(panel.x)) drawGlassPanel(renderer, panel, !keeper || keeper.phase === 'rest', time);
  if (drone && visible(drone.x)) drawDrone(renderer, drone, time);
  if (keeper && visible(keeper.x)) drawKeeper(renderer, keeper, panel.broken);
  if (keeper && panel.broken && visible(campaign.level.steps[1].x)) drawSluice(renderer, campaign, time);
}
