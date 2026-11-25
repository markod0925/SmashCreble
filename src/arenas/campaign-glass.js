import { clamp, smoothStep } from '../math.js';
import { campaignImpact, disableCampaignPlatform } from '../combat/campaign.js';
import { drawGlassGardens } from '../render/campaign-glass.js';
import { floor, ledge } from './campaign-layout.js';

const bedY = -2.2;
const glass = (left, right) => ({ ...floor('glass-panel', left, right), visual: false });
const crackedFloor = glass(11.45, 18.2);
const greenhouseFloor = glass(13.5, 21.3);
const keeperFloor = glass(12.45, 18.65);

function gardenRamp(left, right) {
  const center = (left + right) / 2;
  const halfWidth = Math.hypot(right - left, bedY) / 2;
  return {
    ...floor('garden-ramp', center - halfWidth, center + halfWidth, bedY / 2),
    rotation: () => Math.atan2(bedY, right - left),
  };
}

function setupPanel(match, platform, x) {
  match.adventure.campaign.state.panel = { ...platform, x, broken: false };
}

function breakPanel(match) {
  const { panel } = match.adventure.campaign.state;
  panel.broken = true;
  disableCampaignPlatform(match, panel.id);
  match.events.push({ type: 'break', x: panel.x, y: panel.y, color: '#a2edec' });
}

function panelStep(x, checkpoint) {
  return { type: 'switch', x, y: .8, hitHeight: 1.5, marker: false, prompt: 'Hit the cracked glass!', done: breakPanel, checkpoint };
}

function advanceDrone(match, players, dt) {
  const { drone } = match.adventure.campaign.state;
  if (drone.phase === 'idle' && !players.some(({ x }) => x > drone.left - 6 && x < drone.right + 2)) return;

  drone.time += dt;
  if (drone.phase === 'idle' && drone.time >= .9) {
    const target = players.reduce((nearest, player) => Math.abs(nearest.x - drone.x) <= Math.abs(player.x - drone.x) ? nearest : player);
    drone.lane = target.y > 2.5 ? 'upper' : 'lower';
    drone.phase = 'warning';
    drone.time = 0;
  } else if (drone.phase === 'warning' && drone.time >= 1.55) {
    drone.phase = 'fire';
    drone.time = 0;
    drone.hit.clear();
    match.events.push({ type: 'swing', x: drone.x, y: drone.lane === 'upper' ? 4.55 : 1.1, color: '#f5bc83' });
  } else if (drone.phase === 'fire' && drone.time >= .58) {
    drone.phase = 'rest';
    drone.time = 0;
  } else if (drone.phase === 'rest' && drone.time >= 2.9) {
    drone.phase = 'idle';
    drone.time = 0;
  }

  if (drone.phase !== 'fire') return;
  const laneFootY = drone.lane === 'upper' ? 3.45 : 0;
  for (const player of players) {
    if (drone.hit.has(player) || player.x < drone.left || player.x > drone.right || Math.abs(player.y - laneFootY) > 1.1) continue;
    if (campaignImpact(match, player, drone.x, { damage: 3, force: 2, maxLaunch: 3, lift: 1.5 })) drone.hit.add(player);
  }
}

function advanceKeeper(match, players, dt) {
  const { keeper, panel } = match.adventure.campaign.state;
  if (panel.broken) {
    keeper.y = Math.max(keeper.y - 7 * dt, bedY);
    return;
  }
  if (keeper.phase === 'idle' && !players.some(({ x }) => Math.abs(x - keeper.home) < 12)) return;

  keeper.time += dt;
  if (keeper.phase === 'idle' && keeper.time >= .55) {
    const target = players.reduce((nearest, player) => Math.abs(nearest.x - keeper.home) <= Math.abs(player.x - keeper.home) ? nearest : player);
    keeper.destination = clamp(target.x, panel.left + 1.15, panel.right - 1.15);
    keeper.phase = 'warning';
    keeper.time = 0;
  } else if (keeper.phase === 'warning' && keeper.time >= 1.4) {
    keeper.phase = 'charge';
    keeper.time = 0;
    keeper.hit.clear();
    match.events.push({ type: 'swing', x: keeper.x, y: 1.15, color: '#dad7ff' });
  } else if (keeper.phase === 'charge' && keeper.time >= .72) {
    keeper.x = keeper.destination;
    keeper.phase = 'rest';
    keeper.time = 0;
  } else if (keeper.phase === 'rest' && keeper.time >= 4.2) {
    keeper.phase = 'return';
    keeper.time = 0;
  } else if (keeper.phase === 'return' && keeper.time >= .9) {
    keeper.x = keeper.home;
    keeper.phase = 'idle';
    keeper.time = 0;
  }

  if (keeper.phase === 'return') {
    keeper.x = keeper.destination + (keeper.home - keeper.destination) * smoothStep(clamp(keeper.time / .9, 0, 1));
  }
  if (keeper.phase !== 'charge') return;
  keeper.x = keeper.home + (keeper.destination - keeper.home) * smoothStep(clamp(keeper.time / .72, 0, 1));
  for (const player of players) {
    if (keeper.hit.has(player) || Math.abs(player.x - keeper.x) > 1.25 || Math.abs(player.y) > 1.1) continue;
    if (campaignImpact(match, player, keeper.x, { damage: 4, force: 2.8, maxLaunch: 4, lift: 1.75 })) keeper.hit.add(player);
  }
}

export const glassLevels = [
  {
    id: 'glass-cracked-floor', name: 'The Cracked Floor', act: 'glass',
    introduction: 'Hit the cracked glass. The garden bed will catch you.',
    platforms: [floor('arrival', -15, 11.6), crackedFloor,
      gardenRamp(18.05, 22.5), floor('garden-bed', 10.65, 33, bedY)],
    lights: [-3, 3.5, 9, { x: 21.5, y: bedY }], gate: 24, gateY: bedY, exit: 28.75, exitY: bedY,
    exitPrompt: 'Follow the lower path!',
    checkpoint: { platform: 'garden-bed', x: 20.75 },
    steps: [panelStep(13.25)],
    setup(match) { setupPanel(match, crackedFloor, 13.25); },
    draw: drawGlassGardens,
  },
  {
    id: 'glass-drone-greenhouse', name: 'The Drone Greenhouse', act: 'glass',
    introduction: 'Change height when the drone marks a lane. Break the glass for a sheltered path.',
    platforms: [floor('arrival', -15, 13.7), greenhouseFloor,
      ledge('greenhouse-step', 6.25, 10.2, 1.65), ledge('greenhouse-perch', 10, 22.5, 3.45),
      floor('sheltered-bed', 12.1, 40, bedY)],
    lights: [-2, 4.5, 10.8, { x: 25, y: bedY }], gate: 28.5, gateY: bedY, exit: 35, exitY: bedY,
    exitPrompt: 'Go through the sheltered path!',
    checkpoint: { platform: 'sheltered-bed', x: 22 },
    steps: [panelStep(15.05)],
    setup(match) {
      setupPanel(match, greenhouseFloor, 15.05);
      match.adventure.campaign.state.drone = { x: 23.5, left: 9.25, right: 25.5, lane: 'lower', phase: 'idle', time: 0, hit: new Set() };
    },
    advance: advanceDrone,
    draw: drawGlassGardens,
  },
  {
    id: 'glass-sluice-keeper', name: 'The Sluice Keeper', act: 'glass',
    introduction: 'Wait for the keeper to charge onto the glass. Break the glass, then open the sluice.',
    platforms: [floor('arrival', -15, 12.6), keeperFloor, floor('keeper-deck', 18.5, 23.5),
      ledge('keeper-lookout', 6.15, 11.2, 2.3), floor('sluice-bed', 11.5, 44, bedY)],
    lights: [-2, 5, 10], gate: 33.4, gateY: bedY, exit: 38.5, exitY: bedY,
    exitPrompt: 'Follow the water to the exit!',
    checkpoint: { platform: 'sluice-bed', x: 30.5 },
    steps: [
      {
        ...panelStep(14.25, { platform: 'sluice-bed', x: 20 }), gate: 22.75,
        ready: (match) => match.adventure.campaign.state.keeper.phase === 'rest',
        waitingPrompt: 'Wait for the keeper to land on the glass.',
        prompt: 'Hit the glass under the keeper!',
      },
      { type: 'switch', x: 28.15, y: bedY + 1.1, marker: false, prompt: 'Hit the sluice lever!' },
    ],
    setup(match) {
      setupPanel(match, keeperFloor, 14.25);
      match.adventure.campaign.state.keeper = { x: 21.7, home: 21.7, y: 0, phase: 'idle', time: 0, hit: new Set() };
    },
    advance: advanceKeeper,
    draw: drawGlassGardens,
  },
];
