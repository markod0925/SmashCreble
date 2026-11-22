import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { briefcaseGrip, briefcaseFlight } from './profile.js';

const blue = '#5b9dd2';
const navy = '#2f5f91';
const pale = '#c4d9e3';
const gold = '#ffcc78';
const black = '#162d3d';
const green = '#60d792';
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const attach = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.39, -.04], [1.04, 1.31, .84], blue),
  part('bevel', [0, 1.4, .28], [.75, 1.06, .32], pale),
  part('bevel', [0, 1.02, -.019], [.83, .38, .76], navy),
  part('leaf', [0, 1.94, -.46], [.225, .98, .65], navy, [-.54, 0, -.08]),
  part('leaf', [-.355, 1.63, .371], [.129, .422, .07], navy, [0, -.36, -.26]),
  part('leaf', [.355, 1.63, .371], [.129, .422, .07], navy, [0, .36, .26]),
];
const head = [
  part('bevel', [0, .282, -.02], [1.12, .85, .95], blue),
  part('leaf', [0, .45, .331], [.92, .522, .75], blue, [Math.PI / 2, 0, 0]),
  part('bevel', [0, .108, .36], [.951, .28, .72], pale, [0, 0, .03]),
  part('grin', [0, .155, .684], [.91, .62, .1], black),
  part('bevel', [.01, .469, -.175], [.79, .55, .63], '#f5b74a', [.16, 0, -.04]),
  part('plate', [0, .525, .34], [.76, .097, .55], '#ff9b58', [-.07, 0, .025]),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .338, .355, .49], [.265, .218, .145], pale, [0, side * .35, side * .1]),
    part('box', [side * .291, .358, .569], [.084, .124, .043], black, [0, side * .24, -.11]),
    part('box', [side * .27, .396, .593], [.038, .037, .014], '#fbfbef', zero, .3),
  );
}
for (const x of [-.27, -.122, .034, .188, .32]) {
  head.push(part('leaf', [x, .038 - (1 - Math.abs(x) * 2) * .018, .715], [.117, .16, .044], '#fff6df', [Math.PI, 0, x * .33]));
}

const arm = [
  part('bevel', [0, -.23, 0], [.32, .62, .363], blue),
  part('bevel', [0, -.509, .023], [.299, .413, .323], navy),
  part('bevel', [0, -.695, .065], [.324, .238, .34], blue),
];
const leg = [
  part('bevel', [0, -.35, 0], [.318, .81, .412], blue),
  part('bevel', [.024, -.727, .095], [.336, .245, .52], navy),
  part('leaf', [.024, -.753, .338], [.387, .382, .155], blue, [Math.PI / 2, 0, .055]),
];
const tail = [
  part('bevel', [0, -.078, -.322], [.315, .31, .85], navy, [-.19, 0, 0]),
  part('leaf', [0, .161, -.661], [.151, .706, .459], blue, [-.46, 0, .1]),
  part('leaf', [0, -.264, -.661], [.165, .438, .328], blue, [2.8, 0, .12]),
];

const radio = [
  part('bevel', [0, 0, 0], [.87, .405, .321], '#28877e'),
  part('box', [0, -.014, .175], [.79, .32, .058], '#24525b'),
  part('box', [0, .291, 0], [.47, .069, .091], black),
  part('box', [-.216, .217, 0], [.053, .163, .091], black),
  part('box', [.216, .217, 0], [.053, .163, .091], black),
  part('box', [0, -.048, .21], [.199, .112, .045], '#7a9b9b'),
  part('box', [0, .074, .219], [.206, .044, .041], '#84f6ac', zero, .5),
  part('box', [.347, .338, -.097], [.028, .48, .023], '#c3d8d8', [0, 0, -.18]),
];
for (const x of [-.266, .266]) {
  radio.push(
    part('disk', [x, -.024, .221], [.267, .05, .267], '#8ad7c1', [Math.PI / 2, 0, 0]),
    part('disk', [x, -.024, .251], [.215, .038, .215], black, [Math.PI / 2, 0, 0]),
    part('disk', [x, -.024, .271], [.088, .031, .088], '#4f8b8c', [Math.PI / 2, 0, 0]),
  );
}

const caseBase = [
  part('bevel', [0, -.022, -.07], [.83, .618, .295], '#a13f55'),
  part('box', [0, 0, .077], [.703, .503, .055], '#472d43'),
  part('box', [0, .392, -.026], [.304, .055, .09], '#352639'),
  part('box', [-.127, .327, -.026], [.054, .151, .094], gold),
  part('box', [.127, .327, -.026], [.054, .151, .094], gold),
];
const caseLid = [
  part('bevel', [0, -.302, .03], [.835, .611, .144], '#dd5863'),
  part('box', [0, -.302, .104], [.677, .451, .033], '#b9455a'),
  part('box', [-.332, -.09, .102], [.105, .089, .066], gold),
  part('box', [.332, -.09, .102], [.105, .089, .066], gold),
];
const digitBars = [[0, .122, .16, .034], [-.063, .062, .034, .123], [.063, .062, .034, .123],
  [0, 0, .155, .034], [-.063, -.061, .034, .122], [.063, -.061, .034, .122], [0, -.123, .16, .034]];
for (const [idx, bars] of [[0, [0, 1, 3, 4, 5, 6]], [1, [0, 2, 5]]]) {
  for (const bar of bars) {
    const [x, y, width, height] = digitBars[bar];
    caseLid.push(part('box', [x + (idx ? .108 : -.108), y - .307, .133], [width, height, .019], '#fff2bc', zero, .3));
  }
}

function drawCase(renderer, root, opening, flash) {
  renderer.parts(caseBase, root, flash);
  renderer.parts(caseLid, attach(root, [0, .283, .098], [-opening, 0, 0]), flash);
}

export const portrait = { targetY: 1.71, fov: .47, heading: .15 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .24, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0,
    caseAway = false, danceTime = null, leadsDance = false } = options;
  const age = attack?.age ?? 0;
  const combo = attack?.type === 'sharkCombo';
  const kick = combo ? pulse(age / .27) : 0;
  const headbutt = combo ? pulse((age - .18) / .34) : 0;
  const cast = attack?.type === 'sharkBriefcase' ? pulse(age / .39) : 0;
  const venom = attack?.type === 'sharkVenom' ? pulse(age / .68) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const beat = danceTime === null ? 0 : Math.sin(danceTime * TAU * 2);
  const stride = Math.sin(time * 14) * running;
  const jump = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing + (guarding ? .23 : charging ? .14 : 0);
  const bob = Math.abs(stride) * .079 + Math.sin(time * 4) * .027 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * headbutt * .33, wobble - facing * running * .08]);
  const body = attach(root, [0, bob, .14 * headbutt], [.11 * running + headbutt * .31 - recovery * .26, 0, .07 * beat]);
  renderer.parts(torso, body, flash);
  renderer.parts(head, attach(body, [0, 1.996, .017 + headbutt * .235], [headbutt * .32 - recovery * .25, 0, -.12 * beat]), flash);
  renderer.parts(tail, attach(body, [0, 1.026, -.306], [0, .34 * stride + .15 * Math.sin(time * 5), 0]), flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legBend = airborne ? side * .41 - jump * .42 : side * stride * .73;
    renderer.parts(leg, attach(root, [side * .249, .833 - crouch * .34, 0],
      [legBend - (lead ? kick * 1.65 : 0) - recovery * .41, 0, side * .115]), flash);
    const props = side > 0 ? -.96 * cast - .5 * venom : -.76 - .46 * beat;
    const pitch = guarding ? -1.19 : props - side * stride * .39 - jump * .31 - recovery * .92;
    const hand = attach(body, [side * .461, 1.801, -.001], [pitch, 0, side * (.29 + (pose ? .19 : 0))]);
    renderer.parts(arm, hand, flash);
    if (side < 0) {
      renderer.parts(radio, attach(hand, [-.051, -.772, .136], [-pitch - .12, 0, .3]), flash);
    } else if (!caseAway) {
      const opening = leadsDance ? Math.min(1, danceTime * 8) * 1.8 : venom * 1.68;
      drawCase(renderer, attach(hand, [.145, -.984, .133], [-pitch - .13, 0, -.26 + .1 * stride]), opening, flash);
    }
  }
}

function drawBriefcase(renderer, projectile) {
  const { owner, x, y, remaining, facing } = projectile;
  const [gripX, gripY] = briefcaseGrip(owner, facing);
  const extension = 1 - remaining / briefcaseFlight;
  let previous = [gripX, gripY];
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const px = gripX + (x - gripX) * t;
    const py = gripY + (y - gripY) * t - .31 * Math.sin(Math.PI * t);
    const [ax, ay] = previous;
    renderer.object('box', [(px + ax) * .5, (py + ay) * .5, .68], [Math.hypot(px - ax, py - ay) + .027, .042, .044],
      i % 2 ? '#f5c58e' : '#d99d63', [0, 0, Math.atan2(py - ay, px - ax)], .37);
    previous = [px, py];
  }
  drawCase(renderer, transform([x, y, .72], one, [0, .28 * facing, facing * Math.sin(extension * TAU) * .59]), 0, false);
}

function drawVenom(renderer, { x, y, vx, vy }, time) {
  const z = .75 + Math.sin(vx * 2.3 + vy) * .36;
  renderer.object('gem', [x, y, z], [.235, .32, .115], Math.sin(vx + vy) > 0 ? '#a3f769' : '#45cc79', [0, time * 7 + vx, -.28], .73);
}

export const projectiles = { tetheredBriefcase: drawBriefcase, venomSnake: drawVenom };

export function drawDanceSnake(renderer, snake, time) {
  const age = time - snake.delay;
  if (age < 0) return;
  const size = Math.min(1, .22 + age * 4.3);
  const root = transform([snake.x, snake.y, snake.depth], [size, size, size], [0, 0, snake.angle]);
  for (let i = 1; i <= 5; i++) {
    const bend = Math.sin(time * 21 - i * .93 + snake.index) * (.039 + i * .02);
    const girth = .25 - i * .026;
    renderer.mesh('bevel', multiply(root, transform([-i * .152, bend, 0], [.203, girth, girth], zero)), i % 2 ? green : '#379467', .34);
  }
  renderer.mesh('bevel', multiply(root, transform([0, 0, 0], [.35, .245, .285], zero)), '#9de278', .45);
  renderer.mesh('box', multiply(root, transform([.059, .053, .144], [.063, .055, .029], zero)), '#152b31');
  renderer.mesh('box', multiply(root, transform([.179, -.059, .029], [.135, .031, .036], zero)), '#f67a78', .46);
}
