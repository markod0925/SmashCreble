import { strike } from '../../combat/hits.js';
import { bodyCenter, combatants } from '../../combat/state.js';
import { clamp, direction } from '../../math.js';
import { traceCenter, traceDigits, tracePosition } from './path.js';

export function startTrace(player, match) {
  player.attack.origin = [player.x, player.y + traceCenter];
  player.vx = 0;
  player.vy = 0;
  player.grounded = null;
  match.events.push({ type: 'packmanTrace', startedAt: match.time });
}

function strikeAlongTrace(player, attack, match, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const travel = dx * dx + dy * dy;
  for (const target of combatants(match)) {
    if (target.slot === player.slot || attack.victims.has(target)) continue;
    const center = target.y + bodyCenter(target);
    const t = travel > 0 ? clamp(((target.x - ax) * dx + (center - ay) * dy) / travel, 0, 1) : 0;
    const gapX = target.x - ax - dx * t;
    const gapY = center - ay - dy * t;
    if (Math.hypot(gapX, gapY) > 1.19) continue;
    const hit = { damage: 23, force: 15, x: direction(gapX, player.facing), y: .47, lift: 3.1 };
    if (strike(player, target, hit, match)) attack.victims.add(target);
  }
}

export function advanceTrace(player, attack, match, dt) {
  const [x, y] = tracePosition(attack.age, attack.origin);
  const dx = x - player.x;
  if (Math.abs(dx) > .012) player.facing = Math.sign(dx);
  player.x = x;
  player.y = y - traceCenter;

  for (const { start, end } of traceDigits) {
    const from = Math.max(start, attack.age - dt);
    const to = Math.min(end, attack.age);
    if (from > to) continue;
    strikeAlongTrace(player, attack, match, tracePosition(from, attack.origin), tracePosition(to, attack.origin));
  }
}
