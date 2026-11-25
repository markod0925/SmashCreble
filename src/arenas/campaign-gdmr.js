import { approach, clamp } from '../math.js';
import { campaignObjectHit } from '../combat/campaign.js';
import { platformCenter, platformHeight } from '../combat/arena.js';
import { drawGdmrBalance, drawGdmrLoad } from '../render/campaign-gdmr.js';
import { floor, ledge } from './campaign-layout.js';

const balance = {
  ...ledge('balance', 3, 25, 1.75),
  rotation: (_, arena) => arena?.campaign?.state.angle ?? 0,
};
const loadingRail = {
  ...ledge('rail', 6, 25, 1.22),
  rotation: () => -.085,
};
const dockingAngle = -.07;

function setupBalance(match) {
  const { state } = match.adventure.campaign;
  const deck = match.arena.platforms.find(({ id }) => id === balance.id);
  const x = platformCenter(deck) - 1;
  state.deck = deck;
  state.angle = 0;
  state.weight = { x, y: platformHeight(deck, x) + .8, targetX: x, hitHeight: .75 };
}

function advanceBalance(match, players, dt) {
  const { state, opened } = match.adventure.campaign;
  const { weight, deck } = state;
  if (!opened && campaignObjectHit(match, players, weight)) {
    weight.targetX = Math.min(balance.right - 2, weight.targetX + 4.5);
  }
  weight.x = approach(weight.x, weight.targetX, 10 * dt);
  weight.y = platformHeight(deck, weight.x) + .8;
  const center = platformCenter(deck);
  const halfSpan = (balance.right - balance.left) / 2;
  const offset = (x) => (x - center) / halfSpan;
  let torque = offset(weight.x) * 1.25;
  for (const player of players) {
    if (player.grounded === deck) torque += offset(player.x) * player.fighter.weight;
  }
  const targetAngle = opened ? dockingAngle : -.145 * clamp(torque, -1, 1);
  state.angle = approach(state.angle, targetAngle, .62 * dt);
}

function isDocked(match) {
  return match.adventure.campaign.state.deck.angle <= dockingAngle;
}

function updateLoadHeight(match) {
  const rail = match.arena.platforms.find(({ id }) => id === loadingRail.id);
  const { objective } = match.adventure.campaign;
  objective.y = platformHeight(rail, objective.x) + .76;
}

export const gdmrLevels = [
  {
    id: 'gdmr-giant-balance',
    name: 'The Giant Balance',
    introduction: 'Jump onto the balance. Stand on the right or hit the weight to lower that end.',
    platforms: [floor('arrival', -15, 39), ledge('step', -1, 4.5, .85), balance],
    lights: [-2, 4, 9], gate: 28, exit: 35, exitPrompt: 'The balance is ready. Go right!',
    checkpoint: { platform: 'arrival', x: 29 },
    objective: {
      type: 'reach', x: 22, y: .85, minY: 0, radius: 2.6, marker: false,
      ready: isDocked, prompt: 'Move to the right end', waitingPrompt: 'Tip the balance right',
    },
    setup: setupBalance,
    advance: advanceBalance,
    draw: drawGdmrBalance,
  },
  {
    id: 'gdmr-sliding-load',
    name: 'The Sliding Load',
    introduction: 'Hit the round weight until it settles in the catch. Jump over the sentry when it lights up.',
    platforms: [floor('arrival', -15, 41), ledge('step', 2, 6.5, .85), loadingRail],
    lights: [0, 5, 9], gate: 29, exit: 36,
    checkpoint: { platform: 'arrival', x: 30 },
    objective: {
      type: 'crate', x: 9, y: 2.5, stop: 23, push: 4.8, hitHeight: .75, marker: false,
      prompt: 'Hit the weight toward the catch',
    },
    guard: { type: 'sentry', x: 26, left: 17, right: 27, speed: 4 },
    setup: updateLoadHeight,
    advance: updateLoadHeight,
    draw: drawGdmrLoad,
  },
  {
    id: 'gdmr-bridge-keeper',
    name: 'The Bridge Keeper',
    introduction: 'Tip the balance right. Hit the bridge lock when the keeper rests.',
    platforms: [
      floor('arrival', -15, 29), ledge('step', 0, 4.5, .85), balance,
      ledge('walkway-step', 5.5, 10, 2.35), ledge('walkway', 11, 21.5, 3.85), floor('far-bank', 34, 49),
    ],
    lights: [-1, 5, 10], gate: 28, exit: 43,
    bridge: floor('bridge', 28.75, 34.25), checkpoint: { platform: 'far-bank', x: 40 },
    objective: {
      type: 'switch', x: 23.1, y: 1.3, prompt: 'Hit the bridge lock!',
      waitingPrompt: 'Tip right and wait for the keeper',
      ready: (match) => isDocked(match) && match.adventure.campaign.guard.phase === 'rest',
    },
    guard: { type: 'keeper', x: 16 },
    setup: setupBalance,
    advance: advanceBalance,
    draw: drawGdmrBalance,
  },
];
