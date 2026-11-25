import { draw as drawNuvol } from '../fighters/nuvol/model.js';
import { fighter as nuvol } from '../fighters/nuvol/profile.js';
import { zero } from './math.js';

const steel = '#486681';
const dark = '#243748';
const sky = '#8deaf2';
const brass = '#ffca73';

function drawWindsock(renderer, { x, y }, { direction, gust, warning }, time) {
  const strength = Math.max(gust, warning ? .62 : 0);
  const angle = -direction * (.14 + strength * 1.35) + Math.sin(time * 5 + x) * .09;
  const z = -1.75;
  const mountY = y + 2.6;
  renderer.object('bevel', [x, y + .1, z], [.71, .21, .8], dark, zero, .2);
  renderer.object('box', [x, y + 1.3, z], [.14, 2.6, .14], '#a6b8c9', zero, .37);
  renderer.object('gem', [x, mountY + .05, z], [.3, .3, .3], warning ? brass : sky, zero, .62);
  for (let i = 0; i < 3; i++) {
    const length = .57 + i * .53;
    const offsetX = -Math.sin(angle) * length;
    const offsetY = Math.cos(angle) * length - (1 - strength) * length * .68;
    renderer.object('bevel', [x + offsetX, mountY + offsetY, z],
      [.63 - i * .105, .6, .34 - i * .05], i % 2 === 0 ? '#f0b36e' : '#f8eed2', [0, 0, angle], .42);
  }
}

function drawWind(renderer, environment, visible, time) {
  const { gust, direction, zones, shelters } = environment;
  if (!gust) return;
  for (const { left, right, bottom, top } of zones) {
    if (!visible(left) && !visible(right) && !visible((left + right) / 2)) continue;
    for (let i = 0; i < 11; i++) {
      const travel = (time * .54 + i * .317) % 1;
      const x = left + (right - left) * (direction > 0 ? travel : 1 - travel);
      const y = bottom + .3 + (top - bottom - .6) * ((i * .237) % 1);
      if (shelters.some(({ left, right, y: floor }) => x >= left && x <= right && y >= floor && y < floor + 2.15)) continue;
      const alpha = Math.sin(Math.PI * travel) * gust * .68;
      renderer.object('box', [x, y, -1.42 - (i % 3) * .44], [.8 + (i % 3) * .53, .048, .08], '#c4f5fa', zero, .8, alpha);
    }
  }
}

function drawLift(renderer, layout, platform, held, boarding, time) {
  const { left, right, bottom, top } = layout;
  const z = -1.83;
  const x = (left + right) / 2;
  const railHeight = top - bottom + 1.3;
  const railY = bottom + railHeight / 2 - .37;
  for (const railX of [left + .44, right - .44]) {
    renderer.object('bevel', [railX, railY, z], [.37, railHeight, .39], steel, zero, .23);
    for (const y of [bottom + .18, top + .18]) renderer.object('box', [railX, y, z + .23], [.26, .26, .06], held ? brass : sky, zero, .72);
  }
  renderer.object('box', [x, top + .68, z], [right - left - .82, .22, .31], dark, zero, .2);
  renderer.object('bevel', [x, platform.y - .17, .2], [right - left, .34, 2.75], steel, zero, .31);
  renderer.object('box', [x, platform.y - .07, 1.59], [right - left - .4, .17, .12], held ? brass : sky, zero, .78);
  if (boarding) renderer.object('horn', [x, platform.y + 1.52 + Math.sin(time * 4) * .13, .8],
    [.48, .62, .48], sky, [0, 0, Math.PI], .8);
}

function drawShelter(renderer, { left, right, y }) {
  const x = (left + right) / 2;
  const depth = -2.54;
  const width = right - left;
  for (const postX of [left + .18, right - .18]) {
    renderer.object('bevel', [postX, y + 1.17, depth], [.2, 2.4, .35], steel, zero, .24);
  }
  renderer.object('bevel', [x, y + 2.34, depth], [width, .23, .68], dark, zero, .22);
  renderer.object('box', [x, y + 2.34, depth + .36], [width - .45, .08, .08], '#a8e2f7', zero, .61);
}

function drawPad(renderer, { x, y, radius }, pressed) {
  const tint = pressed ? '#99f9cf' : sky;
  renderer.object('bevel', [x, y + .08, 1.11], [radius * 1.3, .15, 1.22], dark, zero, .35);
  renderer.object('box', [x, y + .17, 1.33], [radius, .065, .75], tint, zero, .73);
  for (const offset of [-.31, .31]) {
    renderer.object('box', [x + offset, y + .21, 1.34], [.1, .035, .48], '#f1fff5', [0, offset > 0 ? -.65 : .65, 0], .82);
  }
}

function drawRescue(renderer, { x, y }, rescued, time) {
  renderer.object('bevel', [x, y + .16, -.8], [3.3, .33, 2.25], dark, zero, .35);
  renderer.object('box', [x, y + .24, .35], [2.95, .09, .07], rescued ? '#9df6c7' : brass, zero, .85);
  if (rescued) return;
  drawNuvol(renderer, nuvol, [x, y + .18, -.73], time, { heading: .22, pose: true });
  for (const offset of [-1.46, 1.46]) {
    renderer.object('bevel', [x + offset, y + 1.27, -.7], [.23, 2.25, .24], steel, zero, .29);
  }
  renderer.object('horn', [x, y + 3.5 + Math.sin(time * 3) * .15, .2], [.63, .74, .63], brass, [0, 0, Math.PI], .82);
}

function drawWinch(renderer, machine, { phase }, time) {
  const { x, floor } = machine;
  const warning = phase === 'warning';
  const exposed = phase === 'repair';
  const pushing = phase === 'push';
  const repaired = phase === 'repaired';
  const lamp = repaired ? '#a5f3c5' : warning || pushing ? brass : sky;
  const lean = exposed ? -.38 : pushing ? .28 : 0;
  renderer.object('bevel', [x, floor + .26, -.85], [2.8, .55, 1.9], dark, zero, .25);
  renderer.object('bevel', [x + (exposed ? .38 : 0), floor + 1.62, -.8], [2.3, 2.51, 1.65], steel, [0, 0, lean], .34);
  renderer.object('disk', [x + (exposed ? .38 : 0), floor + 1.72, .16], [1.5, .3, 1.5], '#728eaa', [Math.PI / 2, 0, 0], .38);
  renderer.object('gem', [x + (exposed ? .38 : 0), floor + 1.72, .36], [.58, .65, .42], lamp, [0, Math.sin(time) * .2, lean], .79);
  if (!warning && !pushing) return;
  renderer.object('box', [x, floor + .035, .4], [5.2, .065, 2.2], pushing ? '#ffc490' : brass, zero, .72, .48);
  for (let i = -1; i <= 1; i++) {
    const offset = i * .62;
    const height = .51 + Math.sin(time * 11 + i) * .12;
    renderer.object('horn', [x + offset, floor + 3.15, -.11], [.25, height, .25], lamp, [0, 0, -offset * .45], .85);
  }
}

export function drawStormcoil(renderer, { state }, time, { x, radius }, arena, layout) {
  const visible = (worldX) => Math.abs(worldX - x) < radius;
  const { environment } = arena;
  drawWind(renderer, environment, visible, time);
  for (const flag of layout.flags) {
    if (visible(flag.x)) drawWindsock(renderer, flag, environment, time);
  }
  for (const shelter of layout.shelters) {
    if (visible((shelter.left + shelter.right) / 2)) drawShelter(renderer, shelter);
  }
  for (const lift of layout.lifts) {
    if (!visible((lift.left + lift.right) / 2)) continue;
    const platform = arena.platforms.find(({ id }) => id === lift.id);
    const runtime = state.lifts[lift.id];
    drawLift(renderer, lift, platform, state.holdPressed && runtime.phase === 'top' && runtime.carriedRider,
      runtime.phase === 'bottom', time);
  }
  if (layout.call && visible(layout.call.x)) drawPad(renderer, layout.call, state.callPressed);
  if (layout.hold && visible(layout.hold.x)) drawPad(renderer, layout.hold, state.holdPressed);
  if (layout.rescue && visible(layout.rescue.x)) drawRescue(renderer, layout.rescue, state.rescued, time);
  if (layout.winch && visible(layout.winch.x)) drawWinch(renderer, layout.winch, state.winch, time);
}
