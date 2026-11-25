import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const charcoal = '#333342';
const soot = '#242433';
const slate = '#5c576c';
const coral = '#ef7886';
const cream = '#ffeddc';
const pink = '#ffc8d0';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));

const body = [
  part('bevel', [0, 1.473, -.054], [.939, 1.16, .714], charcoal, [.12, 0, .028]),
  part('bevel', [0, 1.961, .037], [.452, .391, .449], soot, [.08, 0, 0]),
  part('bevel', [.005, 1.464, .286], [.685, .977, .306], '#474054', [.13, 0, -.036]),
  part('leaf', [0, 1.488, .45], [.364, .907, .083], '#763e59', [Math.PI, 0, -.035]),
  part('leaf', [0, 1.49, .491], [.27, .788, .052], coral, [Math.PI, 0, -.031]),
  ...[-1, 1].map(side => part('leaf', [side * .269, 1.757, .381], [.215, .48, .097], slate, [.22, side * .23, side * -.34])),
];
for (let i = 0; i < 4; i++) {
  const edge = i % 2 ? -1 : 1;
  body.push(part('leaf', [edge * .075, 1.28 + i * .128, .516], [.115, .227, .055], cream, [0, 0, edge * .81]));
}

const head = [
  part('horn', [0, .355, .011], [1.317, 1.06, .947], charcoal, [.092, -.023, Math.PI]),
  part('bevel', [0, .693, .048], [1.287, .375, .9], soot, [.19, 0, -.036]),
  part('bevel', [0, .404, .303], [.879, .685, .452], '#414052', [.18, 0, .03]),
  part('leaf', [.014, .792, .314], [.397, .278, .197], slate, [.1, -.16, -.37]),
  part('bevel', [0, .163, .443], [.717, .234, .362], '#823c57', [-.14, 0, -.016]),
  part('bevel', [0, .13, .539], [.621, .151, .204], '#292231', [-.073, 0, .014]),
];
const jaw = [
  part('bevel', [0, -.036, .211], [.644, .239, .554], charcoal, [-.18, 0, 0]),
  part('bevel', [.013, .055, .304], [.57, .117, .465], '#a84f6c', [-.16, 0, -.023]),
  part('bevel', [0, .102, .295], [.324, .078, .342], '#d57086'),
];
for (const side of [-1, 1]) {
  head.push(
    part('leaf', [side * .554, .717, .123], [.212, .463, .329], soot, [.28, side * .31, -side * .82]),
    part('bevel', [side * .32, .599 - side * .032, .468], [.284, .239, .132], soot, [0, side * .21, side * .39]),
    part('leaf', [side * .32, .598 - side * .032, .554], [.232, .281, .064], cream, [-.11, side * .19, side * .65 + .14], .37),
    part('bevel', [side * .28, .59 - side * .033, .583], [.061, .1, .033], '#584152', [0, side * .21, -.13]),
  );
  for (let i = 0; i < 3; i++) {
    head.push(part('horn', [side * (.1 + i * .089), .102 + i * .016, .558 - i * .034],
      [.116, .174 - i * .02, .085], cream, [Math.PI + .076, 0, side * .16]));
    jaw.push(part('horn', [side * (.083 + i * .083), .124 + i * .012, .483 - i * .036],
      [.096, .154 - i * .011, .087], cream, [.13, 0, -side * .13]));
  }
}

const upperArm = [
  part('bevel', [0, -.222, -.005], [.291, .679, .345], soot),
  part('bevel', [0, -.13, .075], [.256, .397, .213], charcoal, [.15, 0, 0]),
];
const forearm = [
  part('bevel', [0, -.194, .009], [.227, .563, .265], charcoal),
  part('bevel', [0, -.397, .11], [.342, .219, .296], slate, [.36, 0, 0]),
];
for (const finger of [-1, 0, 1]) {
  forearm.push(part('leaf', [finger * .107, -.58, .157], [.138, .371 - .044 * Math.abs(finger), .139], cream, [Math.PI - .31, 0, finger * .21]),
    part('horn', [finger * .15, -.735 + .036 * Math.abs(finger), .24], [.11, .227, .108], coral, [Math.PI - .22, 0, finger * .28]));
}
const thigh = [part('bevel', [0, -.186, .009], [.263, .491, .328], soot)];
const foot = [
  part('bevel', [0, -.152, .018], [.222, .411, .27], charcoal),
  part('bevel', [0, -.462, .153], [.355, .185, .448], slate, [-.08, 0, .021]),
  ...[-1, 0, 1].map(toe => part('horn', [toe * .103, -.45, .348], [.114, .195, .117], coral, [Math.PI / 2, 0, -toe * .23])),
];

export function drawClawSwipe(renderer, [x, y, z], facing, attack, size) {
  const progress = (attack.age - attack.from) / (attack.until - attack.from);
  if (progress < 0 || progress > 1) return;
  const cross = attack.type === 'killyClaws';
  for (const direction of (cross ? [-1, 1] : [1])) {
    for (let i = 0; i < 3; i++) {
      renderer.object('scythe', [x + facing * (1.48 + .42 * progress + i * .17) * size, y + (1.64 + .21 * i - .4 * progress) * size, z + .69 + i * .032],
        [facing * (cross ? 1.23 : .84) * size, (.78 + .16 * i) * size, .26], i % 2 ? coral : pink,
        [0, .05, facing * direction * (1.32 - .55 * progress)], .97, .87 * (1 - progress));
    }
  }
}

function drawMouthWind(renderer, mouth, facing, size, attack, drawSpit) {
  const [x, y, z] = mouth;
  const inhale = attack.age >= attack.from && attack.age < attack.swallowAt;
  if (!inhale && !drawSpit) return;
  const phase = inhale ? (attack.age - attack.from) / (attack.swallowAt - attack.from) : (attack.age - attack.biteAt) / .28;
  const reach = inhale ? attack.range * .78 : 2 * size;
  for (let i = 0; i < (inhale ? 10 : 6); i++) {
    const drift = (i * .28 + (inhale ? 1 - phase * 3 : phase * 2) + 4) % 1;
    const theta = i * 2.39 + phase * TAU;
    renderer.object('leaf', [x + facing * reach * drift, y + Math.sin(theta) * (.3 + drift * .9) * size, z + Math.cos(theta) * .37 * size],
      [.155 * size, (.36 + drift * .62) * size, .16], i % 2 ? '#afedeb' : '#fff1e9',
      [0, 0, -facing * 1.57 + .33 * Math.sin(theta)], .96, (1 - phase) * (.78 - drift * .21));
  }
}

export const portrait = { heading: .26, targetY: 1.71, fov: .55 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const scratching = type === 'killyScratch';
  const crossing = type === 'killyClaws';
  const windy = type === 'killyAirBlades';
  const swiping = scratching || crossing || windy;
  const swallowing = type === 'killyGulp';
  const windup = swiping ? pulse(age / (attack.from + .04)) : 0;
  const swipe = swiping ? pulse((age - attack.from + .052) / (scratching ? .235 : .345)) : 0;
  const suck = swallowing ? ease(age / .212) * ease((attack.swallowAt - age) / .13) : 0;
  const full = swallowing && attack.captures?.length && age >= attack.swallowAt ? 1 : 0;
  const spit = swallowing ? pulse((age - attack.biteAt + .054) / .234) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 16) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) : 0;
  const crouch = landing * 1.35 + (guarding ? .27 : charging ? .21 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.35 * swipe - .56 * windup + .14 * spit),
    wobble - facing * (.11 * running + .21 * swipe - .23 * windup)], attack);
  const torso = multiply(root, transform([0, Math.abs(stride) * .088 + .033 * Math.sin(time * 5.1) - crouch, .12 * swipe + .12 * suck],
    [1 + full * .22, 1 + full * .065, 1 + full * .2], [.18 * running + .27 * swipe - .29 * windup + .16 * suck + .39 * spit - .3 * recover, 0, .085 * stride]));
  renderer.parts(body, torso, flash);
  const skull = multiply(torso, transform([0, 2.12, .056 + .195 * suck + .23 * spit],
    [1 + .18 * suck + .13 * spit, 1 + .06 * full, 1 + .19 * suck], [-.05 - .24 * suck - .33 * spit + .22 * swipe, .15 * stride, .074 * full * Math.sin(time * 29)]));
  renderer.parts(head, skull, flash);
  const gape = .13 + .078 * Math.sin(time * 4.9) + 1.23 * suck + 1.06 * spit + .29 * recover - .09 * full;
  const hinge = joint(skull, [0, .054 - .2 * suck, -.077], [gape, 0, .084 * full * Math.sin(time * 27)]);
  renderer.parts(jaw, hinge, flash);
  if (swallowing) {
    drawMouthWind(renderer, transformPoint(skull, [0, .033 - .11 * suck, .62]), facing, size, attack,
      age >= attack.biteAt && age < attack.biteAt + .28);
  }

  for (const side of [-1, 1]) {
    const leg = joint(root, [side * .244, 1.001 - .63 * crouch, -.062],
      [airborne ? side * .56 - .63 * rise : stride * side * .96 - .27 * swipe, 0, side * (.166 + .23 * suck + .14 * swipe)]);
    renderer.parts(thigh, leg, flash);
    renderer.parts(foot, joint(leg, [0, -.465, .02], [airborne ? .44 + side * .24 : .26 * Math.max(0, -side * stride), 0, 0]), flash);

    const lead = side === facing;
    const swing = lead || !scratching ? swipe : .32 * swipe;
    const pitch = (guarding ? -1.26 : -.23 - side * stride * .79 - .31 * rise) + (lead ? .98 : .76) * windup -
      (crossing || windy ? 1.85 : 1.54) * swing - 1.13 * suck - .83 * spit - .78 * recover;
    const spread = side * (.48 + (pose ? .64 : 0) + .59 * windup + .48 * suck - (crossing ? .57 : .19) * swing);
    const shoulder = joint(torso, [side * .421, 1.773, -.029], [pitch, side * (.14 + .36 * windup), spread]);
    renderer.parts(upperArm, shoulder, flash);
    renderer.parts(forearm, joint(shoulder, [0, -.459, .024], [-.46 + .39 * swing - .5 * suck, side * -.13, side * (.14 - .38 * swipe)]), flash);
  }

  if (scratching || crossing) drawClawSwipe(renderer, position, facing, attack, size);
}

export const projectiles = {
  killyWindBlade(renderer, { x, y, vx, vy, scale, lane, remaining }, time) {
    const facing = Math.sign(vx);
    const angle = Math.atan2(vy, Math.abs(vx));
    const shade = lane === 0 ? cream : '#b7f0f1';
    const rotation = [0, Math.sin(time * 9 + lane) * .15, facing * (1.31 + angle)];
    const fade = Math.min(1, remaining * 10);
    renderer.object('scythe', [x, y + .42 * scale, .86 + lane * .095], [facing * .98 * scale, 1.33 * scale, .48], shade, rotation, 1, .96 * fade);
    renderer.object('scythe', [x - facing * .33 * scale, y + .37 * scale, .8 + lane * .095], [facing * 1.1 * scale, 1.45 * scale, .34],
      '#83d6eb', rotation, .98, .66 * fade);
  },
};
