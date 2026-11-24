import { clamp } from '../math.js';

export const rules = { stocks: 3, duration: 180, gravity: 31, step: 1 / 120 };

export const platformCenter = ({ left, right }) => (left + right) / 2;

export const platformHeight = (platform, x) => platform.y + (x - platformCenter(platform)) * platform.slope;

function platformPose(layout, arena) {
  const [dx, dy] = layout.motion?.(arena.environment, arena.elapsed) ?? [0, 0];
  const angle = layout.rotation?.(arena.elapsed) ?? 0;
  const width = layout.right - layout.left;
  const x = platformCenter(layout) + dx;
  const halfSpan = width * Math.cos(angle) / 2;
  return { left: x - halfSpan, right: x + halfSpan, y: layout.y + dy, width, angle, slope: Math.tan(angle) };
}

function savePlatformPose(platform) {
  const { left, right, y, slope } = platform;
  Object.assign(platform, { previousLeft: left, previousRight: right, previousY: y, previousSlope: slope });
}

export function createArena(definition) {
  const arena = { definition, elapsed: 0, environment: definition.environment?.(0) };
  arena.platforms = definition.platforms.map((layout) => {
    const platform = { id: layout.id, main: layout.main, ...platformPose(layout, arena) };
    savePlatformPose(platform);
    return platform;
  });
  return arena;
}

export function advanceArena(arena, dt) {
  arena.elapsed += dt;
  arena.environment = arena.definition.environment?.(arena.elapsed);
  arena.definition.platforms.forEach((layout, i) => {
    const platform = arena.platforms[i];
    if (!layout.motion && !layout.rotation) return;
    savePlatformPose(platform);
    Object.assign(platform, platformPose(layout, arena));
  });
}

export function carryRider(player) {
  const platform = player.grounded;
  if (!platform) return;
  const { left, right, previousLeft, previousRight } = platform;
  const offset = (player.x - previousLeft) / (previousRight - previousLeft);
  player.x += (left - previousLeft) * (1 - offset) + (right - previousRight) * offset;
  player.y = platformHeight(platform, player.x);
}

export function crossedPlatform(arena, from, to) {
  let surface = null;
  let earliest = Infinity;
  for (const platform of arena.platforms) {
    const { left, right, y, slope, previousLeft, previousRight, previousY, previousSlope } = platform;
    const before = from.y - previousY - (from.x - (previousLeft + previousRight) / 2) * previousSlope;
    const after = to.y - platformHeight(platform, to.x);
    if (before < 0 || after > 0 || after > before) continue;
    const progress = before === after ? 0 : before / (before - after);
    if (progress >= earliest || to.x < platform.left || to.x > platform.right) continue;
    if (left !== previousLeft || right !== previousRight || y !== previousY || slope !== previousSlope) {
      // Check the overlap at impact so a lift moving in from the side cannot catch a fighter late.
      const leftGap = (from.x - previousLeft) * (1 - progress) + (to.x - left) * progress;
      const rightGap = (previousRight - from.x) * (1 - progress) + (right - to.x) * progress;
      if (leftGap < 0 || rightGap < 0) continue;
    }
    surface = platform;
    earliest = progress;
  }
  return surface;
}

export function leavePlatform(player) {
  const platform = player.grounded;
  if (!platform) return;
  if (platform.slope) player.y = platformHeight(platform, clamp(player.x, platform.left, platform.right));
  if (player.x < platform.left || player.x > platform.right) {
    player.grounded = null;
    player.jumps = Math.min(player.jumps, player.fighter.airJumps ?? 1);
  }
}
