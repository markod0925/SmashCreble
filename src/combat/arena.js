export const rules = { stocks: 3, duration: 180, gravity: 31, step: 1 / 120 };

export const platformCenter = ({ left, right }) => (left + right) / 2;

function platformOffset(platform, arena) {
  return platform.motion?.(arena.environment, arena.elapsed) ?? [0, 0];
}

export function createArena(definition) {
  const arena = { definition, elapsed: 0, environment: definition.environment?.(0) };
  arena.platforms = definition.platforms.map((platform) => {
    const [dx, dy] = platformOffset(platform, arena);
    const left = platform.left + dx;
    const right = platform.right + dx;
    const y = platform.y + dy;
    return { id: platform.id, main: platform.main, left, right, y, previousLeft: left, previousY: y };
  });
  return arena;
}

export function advanceArena(arena, dt) {
  arena.elapsed += dt;
  arena.environment = arena.definition.environment?.(arena.elapsed);
  arena.definition.platforms.forEach((layout, i) => {
    const platform = arena.platforms[i];
    platform.previousLeft = platform.left;
    platform.previousY = platform.y;
    if (!layout.motion) return;
    const [dx, dy] = platformOffset(layout, arena);
    platform.left = layout.left + dx;
    platform.right = layout.right + dx;
    platform.y = layout.y + dy;
  });
}

export function carryRider(player) {
  const platform = player.grounded;
  if (!platform) return;
  player.x += platform.left - platform.previousLeft;
  player.y = platform.y;
}

export function crossedPlatform(arena, from, to) {
  let surface = null;
  let earliest = Infinity;
  for (const platform of arena.platforms) {
    const before = from.y - platform.previousY;
    const after = to.y - platform.y;
    if (before < 0 || after > 0 || after > before) continue;
    const progress = before === after ? 0 : before / (before - after);
    if (progress >= earliest || to.x < platform.left || to.x > platform.right) continue;
    if (platform.left !== platform.previousLeft || platform.y !== platform.previousY) {
      // Check the overlap at impact so a lift moving in from the side cannot catch a fighter late.
      const offset = (from.x - platform.previousLeft) * (1 - progress) + (to.x - platform.left) * progress;
      if (offset < 0 || offset > platform.right - platform.left) continue;
    }
    surface = platform;
    earliest = progress;
  }
  return surface;
}

export function leavePlatform(player) {
  if (player.grounded && (player.x < player.grounded.left || player.x > player.grounded.right)) {
    player.grounded = null;
    player.jumps = Math.min(player.jumps, player.fighter.airJumps ?? 1);
  }
}
