import { clamp } from '../../math.js';
import { multiply, one, smoothStep, TAU, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';
import { companionCount, companionOrbit, returnSeconds } from './profile.js';

const orange = '#e79050';
const copper = '#b45645';
const mint = '#a3d89b';
const dark = '#304447';
const ice = '#b3dedd';
const red = '#c85a64';
const cream = '#f5dfb4';
const pulse = (phase) => Math.sin(Math.PI * clamp(phase, 0, 1));
const mix = (a, b, t) => a + (b - a) * t;
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.38, -.03], [.96, 1.23, .79], orange),
  part('plate', [0, 1.19, .018], [.954, .21, .805], copper),
  part('bevel', [0, 1.528, .36], [.502, .486, .142], cream),
  part('bevel', [0, 1.52, .444], [.327, .292, .051], dark),
  part('gem', [0, 1.53, .473], [.241, .21, .067], '#78f1d6', [0, 0, .23], .53),
  part('bevel', [0, 1.57, -.462], [.724, .821, .37], copper),
  part('box', [0, 1.63, -.661], [.587, .381, .086], '#d19964'),
  part('plate', [0, 1.96, 0], [.94, .169, .833], dark),
  part('plate', [0, 2.051, .037], [.956, .12, .856], ice),
];
for (const side of [-1, 1]) {
  torso.push(
    part('tube', [side * .318, 1.54, -.609], [.193, .58, .191], '#d6c5a5', [0, 0, side * .08]),
    part('gem', [side * .14, 1.16, .414], [.093, .086, .056], '#f3b56a', zero, .27),
  );
}

const head = [
  part('bevel', [0, .293, 0], [.724, .707, .698], '#77b380'),
  part('bevel', [0, .223, .186], [.608, .398, .479], mint),
  part('bevel', [0, .283, .384], [.225, .14, .146], '#8bc69f'),
  part('grin', [0, .152, .407], [.355, .349, .105], '#405350'),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .16, .372, .344], [.18, .199, .12], cream, [0, side * .16, side * .08]),
    part('box', [side * .155, .369, .414], [.074, .115, .035], dark, [0, side * .19, side * .1]),
    part('box', [side * .135, .397, .44], [.03, .035, .012], '#ffffee', zero, .3),
    part('tube', [side * .143, .638, -.031], [.062, .321, .059], '#50835f', [0, 0, -side * .42]),
    part('gem', [side * .223, .803, -.039], [.139, .133, .132], '#b7e995', zero, .35),
  );
}

const arm = [
  part('bevel', [0, -.187, .003], [.353, .563, .373], orange),
  part('bevel', [0, -.48, .045], [.29, .392, .336], copper),
  part('plate', [0, -.599, .049], [.336, .115, .376], cream),
  part('bevel', [0, -.715, .071], [.301, .239, .328], '#79b985'),
];
const leg = [
  part('bevel', [0, -.293, -.018], [.34, .744, .407], '#72a88d'),
  part('plate', [0, -.44, .089], [.325, .181, .364], '#53886e'),
  part('bevel', [0, -.698, .135], [.396, .29, .521], red),
  part('plate', [0, -.802, .146], [.391, .105, .51], '#593c47'),
  part('box', [0, -.692, .395], [.201, .084, .032], '#f79c79'),
];

const sproutColors = [
  ['#e96570', '#9d3d53', '#f6ab9b'],
  ['#63bcf1', '#32679d', '#a0e0f7'],
  ['#f3cf5a', '#9d722e', '#fff09c'],
];
const sproutRigs = sproutColors.map(([color, shade, accent], index) => [
  part('bevel', [0, -.067, 0], [.64, .61, .563], color),
  part('bevel', [0, .176, .043], [.726, .38, .603], color),
  part('plate', [0, -.284, .006], [.442, .139, .426], shade),
  part('bevel', [0, .165, .329], [.486, .207, .072], shade),
  part('bevel', [-.079, .174, .378], [.102, .098, .041], '#ffffea', zero, .76),
  part('bevel', [.079, .174, .378], [.102, .098, .041], '#ffffea', zero, .76),
  part('leaf', [-.336, -.005, -.092], [.237, .433, .268], accent, [0, -.33, .86]),
  part('leaf', [.336, -.005, -.092], [.237, .433, .268], accent, [0, .33, -.86]),
  part('tube', [0, .437, -.019], [.073, .301, .074], '#4f9770', [0, 0, -.12]),
  part(index === 1 ? 'star' : index === 2 ? 'gem' : 'leaf', [.041, .601, -.014],
    [.326, .347, .15], accent, [0, .21, -.39], .36),
]);

function drawSprout(renderer, index, position, size, heading, tilt) {
  const root = transform(position, [size, size, size], [0, heading, tilt]);
  renderer.parts(sproutRigs[index], root, false);
}

function bladePoint(position, facing, age, index, size) {
  const [x, y, z] = position;
  const angle = age < .3 ? 1.48 - clamp((age - .085) / .18, 0, 1) * 2.15
    : -.67 + clamp((age - .303) / .195, 0, 1) * 2.04;
  const distance = .45 + index * .434;
  return [x + facing * (.65 + Math.cos(angle) * distance) * size,
    y + (1.49 + Math.sin(angle) * distance) * size, z + .85 * size, angle];
}

function bladeTrail(renderer, position, facing, attack, size) {
  if (attack.age < attack.from || attack.age > attack.until) return;
  const streak = 1 - (attack.age - attack.from) / (attack.until - attack.from);
  const [x, y, z, angle] = bladePoint(position, facing, attack.age, 3, size);
  renderer.object('leaf', [x, y, z + .08], [.29 * size, .83 * size, .09], '#d7fcbe',
    [0, 0, facing * (angle - .95)], .92, .81 * streak);
}

function bladeEdge(renderer, position, facing, attack, size, shape) {
  const [x, y, z, angle] = bladePoint(position, facing, attack.age, 1.12, size);
  const length = 1.44 * size;
  renderer.object('box', [x, y, z - .07], [length, .102 * size, .096],
    '#a4ecc6', [0, 0, facing > 0 ? angle : Math.PI - angle], .94, shape * .65);
  const [tx, ty, tz] = bladePoint(position, facing, attack.age, 2.63, size);
  renderer.object('leaf', [tx, ty, tz], [.162 * size, .49 * size, .103],
    '#d3ffdc', [0, 0, facing * (angle - Math.PI / 2)], .95, shape * .84);
}

export function drawBorrowedBlade(renderer, position, facing, attack, size) {
  const shape = clamp(Math.min(attack.age / .11, (attack.duration - attack.age) / .13), 0, 1);
  if (shape <= 0) return;
  const scale = size * .51 * shape;
  bladeEdge(renderer, position, facing, attack, size, shape);
  for (let i = 0; i < companionCount; i++) {
    const [x, y, z, angle] = bladePoint(position, facing, attack.age, i, size);
    drawSprout(renderer, i, [x, y, z], scale, facing * .49, facing * (angle - Math.PI / 2));
  }
  bladeTrail(renderer, position, facing, attack, size);
}

function drawCompanions(renderer, position, size, clock, attack, facing, assault, remaining) {
  const blade = attack?.type === 'olivarBlade';
  const [x, y, z] = position;
  const returning = smoothStep(clamp(-remaining / returnSeconds, 0, 1));
  const shape = blade ? smoothStep(clamp(Math.min(attack.age / .13, (attack.duration - attack.age) / .15), 0, 1)) : 0;
  if (shape > .45) bladeEdge(renderer, position, facing, attack, size, (shape - .45) / .55);
  for (let i = 0; i < companionCount; i++) {
    const [ox, oy, oz] = companionOrbit(i, clock);
    const orbit = [x + ox * size, y + oy * size, z + oz * size];
    const unit = assault?.units[i];
    const from = unit ? [mix(unit.x, orbit[0], returning), mix(unit.y, orbit[1], returning), mix(.6 + unit.z, orbit[2], returning)] : orbit;
    const scale = .54 * size * (unit ? mix(1.34, 1, returning) : 1);
    if (blade) {
      const [bx, by, bz, angle] = bladePoint(position, facing, attack.age, i, size);
      drawSprout(renderer, i, [mix(from[0], bx, shape), mix(from[1], by, shape), mix(from[2], bz, shape)],
        scale, facing * .49, facing * (angle - Math.PI / 2) * shape);
    } else {
      drawSprout(renderer, i, from, scale, (unit?.facing ?? 1) * .32, .1 * Math.sin(clock * 7 + i));
    }
  }
  if (blade) bladeTrail(renderer, position, facing, attack, size);
}

export const portrait = { targetY: 1.66, fov: .48, heading: .13 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .35, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0,
    companionClock = time, companionAssault = null, companionRemaining = 0 } = options;
  const age = attack?.age ?? 0;
  const combo = attack?.type === 'olivarCombo';
  const kick = combo ? pulse(age / .245) : 0;
  const jab = combo ? pulse((age - .18) / .31) : 0;
  const slash = attack?.type === 'olivarBlade' ? pulse(age / attack.duration) : 0;
  const command = attack?.type === 'olivarAssault' ? pulse(age / attack.duration) : 0;
  const laser = attack?.type === 'olivarLaser' ? pulse(age / attack.duration) : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 14.7) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.18 + (guarding ? .22 : charging ? .18 : 0);
  const bob = Math.abs(stride) * .087 + Math.sin(time * 4.5) * .025 - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.35 * jab + slash * .21),
    wobble - facing * (running * .104 + jab * .13)], attack);
  const body = joint(root, [0, bob, .096 * jab], [.103 * running - kick * .19 - recover * .31, 0, -.071 * command]);
  renderer.parts(torso, body, flash);
  const helmet = joint(body, [0, 2.067, .041], [-recover * .21, jab * .16, pose ? -.061 : stride * .07]);
  renderer.parts(head, helmet, flash);
  renderer.mesh('bombShell', multiply(helmet, transform([0, .448, 0], [1.198, 1.079, 1.002], zero)), '#9cdbdf', .24, .18);
  renderer.mesh('leaf', multiply(helmet, transform([-.412, .622, .337], [.121, .415, .043], [0, -.32, -.59])), '#d7fbfe', .67, .49);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const foot = joint(root, [side * .238, .84 - crouch * .36, 0], [airborne ? side * .43 - rise * .48 : side * stride * .77,
      0, side * .095]);
    renderer.parts(leg, joint(foot, [0, 0, .09 * kick], [-(lead ? kick * 1.66 : 0) - recover * .32, 0, 0]), flash);
    const punch = lead ? jab : 0;
    const swing = guarding ? -1.38 : -side * stride * .54 - rise * .31 - recover * 1.35 - laser * .83 - command * 1.68 -
      (lead ? punch * 1.75 + slash * 1.6 : .17 * slash);
    const reach = .31 + (pose ? .15 : 0) + laser * .74 + .25 * command;
    renderer.parts(arm, joint(body, [side * .473, 1.797, .005], [swing, side * punch * .12, side * reach]), flash);
  }

  if (laser) {
    const [x, y, z] = position;
    const fired = age >= attack.from;
    const glow = fired ? Math.max(0, 1 - (age - attack.from) * 3.8) : age / attack.from;
    if (glow > 0) {
      renderer.object('gem', [x, y + 1.74, z + .91], [.47 + glow * .56, .55 + glow * .52, .26], '#c7ffea', [0, time * 3, time * 3.7], .97, glow * .86);
    }
  }
  drawCompanions(renderer, position, size, companionClock, attack, facing, companionAssault, companionRemaining);
}

function drawBeam(renderer, { x, y, angle, remaining }) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const fade = clamp(remaining * 5.4, .21, .93);
  const rotation = [0, 0, angle];
  renderer.object('box', [x - dx * .76, y - dy * .76, .88], [2.02, .15, .095], '#4cdbd8', rotation, 1, fade * .74);
  renderer.object('box', [x - dx * .31, y - dy * .31, .94], [1.17, .065, .077], '#d1ffe7', rotation, 1, fade);
}

export const projectiles = { olivarBeam: drawBeam };
