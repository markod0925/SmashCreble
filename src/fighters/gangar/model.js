import { multiply, one, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const gangarEyes = [[-.301, .452, .407], [.287, .476, .416]];

function buildGangarRig() {
  const purple = '#865aae';
  const dark = '#4a325f';
  const light = '#ad7ecb';
  const crest = '#b283bb';
  const coral = '#f06b73';
  const tooth = '#fff0d8';
  const torso = [
    part('bevel', [0, 1.38, -.055], [1.1, 1.29, .91], purple),
    part('bevel', [0, 1.452, .277], [.77, .92, .33], '#9868b7'),
    part('bevel', [0, .884, -.029], [.82, .34, .66], dark),
    part('leaf', [.01, 1.405, .463], [.339, .585, .089], light, [Math.PI, 0, -.23]),
    part('leaf', [-.232, 1.314, .409], [.168, .37, .069], '#bc8dd3', [0, -.38, -.31]),
    part('leaf', [.223, 1.219, .39], [.155, .319, .076], light, [.08, .43, -.36]),
  ];
  const head = [
    part('bevel', [0, .342, -.058], [1.17, .841, .85], purple),
    part('bevel', [0, .338, .255], [1.05, .615, .325], light),
    part('bevel', [0, .157, .379], [.61, .236, .224], purple),
    part('earCrest', [-.47, .516, -.111], [.99, .91, .94], dark, [.04, -.14, .52]),
    part('earCrest', [-.473, .623, -.043], [.48, .65, .49], crest, [0, -.24, .56]),
    part('earCrest', [.487, .522, -.09], [1.06, 1.07, .99], dark, [-.04, 0, -.08]),
    part('earCrest', [.497, .63, -.008], [.51, .758, .54], crest, [0, .17, -.10]),
    part('gem', [0, .674, .236], [.177, .183, .04], '#ecc9e5', [0, 0, -.13], .23),
  ];
  gangarEyes.forEach(([x, y, z], i) => {
    const side = i ? 1 : -1;
    const tilt = side * .26;
    head.push(
      part('bevel', [x, y, z - .024], [.344, .271, .17], '#412844', [0, side * .19, tilt]),
      part('bevel', [x, y, z + .058], [.25, .189, .064], coral, [0, side * .18, tilt], .54),
      part('box', [x - side * .011, y, z + .098], [.052, .127, .026], '#662846', [0, .13, tilt * .45]),
      part('gem', [x + .059, y + .052, z + .101], [.079, .069, .035], '#ffb7a0', zero, .79),
    );
  });
  const upperFangs = [];
  const lowerFangs = [];
  for (const [x, y, length] of [[-.34, .011, .22], [-.177, -.056, .125], [.005, -.074, .115], [.19, -.047, .134], [.348, .023, .23]]) {
    upperFangs.push(part('leaf', [x, y - length * .34, .496], [.153, length, .119], tooth, [Math.PI, 0, x * .52]));
  }
  for (const x of [-.275, -.112, .084, .246]) {
    lowerFangs.push(part('leaf', [x, -.171 + Math.abs(x) * .135, .489], [.13, .132, .107], tooth, [0, 0, -x * .51]));
  }
  const arm = [
    part('bevel', [0, -.111, 0], [.351, .429, .43], dark),
    part('bevel', [0, -.405, .037], [.31, .482, .352], purple),
    part('bevel', [0, -.601, .087], [.394, .281, .401], dark),
  ];
  const leg = [
    part('bevel', [0, -.229, 0], [.377, .569, .398], purple),
    part('bevel', [0, -.522, .013], [.303, .383, .353], dark),
    part('bevel', [0, -.768, .133], [.39, .282, .556], purple),
  ];
  for (const finger of [-1, 0, 1]) {
    arm.push(part('leaf', [finger * .108, -.752, .08], [.1, .223 - Math.abs(finger) * .028, .139], light, [Math.PI - .15, 0, finger * .26]));
    leg.push(part('leaf', [finger * .1, -.815, .404], [.086, .214, .109], light, [Math.PI / 2, 0, 0]));
  }
  return { torso, head, upperFangs, lowerFangs, arm, leg };
}

const rig = buildGangarRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const phase = attack ? attack.age / attack.duration : 0;
  const combo = attack?.type === 'gangarCombo';
  const kickAt = attack?.followUp?.from ?? attack?.from;
  const punch = combo ? pulse(attack.age / kickAt) : 0;
  const kick = combo ? pulse((attack.age - kickAt + .06) / (attack.duration - kickAt + .06)) : 0;
  const laser = attack?.type === 'gangarLasers';
  const biting = attack?.type === 'gangarBite';
  const swallowing = attack?.type === 'gangarGulp';
  const full = swallowing && attack.capture && attack.age >= attack.swallowAt;
  const chomp = swallowing ? pulse((attack.age - attack.biteAt + .045) / .14) : 0;
  const gape = biting ? pulse(Math.pow(unit(attack.age / (attack.from + .034)), .76))
    : swallowing ? unit((attack.age - .035) * 7) * (1 - unit((attack.age - attack.swallowAt + .082) * 12.2)) + chomp * .68 : 0;
  const rush = biting ? pulse((attack.age - .1) / .39) : swallowing ? pulse((attack.age - .07) / .53) : 0;
  const recoil = laser ? pulse(phase) : 0;
  const recover = attack?.type === 'recovery' ? pulse(phase) : 0;
  const stride = Math.sin(time * 14) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 8)) : 0;
  const crouch = landing * 1.1 + (guarding ? .22 : charging ? .2 : 0);
  const bob = Math.abs(stride) * .083 + Math.sin(time * 4.5) * .031 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * (recoil * .235 + punch * .27), wobble - facing * (running * .12 + rush * .12)]);
  const upper = multiply(root, transform([0, bob, .21 * rush], [1 + (full ? .115 : 0), 1, 1], [running * .15 + rush * .32 - recoil * .112, 0, -kick * .13]));
  renderer.parts(rig.torso, upper, flash);
  const head = multiply(upper, transform([0, 2.005, .039], [1 + (full ? .09 : 0), 1, 1], [-gape * .19 - recover * .31, 0, pose ? -.065 : 0]));
  renderer.parts(rig.head, head, flash);
  const mouth = multiply(head, transform([0, .152 - gape * .015, .464], [1 + gape * .1, 1 + gape * .86, .52], zero));
  renderer.mesh('grin', mouth, flash ? '#ffffff' : '#392239');
  const jaw = multiply(head, transform([0, -.138 - gape * .21, .376], one, [-gape * .15, 0, 0]));
  renderer.mesh('bevel', multiply(jaw, transform([0, .02, .013], [.748, .195, .356], zero)), flash ? '#ffffff' : '#865aae');
  const dental = multiply(head, transform([0, .145, .035], one, zero));
  renderer.parts(rig.upperFangs, dental, flash);
  renderer.parts(rig.lowerFangs, multiply(dental, transform([0, -gape * .245, .014], one, zero)), flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legPitch = airborne ? side * .36 - rise * .28 : stride * side * .74;
    const leg = multiply(root, transform([side * .247, .897 - crouch * .33, 0], one, [legPitch - (lead ? kick * 1.69 : 0) - recover * .37, 0, side * .077]));
    renderer.parts(rig.leg, leg, flash);
    const armPitch = guarding ? -1.15 : -stride * side * .67 - rise * .34 - recover * 1.22 - rush * (swallowing ? 1.48 : .64) - (lead ? punch * 1.78 : 0) - (pose ? .62 : 0);
    const splay = (pose ? .71 : .26) + rush * .33 + (full ? .28 : 0);
    const arm = multiply(upper, transform([side * .527, 1.782, .025], one, [armPitch, side * .12, side * splay]));
    renderer.parts(rig.arm, arm, flash);
  }

  if (laser && attack.age >= attack.from && attack.age <= attack.until) {
    const starts = gangarEyes.map(([x, y, z]) => multiply(head, transform([x, y, z + .14], one, zero)).slice(12, 15));
    eyeBeams(renderer, starts, position[0] + facing * attack.range, attack, time);
  }
  if (biting && attack.age >= attack.from && attack.age <= attack.until) {
    biteEffect(renderer, position, facing, attack);
  }
}

export function biteEffect(renderer, [x, y, z], facing, attack) {
  const snap = (attack.age - attack.from) / (attack.until - attack.from);
  for (const side of [-1, 1]) {
    const angle = side * (.7 - snap * .57);
    renderer.object('leaf', [x + facing * (1.31 + snap * .39), y + 1.63 + side * (.44 - snap * .27), z + .75],
      [.216, .71, .117], '#f9d6ff', [0, 0, angle - facing * Math.PI * .5], .85, (1 - snap) * .86);
  }
}

function eyeBeams(renderer, starts, endpointX, attack, time) {
  const energy = 1 - (attack.age - attack.from) / (attack.until - attack.from);
  for (const [i, start] of starts.entries()) {
    const dx = endpointX - start[0];
    const dy = i ? .14 : -.14;
    const center = [start[0] + dx * .5, start[1] + dy * .5, start[2]];
    const width = Math.hypot(dx, dy);
    const rotation = [0, 0, Math.atan2(dy, dx)];
    renderer.object('box', center, [width, .157 + .112 * energy, .135], '#ff5167', rotation, .96, .57 + .28 * energy);
    renderer.object('box', center, [width, .051 + .031 * energy, .091], '#fff1cc', rotation, 1);
    renderer.object('gem', start, [.221, .2, .179], '#ff8e83', [0, time * 13, 0], 1);
  }
}

export const portrait = { targetY: 1.93, fov: .453 };
