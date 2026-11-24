export { smoothStep } from '../math.js';

export const TAU = Math.PI * 2;
export const sub = (a, b) => a.map((value, i) => value - b[i]);
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const normalize = (a) => a.map((value) => value / Math.hypot(...a));

export function multiply(a, b) {
  const result = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      result[col * 4 + row] = a[row] * b[col * 4] + a[row + 4] * b[col * 4 + 1] + a[row + 8] * b[col * 4 + 2] + a[row + 12] * b[col * 4 + 3];
    }
  }
  return result;
}

export function transform([x, y, z], [sx, sy, sz], [rx, ry, rz]) {
  const [a, b, c] = [Math.cos(rx), Math.cos(ry), Math.cos(rz)];
  const [d, e, f] = [Math.sin(rx), Math.sin(ry), Math.sin(rz)];
  return [
    b * c * sx, b * f * sx, -e * sx, 0,
    (d * e * c - a * f) * sy, (d * e * f + a * c) * sy, d * b * sy, 0,
    (a * e * c + d * f) * sz, (a * e * f - d * c) * sz, a * b * sz, 0,
    x, y, z, 1,
  ];
}

export function transformPoint(matrix, [x, y, z]) {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

export function viewProjection(eye, target, aspect, fov) {
  const z = normalize(sub(eye, target));
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  const view = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
  const f = 1 / Math.tan(fov / 2);
  return multiply([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, -1.002, -1, 0, 0, -0.4, 0], view);
}

export function battleCamera(definition, aspect, shakeX = 0) {
  const { x = 0, height = 7.8, distance = 29.5, targetY = 1.8, fov = .64 } = definition.camera ?? {};
  const horizontalFit = Math.max(1, 1.55 / aspect);
  return {
    eye: [x + shakeX, height, distance * horizontalFit],
    target: [x + shakeX, targetY, 0],
    fov,
  };
}

export const zero = [0, 0, 0];
export const one = [1, 1, 1];
