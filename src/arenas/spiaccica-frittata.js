import { clamp, smoothStep } from '../math.js';

const interval = 15;
const warningTime = 1;
const closingTime = .3;
const closedTime = .16;
const reopeningTime = .4;

function foldingState(time) {
  const cycle = Math.floor((time + 1e-9) / interval);
  const sinceImpact = Math.max(0, time - cycle * interval);
  const untilImpact = interval - sinceImpact;
  const warning = clamp(1 - untilImpact / warningTime, 0, 1);
  const closing = clamp(1 - untilImpact / closingTime, 0, 1);
  const reopening = cycle ? clamp(1 - (sinceImpact - closedTime) / reopeningTime, 0, 1) : 0;
  return { cycle, untilImpact, warning, fold: smoothStep(Math.max(closing, reopening)) };
}

export const spiaccicaFrittata = {
  id: 'spiaccica-frittata',
  name: 'Spiaccica Frittata',
  theme: 'frittata',
  platforms: [{ id: 'deck', left: -12.75, right: 12.75, y: 0, main: true }],
  bounds: { side: 19, top: 17, bottom: -11 },
  spawns: [-6, 6, -1.8, 1.8].map((x) => ({ platform: 'deck', x })),
  respawnHeight: 7.8,
  superstar: { x: 0, y: 1.35 },
  camera: { height: 7.5, distance: 32, targetY: 2.5, fov: .68 },
  environment: foldingState,
  deckCrush: { damage: 12, clearance: 1, duration: .48 },
};
