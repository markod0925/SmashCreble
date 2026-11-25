import { zero } from './math.js';

const metal = '#485674';
const glow = '#8cf1df';
const amber = '#ffcf75';
const danger = '#ff9c7b';

function tower(renderer, x, y, height) {
  renderer.object('bevel', [x, y + height / 2, -2.5], [1, height, .8], metal);
  renderer.object('box', [x, y + 1, -2.02], [.26, height * .5, .09], '#93a4c5', zero, .46);
}

export function drawCoreRelayRoom(renderer, campaign, time, { x, radius }, arena) {
  for (const pos of [1, 15, 31, 49]) {
    if (Math.abs(pos - x) > radius) continue;
    tower(renderer, pos, 0, 4.9);
  }
  if (!campaign.step && Math.abs(x - 5) < radius) {
    for (let i = 0; i < 5; i++) {
      const gustX = (time * (3 + arena.environment.gust) + i * 3.2) % 15 - 1;
      renderer.object('box', [gustX, 1.5 + i * .38, -.4], [1.65, .065, .09], '#c8e5ff', zero, .57, .48);
    }
  }
  if (Math.abs(x - 24) > radius) return;
  const panel = arena.platforms.find(({ id }) => id === 'relay-glass');
  if (panel.inactive) return;
  const center = (panel.left + panel.right) / 2;
  renderer.object('box', [center, panel.y - .1, 0], [panel.width, .2, 3.5], '#91d5d1', zero, .6, .76);
  for (const sign of [-1, 1]) {
    renderer.object('box', [center + sign * .9, panel.y + .025, .85], [2.15, .06, .12], '#e5fff0', [0, sign * .49, 0], .75);
  }
  if (campaign.step === 1) {
    renderer.object('horn', [campaign.objective.x, 2 + Math.sin(time * 4) * .15, .85], [.6, .75, .6], amber, [0, 0, Math.PI], .85);
  }
}

export function drawFinalClimb(renderer, _campaign, _time, { x, radius }, arena) {
  for (const platform of arena.platforms.filter(({ moving }) => moving)) {
    const center = (platform.left + platform.right) / 2;
    if (Math.abs(center - x) > radius) continue;
    renderer.object('box', [center, platform.y - .075, 1.31], [platform.width * .85, .14, .13], glow, zero, .75);
    tower(renderer, center, platform.y - 2.7, 6.8);
  }
  for (const { x: pos, y } of [{ x: 16, y: 2.65 }, { x: 34, y: 5.2 }, { x: 51, y: 7.75 }]) {
    if (Math.abs(pos - x) > radius) continue;
    renderer.object('bevel', [pos, y + 1.42, -2.2], [4, 2.85, .82], '#526180');
    renderer.object('box', [pos, y + 2.93, -1.77], [4, .18, .09], glow, zero, .73);
  }
}

export function drawRegulator(renderer, campaign, time, { x: viewX, radius }, { x, y, radius: pulseRadius }) {
  if (Math.abs(x - viewX) > radius) return;
  const { opened, state } = campaign;
  const phase = opened ? 'rest' : state.pulse.phase;
  const warning = phase === 'warning';
  const active = phase === 'pulse';
  const height = active ? 2 : phase === 'rest' ? 3.1 : 3.8 + Math.sin(time * 4) * .14;
  const color = phase === 'rest' ? glow : warning ? amber : active ? danger : '#acb4d5';
  renderer.object('gem', [x, y + height, -1.5], [3, 3.3, 2.55], metal, [0, time * .65, 0]);
  renderer.object('disk', [x, y + height, -1.4], [4.6, .23, 3.16], color, [0, 0, warning ? .18 : 0], .7);
  renderer.object('gem', [x, y + height, -.06], [1.23, 1.57, .8], color, zero, .85);
  if (!warning && !active) return;
  renderer.object('disk', [x, y + .07, 0], [pulseRadius * 2, .15, 4.1], color, zero, .7, active ? .65 : .36);
  renderer.object('box', [x, y + height + 2.15, .6], [.18, .65, .16], color, zero, .85);
  renderer.object('box', [x, y + height + 1.71, .6], [.18, .16, .16], color, zero, .85);
}
