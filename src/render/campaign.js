import { zero } from './math.js';
import { campaignObjectiveReady } from '../combat/campaign.js';

export function drawCampaign(renderer, match, time, view) {
  const { x: cameraX, radius } = view;
  const { campaign } = match.adventure;
  const { level, objective, opened, guard } = campaign;
  const visible = (x) => Math.abs(x - cameraX) < radius;
  const amber = '#ffc765';
  const green = '#82ebc4';
  for (const light of level.lights ?? []) {
    const { x, y = 0 } = typeof light === 'number' ? { x: light } : light;
    if (!visible(x)) continue;
    renderer.object('box', [x, y + .06, 1.7], [1, .12, .34], amber, zero, .7);
  }

  if (objective && objective.marker !== false && visible(objective.x)) {
    const { x, y, type } = objective;
    const locked = !opened && !campaignObjectiveReady(match);
    const light = opened ? green : locked ? '#b7bbc4' : amber;
    if (type === 'crate') {
      renderer.object('bevel', [objective.stop, y - .57, 0], [2.6, .46, 2.1], '#314752');
      for (const z of [-.85, .85]) renderer.object('box', [objective.stop, y - .32, z], [2.6, .1, .14], light, zero, .65);
      renderer.object('bevel', [x, y, .12], [1.65, 1.55, 1.5], '#a56d42');
      renderer.object('box', [x, y, .89], [.23, 1.3, .08], '#ffda9a', [0, 0, -.68]);
      renderer.object('box', [x, y, .90], [.23, 1.3, .08], '#ffda9a', [0, 0, .68]);
    } else if (type === 'reach') {
      renderer.object('disk', [x, y + .055, .16], [1.5, .09, 1.25], light, zero, .67);
    } else {
      renderer.object('bevel', [x, y - .64, .16], [.9, .9, 1.1], '#43515c');
      renderer.object('gem', [x, y, .4], [1.16, 1.12, .95], light, [0, .35, 0], .69);
    }
    if (!opened && !locked) {
      renderer.object('horn', [x, y + 1.52 + Math.sin(time * 4) * .14, .8], [.58, .67, .58], amber, [0, 0, Math.PI], .85);
    }
  }

  if (guard && visible(guard.x)) drawGuard(renderer, guard, opened);
  level.draw?.(renderer, campaign, time, view, match.arena);
  if (level.bridge && opened) {
    const { left, right, y } = level.bridge;
    renderer.object('box', [(left + right) / 2, y + .025, 0], [right - left, .05, 3.8], '#728696');
  }
  if (!opened || !visible(level.exit)) return;
  const exitY = level.exitHeight ?? level.exitY ?? 0;
  for (const z of [-1.55, 1.55]) renderer.object('bevel', [level.exit, exitY + 1.3, z], [.48, 2.6, .48], green, zero, .45);
  renderer.object('box', [level.exit, exitY + 2.65, 0], [.55, .26, 3.5], green, zero, .65);
}

function drawGuard(renderer, { x, facing, type, phase }, opened) {
  const keeper = type === 'keeper';
  const warning = !opened && phase === 'warning';
  const active = !opened && phase === 'active';
  const resting = opened || phase === 'rest';
  const size = keeper ? 1.5 : 1;
  const light = warning ? '#ffca54' : active ? '#ff8d66' : '#8ed9e7';
  const y = resting ? .8 * size : 1.14 * size;
  renderer.object('bevel', [x, y, -.3], [1.72 * size, 1.47 * size, 1.65 * size], '#566581', [0, 0, active ? -.18 * facing : 0]);
  renderer.object('bevel', [x + facing * .4 * size, y + .25 * size, .63 * size], [.81 * size, .37 * size, .2], light, zero, .55);
  for (const offset of [-.6, .6]) renderer.object('box', [x + offset * size, .25, -.28], [.51 * size, .48, 1.42 * size], '#384251');
  if (!warning && !active) return;
  const laneWidth = keeper ? 5.6 : 4.5;
  const laneX = keeper || active ? x : x + laneWidth * facing / 2;
  renderer.object('box', [laneX, .04, .45], [laneWidth, .08, 2.1], light, zero, .54, .5);
  if (warning) {
    renderer.object('box', [x, y + 1.26 * size, .85], [.21, .63, .2], light, zero, .8);
    renderer.object('box', [x, y + .81 * size, .85], [.21, .18, .2], light, zero, .8);
  }
}
