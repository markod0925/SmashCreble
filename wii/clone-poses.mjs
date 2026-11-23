import { fighters, signatureAttacks } from '../src/fighters/index.js';

export const cloneRoster = fighters.filter(({ moves }) =>
  moves && Object.values(moves).some((move) => signatureAttacks[move]?.summonsClones));

export const clonePoses = [
  { name: 'idle', time: 0, options: {} },
  { name: 'stepA', time: Math.PI / 30, options: { running: 1 } },
  { name: 'stepB', time: 3 * Math.PI / 30, options: { running: 1 } },
  { name: 'air', time: 0, options: { airborne: true } },
];

export function clonePoseIndex(id, facing, airborne, running, time) {
  const fighter = cloneRoster.findIndex((entry) => entry.id === id);
  if (fighter < 0) return -1;
  const pose = airborne ? 3 : running < .2 ? 0 : Math.sin(time * 15) >= 0 ? 1 : 2;
  return (fighter * 2 + Number(facing > 0)) * clonePoses.length + pose;
}
