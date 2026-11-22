import { clamp } from '../../math.js';

export const traceCenter = 1.14;
export const traceDuration = 3.03;
export const traceAfterglow = .64;

function digit(points, start, end) {
  let length = 0;
  const segments = points.slice(1).map((to, index) => {
    const from = points[index];
    const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const segment = { from, to, offset: length, distance };
    length += distance;
    return segment;
  });
  return { start, end, length, segments, first: points[0], last: points.at(-1) };
}

export const traceDigits = [
  digit([[-1.33, 6.83], [-2.64, 6.96], [-3.98, 6.52], [-5.05, 5.56], [-5.56, 4.38], [-5.7, 3.23],
    [-5.58, 2.2], [-4.99, 1.47], [-4.01, 1.26], [-2.91, 1.4], [-1.98, 1.88], [-1.61, 2.64],
    [-1.88, 3.37], [-2.62, 3.82], [-3.65, 3.94], [-4.61, 3.74], [-5.7, 3.23]], .32, 1.56),
  digit([[.23, 6.87], [5.56, 6.87], [2.29, 1.43]], 1.79, 2.62),
];

export function traceDistance(stroke, age) {
  return stroke.length * clamp((age - stroke.start) / (stroke.end - stroke.start), 0, 1);
}

export function interpolate([ax, ay], [bx, by], t) {
  return [ax + (bx - ax) * t, ay + (by - ay) * t];
}

function approach(from, to, progress) {
  return interpolate(from, to, progress * progress * (3 - 2 * progress));
}

export function tracePosition(age, origin) {
  const [six, seven] = traceDigits;
  if (age < six.start) return approach(origin, six.first, age / six.start);
  if (age > seven.end) return seven.last;
  if (age > six.end && age < seven.start) {
    return approach(six.last, seven.first, (age - six.end) / (seven.start - six.end));
  }
  const stroke = age <= six.end ? six : seven;
  const distance = traceDistance(stroke, age);
  const segment = stroke.segments.find(({ offset, distance: length }) => distance <= offset + length);
  return segment ? interpolate(segment.from, segment.to, (distance - segment.offset) / segment.distance) : stroke.last;
}
