const cloudbreakFoundry = {
  id: 'cloudbreak-foundry',
  name: 'Cloudbreak Foundry',
  theme: 'foundry',
  platforms: [
    { id: 'deck', left: -11.5, right: 11.5, y: 0, main: true },
    { id: 'west', left: -10.1, right: -4.1, y: 3.25 },
    { id: 'east', left: 3.6, right: 10.2, y: 2.5 },
    { id: 'upper', left: -2.7, right: 2.7, y: 5.5 },
  ],
  bounds: { side: 19, top: 15, bottom: -9 },
  spawns: [-6, 6, -1.8, 1.8].map((x) => ({ platform: 'deck', x })),
  respawnHeight: 7.8,
  superstar: { x: 0, y: 1.35 },
};

function stormCurrent(time) {
  const phase = time * .95;
  return { left: -5.2, right: 5.2, bottom: .35, top: 6.8, gust: Math.sin(phase), travel: (1 - Math.cos(phase)) * 4.2 };
}

function stormDrift({ x, y }, { left, right, bottom, top, gust }) {
  const edge = Math.min(x - left, right - x, y - bottom, top - y);
  return gust * 4 * Math.max(0, Math.min(1, edge));
}

const stormcoilArray = {
  id: 'stormcoil-array',
  name: 'Stormcoil Array',
  theme: 'storm',
  platforms: [
    { id: 'deck', left: -10.8, right: 10.8, y: .35, main: true },
    { id: 'west-lift', left: -8.9, right: -4.1, y: 3.6, motion: ({ gust }) => [gust * 1.35, gust * 1.15] },
    { id: 'east-lift', left: 4.1, right: 8.9, y: 3.6, motion: ({ gust }) => [gust * 1.35, -gust * 1.15] },
    { id: 'bridge', left: -2.15, right: 2.15, y: 5.05 },
  ],
  bounds: { side: 18.5, top: 15.5, bottom: -9.5 },
  spawns: [-7.4, 7.4, -2.6, 2.6].map((x) => ({ platform: 'deck', x })),
  respawnHeight: 7.6,
  superstar: { x: 0, y: 1.7 },
  camera: { height: 8.5, distance: 31.5, targetY: 2.5 },
  environment: stormCurrent,
  airDrift: stormDrift,
};

const gdmr = {
  id: 'gdmr',
  name: 'GDMR',
  theme: 'gdmr',
  platforms: [
    { id: 'deck', left: -13, right: 13, y: 0, main: true, rotation: (time) => -Math.PI / 6 * Math.cos(time * Math.PI / 4) },
  ],
  bounds: { side: 19, top: 17, bottom: -13 },
  spawns: [-6, 6, -1.8, 1.8].map((x) => ({ platform: 'deck', x })),
  respawnHeight: 7.8,
  superstar: { x: 0, y: 1.35 },
  rivalClonesOnSuper: 2,
  camera: { height: 5, distance: 32, targetY: 1.4, fov: .68 },
};

export const arenas = [cloudbreakFoundry, stormcoilArray, gdmr];
export const defaultArena = cloudbreakFoundry;
