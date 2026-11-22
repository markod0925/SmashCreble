import { transform, zero } from './math.js';

export function part(shape, position, size, color, rotation = zero, glow = 0) {
  return { shape, matrix: transform(position, size, rotation), color, glow };
}
