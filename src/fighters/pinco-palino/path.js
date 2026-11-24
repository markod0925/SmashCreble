import { clamp } from '../../math.js';
import { closestFloor } from '../../combat/arena.js';
import { interpolate, traceDigits, traceStroke } from '../packman/path.js';

export const kickCenter = 1.19;
export const kickDuration = 3.06;

const templatePoints = traceDigits.flatMap(({ points }) => points);
const minX = Math.min(...templatePoints.map(([x]) => x));
const maxX = Math.max(...templatePoints.map(([x]) => x));
const minY = Math.min(...templatePoints.map(([, y]) => y));
const maxY = Math.max(...templatePoints.map(([, y]) => y));
const timings = [[.4, 1.63], [1.87, 2.66]];

export function layoutKickTrace(origin, arena, facing) {
  const [x, y] = origin;
  const deck = arena.definition.theme === 'adventure' ? closestFloor({ x, y: y - kickCenter }, arena) : arena.platforms.find(({ main }) => main);
  const { side, top } = arena.definition.bounds;
  const floor = deck?.y ?? 0;
  const left = Math.max(-side + 1, (deck?.left ?? -side) - 1.4);
  const right = Math.min(side - 1, (deck?.right ?? side) + 1.4);
  const scale = Math.min(.88, (right - left) / (maxX - minX));
  const anchorX = clamp(x + facing * .68, left - minX * scale, right - maxX * scale);
  const anchorY = clamp(y - .62, floor + kickCenter + .18, Math.min(floor + 5, top - 1 - (maxY - minY) * scale));
  const digits = traceDigits.map(({ points }, index) => traceStroke(
    points.map(([px, py]) => [anchorX + scale * px, anchorY + scale * (py - minY)]), ...timings[index],
  ));
  const [six] = digits;
  const middle = interpolate(origin, six.first, .56);
  middle[1] += Math.min(.63, Math.hypot(x - six.first[0], y - six.first[1]) * .11);
  return { digits, leadIn: traceStroke([origin, middle, six.first], 0, six.start) };
}
