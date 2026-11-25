import { zero } from './math.js';

const amber = '#ffd078';
const poweredLight = '#8aebcc';

export function drawFoundryStartup(renderer, campaign, time, { x: cameraX, radius }) {
  const { level, step, opened } = campaign;
  const [floorSwitch, doorSwitch] = level.steps;
  const powered = step > 0;
  const visible = (x) => Math.abs(x - cameraX) <= radius + 4;

  for (const x of [-12, -5, 2, 9, 16, 23, 30]) {
    if (!visible(x)) continue;
    renderer.object('box', [x, 3.15, -6.9], [6.88, 8.7, .45], x % 2 ? '#2b3b4e' : '#36485a');
    renderer.object('bevel', [x - 3.3, 3.12, -6.45], [.55, 8.75, .8], '#1d2a38');
    renderer.object('box', [x, 5.55, -6.35], [6.9, .32, .7], '#526378');
    renderer.object('bevel', [x, 5.05, -5.98], [3.3, .48, .76], '#1d2a38');
    const on = powered || x <= floorSwitch.x;
    renderer.object('box', [x, 4.94, -5.57], [2.6, .14, .12], on ? amber : '#526378', zero, on ? .83 : 0);
  }

  if (visible(floorSwitch.x)) {
    const x = floorSwitch.x;
    const light = powered ? poweredLight : amber;
    renderer.object('bevel', [x, .046, .15], [3.25, .085, 2.7], '#253748');
    renderer.object('box', [x, powered ? .081 : .12, .18], [2.48, .065, 2.25], light, zero, .48);
    for (const z of [-.55, 0, .55]) renderer.object('box', [x, .157, .22 + z], [1.7, .015, .085], '#53667a');
    if (!powered) {
      renderer.object('horn', [x, 1.92 + Math.sin(time * 3.4) * .13, .95], [.62, .8, .59], amber, [0, 0, Math.PI], .86);
    }
    renderer.object('tube', [x, 1.8, -3.75], [2.2, 3.8, 1.7], '#253748');
    renderer.object('tube', [x, 2.95, -3.74], [1.72, .72, 1.56], light, zero, powered ? .75 : .22);
    if (powered) renderer.object('disk', [x, 2.08, -2.85], [1.26, .09, 1.26], poweredLight, [Math.PI / 2, time, 0], .65);
  }

  if (powered) {
    for (let x = 6; x <= (opened ? level.exit : doorSwitch.x); x += 2) {
      if (visible(x)) renderer.object('box', [x, .025, 1.47], [1.28, .04, .18], poweredLight, zero, .73);
    }
  }
}
