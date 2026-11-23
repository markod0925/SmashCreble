// Bundled at src/render/math.js on Wii.
export * from './math.browser.js';

export function multiply(a, b) {
  return globalThis.wiiMultiply(
    a instanceof Float32Array ? a : Float32Array.from(a),
    b instanceof Float32Array ? b : Float32Array.from(b),
  );
}

export function transform([x, y, z], [sx, sy, sz], [rx, ry, rz]) {
  return globalThis.wiiTransform(x, y, z, sx, sy, sz, rx, ry, rz);
}
