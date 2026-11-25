import { clamp } from '../math.js';

export const rules = { stocks: 3, duration: 180, gravity: 31, step: 1 / 120 };

export const platformCenter = ({ left, right }) => (left + right) / 2;

export const platformHeight = (platform, x) => platform.y + (x - platformCenter(platform)) * platform.slope;

export function closestFloor({ x, y, grounded }, arena) {
  if (grounded?.main && !grounded.falling && !grounded.inactive) return grounded;
  let nearest;
  let distance = Infinity;
  for (const platform of arena.platforms) {
    if (!platform.main || platform.inactive) continue;
    const edge = clamp(x, platform.left, platform.right);
    const candidate = Math.hypot(x - edge, y - platformHeight(platform, edge));
    if (candidate >= distance) continue;
    nearest = platform;
    distance = candidate;
  }
  return nearest;
}

function platformPose(layout, arena) {
  const [dx, dy] = layout.motion?.(arena.environment, arena.elapsed, arena) ?? [0, 0];
  const angle = layout.rotation?.(arena.elapsed, arena) ?? 0;
  const width = layout.right - layout.left;
  const x = platformCenter(layout) + dx;
  const halfSpan = width * Math.cos(angle) / 2;
  return { left: x - halfSpan, right: x + halfSpan, y: layout.y + dy, width, angle, slope: Math.tan(angle) };
}

function savePlatformPose(platform) {
  const { left, right, y, slope } = platform;
  Object.assign(platform, { previousLeft: left, previousRight: right, previousY: y, previousSlope: slope });
}

export function createPlatform(layout, arena, height = 0) {
  const platform = {
    id: layout.id, main: layout.main, visual: layout.visual,
    moving: Boolean(layout.motion || layout.rotation), ...platformPose(layout, arena),
  };
  platform.y += height;
  savePlatformPose(platform);
  return platform;
}

export function createArena(definition) {
  const arena = { definition, elapsed: 0 };
  arena.environment = definition.environment?.(0, arena);
  arena.platforms = definition.platforms.map((layout) => createPlatform(layout, arena));
  if (definition.platformCycle) arena.platformGeneration = 0;
  arena.walls = definition.platforms.filter(({ wallBase }) => wallBase !== undefined);
  return arena;
}

export function stopAtWall(player, fromX, arena) {
  for (const { left, right, y, wallBase } of arena.walls) {
    if (player.y < wallBase || player.y >= y) continue;
    if (fromX < left && player.x >= left) player.x = left - .01;
    else if (fromX > right && player.x <= right) player.x = right + .01;
    else continue;
    player.vx = 0;
  }
}

function setPlatformHeight(platform, y) {
  savePlatformPose(platform);
  platform.y = y;
}

function advancePlatformCycle(arena, { platformId, interval, warning, transition, enterHeight }) {
  // Snap phase boundaries to the fixed simulation clock despite floating-point accumulation.
  const time = arena.elapsed + 1e-9;
  const generation = Math.max(0, Math.floor((time - warning) / interval));
  const warningAt = (generation + 1) * interval;
  arena.platformWarning = Math.max(0, time - warningAt);
  if (generation === arena.platformGeneration && !arena.fallingPlatform) return;

  const index = arena.definition.platforms.findIndex(({ id }) => id === platformId);
  const layout = arena.definition.platforms[index];
  if (generation !== arena.platformGeneration) {
    arena.fallingPlatform = arena.platforms[index];
    arena.fallingPlatform.falling = true;
    arena.platforms[index] = createPlatform(layout, arena, enterHeight);
    arena.platformGeneration = generation;
  }

  const progress = Math.min(1, (time - (generation * interval + warning)) / transition);
  const exitDistance = layout.y - arena.definition.bounds.bottom + 1;
  setPlatformHeight(arena.platforms[index], layout.y + enterHeight * (1 - progress) ** 2);
  setPlatformHeight(arena.fallingPlatform, layout.y - exitDistance * progress ** 2);
  if (progress === 1) arena.fallingPlatform = null;
}

export function advanceArena(arena, dt) {
  arena.elapsed += dt;
  arena.environment = arena.definition.environment?.(arena.elapsed, arena);
  if (arena.definition.platformCycle) {
    advancePlatformCycle(arena, arena.definition.platformCycle);
    return;
  }
  arena.definition.platforms.forEach((layout, i) => {
    const platform = arena.platforms[i];
    if (platform.inactive || (!layout.motion && !layout.rotation)) return;
    savePlatformPose(platform);
    Object.assign(platform, platformPose(layout, arena));
  });
}

export function carryRider(player) {
  const platform = player.grounded;
  if (!platform || platform.inactive) return;
  const { left, right, previousLeft, previousRight } = platform;
  const offset = (player.x - previousLeft) / (previousRight - previousLeft);
  player.x += (left - previousLeft) * (1 - offset) + (right - previousRight) * offset;
  player.y = platformHeight(platform, player.x);
}

export function crossedPlatform(arena, from, to) {
  let surface = null;
  let earliest = Infinity;
  for (const platform of arena.platforms) {
    if (platform.inactive) continue;
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
