import { clamp } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { reserveRounds } from './profile.js';

const custard = '#e8bd94';
const cream = '#f9dcb1';
const caramel = '#a66448';
const ink = '#523d48';
const red = '#c74751';
const teal = '#76e4df';
const gold = '#ffcc79';
const pulse = value => Math.sin(Math.PI * clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const jelly = [
  part('bevel', [0, 1.61, -.017], [1.64, 2.26, 1.143], custard),
  part('bevel', [0, 1.62, .358], [1.348, 1.9, .434], cream),
  part('bevel', [-.449, 1.994, .43], [.183, .676, .121], '#fff0c7', [.077, -.34, -.111], .29),
  part('plate', [0, .641, .003], [1.31, .119, .97], '#c79473', [.038, 0, -.034]),
  part('bevel', [-.044, 2.705, .075], [.527, .09, .773], caramel, [0, 0, -.092]),
  part('bevel', [-.077, 2.56, .447], [.312, .37, .154], '#8c4b3a', [-.31, -.103, .183]),
  part('bevel', [.044, 2.483, .478], [.14, .366, .087], caramel, [.14, .12, -.205]),
  part('grin', [0, 1.72, .591], [.455, .468, .085], ink, [0, 0, -.07]),
  part('bevel', [.024, 1.675, .641], [.181, .065, .034], '#e49388'),
  part('gem', [0, .965, .562], [.219, .194, .147], '#a3374d', [0, 0, -.05]),
];
for (const side of [-1, 1]) {
  jelly.push(
    part('bevel', [side * .268, 2.008 + side * .026, .512], [.39, .338, .153], '#fff4dc', [0, side * .225, side * .072]),
    part('bevel', [side * .226, 2.015 + side * .026, .594], [.193, .233, .061], ink, [0, side * .23, 0]),
    part('gem', [side * .237 - .029, 2.069 + side * .026, .631], [.077, .089, .038], '#fff9e8', zero, .72),
    part('bevel', [side * .44, 1.77, .499], [.181, .098, .063], '#e49f8f', [0, side * .29, side * .122]),
    part('leaf', [side * .142, .975, .571], [.265, .281, .118], red, [0, 0, side * -.46 + side * Math.PI / 2]),
  );
}
const arm = [
  part('bombShell', [0, -.145, 0], [.383, .473, .385], cream),
  part('bombShell', [0, -.372, .026], [.289, .397, .3], custard),
  part('bevel', [0, -.588, .061], [.259, .225, .259], cream),
  part('bevel', [-.086, -.558, .167], [.112, .134, .117], custard, [0, 0, .2]),
];
const leg = [
  part('bevel', [0, -.165, 0], [.221, .467, .276], custard),
  part('bevel', [0, -.407, .107], [.319, .238, .446], caramel),
  part('bevel', [0, -.529, .125], [.327, .085, .453], '#7f5349'),
  part('bevel', [0, -.379, .279], [.227, .118, .143], cream),
];

function drawBlaster(renderer, matrix, heavy, phase) {
  const tint = heavy ? gold : teal;
  const casing = heavy ? '#764f75' : '#68758e';
  renderer.mesh('bevel', multiply(matrix, transform(zero, [1, .456, .461], zero)), casing);
  renderer.mesh('gem', multiply(matrix, transform([.27, .044, .002], [.569, .463, .478], [0, 0, -Math.PI / 2])), tint, .7);
  renderer.mesh('gem', multiply(matrix, transform([.553, .044, .006], [.241 + phase * .21, .251 + phase * .23, .249], [0, 0, .46])), '#fff4d1', .98);
}

export function drawBorrowedFiveK(renderer, [x, y, z], facing, attack, size) {
  const recoil = pulse((attack.age - attack.from + .055) / .207);
  if (recoil < .025) return;
  const width = .64 * size;
  drawBlaster(renderer, transform([x + facing * .75 * size, y + 1.38 * size, z + .59], [width, width, width], [0, facing > 0 ? 0 : Math.PI, .1]), false, recoil);
}

export const portrait = { heading: .193, targetY: 1.59, fov: .453 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .3, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0, reserveAmmo = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const punch = type === 'budinoCombo' ? pulse((age - .021) / .177) : 0;
  const kick = type === 'budinoCombo' ? pulse((age - .17) / .27) : 0;
  const heavy = type === 'budinoTwentyK';
  const firing = heavy || type === 'budinoFiveK';
  const recoil = firing ? pulse((age - attack.from + .077) / (heavy ? .34 : .21)) : 0;
  const aim = firing ? pulse(age / attack.duration) : 0;
  const loading = type === 'budinoReserve' ? pulse(age / attack.duration) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.7) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) : 0;
  const crouch = landing * 1.21 + (guarding ? .19 : charging ? .17 : 0);
  const bob = Math.abs(stride) * .091 + Math.sin(time * 4.8) * .046 - crouch;
  const size = fighter.size;
  const jolt = recoil * Math.sin(Math.max(0, age - (attack?.from ?? 0)) * 39);
  const root = fighterRoot(position, size, [0, heading + facing * (.29 * punch - .38 * aim),
    wobble - facing * (running * .125 + .19 * punch - .24 * recoil + .11 * kick)], attack);
  const body = multiply(root, transform([0, bob + .105 * loading, .098 * punch],
    [1 + .12 * crouch + .074 * jolt, 1 - .17 * crouch - .061 * jolt, 1], [.118 * running + .26 * punch - .32 * recover, 0, loading * .125 * Math.sin(age * 26)]));
  renderer.parts(jelly, body, flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legPitch = airborne ? .49 * side - .39 * rise : side * stride * .86;
    renderer.parts(leg, joint(root, [side * .31, .599 - .36 * crouch, -.02],
      [legPitch - (lead ? 1.91 * kick : 0) - .38 * recover, 0, side * (.171 + .17 * loading)]), flash);
    const pitch = (guarding ? -1.22 : -.33 - side * stride * .66 - .44 * rise) - 1.26 * recover - .97 * loading +
      (lead ? -1.77 * punch - 1.01 * aim + .56 * recoil : -.38 * aim);
    const shoulder = joint(body, [side * .681, 1.597, -.028], [pitch, side * (.10 + .19 * punch), side * (.47 + .71 * loading + (pose ? .64 : 0))]);
    renderer.parts(arm, shoulder, flash);
    if (firing && lead) {
      const muzzle = transformPoint(shoulder, [0, -.629, .134]);
      const width = (heavy ? 1.03 : .74) * size;
      drawBlaster(renderer, transform(muzzle, [width, width, width], [0, facing < 0 ? Math.PI : 0, .15 * recoil * facing]), heavy, recoil);
    }
  }

  const segments = Math.ceil(reserveAmmo / (reserveRounds / 4));
  for (let i = 0; i < segments; i++) {
    renderer.mesh('gem', multiply(body, transform([-.294 + i * .194, 1.226, .624], [.137, .146, .066], [0, 0, .76])), i % 2 ? teal : gold, .86);
  }
  if (loading <= .035) return;
  const [x, y, z] = position;
  for (let i = 0; i < 7; i++) {
    const angle = age * 11.3 + i * TAU / 7;
    const radius = 1.01 + .47 * loading;
    renderer.object('gem', [x + Math.cos(angle) * radius * size, y + (1.67 + Math.sin(angle) * radius) * size, z + .58],
      [.32 * size, .161 * size, .132 * size], i % 2 ? teal : gold, [0, angle, angle * 1.11], .96, loading * .83);
  }
}

function drawPulse(renderer, { kind, x, y, vx, vy, scale, boosted }) {
  const big = kind === 'budinoBurst';
  const color = big ? gold : teal;
  const rotation = [0, 0, Math.atan2(vy, vx)];
  renderer.object('bevel', [x, y, .67], [.66 * scale, .367 * scale, .295 * scale], color, rotation, .96);
  renderer.object('bevel', [x, y, .8], [.43 * scale, .146 * scale, .115 * scale], '#fff7d1', rotation, 1);
  renderer.object('bevel', [x - Math.sign(vx) * .48 * scale, y - .031 * vy, .61], [.92 * scale, .132 * scale, .139 * scale],
    boosted ? '#f1b183' : color, rotation, .87, .62);
}

export const projectiles = { budinoPulse: drawPulse, budinoBurst: drawPulse };
