export const floor = (id, left, right, y = 0) => ({ id, left, right, y, main: true });
export const ledge = (id, left, right, y) => ({ id, left, right, y });

export function campaignArena(level, module) {
  const arrival = level.platforms[0];
  const center = (arrival.left + arrival.right) / 2;
  const spawns = level.spawns ?? [-8, -10, -6, -12];
  return {
    id: level.id, name: level.name, theme: 'adventure', platforms: level.platforms, spikes: [],
    bounds: { side: level.exit + 8, top: 23, bottom: -5, ...level.bounds },
    spawns: spawns.map((x) => ({ platform: arrival.id, x: x - center, facing: 1 })),
    respawnHeight: 0,
    camera: { height: 6.4, distance: 22, targetY: 1.9, fov: .65, ...level.camera },
    environment: level.environment,
    airDrift: level.airDrift && ((position, environment, arena, player) =>
      level.airDrift(position, environment, arena, player) * (module === 'wind-stabilizer' && player.team === 'party' ? .55 : 1)),
  };
}
