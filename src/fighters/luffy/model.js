import { clamp, direction, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { rubberDanceBeat, rubberDanceImpact, rubberDanceSeconds } from './profile.js';

const skin = '#dc9a65';
const cheek = '#efb57f';
const ink = '#332b37';
const jacket = '#d54c43';
const trim = '#f57155';
const denim = '#41679b';
const straw = '#ecbe71';
const white = '#fff3e1';
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.54, 0], [.77, .91, .55], skin),
  part('bevel', [0, 1.48, -.153], [.91, .82, .474], jacket),
  part('bevel', [0, .931, -.026], [.796, .286, .644], denim),
  part('plate', [0, 1.042, .012], [.872, .132, .678], '#f0aa59', [0, 0, -.04]),
  part('bevel', [0, 1.978, .012], [.333, .278, .354], cheek),
];
const head = [
  part('bevel', [0, .332, .01], [.896, .772, .75], cheek),
  part('bevel', [0, .575, -.07], [.953, .496, .713], ink),
  part('bevel', [0, .304, .406], [.127, .137, .145], skin),
  part('grin', [0, .166, .391], [.45, .553, .076], '#582e38', [0, 0, .1]),
  part('bevel', [0, .151, .444], [.302, .062, .038], '#fff0d6', [0, 0, .09]),
];
for (const side of [-1, 1]) {
  torso.push(
    part('bevel', [side * .311, 1.475, .169], [.291, .859, .459], jacket, [0, side * .14, side * -.12]),
    part('plate', [side * .207, 1.481, .384], [.091, .67, .059], trim, [0, side * .14, side * -.128]),
    part('disk', [side * .25, 1.317, .414], [.079, .025, .075], straw, [Math.PI / 2, 0, 0]),
  );
  head.push(
    part('bevel', [side * .429, .33, .009], [.161, .22, .22], skin),
    part('bevel', [side * .152, .395, .385], [.168, .163, .06], '#fff0d6', [0, side * .2, side * .15]),
    part('bevel', [side * .15, .393, .421], [.059, .094, .025], ink),
    part('leaf', [side * .303, .497, .329], [.204, .258, .123], ink, [Math.PI, 0, side * .42]),
  );
}
head.push(part('box', [.217, .309, .386], [.122, .026, .021], '#ad624b', [0, .28, .12]));

const hat = [
  part('disk', [0, .652, .002], [1.53, .112, 1.157], '#bf8a4e', [.03, 0, -.08]),
  part('disk', [0, .698, .006], [1.49, .083, 1.13], straw, [.03, 0, -.08]),
  part('bevel', [0, .798, -.048], [.934, .434, .807], straw, [0, 0, -.08]),
  part('plate', [0, .748, -.043], [.951, .111, .817], jacket, [0, 0, -.08]),
];
const curls = [
  part('bombShell', [0, .689, -.045], [1.08, .504, .798], white),
  ...[[-.421, .697, .5], [-.243, .899, .34], [.032, .979, -.085], [.272, .868, -.38], [.432, .681, -.58]].map(([x, y, lean]) =>
    part('earCrest', [x, y, .01], [.493, .621, .521], white, [-.49, x, lean], .27)),
];

const arm = [
  part('bevel', [0, -.116, .014], [.261, .335, .286], jacket),
  part('bevel', [0, -.392, .03], [.204, .524, .221], skin),
  part('bevel', [0, -.682, .065], [.298, .267, .287], cheek),
];
const leg = [
  part('bevel', [0, -.226, -.006], [.344, .497, .387], denim),
  part('bevel', [0, -.42, .019], [.345, .132, .369], '#88a4c5'),
  part('bevel', [0, -.577, .018], [.227, .339, .222], skin),
  part('bevel', [0, -.77, .118], [.351, .171, .463], cheek),
  part('plate', [0, -.825, .121], [.389, .101, .507], '#7e593f'),
  part('box', [0, -.714, .223], [.284, .064, .061], '#69473d', [0, 0, .117]),
];
const paleColors = { [skin]: '#e9cab0', [cheek]: '#ffe2c7', [ink]: '#d5d5ed', [jacket]: white, [trim]: '#f8f8ff',
  [denim]: '#eae8fa', '#88a4c5': '#fffafa', '#f0aa59': '#d1b6ed', [straw]: '#fffbf4' };
const paleParts = parts => parts.map(piece => ({ ...piece, color: paleColors[piece.color] ?? piece.color }));
const normal = { torso, head, arm, leg };
const transformed = { torso: paleParts(torso), head: paleParts(head), arm: paleParts(arm), leg: paleParts(leg) };

function mixPoint(a, b, t) {
  return a.map((value, i) => value + (b[i] - value) * t);
}

function anglesAlong([ax, ay, az], [bx, by, bz]) {
  const dx = bx - ax, dy = by - ay;
  return [Math.atan2(bz - az, Math.hypot(dx, dy)), 0, Math.atan2(-dx, dy)];
}

function drawRubberLimb(renderer, start, end, size, bend, kick, dancing) {
  const points = [start, ...[1 / 3, 2 / 3].map(t => {
    const point = mixPoint(start, end, t);
    point[1] += bend;
    point[2] += .15 * size;
    return point;
  }), end];
  const limb = dancing ? '#f3dccc' : skin;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    renderer.object('bevel', mixPoint(a, b, .5), [.249 * size, length + .18 * size, .237 * size], limb,
      anglesAlong(a, b), dancing ? .22 : 0);
  }
  const angle = anglesAlong(points.at(-2), end);
  renderer.object('bevel', end, (kick ? [.42, .6, .34] : [.41, .46, .396]).map(value => value * size),
    kick ? (dancing ? white : straw) : (dancing ? '#ffead3' : cheek), angle, dancing ? .3 : 0);
}

export const portrait = { targetY: 1.58, fov: .467, heading: .23 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .3, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const type = attack?.type;
  const combo = type === 'luffyCombo';
  const kick = combo ? pulse((age - .008) / .205) : 0;
  const jab = combo ? pulse((age - .163) / .277) : 0;
  const headbutt = type === 'luffyHeadbutt' ? pulse((age - .041) / .31) : 0;
  const winding = type === 'luffyGumGum' ? pulse(age / .265) : 0;
  const stretch = type === 'luffyGumGum' ? ease((age - .115) / (attack.from - .115)) * (1 - ease((age - attack.until + .045) / .185)) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const dancing = attack?.rubberDance && attack.fired;
  const elapsed = attack?.danceElapsed ?? 0;
  const beat = Math.floor(elapsed / rubberDanceBeat);
  const beatTime = elapsed - beat * rubberDanceBeat;
  const rhythm = dancing ? Math.sin(elapsed * TAU / rubberDanceBeat) * ease(elapsed / .13) * ease((rubberDanceSeconds - elapsed) / .17) : 0;
  const danceReach = dancing ? ease((beatTime - .035) / (rubberDanceImpact - .035)) * (1 - ease((beatTime - .26) / .18)) : 0;
  const lash = dancing && beat * rubberDanceBeat + rubberDanceImpact < rubberDanceSeconds ? danceReach : 0;
  const swing = rhythm + lash * (beat % 2 === 0 ? .53 : -.53);
  const stride = Math.sin(time * 15.6) * running;
  const rise = airborne ? clamp(verticalSpeed / 9, -1, 1) : 0;
  const crouch = landing * 1.1 + (guarding ? .21 : charging ? .18 : 0);
  const bob = Math.sin(time * 4.8) * .022 + Math.abs(stride) * .075 - crouch + Math.abs(rhythm) * .135;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.34 * headbutt + .38 * jab) + .35 * rhythm,
    wobble - facing * (.11 * running + .18 * headbutt) + rhythm * .14], attack);
  const body = joint(root, [0, bob, .218 * headbutt + .12 * jab], [.13 * running + .53 * headbutt - recover * .32, 0, .14 * rhythm]);
  const rig = dancing ? transformed : normal;
  renderer.parts(rig.torso, body, flash);
  const face = joint(body, [0, 2.026 - .17 * headbutt, .014 + .264 * headbutt], [.14 * headbutt, 0, -.2 * rhythm + (pose ? -.09 : 0)]);
  renderer.parts(rig.head, face, flash);
  if (dancing) {
    renderer.parts(curls, face, flash);
    renderer.parts(hat, joint(body, [0, 1.27, .21], [-1.36, .06, -.12]), flash);
  } else {
    renderer.parts(hat, joint(face, [0, .034 * headbutt, 0], [-.18 * headbutt, 0, .08 * stride]), flash);
  }

  const hands = [], feet = [];
  const [x, y, z] = position;
  for (const side of [-1, 1]) {
    const lead = side === facing;
    const shoulder = joint(body, [side * .455, 1.747, .006], [
      (guarding ? -1.5 : -.27 - side * stride * .63 - .35 * rise) - (lead ? 1.92 * jab : .35 * jab) +
      .94 * winding - 1.12 * recover - .45 * headbutt - Math.max(0, side * swing) * 1.36,
      side * (.14 + .28 * winding), side * (.3 + .35 * Number(pose) + .4 * winding + .27 * Math.abs(rhythm)),
    ]);
    const wrist = transformPoint(shoulder, [0, -.682, .065]);
    hands.push(wrist);
    if (stretch > .005) {
      const target = [x + facing * (attack.range - (lead ? .08 : .79)), y + (lead ? 1.37 : 1.68) * size, z + (lead ? .71 : .39) * size];
      drawRubberLimb(renderer, transformPoint(shoulder, zero), mixPoint(wrist, target, stretch), size, .28 * side * stretch, false, false);
    } else {
      renderer.parts(rig.arm, shoulder, flash);
    }

    const dancingKick = Math.max(0, -side * swing);
    const legPitch = airborne ? side * .46 - rise * .41 : side * stride * .84;
    const foot = joint(root, [side * .227, .88 - .43 * crouch + .09 * dancingKick, 0],
      [legPitch - (lead ? kick * 1.98 : 0) - .36 * recover - dancingKick * 1.1, 0, side * (.082 + .31 * dancingKick)]);
    feet.push(transformPoint(foot, [0, -.766, .219]));
    renderer.parts(rig.leg, foot, flash);
  }

  if (!dancing) return;
  for (let i = 0; i < 5; i++) {
    const angle = elapsed * 4.7 + i * TAU / 5;
    const cloud = (.19 + i % 2 * .09) * size;
    renderer.object('bombShell', [x + Math.sin(angle) * 1.07 * size, y + (2.49 + i % 3 * .27) * size, z + Math.cos(angle) * .81 * size],
      [cloud * 1.42, cloud, cloud], white, [0, elapsed * 3, angle], .84, .72);
  }
  if (lash <= .01) return;
  for (const [index, target] of attack.danceTargets.entries()) {
    if (!target.stocks || target.respawn) continue;
    const side = direction(target.x - x, facing);
    const kickBeat = (beat + index) % 2 === 1;
    const start = (kickBeat ? feet : hands)[side > 0 ? 1 : 0];
    const end = [target.x, target.y + (kickBeat ? .86 : 1.39) * target.fighter.size, (target.depth ?? .21) + .66];
    drawRubberLimb(renderer, start, mixPoint(start, end, lash), size * .92, (kickBeat ? -.43 : .61) * lash, kickBeat, true);
  }
}
