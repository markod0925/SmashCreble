import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const pink = '#e082a3';
const blush = '#f6a4bc';
const blue = '#4563b9';
const scarlet = '#db575e';
const gold = '#f6cc65';
const dark = '#4e2c4c';
const enamel = '#fff5df';
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const joint = (root, position, rotation = zero) => multiply(root, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.43, -.025], [1.107, 1.139, .763], blue),
  part('bevel', [0, 1.421, .31], [.926, 1.044, .202], '#5474cd'),
  part('plate', [0, 1.005, -.018], [1.127, .162, .765], '#34488f', [0, 0, -.037]),
  part('bevel', [0, 1.95, .005], [.399, .352, .433], pink),
  part('box', [-.176, 1.44, .413], [.057, .732, .024], '#7292e0', [0, 0, -.11]),
  part('bevel', [.223, 1.53, .4], [.285, .235, .067], '#3d5cae', [0, 0, -.096]),
  part('box', [.214, 1.616, .45], [.255, .037, .024], '#8fb0f2', [0, 0, -.096]),
];

const head = [
  part('bevel', [0, .356, .029], [1.083, .853, .828], pink),
  part('bevel', [0, .373, .299], [.967, .613, .351], blush),
  part('leaf', [0, .658, .452], [.539, .284, .072], '#c96e97', [Math.PI, 0, .087]),
  part('bevel', [0, .319, .476], [.17, .132, .158], '#e38caa', [0, 0, .19]),
];
const eye = [
  part('bevel', [0, 0, 0], [.276, .256, .116], dark),
  part('bevel', [0, .006, .055], [.225, .217, .092], gold, zero, .26),
  part('bevel', [.031, .004, .104], [.101, .14, .038], dark),
  part('gem', [.009, .041, .13], [.072, .063, .027], enamel, zero, .6),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .538, .32, -.021], [.257, .261, .263], pink, [0, 0, side * -.35]),
    part('bevel', [side * .393, .279, .36], [.192, .098, .09], '#d6769c', [0, side * .29, side * .11]),
    part('box', [side * .239, .593, .421], [.262, .052, .059], '#85557c', [0, side * .11, side * .27]),
  );
}

const smile = [
  part('grin', [0, .192, .473], [.646, .637, .094], dark, [0, 0, .05]),
  part('bevel', [0, .152, .518], [.418, .066, .053], enamel, [0, 0, .051]),
];
for (const [i, x] of [-.225, -.135, -.041, .058, .164, .239].entries()) {
  smile.push(part('leaf', [x, .155 + Math.abs(x) * .2, .532], [.092, .12 - i % 2 * .025, .049], enamel, [Math.PI, 0, x * .62]));
}
const jaw = [
  part('bevel', [0, -.049, .297], [.706, .242, .457], pink),
  part('bevel', [0, .033, .456], [.386, .069, .12], enamel),
];

const crest = [
  part('bevel', [0, .824, -.024], [1.269, .531, .881], gold, [.088, 0, .047]),
  part('bevel', [-.26, .767, .284], [.652, .414, .439], '#fbe181', [0, -.21, .19]),
  part('bevel', [.296, .791, .287], [.597, .397, .422], '#efb955', [0, .26, -.19]),
  part('plate', [0, 1.028, -.009], [1.275, .166, .872], blue, [.08, 0, .061]),
];
for (const [x, y, scale, lean] of [[-.518, 1.06, .31, .53], [-.319, 1.136, .48, .22], [-.027, 1.182, .43, -.24], [.302, 1.233, .61, -.27], [.517, 1.092, .32, -.51]]) {
  crest.push(part('horn', [x, y, .012], [.31, scale, .522], x < 0 ? '#597bd4' : '#415eb5', [.15, 0, lean]));
}

const sleeve = [
  part('bevel', [0, -.159, -.006], [.305, .449, .331], pink),
  part('bevel', [0, -.45, .043], [.251, .417, .261], blush),
];
const palm = [part('bevel', [0, -.063, 0], [.345, .23, .208], blush)];
for (const [i, x] of [-.113, -.037, .043, .111].entries()) {
  palm.push(part('bevel', [x, -.203 - (i === 1 ? .019 : 0), .007], [.085, .166 - i * .013, .117], pink, [0, 0, x * 1.43]));
}
const fist = [part('bevel', [0, -.066, .027], [.348, .26, .295], blush), part('bevel', [-.115, -.084, .131], [.174, .16, .112], pink)];
const boot = [
  part('bevel', [0, -.255, .008], [.405, .587, .492], scarlet),
  part('bevel', [0, -.563, .002], [.375, .392, .451], '#bf4758'),
  part('bevel', [0, -.764, .151], [.497, .272, .629], '#e67072'),
  part('plate', [0, -.837, .164], [.509, .117, .65], '#8f3853'),
];

const ruler = [
  part('bevel', [0, .47, 0], [.237, 1.67, .145], '#e3b471'),
  part('bevel', [0, -.255, 0], [.265, .248, .179], '#ad7252'),
];
for (let i = 0; i < 8; i++) {
  const length = i % 2 ? .055 : .09;
  ruler.push(part('box', [.106 - length * .5, .103 + i * .145, .078], [length, .022, .017], '#76565a'));
}

export const portrait = { targetY: 1.73, fov: .494, heading: .2 };

function drawShout(renderer, mouth, [x, y, z], attack, size) {
  const [mouthX, mouthY, mouthZ] = mouth;
  const { age, from, facing, range, waveSpeed, scale } = attack;
  for (let i = 0; i < 5; i++) {
    const elapsed = age - from - i * .067;
    if (elapsed < 0) continue;
    const travel = elapsed * waveSpeed * scale;
    const progress = Math.min(1, travel / range);
    const alpha = .89 * (1 - ease((travel - range + .65) / 1.7)) * ease((attack.duration - age) / .1);
    if (alpha <= 0) continue;
    const centerX = x + facing * Math.max(Math.min(range, travel), facing * (mouthX - x));
    const centerY = mouthY + (y + 1.67 * size - mouthY) * progress;
    const depth = Math.max(z + .69 * size, mouthZ) + i * .012;
    const radius = (.205 + 1.01 * progress) * size;
    const color = i % 2 ? '#fff09d' : '#a8dfff';
    let previous;
    for (let step = 0; step <= 7; step++) {
      const angle = (step / 7 - .5) * 2.78;
      const px = centerX - facing * (1 - Math.cos(angle)) * radius * .6;
      const py = centerY + Math.sin(angle) * radius;
      if (previous) {
        const [ax, ay] = previous;
        const width = (.11 + .055 * progress) * size;
        renderer.object('bevel', [(ax + px) * .5, (ay + py) * .5, depth], [width, Math.hypot(px - ax, py - ay) + .05, .12],
          color, [0, 0, Math.atan2(ax - px, py - ay)], .94, alpha);
      }
      previous = [px, py];
    }
  }
}

function drawRulerTrail(renderer, [x, y, z], facing, attack, size) {
  const progress = (attack.age - attack.from) / (attack.until - attack.from);
  for (let i = 0; i < 4; i++) {
    const angle = .78 - progress * 1.51 + i * .23;
    renderer.object('leaf', [x + facing * (.86 + Math.cos(angle) * 1.3) * size, y + (1.57 + Math.sin(angle) * .93) * size, z + .67],
      [.234 * size, .83 * size, .12], i % 2 ? '#e1b582' : '#ffefac', [0, 0, -facing * (1.23 + angle)], .85, (1 - progress) * .81);
  }
}

export function drawBorrowedRuler(renderer, [x, y, z], facing, attack, size) {
  const slide = pulse((attack.age - .04) / .42);
  if (slide > .01) {
    const matrix = transform([x + facing * (.63 + .27 * slide) * size, y + 1.22 * size, z + .69 * size], [size, size, size],
      [0, .12 * facing, facing * (1.12 - attack.age * 9.6)]);
    renderer.parts(ruler, matrix, false);
  }
  if (attack.age >= attack.from && attack.age <= attack.until) drawRulerTrail(renderer, [x, y, z], facing, attack, size);
}

export function draw(renderer, fighter, position, time, options) {
  const { heading = .36, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const type = attack?.type;
  const pulling = type === 'maestraHairPull';
  const reaching = pulling ? pulse((age - .018) / .234) : 0;
  const yank = pulling ? pulse((age - .109) / .26) : 0;
  const swinging = type === 'maestraRuler';
  const wind = swinging ? pulse(age / .229) : 0;
  const chop = swinging ? pulse((age - .095) / .269) : 0;
  const shouting = type === 'maestraShout';
  const inhale = shouting ? pulse(age / attack.from) : 0;
  const open = shouting ? ease((age - .144) / .13) * (1 - ease((age - .604) / .18)) : 0;
  const shoving = type === 'maestraShove';
  const brace = shoving ? pulse((age - .018) / .306) : 0;
  const push = shoving ? ease((age - .208) / .083) * (1 - ease((age - .444) / .231)) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.4) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.8, -1, 1) : 0;
  const crouch = landing * 1.16 + (guarding ? .22 : charging ? .18 : 0);
  const bob = Math.abs(stride) * .075 + Math.sin(time * 4.6) * .025 - crouch;
  const size = fighter.size;

  const root = fighterRoot(position, size, [0, heading + facing * (.38 * reaching + .27 * chop + .16 * push),
    wobble - facing * (.114 * running + .084 * reaching - .18 * yank + .078 * push)], attack);
  const body = joint(root, [0, bob - .16 * brace, .105 * reaching + .26 * push],
    [.104 * running + .24 * reaching - .27 * yank - .194 * inhale + .27 * push - .31 * recover, 0, .131 * chop]);
  renderer.parts(torso, body, flash);
  const face = joint(body, [0, 1.995, .028 - .27 * push], [-.176 * inhale + .25 * open - .09 * reaching - .29 * push, 0, pose ? -.147 : .076 * stride]);
  renderer.parts(head, face, flash);
  for (const side of [-1, 1]) {
    const eyeSize = 1 + .17 * open + .12 * push;
    renderer.parts(eye, multiply(face, transform([side * .246, .453, .465], [eyeSize, eyeSize, eyeSize], [0, side * .17, side * .14])), flash);
  }
  if (open > .06) {
    renderer.mesh('bevel', multiply(face, transform([0, .176 - .105 * open, .48], [.554, .115 + .48 * open, .121], zero)), dark);
    renderer.parts(jaw, joint(face, [0, .106 - .267 * open, .025], [.25 * open, 0, .06]), flash);
  } else {
    renderer.parts(smile, face, flash);
  }
  const shake = shouting ? Math.sin(age * 40) * open : 0;
  renderer.parts(crest, joint(face, [0, .05 * open, -.04 * push], [-.16 * running + .14 * open, .06 * shake, .079 * stride + .1 * shake - .22 * yank]), flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const pitch = airborne ? side * .4 - rise * .37 : stride * side * .81;
    renderer.parts(boot, joint(root, [side * .268, .886 - crouch * .38 + (lead ? .07 * push : 0), 0],
      [pitch - .42 * recover - (lead ? .57 * push : -.19 * brace), 0, side * (.065 + .12 * brace)]), flash);
    const armPitch = (guarding ? -1.37 : -.3 - side * stride * .63 - .33 * rise) - .94 * recover - 1.59 * push + .45 * brace +
      (lead ? -1.78 * reaching + .48 * yank - 1.49 * wind - .72 * chop : -.41 * wind) - .58 * inhale - .52 * open;
    const armRoll = side * (.306 + (pose ? .53 : 0) + .48 * open + (lead ? .22 * chop : 0) - .11 * push);
    const arm = multiply(body, transform([side * .486, 1.773, .026], [1, 1 + .26 * push, 1], [armPitch, side * (.118 + .19 * chop), armRoll]));
    renderer.parts(sleeve, arm, flash);
    const hand = joint(arm, [0, -.652, .081], [-.47 * reaching + .24 * yank - .51 * push, 0, side * .104]);
    renderer.parts(lead && swinging || pulling && yank > reaching ? fist : palm, hand, flash);
    if (lead && swinging) renderer.parts(ruler, joint(hand, [.046, -.143, .087], [-1.1 - armPitch - 1.36 * chop, .297, -.53 + chop * .91]), flash);
  }

  if (shouting && age >= attack.from) drawShout(renderer, transformPoint(face, [0, .15 - .12 * open, .546]), position, attack, size);
  if (!attack?.until || age < attack.from || age > attack.until) return;
  if (swinging) drawRulerTrail(renderer, position, facing, attack, size);
  const [x, y, z] = position;
  const progress = (age - attack.from) / (attack.until - attack.from);
  if (pulling && attack.victims.size) {
    for (const side of [-1, 1]) {
      renderer.object('leaf', [x + facing * (1.22 - .51 * progress) * size, y + (2.19 + side * .244) * size, z + .8],
        [.15, .52, .12], '#ffd3e6', [0, 0, facing * (1.19 + side * .24)], .77, (1 - progress) * .72);
    }
  } else if (shoving) {
    for (let i = -2; i <= 2; i++) {
      renderer.object('leaf', [x + facing * (1.28 + progress * .82) * size, y + (1.46 + i * (.18 + .2 * progress)) * size, z + .9],
        [.25 * size, (.7 - .082 * Math.abs(i)) * size, .15], i % 2 ? '#b4dcff' : '#fff1b4', [0, 0, -facing * 1.48 + i * .19], .97, (1 - progress) * .85);
    }
  }
}
