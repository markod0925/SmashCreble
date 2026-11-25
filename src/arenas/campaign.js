import { floor, ledge } from './campaign-layout.js';
import { stormcoilLevels } from './campaign-stormcoil.js';
import { glassLevels } from './campaign-glass.js';
import { gdmrLevels } from './campaign-gdmr.js';
import { regulatorLevels } from './campaign-regulator.js';
import { drawFoundryStartup } from '../render/campaign-cloudbreak.js';

const cloudbreakLevels = [
  {
    id: 'cloudbreak-lights', name: 'The Lights of Cloudbreak',
    introduction: 'Step on the floor switch to turn on the lights. Then hit the yellow switch and walk to the exit.',
    platforms: [floor('arrival', -15, 35), ledge('step', 9, 13, .9), ledge('walkway', 13, 17, 1.65)],
    lights: [-5, -2], gate: 23, exit: 30, exitPrompt: 'Walk through the green door!',
    steps: [
      { type: 'reach', x: 3, y: 0, radius: 1.55, gate: 7, marker: false, prompt: 'Step on the yellow floor switch', checkpoint: { platform: 'arrival', x: 5 } },
      { type: 'switch', x: 19, y: 1.1, prompt: 'Hit the yellow switch!' },
    ],
    checkpoint: { platform: 'arrival', x: 16 },
    draw: drawFoundryStartup,
  },
  {
    id: 'cloudbreak-gate', name: 'The Jammed Gate',
    introduction: 'Hit the crate until it reaches the stop.',
    platforms: [floor('arrival', -15, 40), ledge('step', 6, 10, 1.5), ledge('bypass', 11, 21, 3.55)],
    lights: [0, 7, 11], gate: 28, exit: 35,
    objective: { type: 'crate', x: 13, y: .8, stop: 23, push: 3.5 },
    guard: { type: 'sentry', x: 23, left: 11, right: 26, speed: 5 },
    checkpoint: { platform: 'arrival', x: 25 },
  },
  {
    id: 'cloudbreak-bridge', name: 'The Foundry Bridge',
    introduction: 'Wait for the keeper to rest. Then hit the switch.',
    platforms: [floor('arrival', -15, 28), ledge('step', 5, 9, 1.55), ledge('walkway', 10, 24, 3.7), floor('far-bank', 32, 48)],
    lights: [0, 7, 12], gate: 27, exit: 42,
    objective: { type: 'switch', x: 23, y: 1.15 },
    guard: { type: 'keeper', x: 17 }, bridge: floor('bridge', 27.75, 32.25),
    checkpoint: { platform: 'far-bank', x: 38 },
  },
];

export const campaignActs = [
  ['cloudbreak', 'I', 'Cloudbreak Foundry', 'Cloudbreak is connected again. Stormcoil Array is open!', cloudbreakLevels],
  ['stormcoil', 'II', 'Stormcoil Array', 'The winch is working. The lifts open the path to Glass Gardens!', stormcoilLevels],
  ['glass', 'III', 'Glass Gardens', 'Water is flowing again. The path to GDMR Bridge is open!', glassLevels],
  ['gdmr', 'IV', 'GDMR Bridge', 'The bridge is down. You can reach the Regulator Core!', gdmrLevels],
  ['regulator', 'V', 'The Regulator Core', 'The islands are connected again. Visit the map to replay any level.', regulatorLevels],
].map(([id, numeral, name, clearMessage, levels]) => ({
  id, numeral, name, clearMessage, levels: levels.map((level) => ({ ...level, act: id })),
}));

export const campaignLevels = campaignActs.flatMap(({ levels }) => levels);
