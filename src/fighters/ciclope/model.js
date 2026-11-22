import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { drawGasCloud } from '../packman/model.js';
import { lassoGrip } from './profile.js';

const skin = '#d89b5f';
const gold = '#e8b977';
const shade = '#a97048';
const hide = '#7d5140';
const dark = '#443238';
const red = '#f64d56';
const ivory = '#fee5b4';
const fiber = '#c0975f';
const lightFiber = '#f0c884';
const pulse = t => Math.sin(Math.PI * clamp(t, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.397, -.009], [1.168, 1.424, .826], hide, [0, 0, -.036]),
  part('bevel', [0, 1.414, .238], [.882, 1.23, .508], '#98694c', [-.07, 0, .036]),
  part('plate', [0, 1.876, -.01], [1.071, .166, .825], '#bb8a5f', [-.12, 0, -.15]),
  part('plate', [0, 1.021, -.025], [1.19, .179, .805], dark, [0, 0, -.061]),
  part('bevel', [0, 1.026, .406], [.272, .18, .089], '#bc8756', [0, .13, -.11]),
  part('box', [0, 1.026, .459], [.129, .063, .022], hide, [0, .13, -.11]),
  part('box', [-.12, 1.473, .481], [.037, .622, .026], '#b48260', [.109, 0, -.2]),
  part('plate', [0, 1.988, -.044], [.58, .206, .514], shade),
];
for (const [i, x] of [-.426, -.228, .01, .24, .425].entries()) {
  torso.push(part('leaf', [x, .902 - i % 2 * .032, .309], [.242, .273, .192],
    i % 2 ? '#734d3d' : '#935e44', [Math.PI - .19, 0, (i - 2) * .134]));
}
for (const y of [1.315, 1.484, 1.653]) {
  torso.push(part('box', [.081, y, .498], [.117, .039, .023], '#d6a279', [0, .057, -.42]));
}

const head = [
  part('bevel', [0, .337, 0], [1.081, .922, .859], gold),
  part('bevel', [0, .202, .244], [.895, .499, .542], skin, [0, 0, .08]),
  part('bevel', [0, .506, .408], [.697, .458, .221], '#b77b4f', [0, .028, -.04]),
  part('bevel', [0, .501, .53], [.54, .346, .115], '#532e39', [0, 0, -.02]),
  part('bevel', [0, .502, .601], [.435, .289, .069], red, zero, .56),
  part('bevel', [0, .5, .651], [.137, .219, .043], '#742d41', [0, 0, -.083]),
  part('gem', [-.092, .573, .66], [.071, .062, .027], '#ffebe5', zero, .84),
  part('bevel', [0, .298, .497], [.228, .129, .19], gold),
  part('grin', [0, .154, .495], [.642, .43, .119], dark, [0, 0, .048]),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .518, .289, -.066], [.204, .337, .306], shade, [0, side * .18, -.22 * side]),
    part('plate', [side * .475, .284, .061], [.208, .193, .083], '#b9815a', [0, side * .19, side * .16]),
    part('box', [side * .053, .273, .589], [.044, .027, .019], hide, [0, side * .22, .21]),
  );
}
for (const x of [-.23, -.113, 0, .119, .23]) {
  head.push(part('leaf', [x, .115 - (.2 - Math.abs(x)) * .12, .514], [.11, .104, .05],
    ivory, [Math.PI, 0, x * .51]));
}

const arm = [
  part('bevel', [0, -.183, 0], [.426, .575, .41], skin),
  part('bevel', [0, -.496, .053], [.361, .457, .387], gold, [.17, 0, 0]),
  part('plate', [0, -.604, .067], [.388, .133, .383], hide),
  part('bevel', [0, -.72, .086], [.352, .256, .365], gold),
];
const leg = [
  part('bevel', [0, -.315, -.007], [.361, .769, .42], shade),
  part('bevel', [0, -.487, .042], [.374, .316, .44], skin),
  part('plate', [0, -.614, .05], [.381, .187, .458], hide),
  part('bevel', [0, -.758, .142], [.458, .237, .552], gold),
];
const club = [
  part('tube', [0, .173, 0], [.144, .654, .146], '#5f4338'),
  part('tube', [0, .169, 0], [.173, .278, .184], '#99734e', [0, 0, .049]),
  part('bevel', [0, .767, .004], [.372, .919, .38], '#775345', [0, 0, -.136]),
  part('bevel', [-.073, 1.03, .027], [.466, .579, .431], '#895e49', [0, 0, -.219]),
  part('box', [-.14, .951, .203], [.053, .393, .029], '#b6855b', [0, 0, -.196]),
  part('gem', [.137, 1.091, .181], [.154, .206, .12], '#644238', [0, .19, -.49]),
];

function link(ax, ay, bx, by) {
  return { position: [(ax + bx) / 2, (ay + by) / 2], length: Math.hypot(bx - ax, by - ay), angle: Math.atan2(by - ay, bx - ax) };
}

const ropeCoil = Array.from({ length: 14 }, (_, i) => {
  const a = i * TAU / 14;
  const b = (i + 1) * TAU / 14;
  const { position: [x, y], length, angle } = link(.21 * Math.cos(a), .298 * Math.sin(a), .21 * Math.cos(b), .298 * Math.sin(b));
  return part('box', [x, y - .138, .072], [length + .045, .071, .072], i % 2 ? lightFiber : fiber, [0, 0, angle]);
});

export const portrait = { targetY: 1.71, fov: .482, heading: .1 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .24, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const lasso = attack?.type === 'ciclopeLasso';
  const cast = lasso ? pulse((age - .01) / .52) : 0;
  const smashing = attack?.type === 'ciclopeClub';
  const windup = smashing ? pulse(age / .24) : 0;
  const smash = smashing ? pulse((age - .13) / .3) : 0;
  const puff = attack?.type === 'ciclopeGas' ? pulse(age / attack.duration) : 0;
  const firing = attack?.type === 'ciclopeLaser';
  const laser = firing ? pulse(age / attack.duration) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 13.2) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.15 + (guarding ? .214 : charging ? .17 : 0);
  const bob = Math.abs(stride) * .089 + Math.sin(time * 4.4) * .029 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * (cast * .16 + smash * .34),
    wobble - facing * (running * .105 + smash * .134 - laser * .08)]);
  const body = joint(root, [0, bob, .07 * smash], [.13 * running + smash * .23 + puff * .19 - recovery * .24, 0, -.09 * laser]);
  renderer.parts(torso, body, flash);
  const face = joint(body, [0, 2.051, .029], [smash * .16 - recovery * .24, 0, pose ? -.11 : stride * .091]);
  renderer.parts(head, face, flash);
  if (firing) {
    const brightness = age < attack.from ? age / attack.from : Math.max(.19, 1 - (age - attack.from) * 1.37);
    renderer.mesh('bevel', multiply(face, transform([0, .504, .657], [.434, .286, .093], zero)),
      '#ff3e4c', 1, brightness);
  }
  for (const side of [-1, 1]) {
    const foot = joint(root, [side * .257, .872 - crouch * .39, 0],
      [airborne ? side * .397 - rise * .43 : stride * side * .74, 0, side * .087]);
    renderer.parts(leg, foot, flash);
    const clubHand = side < 0;
    const gesture = clubHand ? windup * 1.71 + smash * 1.44 : cast * 1.92;
    const pitch = guarding ? -1.26 : -.26 - stride * side * .46 - rise * .33 - recovery * 1.27 - gesture - (pose ? .45 : 0);
    const reach = side * (.276 + (pose ? .384 : 0) + (clubHand ? windup * .4 : cast * .48));
    const hand = joint(body, [side * .525, 1.822, .027], [pitch, side * gesture * .16, reach]);
    renderer.parts(arm, hand, flash);
    if (clubHand) {
      renderer.parts(club, joint(hand, [-.119, -.728, .146], [-pitch - .28 - smash * 1.08, 0, .28 + smash * .86]), flash);
    } else if (!lasso || !attack.fired || age > .76) {
      renderer.parts(ropeCoil, joint(hand, [.059, -.735, .196], [-pitch + .17, .095, -.27 - cast * .45]), flash);
    }
  }
  if (!attack?.until || age < attack.from || age > attack.until) return;
  if (smashing) drawClubImpact(renderer, position, facing, attack, size);
  if (puff) drawGasCloud(renderer, position, facing, attack, size * 1.13);
  if (firing) {
    const eyeX = position[0] + facing * .56 * size;
    const eyeY = position[1] + (2.55 + bob) * size;
    drawLaser(renderer, [eyeX, eyeY, position[2] + .66], facing, attack, size);
  }
}

export function drawClubImpact(renderer, [x, y, z], facing, attack, size) {
  const progress = clamp((attack.age - attack.from) / (attack.until - attack.from), 0, 1);
  for (let i = 0; i < 4; i++) {
    const angle = .78 - progress * 1.45 + i * .23;
    renderer.object('leaf', [x + facing * (1.22 + Math.cos(angle) * .67) * size, y + (1.58 + Math.sin(angle) * .87) * size, z + .68],
      [.251 * size, .73 * size, .1], i % 2 ? '#e7bc81' : ivory, [0, 0, -facing * (.92 + angle)], .79, (1 - progress) * .76);
  }
}

function drawLaser(renderer, [x, y, z], facing, attack, size) {
  const progress = clamp((attack.age - attack.from) / (attack.until - attack.from), 0, 1);
  const length = attack.range - .56 * size;
  const beamX = x + facing * length / 2;
  const glare = (1 - progress * .58) * (.88 + .12 * Math.sin(attack.age * 52));
  renderer.object('box', [beamX, y, z], [length, .41, .16], '#de3244', zero, 1, glare * .64);
  renderer.object('box', [beamX, y, z + .09], [length, .215, .117], '#ff6363', zero, 1, glare * .95);
  renderer.object('box', [beamX, y, z + .162], [length, .089, .081], '#ffe4cd', zero, 1, glare);
  renderer.object('gem', [x, y, z + .182], [.69 * size, .56 * size, .26], '#ff8b78', [0, attack.age * 8, .49], 1, glare);
}

function ropeSegment(renderer, previous, current, depth, width, color) {
  const { position: [x, y], length, angle } = link(...previous, ...current);
  renderer.object('box', [x, y, depth], [length + width * .65, width, .04], color, [0, 0, angle], .36);
}

function drawLasso(renderer, { owner, facing, x, y, reach, recalling }) {
  const [gripX, gripY] = lassoGrip(owner, facing);
  const open = clamp(reach / 1.2, .16, 1);
  let previous = [gripX, gripY];
  for (let i = 1; i <= 9; i++) {
    const t = i / 9;
    const point = [gripX + (x - gripX) * t, gripY + (y - gripY) * t - .22 * Math.sin(Math.PI * t) * open];
    ropeSegment(renderer, previous, point, .8, .052, i % 2 ? lightFiber : fiber);
    previous = point;
  }
  const radius = (recalling ? .303 : .37) * open;
  previous = [x, y];
  for (let i = 1; i <= 16; i++) {
    const angle = i * TAU / 16;
    const point = [x + facing * (radius * (1 - Math.cos(angle)) - .106 * open * Math.sin(angle)), y + .51 * open * Math.sin(angle)];
    ropeSegment(renderer, previous, point, .85, .063, i % 2 ? fiber : lightFiber);
    previous = point;
  }
}

export const projectiles = { ciclopeRope: drawLasso };
