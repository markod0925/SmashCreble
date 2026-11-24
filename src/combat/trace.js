import { strike } from './hits.js';
import { bodyCenter, combatants } from './state.js';
import { clamp, direction } from '../math.js';
import { traceDigits, tracePosition } from '../fighters/packman/path.js';

export function startTrace(player, match) {
  const attack = player.attack;
  const { center, layout, cue, afterglow, colors } = attack.trace67;
  const origin = [player.x, player.y + center];
  const tracePath = layout ? layout(origin, match.arena, attack.facing) : { digits: traceDigits };
  attack.origin = origin;
  attack.tracePath = tracePath;
  attack.traceDirection = [attack.facing, 0];
  attack.strikingStrokes = tracePath.leadIn ? [tracePath.leadIn, ...tracePath.digits] : tracePath.digits;
  player.vx = 0;
  player.vy = 0;
  player.grounded = null;
  match.events.push({ type: cue, tracePath, afterglow, colors, duration: attack.duration, startedAt: match.time });
}

function strikeAlongTrace(player, attack, match, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const travel = dx * dx + dy * dy;
  for (const target of combatants(match)) {
    if (target.slot === player.slot || attack.victims.has(target)) continue;
    const center = target.y + bodyCenter(target, match);
    const t = travel > 0 ? clamp(((target.x - ax) * dx + (center - ay) * dy) / travel, 0, 1) : 0;
    const gapX = target.x - ax - dx * t;
    const gapY = center - ay - dy * t;
    if (Math.hypot(gapX, gapY) > attack.trace67.radius) continue;
    const hit = { ...attack.trace67.hit, x: direction(gapX, player.facing) };
    if (strike(player, target, hit, match)) attack.victims.add(target);
  }
}

export function advanceTrace(player, attack, match, dt) {
  const [x, y] = tracePosition(attack.age, attack.origin, attack.tracePath);
  const dx = x - player.x;
  const dy = y - player.y - attack.trace67.center;
  if (dx || dy) attack.traceDirection = [dx, dy];
  if (Math.abs(dx) > .012) player.facing = Math.sign(dx);
  player.x = x;
  player.y = y - attack.trace67.center;

  for (const { start, end } of attack.strikingStrokes) {
    const from = Math.max(start, attack.age - dt);
    const to = Math.min(end, attack.age);
    if (from > to) continue;
    strikeAlongTrace(player, attack, match, tracePosition(from, attack.origin, attack.tracePath), tracePosition(to, attack.origin, attack.tracePath));
  }
}
