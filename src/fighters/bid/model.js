import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const moss = '#518b48';
const green = '#78b95b';
const light = '#a3ce77';
const lime = '#d1f78b';
const deep = '#284c38';
const straw = '#b6c995';
const claws = '#e2edbf';
const pulse = (phase) => Math.sin(Math.PI * clamp(phase, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.34, -.037], [1.16, 1.32, .79], moss),
  part('bevel', [0, 1.398, .179], [1.102, 1.217, .484], '#8dad64', [-.048, 0, 0]),
  part('bevel', [0, 1.363, .348], [.805, .986, .238], straw),
  part('plate', [0, 1.015, -.021], [1.115, .197, .857], '#6c7f4d'),
  part('box', [0, 1.023, .424], [.275, .165, .083], '#b1a372', [0, 0, .13]),
  part('box', [0, 1.022, .473], [.117, .079, .017], '#625b42', [0, 0, .13]),
  part('box', [.083, 1.4, .472], [.254, .041, .02], '#8f8356', [0, -.13, -.26]),
];
for (const side of [-1, 1]) {
  for (const [i, y] of [1.013, 1.294, 1.639, 1.817].entries()) {
    torso.push(part('leaf', [side * (.52 + i * .013), y, .029], [.275, .55, .386], i % 2 ? moss : green,
      [0, -.13 * side, side * (-2.02 + i * .45)]));
  }
  torso.push(part('leaf', [side * .321, 1.815, .405], [.256, .399, .071], '#ced39e', [0, side * .21, side * .68]));
}

const head = [
  part('bevel', [0, .367, -.033], [.968, .842, .795], green),
  part('bevel', [0, .174, .152], [.743, .355, .57], '#609b55', [0, 0, -.065]),
  part('bevel', [0, .337, .393], [.207, .159, .17], light, [0, .03, .13]),
  part('grin', [.01, .145, .44], [.642, .45, .11], deep, [0, 0, -.052]),
];
for (const side of [-1, 1]) {
  head.push(
    part('leaf', [side * .51, .657, -.043], [.39, .81, .362], green, [-.07, side * .14, -side * .49]),
    part('leaf', [side * .575, .663, .07], [.183, .548, .109], '#c2d697', [.15, side * .22, -side * .46]),
    part('bevel', [side * .228, .435, .362], [.335, .304, .144], deep, [0, side * .2, -side * .21]),
    part('bevel', [side * .224, .435, .435], [.258, .228, .069], '#96e157', [0, side * .2, -side * .21], .32),
    part('box', [side * .198, .432, .484], [.058, .13, .037], '#24413b', [0, side * .23, -side * .19]),
    part('gem', [side * .251, .487, .493], [.051, .055, .021], '#f0fbbd', zero, .69),
    part('leaf', [side * .21, .15, .464], [.117, .163, .085], claws, [0, side * .22, side * .22]),
  );
}

const arm = [
  part('bevel', [0, -.244, .017], [.335, .641, .389], moss, [0, 0, -.047]),
  part('bevel', [0, -.516, .044], [.322, .438, .335], green),
  part('bevel', [0, -.732, .076], [.463, .35, .396], light),
  part('plate', [0, -.587, .048], [.35, .106, .351], '#667f4b'),
];
for (const [x, length] of [[-.157, .307], [0, .393], [.157, .328]]) {
  arm.push(
    part('bevel', [x, -.878, .08], [.143, .242, .175], green, [0, 0, x * 1.4]),
    part('leaf', [x * 1.15, -.969 - length * .11, .092], [.129, length, .144], claws, [Math.PI - .22, 0, -x * 1.18], .13),
  );
}

const leg = [
  part('bevel', [0, -.228, -.024], [.331, .671, .395], moss),
  part('bevel', [0, -.479, .084], [.311, .407, .415], green),
  part('bevel', [0, -.648, .113], [.409, .249, .509], deep),
  part('plate', [0, -.649, .236], [.357, .116, .321], '#52744d'),
];
for (const x of [-.11, 0, .11]) {
  leg.push(part('leaf', [x, -.667, .353], [.103, .172, .14], '#9dae76', [Math.PI / 2, 0, x * .9]));
}

export const portrait = { targetY: 1.7, fov: .48, heading: .11 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .27, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const swipe = attack?.type === 'bidClaws' ? pulse((age - .025) / .31) : 0;
  const kicking = attack?.type === 'bidKicks';
  const kickA = kicking ? pulse(age / .29) : 0;
  const kickB = kicking ? pulse((age - .24) / .34) : 0;
  const summon = attack?.summonsClones ? pulse(age / attack.duration) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.26 + (guarding ? .2 : charging ? .21 : 0);
  const bob = Math.abs(stride) * .087 + Math.sin(time * 5.1) * .034 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * (.39 * swipe + .21 * kickA),
    wobble + facing * (kickA * .3 + kickB * .17 - running * .14 - swipe * .22)]);
  const body = joint(root, [0, bob, swipe * .1], [.15 * running - (kickA + kickB) * .52 - recovery * .23, 0, .087 * summon]);
  renderer.parts(torso, body, flash);
  renderer.parts(head, joint(body, [0, 1.963, .028], [-.3 * recovery - .12 * summon, swipe * .19, stride * .09 - .06]), flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const kick = lead ? kickA : kickB;
    const legSwing = airborne ? side * .45 - rise * .41 : stride * side * .81;
    const foot = joint(root, [side * .271, .767 - crouch * .42, kick * .08],
      [legSwing - kick * 1.99 - recovery * .41, 0, side * .092]);
    renderer.parts(leg, foot, flash);
    const reach = lead ? swipe : swipe * .39;
    const armSwing = guarding ? -1.24 : -.28 - side * stride * .63 - rise * .35 - reach * 1.6 - summon * 2.18
      - recovery * 1.45 - (pose ? 1.1 : 0) + (kickA + kickB) * .24;
    const hand = joint(body, [side * .536, 1.793, .01], [armSwing, side * reach * .38, side * (.36 + .56 * summon + (pose ? .64 : 0) - .28 * reach)]);
    renderer.parts(arm, hand, flash);
  }

  if (summon) {
    const [x, y, z] = position;
    const horde = attack.type === 'bidHorde';
    const count = horde ? 7 : 4;
    for (let i = 0; i < count; i++) {
      const angle = i * TAU / count + age * 6.8;
      const distance = (horde ? 1.48 : 1.14) * size;
      renderer.object('gem', [x + Math.cos(angle) * distance, y + (1.14 + summon * 1.64 + Math.sin(angle * 2) * .24) * size, z + .57 + Math.sin(angle) * .58],
        [.239 * size, .329 * size, .192 * size], i % 2 ? '#bbe985' : '#e3f4af', [0, angle, -angle], .86, summon * .85);
    }
  }
  if (!attack?.until || age < attack.from || age > attack.until) return;
  if (kicking) drawFlyingKickTrail(renderer, position, facing, attack, size);
  else if (swipe) {
    const [x, y, z] = position;
    const streak = 1 - (age - attack.from) / (attack.until - attack.from);
    for (let i = 0; i < 3; i++) {
      renderer.object('leaf', [x + facing * (1.18 + i * .145) * size, y + (1.42 + i * .184) * size, z + .67],
        [.165 * size, .95 * size, .105], i === 1 ? '#eef7be' : '#c4ec8a', [0, 0, -facing * .97], .84, streak * .86);
    }
  }
}

export function drawFlyingKickTrail(renderer, [x, y, z], facing, attack, size) {
  const progress = (attack.age - attack.from) / (attack.until - attack.from);
  const finishing = !attack.followUp;
  for (let i = 0; i < 3; i++) {
    renderer.object('leaf', [x + facing * (1.04 + i * .19 + progress * .47) * size, y + (.58 + i * .227 + (finishing ? .22 : 0)) * size, z + .64],
      [(.15 + i * .02) * size, .82 * size, .089], finishing ? '#e4f6b2' : '#b3e58c', [0, 0, -facing * (1.15 + i * .11)], .79, (1 - progress) * .83);
  }
}
