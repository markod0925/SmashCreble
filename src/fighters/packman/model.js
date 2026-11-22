import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { interpolate, traceAfterglow, traceDigits, traceDistance, traceDuration } from './path.js';

const amber = '#e9b64b';
const yellow = '#facd65';
const brass = '#a57334';
const dark = '#293347';
const steel = '#546484';
const blue = '#73bafa';
const pale = '#bde5fd';
const pulse = phase => Math.sin(Math.PI * clamp(phase, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const shell = [
  part('bevel', [0, 1.46, -.411], [1.72, 1.88, 1.08], amber, [-.11, 0, 0]),
  part('bevel', [0, 1.87, -.888], [1.4, .66, .478], brass, [-.15, 0, 0]),
  part('plate', [0, 1.08, -.584], [1.755, .235, 1.02], dark, [.04, 0, 0]),
  part('bevel', [0, 1.465, .071], [1.334, .772, .255], dark),
  part('plate', [0, .748, -.399], [1.208, .162, .935], steel),
  part('gem', [0, .663, -.435], [.49, .273, .5], blue, zero, .55),
];
const hood = [
  part('bevel', [0, .341, .278], [1.64, .776, 1.325], yellow),
  part('bevel', [0, .587, .28], [1.45, .376, 1.06], amber, [-.11, 0, .06]),
  part('bevel', [0, .094, .764], [1.42, .329, .65], amber),
  part('plate', [0, -.043, .693], [1.445, .137, .735], steel),
  part('box', [0, .185, 1.067], [.294, .115, .055], brass, [0, .02, -.075]),
];
const chin = [
  part('bevel', [0, -.148, .51], [1.506, .421, 1.328], amber),
  part('bevel', [0, -.275, .598], [1.28, .231, .93], brass),
  part('plate', [0, .029, .56], [1.423, .147, 1.23], steel),
  part('plate', [0, -.153, 1.094], [.657, .192, .195], yellow, [-.21, 0, 0]),
];
for (const side of [-1, 1]) {
  shell.push(
    part('disk', [side * .808, 1.445, -.241], [.447, .241, .447], brass, [0, 0, Math.PI / 2]),
    part('disk', [side * .94, 1.445, -.241], [.326, .086, .326], steel, [0, 0, Math.PI / 2]),
    part('gem', [side * .987, 1.445, -.242], [.065, .141, .141], blue, [0, side * .4, 0], .32),
  );
  hood.push(
    part('bevel', [side * .434, .387, .804], [.413, .329, .237], dark, [0, side * .27, -side * .19]),
    part('bevel', [side * .434, .388, .918], [.287, .232, .081], blue, [0, side * .27, -side * .19], .51),
    part('box', [side * .401, .396, .971], [.086, .117, .029], '#28517b', [0, side * .28, -side * .19]),
    part('gem', [side * .448, .451, .967], [.069, .062, .043], pale, zero, .8),
    part('box', [side * .639, .201, .906], [.133, .083, .054], brass, [0, side * .28, .13]),
  );
  chin.push(part('box', [side * .467, -.064, 1.026], [.118, .067, .049], brass, [0, side * .14, .04]));
}
for (const [x, length] of [[-.571, .259], [-.356, .31], [-.126, .23], [.121, .26], [.349, .314], [.562, .249]]) {
  const y = .033 - length * .43;
  const z = .96 - Math.abs(x) * .13;
  hood.push(part('leaf', [x, y, z], [.177, length, .153], Math.abs(x) > .4 ? blue : pale, [Math.PI - .197, .03, x * .158], .26));
  chin.push(part('leaf', [x * .975, .052 + length * .2, z + .048], [.168, length * .84, .139], blue, [.12, .02, -x * .17], .24));
}
const pod = [
  part('bevel', [0, 0, 0], [.448, .404, .606], brass),
  part('plate', [0, .061, .124], [.477, .248, .534], yellow),
  part('box', [0, -.035, .353], [.251, .085, .063], steel),
  part('gem', [0, -.209, -.015], [.295, .161, .332], blue, zero, .7),
];
const castColors = new Map([
  [amber, '#3184c9'], [yellow, '#75c7ff'], [brass, '#2460a0'], [dark, '#1a3e6b'],
  [steel, '#5ebaf0'], [blue, '#9cecff'], [pale, '#e3feff'],
]);
const chargedParts = parts => parts.map(entry => ({ ...entry, color: castColors.get(entry.color) ?? '#4691c8', glow: Math.max(entry.glow, .58) }));
const normalRig = { shell, hood, chin, pod };
const traceRig = { shell: chargedParts(shell), hood: chargedParts(hood), chin: chargedParts(chin), pod: chargedParts(pod) };

export const portrait = { targetY: 1.48, fov: .405, heading: .46 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .4, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const trace = attack?.trace67;
  const biting = attack?.type === 'packmanBite';
  const gas = attack?.type === 'packmanGas' ? pulse(age / attack.duration) : 0;
  const aiming = attack?.type === 'packmanLaser' ? pulse(age / attack.duration) : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const dent = landing * .95 + (guarding ? .18 : charging ? .12 : 0);
  const bob = trace ? Math.sin(age * 18) * .035 : Math.sin(time * 6) * .07 + stride * .045;
  const thrust = biting ? pulse((age - .02) / .3) : 0;
  const jaw = trace ? 1.18 * (.5 + .5 * Math.sin(age * TAU * 10.6))
    : biting ? .93 * pulse(age < .15 ? age / .25 : (age - .19) / .23)
      : (pose ? .56 : .14 + .087 * Math.sin(time * 5.2)) + gas * .12 + recover * .32;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * thrust * .13,
    wobble - facing * (running * .115 + thrust * .12 - gas * .21)]);
  const body = joint(root, [0, bob - dent, thrust * .11], [.128 * running - rise * .13 - recover * .42, 0, 0]);
  const rig = trace ? traceRig : normalRig;
  const blink = flash && !trace;
  renderer.parts(rig.shell, body, blink);
  renderer.parts(rig.hood, joint(body, [0, 1.489, -.33], [-jaw * .48 - aiming * .14, 0, -.037]), blink);
  renderer.parts(rig.chin, joint(body, [0, 1.407, -.35], [jaw * .8 + aiming * .12, 0, .027]), blink);

  for (const side of [-1, 1]) {
    const motor = joint(body, [side * (.776 + rise * .081), .672 + side * stride * .091, -.366 + thrust * .18],
      [-rise * .61 - recover * .64, side * .14, side * (guarding ? .39 : .14)]);
    renderer.parts(rig.pod, motor, blink);
    const spark = (airborne ? .24 : .12) + running * .11 + recover * .16;
    renderer.mesh('leaf', multiply(motor, transform([0, -.33, 0], [.166, spark, .165], [Math.PI, 0, time])), pale, .66, .51);
  }

  const [x, y, z] = position;
  if (trace) {
    renderer.object('bevel', [x, y + 1.44 * size, z - .11], [2.34 * size, 2.46 * size, 1.72 * size], '#429dff',
      [0, heading + age * .6, 0], 1, .17 + .045 * Math.sin(age * 23));
    for (let i = 0; i < 3; i++) {
      const phase = (age * 3.8 + i / 3) % 1;
      renderer.object('gem', [x - facing * (.91 + phase * .61), y + 1.12 + i * .39, z + .82],
        [.31 * (1 - phase), .152, .124], '#b8f3ff', [0, age * 4 + i, .42], .97, (1 - phase) * .86);
    }
  } else if (attack?.until && age >= attack.from && age <= attack.until) {
    if (attack.type === 'packmanGas') drawGasCloud(renderer, position, facing, attack, size);
    if (attack.type === 'packmanLaser') drawEyeLasers(renderer, position, facing, attack, size);
    if (biting) renderer.object('leaf', [x + facing * 1.2 * size, y + 1.34 * size, z + .64], [.3, .78, .11],
      '#cef3fc', [0, 0, -facing * .97], .77, thrust * .67);
  }
}

export function drawGasCloud(renderer, [x, y, z], facing, attack, size) {
  const progress = clamp((attack.age - attack.from) / (attack.until - attack.from), 0, 1);
  for (let i = 0; i < 6; i++) {
    const side = i < 4 ? -facing : facing;
    const radius = (.51 + progress * 1.35) * (.74 + (i % 4) * .15);
    const thickness = (.27 + progress * .72 + (i % 3) * .09) * size;
    renderer.object('bevel', [x + side * radius * size, y + (.85 + progress * .62 + Math.sin(i * 1.67) * .31) * size, z + .46 + i * .071],
      [thickness * 1.34, thickness * .85, thickness], i % 2 ? '#b9c47c' : '#a1b975', [.19, i, .16 * side], .54, (1 - progress) * .76);
  }
}

function drawEyeLasers(renderer, [x, y, z], facing, attack, size) {
  const span = attack.range - .76;
  const opacity = 1 - (attack.age - attack.from) / (attack.until - attack.from) * .78;
  for (const [height, depth] of [[2.02, .53], [2.2, .85]]) {
    const origin = x + facing * .76 * size;
    const center = [origin + facing * span * .5, y + height * size, z + depth];
    renderer.object('box', center, [span, .143, .112], '#3e9dff', zero, .98, opacity * .73);
    renderer.object('box', [center[0], center[1], center[2] + .07], [span, .059, .068], '#cbfbff', zero, 1, opacity);
    renderer.object('gem', [origin, center[1], center[2] + .08], [.329, .255, .193], '#9eefec', [0, attack.age * 9, .23], .98, opacity);
  }
}

export function drawTrace67(renderer, age) {
  const fade = clamp((traceDuration + traceAfterglow - age) / traceAfterglow, 0, 1);
  for (const stroke of traceDigits) {
    const covered = traceDistance(stroke, age);
    for (const { from, to, offset, distance } of stroke.segments) {
      const painted = Math.min(distance, covered - offset);
      if (painted <= 0) break;
      const [bx, by] = interpolate(from, to, painted / distance);
      const [ax, ay] = from;
      const x = (ax + bx) * .5;
      const y = (ay + by) * .5;
      const angle = Math.atan2(by - ay, bx - ax);
      renderer.object('box', [x, y, 2.43], [painted + .094, .42, .116], '#369aff', [0, 0, angle], 1, fade * .37);
      renderer.object('box', [x, y, 2.49], [painted + .081, .194, .12], '#91dcff', [0, 0, angle], 1, fade * .77);
      renderer.object('box', [x, y, 2.57], [painted + .068, .079, .079], '#e6fcff', [0, 0, angle], 1, fade * .91);
    }
  }
}
