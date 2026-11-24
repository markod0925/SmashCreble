import { clamp } from '../math.js';
import { interpolate, traceDistance } from '../fighters/packman/path.js';

function drawStroke(renderer, stroke, age, [halo, edge, core], fade, thickness) {
  if (fade <= 0) return;
  const covered = traceDistance(stroke, age);
  for (const { from, to, offset, distance } of stroke.segments) {
    if (!distance) continue;
    const painted = Math.min(distance, covered - offset);
    if (painted <= 0) break;
    const [bx, by] = interpolate(from, to, painted / distance);
    const [ax, ay] = from;
    const x = (ax + bx) * .5;
    const y = (ay + by) * .5;
    const rotation = [0, 0, Math.atan2(by - ay, bx - ax)];
    renderer.object('box', [x, y, 2.43], [painted + .094, .42 * thickness, .116], halo, rotation, 1, fade * .37);
    renderer.object('box', [x, y, 2.49], [painted + .081, .194 * thickness, .12], edge, rotation, 1, fade * .77);
    renderer.object('box', [x, y, 2.57], [painted + .068, .079 * thickness, .079], core, rotation, 1, fade * .91);
  }
}

export function drawTrace67(renderer, { age, lifetime, afterglow, tracePath, colors }) {
  const fade = clamp((lifetime - age) / afterglow, 0, 1);
  if (tracePath.leadIn) {
    const leadFade = clamp((tracePath.leadIn.end + .49 - age) / .49, 0, 1);
    drawStroke(renderer, tracePath.leadIn, age, colors, leadFade, .66);
  }
  for (const digit of tracePath.digits) drawStroke(renderer, digit, age, colors, fade, 1);
}
