import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const green = '#a7c974';
const lime = '#c8e391';
const shade = '#749e65';
const teal = '#459eaa';
const blue = '#6bbbc0';
const yellow = '#eac16f';
const ink = '#39434c';
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.51, -.019], [1.048, .859, .704], green),
  part('bevel', [0, 1.55, .273], [.889, .741, .323], lime, [-.092, 0, 0]),
  part('bevel', [0, 1.923, -.022], [.323, .268, .379], shade),
  part('bevel', [0, 1.123, -.008], [.919, .329, .712], yellow),
  part('plate', [0, 1.228, .004], [.955, .105, .735], '#bc925a', [0, 0, -.035]),
];
for (const [i, x] of [-.391, -.139, .131, .361].entries()) {
  torso.push(part('bevel', [x, 1.607 - Math.abs(x) * .15, .441 - Math.abs(x) * .183], [.193, .633 - i * .035, .143],
    i % 2 ? teal : '#389fac', [.147, x * 1.16, x * .224]));
  torso.push(part('bevel', [x - .028, 1.624 - Math.abs(x) * .15, .5 - Math.abs(x) * .183], [.052, .451 - i * .037, .036],
    blue, [.147, x * 1.16, x * .224]));
}

const face = [
  part('bombShell', [0, .377, -.006], [1.139, 1.012, .861], green),
  part('bevel', [0, .337, .239], [.909, .522, .39], lime, [-.121, 0, 0]),
  part('bevel', [-.213, .72, .154], [.237, .088, .133], '#e0ebad', [-.37, -.29, .47], .25),
  part('bevel', [0, .188, .46], [.213, .072, .05], ink, [0, 0, -.081]),
  part('bevel', [.017, .126, .48], [.078, .136, .06], '#e5999a', [0, 0, .062]),
];
for (const side of [-1, 1]) {
  face.push(
    part('leaf', [side * .192, .433, .421], [.217, .374, .091], ink, [.05, side * .19, side * -.083]),
    part('leaf', [side * .183, .428, .472], [.099, .219, .046], '#f0f3c9', [.05, side * .19, side * -.08]),
  );
}
const ear = [
  part('earCrest', [0, 0, 0], [.97, .96, .82], green, [0, 0, -.077]),
  part('earCrest', [.051, .031, .077], [.412, .685, .389], '#d4db8a', [.16, 0, .12]),
];
const arm = [
  part('bevel', [0, -.191, .006], [.253, .489, .285], green),
  part('bevel', [0, -.492, .035], [.222, .44, .243], lime, [.05, 0, -.05]),
  part('bevel', [0, -.678, .052], [.27, .224, .217], teal),
];
for (const finger of [-1, 0, 1]) {
  arm.push(part('bevel', [finger * .083, -.795 - .039 * (finger === 0), .068], [.068, .208, .11], blue, [.018, 0, finger * .31]));
}
const legs = [-1, 1].map(side => {
  const rig = [
    part('bevel', [0, -.313, -.012], [.385, .751, .467], yellow),
    part('bevel', [0, -.429, .205], [.225, .37, .125], '#b59a68', [.03, 0, side * .095]),
    part('bevel', [0, -.772, .142], [.432, .247, .611], '#f6d581'),
    part('plate', [0, -.862, .165], [.444, .101, .606], '#865e58'),
  ];
  const strokes = side < 0
    ? [[.07, .08, -.064, .005], [-.065, .005, -.061, -.076], [-.061, -.076, .058, -.076], [.058, -.076, .058, .005], [.058, .005, -.064, .005]]
    : [[-.067, .074, .076, .074], [.076, .074, -.019, -.079]];
  for (const [ax, ay, bx, by] of strokes) {
    rig.push(part('bevel', [(ax + bx) * .5, -.75 + (ay + by) * .5, .44], [.028, Math.hypot(bx - ax, by - ay) + .022, .035], ink,
      [0, 0, Math.atan2(ax - bx, by - ay)]));
  }
  return rig;
});

export function drawFlyingTongue(renderer, mouth, [x, y, z], attack, size) {
  const { age, from, until, range, facing } = attack;
  const reach = ease((age - .067) / (from - .067)) * (1 - ease((age - until) / .176));
  if (reach <= .006) return;
  const endX = mouth[0] + (x + facing * range - mouth[0]) * reach;
  const endY = mouth[1] + (y + (1.67 + .19 * Math.sin(age * 29)) * size - mouth[1]) * reach;
  let [ax, ay, az] = mouth;
  for (let i = 1; i <= 4; i++) {
    const t = i / 4;
    const bx = mouth[0] + (endX - mouth[0]) * t;
    const by = mouth[1] + (endY - mouth[1]) * t + Math.sin(Math.PI * t) * (.25 + .075 * Math.sin(age * 35)) * reach;
    const bz = mouth[2] + (z + .8 * size - mouth[2]) * t;
    const angle = [0, 0, Math.atan2(ax - bx, by - ay)];
    const length = Math.hypot(bx - ax, by - ay) + .08 * size;
    renderer.object('bevel', [(ax + bx) * .5, (ay + by) * .5, (az + bz) * .5], [.193 * size, length, .147 * size], '#ef879f', angle, .31);
    [ax, ay, az] = [bx, by, bz];
  }
  renderer.object('bevel', [ax, ay, az], [.45 * size, .241 * size, .2 * size], '#ffc0b4', [0, 0, facing * .17], .26);
}

export const portrait = { heading: .227, targetY: 1.64, fov: .458 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const type = attack?.type;
  const bump = type === 'pincoHeadbutt' ? pulse((age - .018) / .28) : 0;
  const tongue = type === 'pincoTongue' ? pulse((age - .029) / .46) : 0;
  const shine = type === 'pincoFlash';
  const bow = shine ? pulse(age / .31) : 0;
  const flare = shine ? pulse((age - attack.from + .046) / .235) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const flying = type === 'pincoFlying67';
  const flight = flying ? ease(age / .09) * ease((attack.duration - age) / .35) : 0;
  const [dx, dy] = attack?.traceDirection ?? [facing, 0];
  const steepness = dy / (Math.hypot(dx, dy) || 1);
  const stride = Math.sin(time * 15.2) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.2, -1, 1) : 0;
  const crouch = landing * 1.25 + (guarding ? .22 : charging ? .15 : 0);
  const bob = Math.abs(stride) * .082 + .035 * Math.sin(time * 5) - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.32 * bump + .23 * tongue - .21 * flight),
    wobble - facing * (.132 * running + .24 * bump) + facing * flight * (.57 + steepness * .25)], attack);
  const body = joint(root, [0, bob, .152 * bump], [.12 * running + .26 * bump + .26 * bow - .31 * recover, 0, .16 * flight * facing]);
  renderer.parts(torso, body, flash);
  const head = joint(body, [0, 1.979 - .122 * bump, .011 + .32 * bump], [.41 * bump + .3 * bow - .36 * flare, .123 * bump * facing, pose ? -.118 : .07 * stride]);
  renderer.parts(face, head, flash);
  for (const [i, side] of [-1, 1].entries()) {
    const lead = side === facing;
    renderer.parts(ear, joint(head, [side * .466, .363, -.015], [.26 + .36 * bump + .48 * flight, 0,
      side * (-.99 + Math.sin(time * 8.2 + i) * .13 - .38 * flight + .21 * bow)]), flash);
    const bent = airborne ? side * .39 - rise * .42 : stride * side * .83;
    const leg = joint(root, [side * .249, .898 - .37 * crouch, -.012],
      [bent * (1 - flight) - .36 * recover - (lead ? .82 : -.76) * flight, side * .132, side * .09 + facing * (lead ? 1.19 : -.36) * flight]);
    renderer.parts(legs[i], leg, flash);
    const shoulder = joint(body, [side * .481, 1.743, -.015], [
      (guarding ? -1.39 : -.24 - stride * side * .61 - rise * .41) - .94 * recover + .78 * bump - .53 * bow - .75 * flight - (lead ? .52 : .16) * tongue,
      side * .16, side * (.334 + (pose ? .55 : 0) + .5 * flare + .26 * flight),
    ]);
    renderer.parts(arm, shoulder, flash);
  }

  const [x, y, z] = position;
  if (tongue > .003) drawFlyingTongue(renderer, transformPoint(head, [0, .178, .51]), position, attack, size);
  if (flare > .027) {
    const [hx, hy, hz] = transformPoint(head, [0, .801, .208]);
    renderer.object('star', [hx, hy, hz + .59], [1.97 * flare, 2.1 * flare, .19], '#faffc9', [0, 0, age * 8], 1, .83 * flare);
    for (let i = 0; i < 5; i++) {
      const angle = TAU * i / 5 + age * 2.8;
      const radius = 1.13 + flare * .68;
      renderer.object('gem', [hx + Math.cos(angle) * radius, hy + Math.sin(angle) * radius * .75, hz + .37],
        [.51 * flare, .13, .121], '#ddfba1', [0, 0, angle], .98, .65 * flare);
    }
  }
  if (flight > .05) {
    const angle = Math.atan2(dy, dx);
    for (let i = 0; i < 3; i++) {
      const phase = (age * 8 + i / 3) % 1;
      const lag = (.39 + phase * .84) * size;
      renderer.object('leaf', [x - Math.cos(angle) * lag, y + (1.06 + i * .19) * size - Math.sin(angle) * lag, z + .64],
        [.141 * size, (.47 + phase * .47) * size, .11], '#9dfa82', [0, 0, angle - Math.PI / 2], .96, (1 - phase) * flight * .72);
    }
  }
}
