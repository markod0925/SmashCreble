import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { acidRainSeconds, attacks, barrageTimes } from './profile.js';

const skin = '#d99160';
const light = '#efad7d';
const shadow = '#ac6449';
const yellow = '#ebcd55';
const red = '#e5464f';
const dark = '#4a303b';
const pulse = value => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = value => smoothStep(clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.535, -.025], [.989, 1.139, .714], skin),
  part('bevel', [0, 1.749, -.008], [1.25, .638, .769], skin),
  part('bevel', [0, 1.987, -.012], [.472, .363, .423], light),
  part('bevel', [0, .96, -.008], [.936, .294, .73], yellow),
  part('plate', [0, 1.078, -.019], [.932, .167, .741], '#f4e187'),
];
for (const side of [-1, 1]) {
  torso.push(part('bevel', [side * .313, 1.77, .315], [.574, .342, .332], light, [0, side * .25, side * .13]),
    part('bevel', [side * .333, 1.368, .245], [.201, .444, .21], shadow, [0, side * .23, side * -.2]));
  for (const [y, width] of [[1.52, .29], [1.385, .26], [1.247, .235]]) {
    torso.push(part('bevel', [side * .14, y, y < 1.3 ? .368 : .393], [width, .151, .145], light, [0, side * .1, side * -.07]));
  }
}
const head = [
  part('bevel', [0, .341, .011], [.901, .798, .728], light),
  part('bevel', [0, .673, -.056], [.944, .36, .751], '#684237', [0, 0, -.1]),
  part('leaf', [-.33, .604, .267], [.329, .333, .126], '#80513e', [0, -.27, .91]),
  part('leaf', [.211, .667, .2], [.545, .277, .218], '#9c6349', [.13, .1, -1.14]),
  part('grin', [0, .22, .402], [.431, .395, .064], '#8e3f4c', [0, 0, -.08]),
  part('bevel', [0, .204, .439], [.294, .052, .036], '#fff1d8', [0, 0, -.08]),
  part('bevel', [0, .331, .399], [.151, .104, .12], '#e9a06f'),
];
for (const side of [-1, 1]) {
  head.push(part('bevel', [side * .451, .29, -.004], [.168, .234, .239], skin),
    part('bevel', [side * .153, .426, .374], [.175, .145, .077], '#ffdfb4', [0, side * .18, side * .09]),
    part('bevel', [side * .151, .425, .42], [.063, .103, .026], dark),
    part('box', [side * .17, .515, .391], [.191, .046, .042], '#6b4539', [0, side * .15, side * .22]));
}
const glove = [
  part('bombShell', [0, -.145, .044], [.56, .573, .555], red),
  part('bevel', [-.171, -.143, .229], [.207, .316, .19], '#cb344e', [.29, .14, .49]),
  part('plate', [0, .079, .019], [.443, .165, .419], '#a63453'),
  part('bevel', [.089, -.204, .264], [.197, .14, .035], '#ff8979', [.57, .06, .22], .34),
];
const upperArm = [
  part('bombShell', [0, -.077, 0], [.508, .449, .509], light),
  part('bevel', [0, -.283, .039], [.417, .471, .439], skin),
  part('bevel', [.037, -.284, .175], [.289, .287, .254], light),
];
const forearm = [part('bevel', [0, -.149, .018], [.309, .361, .326], skin)];
const leg = [
  part('bevel', [0, -.273, -.018], [.428, .664, .465], yellow),
  part('bevel', [0, -.568, .031], [.412, .376, .427], '#dfb24e'),
  part('box', [.143, -.344, .192], [.064, .559, .043], '#f5dc77', [0, .21, -.11]),
  part('bevel', [0, -.766, .157], [.481, .268, .603], '#f2d76b'),
  part('plate', [0, -.859, .171], [.491, .104, .618], '#87604f'),
];

function tripleReach({ age, from, until }) {
  return ease((age - .092) / (from - .092)) * (1 - ease((age - until) / .154));
}

function drawTripleGlove(renderer, wrist, [x, y, z], facing, size, reach, lane) {
  const endpoint = [x + facing * (1.37 + .96 * reach) * size, y + (1.59 + lane * .53) * size, z + (.94 - lane * .077) * size];
  const end = endpoint.map((value, i) => wrist[i] + (value - wrist[i]) * reach);
  const dx = end[0] - wrist[0], dy = end[1] - wrist[1];
  if (lane) {
    renderer.object('bevel', [(end[0] + wrist[0]) * .5, (end[1] + wrist[1]) * .5, (end[2] + wrist[2]) * .5],
      [.264 * size, Math.hypot(dx, dy) + .16 * size, .266 * size], skin, [0, 0, Math.atan2(-dx, dy)]);
  }
  renderer.parts(glove, transform(end, [size, size, size], [0, facing * .24, facing * (1.46 - .14 * lane)]), false);
  if (reach > .81) {
    renderer.object('leaf', [end[0] - .56 * facing * size, end[1] + .105 * size, end[2] + .17],
      [.191 * size, .78 * size, .103], '#ffd4a2', [0, 0, facing * 1.48], .88, .68 * reach);
  }
}

export function drawBorrowedTriple(renderer, position, facing, attack, size) {
  const reach = tripleReach(attack);
  if (reach <= .13) return;
  const [x, y, z] = position;
  for (const lane of [-1, 0, 1]) {
    const wrist = [x + facing * .68 * size, y + (1.6 + lane * .38) * size, z + .71 * size];
    drawTripleGlove(renderer, wrist, position, facing, size, reach, lane);
  }
}

export const portrait = { heading: .18, targetY: 1.57, fov: .47 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const triple = type === 'absTriple' ? tripleReach(attack) : 0;
  const casting = type === 'absAcidRain';
  const rain = casting ? pulse(age / attack.duration) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const strikes = type === 'absBarrage' ? barrageTimes : type === 'absJabs' ? [attacks.absJabs.from, attacks.absJabs.followUp.from] : [];
  const leftPunch = strikes.reduce((strength, from, i) => i % 2 ? strength : Math.max(strength, pulse((age - from + .061) / .151)), 0);
  const rightPunch = strikes.reduce((strength, from, i) => i % 2 ? Math.max(strength, pulse((age - from + .061) / .151)) : strength, 0);
  const stride = Math.sin(time * 15.5) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.6, -1, 1) : 0;
  const crouch = landing * 1.24 + (guarding ? .22 : charging ? .18 : 0);
  const bob = Math.abs(stride) * .077 + Math.sin(time * 5) * .029 - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.41 * (leftPunch - rightPunch) + .24 * triple),
    wobble - facing * (running * .13 + .17 * triple)], attack);
  const body = joint(root, [0, bob - .11 * rain, .16 * triple + .078 * (leftPunch + rightPunch)],
    [.14 * running + .24 * triple - .3 * recover - .18 * rain, 0, .12 * facing * (leftPunch - rightPunch)]);
  renderer.parts(torso, body, flash);
  renderer.parts(head, joint(body, [0, 1.996, .04], [.1 * triple - .38 * rain, 0, pose ? -.15 : .092 * stride]), flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const hit = lead ? leftPunch : rightPunch;
    const legPitch = airborne ? side * .48 - rise * .41 : stride * side * .88 - .23 * hit;
    renderer.parts(leg, joint(root, [side * .239, .902 - crouch * .39, 0], [legPitch - .3 * recover, 0, side * (.084 + .08 * rain)]), flash);
    const armPitch = (guarding ? -1.63 : -.58 - stride * side * .48 - rise * .36) - 1.61 * hit - .91 * triple - 2.02 * rain - .77 * recover;
    const shoulder = joint(body, [side * .571, 1.745, -.021], [armPitch, side * (.16 + .25 * hit), side * (.31 + .56 * rain + .18 * hit)]);
    renderer.parts(upperArm, shoulder, flash);
    const elbow = joint(shoulder, [0, -.452, .029], [-.69 + .61 * hit + .3 * triple + .43 * rain, 0, side * .07]);
    renderer.parts(forearm, elbow, flash);
    const wrist = joint(elbow, [0, -.319 - .074 * hit, .034], [.22 + .22 * hit, 0, 0]);
    if (triple > .035) drawTripleGlove(renderer, [wrist[12], wrist[13], wrist[14]], position, facing, size, triple, lead ? 1 : -1);
    else renderer.parts(glove, wrist, flash);
  }

  const [x, y, z] = position;
  if (triple > .29) {
    drawTripleGlove(renderer, [x + .51 * facing * size, y + 1.59 * size, z + .72], position, facing, size, triple, 0);
  }
  if (casting && age < attack.from) {
    const charge = .16 + .43 * age / attack.from;
    for (const side of [-1, 1]) {
      renderer.object('gem', [x + side * .87 * size, y + (2.11 + .62 * rain) * size, z + .53], [charge, charge * 1.42, charge],
        '#bce76f', [0, side * age * 9, -side * age * 13], .94, .72);
    }
  }
}

export function drawAcidRain(renderer, storms, time) {
  for (const storm of storms) {
    const age = storm.time - time;
    const fade = ease(age / .25) * ease((acidRainSeconds - age) / .28);
    const height = storm.top - storm.bottom;
    for (let i = 0; i < 7; i++) {
      const x = storm.x + (i / 6 - .5) * storm.radius * 1.78;
      renderer.object('bevel', [x, storm.top - .04 + .25 * Math.sin(i * 2.5 + age * 2.73), .62],
        [2.35, .84 + i % 3 * .18, 1.12], i % 2 ? '#536e4b' : '#647f55', [0, .41 * i, -.12], .51, .72 * fade);
    }
    for (let i = 0; i < 30; i++) {
      const x = storm.x + (((i * .618) % 1) * 2 - 1) * storm.radius;
      const fall = (age * (1.6 + i % 4 * .12) + i * .137) % 1;
      const y = storm.top - fall * height;
      renderer.object('leaf', [x, y, .46 + (i % 3) * .46], [.101 + (i % 3) * .032, .58 + (i % 4) * .14, .072],
        i % 3 ? '#a6ef63' : '#e4ff9a', [Math.PI, 0, -.11], .94, fade * (.52 + (i % 4) * .13));
    }
  }
}
