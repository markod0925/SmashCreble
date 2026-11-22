import { TAU, cross, normalize, sub } from './math.js';
import { rainbowHeight } from '../fighters/vi/profile.js';

function triangle(vertices, a, b, c) {
  const normal = normalize(cross(sub(b, a), sub(c, a)));
  for (const vertex of [a, b, c]) vertices.push(...vertex, ...normal);
}

function boxGeometry() {
  const points = [[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
  const vertices = [];
  for (const [a, b, c, d] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]) {
    triangle(vertices, points[a], points[b], points[c]);
    triangle(vertices, points[a], points[c], points[d]);
  }
  return vertices;
}

function prism(sides, rings, angle = Math.PI / 4) {
  const vertices = [];
  const points = rings.map(([y, radius, shift = 0]) => Array.from({ length: sides }, (_, i) => {
    const t = angle + i * TAU / sides;
    return [Math.cos(t) * radius + shift, y, Math.sin(t) * radius];
  }));
  for (let ring = 1; ring < points.length; ring++) {
    const lower = points[ring - 1];
    const upper = points[ring];
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      triangle(vertices, lower[i], upper[i], upper[j]);
      triangle(vertices, lower[i], upper[j], lower[j]);
    }
  }
  for (let i = 1; i < sides - 1; i++) {
    triangle(vertices, points[0][0], points[0][i], points[0][i + 1]);
    const top = points.at(-1);
    triangle(vertices, top[0], top[i + 1], top[i]);
  }
  return vertices;
}

function starGeometry() {
  const vertices = [];
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = i * TAU / 10;
    const radius = i % 2 ? .22 : .5;
    return [-Math.sin(angle) * radius, Math.cos(angle) * radius, 0];
  });
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    triangle(vertices, [0, 0, .28], points[i], points[next]);
    triangle(vertices, [0, 0, -.28], points[next], points[i]);
  }
  return vertices;
}

function scytheGeometry() {
  const vertices = [];
  const edge = [[.23, .1], [.08, .43], [-.23, .62], [-.61, .62], [-.91, .47], [-1.13, .19]];
  const inner = [[.21, .08], [.01, .18], [-.25, .27], [-.54, .33], [-.85, .32], [-1.12, .17]];
  for (const face of [-1, 1]) {
    for (let i = 1; i < edge.length; i++) {
      const a = [...edge[i - 1], 0];
      const b = [...edge[i], 0];
      const c = [...inner[i], face * .075];
      const d = [...inner[i - 1], face * .075];
      if (face > 0) {
        triangle(vertices, a, b, c);
        triangle(vertices, a, c, d);
      } else {
        triangle(vertices, c, b, a);
        triangle(vertices, d, c, a);
      }
    }
  }
  return vertices;
}

function curvedTube(spine, depth = .82) {
  const sides = 8;
  const rings = spine.map(([x, y, radius], i) => {
    const before = spine[Math.max(0, i - 1)];
    const after = spine[Math.min(spine.length - 1, i + 1)];
    const [dx, dy] = normalize([after[0] - before[0], after[1] - before[1]]);
    return Array.from({ length: sides }, (_, j) => {
      const angle = (j + .5) * TAU / sides;
      const offset = radius * Math.cos(angle);
      return [x + dy * offset, y - dx * offset, radius * Math.sin(angle) * depth];
    });
  });
  const vertices = [];
  for (let i = 1; i < rings.length; i++) {
    const lower = rings[i - 1];
    const upper = rings[i];
    for (let j = 0; j < sides; j++) {
      const next = (j + 1) % sides;
      triangle(vertices, lower[j], upper[j], upper[next]);
      triangle(vertices, lower[j], upper[next], lower[next]);
    }
  }
  const first = rings[0];
  const last = rings.at(-1);
  for (let i = 1; i < sides - 1; i++) {
    triangle(vertices, first[0], first[i], first[i + 1]);
    triangle(vertices, last[0], last[i + 1], last[i]);
  }
  return vertices;
}

function grinGeometry() {
  const outline = [[-.5, .08], [-.34, -.025], [-.16, -.066], [.12, -.059], [.34, -.013], [.5, .09],
    [.41, -.128], [.25, -.26], [0, -.31], [-.25, -.258], [-.4, -.14]];
  const vertices = [];
  for (let i = 0; i < outline.length; i++) {
    triangle(vertices, [0, -.151, .105], [...outline[(i + 1) % outline.length], 0], [...outline[i], 0]);
  }
  return vertices;
}

function rainbowStripGeometry() {
  const vertices = [];
  const segments = 22;
  const edge = (i, side) => [i / segments, rainbowHeight({ scale: 1 }, i / segments) + side * .055, 0];
  for (let i = 0; i < segments; i++) {
    triangle(vertices, edge(i, -1), edge(i + 1, -1), edge(i + 1, 1));
    triangle(vertices, edge(i, -1), edge(i + 1, 1), edge(i, 1));
  }
  return vertices;
}

function coffinGeometry() {
  const outline = [[-.31, -.5], [.31, -.5], [.5, .22], [.34, .5], [-.34, .5], [-.5, .22]];
  const front = outline.map(([x, y]) => [x, y, .5]);
  const back = outline.map(([x, y]) => [x, y, -.5]);
  const vertices = [];
  for (let i = 1; i < outline.length - 1; i++) {
    triangle(vertices, front[0], front[i], front[i + 1]);
    triangle(vertices, back[0], back[i + 1], back[i]);
  }
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length;
    triangle(vertices, back[i], back[j], front[j]);
    triangle(vertices, back[i], front[j], front[i]);
  }
  return vertices;
}

export const shapes = {
  box: boxGeometry(),
  bevel: prism(8, [[-.5, .37], [-.33, .51], [.31, .52], [.5, .36]], Math.PI / 8),
  plate: prism(8, [[-.5, .42], [-.25, .53], [.4, .53], [.5, .47]], Math.PI / 8),
  tube: prism(8, [[-.5, .5], [.5, .5]], Math.PI / 8),
  disk: prism(20, [[-.5, .5], [.5, .5]], 0),
  gem: prism(5, [[-.5, .06], [-.18, .53], [.13, .49], [.5, .01, .13]], 0),
  rock: prism(7, [[-.5, .12, -.14], [-.31, .48, -.05], [.31, .58], [.5, .47, -.04]], 0),
  leaf: prism(4, [[-.5, .06], [-.03, .49], [.5, .008, .1]], 0),
  star: starGeometry(),
  scythe: scytheGeometry(),
  banana: curvedTube([[-1.13, -.28, .045], [-.86, -.49, .16], [-.52, -.575, .252], [-.12, -.551, .293], [.27, -.381, .28],
    [.57, -.091, .265], [.72, .25, .221], [.753, .6, .155], [.714, .83, .091]]),
  bananaPeel: curvedTube([[0, 0, .095], [.23, -.205, .151], [.49, -.276, .156], [.73, -.2, .107], [.99, -.02, .016]], .33),
  earCrest: curvedTube([[0, 0, .187], [.043, .179, .159], [.136, .372, .112], [.177, .555, .065], [.127, .731, .013]], .77),
  grin: grinGeometry(),
  horn: prism(7, [[-.5, .5], [-.36, .44], [.05, .25], [.5, .017]], 0),
  rainbow: rainbowStripGeometry(),
  coffin: coffinGeometry(),
  bombShell: prism(12, [[-.5, .09], [-.443, .228], [-.351, .372], [-.206, .46], [0, .51], [.211, .478], [.358, .367], [.454, .234], [.5, .103]], Math.PI / 12),
  fuse: curvedTube([[0, 0, .066], [-.033, .16, .061], [-.025, .315, .061], [.08, .443, .058], [.251, .451, .057], [.334, .354, .048]], .9),
};
