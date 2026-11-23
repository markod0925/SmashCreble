import { shapes } from '../src/render/geometry.js';

export const cameraEye = [0, 9, 36];
export const cameraTarget = [0, 2.4, 0];
const cameraDirection = cameraEye.map((value, axis) => value - cameraTarget[axis]);
const flatShapes = new Set(['box', 'grin', 'leaf']);

function signedArea(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function hull(points) {
  const half = (ordered) => {
    const result = [];
    for (const point of ordered) {
      while (result.length >= 2 && signedArea(result.at(-2), result.at(-1), point) <= 1e-9) result.pop();
      result.push(point);
    }
    return result.slice(0, -1);
  };
  const ordered = [...points].sort(([x, y], [u, v]) => x - u || y - v);
  return [...half(ordered), ...half(ordered.reverse())];
}

function makeProxy(name, source, axis, facing) {
  if (name === 'rainbow') return source;
  const horizontal = (axis + 1) % 3;
  const vertical = (axis + 2) % 3;
  const projected = new Map();
  let front = -Infinity;
  for (let i = 0; i < source.length; i += 6) {
    const point = [source[i + horizontal], source[i + vertical], source[i + axis] * facing];
    const key = point.slice(0, 2).map((value) => Math.round(value * 1e7)).join(',');
    if (!projected.has(key) || projected.get(key)[2] < point[2]) projected.set(key, point);
    front = Math.max(front, point[2]);
  }

  const outline = hull(projected.values());
  const maxCorners = name === 'banana' ? 10 : name === 'bombShell' ? 8 : 4;
  while (outline.length > maxCorners) {
    let smallest = Infinity, cut = 0;
    for (const [i, point] of outline.entries()) {
      const area = signedArea(outline.at(i - 1), point, outline[(i + 1) % outline.length]);
      if (area < smallest) {
        smallest = area;
        cut = i;
      }
    }
    outline.splice(cut, 1);
  }
  // For edge-on planes, retain the source geometry. These models already have very few faces.
  if (outline.length < 3) return source;

  const position = ([x, y, depth]) => {
    const p = [];
    p[horizontal] = x;
    p[vertical] = y;
    p[axis] = depth * facing;
    return p;
  };
  const vertices = [];
  const triangle = (first, second, third) => {
    const a = position(first), b = position(facing > 0 ? second : third), c = position(facing > 0 ? third : second);
    const [ux, uy, uz] = b.map((value, i) => value - a[i]);
    const [vx, vy, vz] = c.map((value, i) => value - a[i]);
    const normal = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const length = Math.hypot(...normal);
    if (length > 0) for (const p of [a, b, c]) vertices.push(...p, ...normal.map((value) => value / length));
  };
  if (flatShapes.has(name)) {
    for (let i = 1; i < outline.length - 1; i++) triangle(outline[0], outline[i], outline[i + 1]);
  } else {
    const center = [0, 0, front];
    for (const [x, y] of outline) {
      center[0] += x / outline.length;
      center[1] += y / outline.length;
    }
    outline.forEach((point, i) => triangle(center, point, outline[(i + 1) % outline.length]));
  }
  return vertices.length ? vertices : source;
}

export const modelDetail = Object.fromEntries(Object.entries(shapes).map(([name, source]) => [
  name, [0, 1, 2].flatMap((axis) => [-1, 1].map((facing) => makeProxy(name, source, axis, facing))),
]));

// Keep this axis and sign selection in step with Fight::Engine::mesh.
export function modelShape(name, matrix) {
  let best = -1, view = 0;
  for (let axis = 0; axis < 3; axis++) {
    const [x, y, z] = matrix.slice(axis * 4, axis * 4 + 3);
    const dot = x * cameraDirection[0] + y * cameraDirection[1] + z * cameraDirection[2];
    const length = x * x + y * y + z * z;
    const score = length > 0 ? dot * dot / length : -1;
    if (score > best) {
      best = score;
      view = axis * 2 + Number(dot >= 0);
    }
  }
  return modelDetail[name][view];
}
