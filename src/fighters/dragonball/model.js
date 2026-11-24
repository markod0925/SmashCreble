import { clamp } from '../../math.js';
import { multiply, one, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';

const skin = '#db925d';
const chest = '#efac76';
const shade = '#b96e47';
const blue = '#3e71c0';
const band = '#e94a59';
const teal = '#6adfca';
const tooth = '#fff2d9';
const bellyButton = [0, 1.17, .388];
const jumpPose = (speed) => clamp(speed / 10, -1, 1);
const pulse = (phase) => Math.sin(Math.PI * clamp(phase, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.49, 0], [.95, 1.01, .69], skin),
  part('bevel', [0, 1.738, -.012], [1.27, .58, .803], skin),
  part('bevel', [0, 1.429, .173], [.731, .74, .424], skin),
  part('bevel', [0, 1.999, -.023], [.53, .39, .48], skin),
  part('bevel', [0, .914, -.015], [.964, .32, .725], blue),
  part('plate', [0, 1.03, -.019], [.958, .145, .731], '#2d5292', [0, 0, -.022]),
  part('bevel', bellyButton, [.071, .058, .025], '#864932'),
];
for (const side of [-1, 1]) {
  torso.push(
    part('bevel', [side * .311, 1.728, .316], [.6, .392, .327], chest, [0, side * .22, side * .05]),
    part('bevel', [side * .292, 1.912, .31], [.41, .097, .119], '#f2ba8a', [0, side * .13, side * -.14]),
    part('bevel', [side * .347, 1.349, .253], [.2, .456, .234], shade, [0, side * .23, side * -.23]),
    part('box', [side * .367, .981, .335], [.163, .037, .053], '#739cdc', [0, side * .2, side * .1]),
  );
  for (const [y, width] of [[1.48, .26], [1.346, .252], [1.22, .235]]) {
    torso.push(part('bevel', [side * .135, y, y > 1.25 ? .356 : .32], [width, .147, .18], chest, [0, side * .12, side * -.09]));
  }
}

const head = [
  part('bevel', [0, .333, .019], [.835, .794, .735], skin),
  part('bevel', [0, .697, -.009], [1.04, .454, .897], band, [0, 0, .13]),
  part('plate', [0, .555, .021], [1.012, .123, .891], '#b72948', [0, 0, .13]),
  part('plate', [0, .819, -.024], [1.071, .094, .916], '#fa6e74', [0, 0, .13]),
  part('bevel', [0, .838, -.027], [.956, .218, .64], '#3ba995'),
  part('bevel', [0, .314, .403], [.164, .175, .184], '#ecaa73', [0, 0, -.11]),
];
for (const [x, y, height, lean] of [[-.406, 1.006, .493, .32], [-.183, 1.113, .65, .31], [.073, 1.207, .72, -.09], [.308, 1.186, .616, -.27], [.451, 1.024, .4, -.29]]) {
  head.push(part('horn', [x, y, -.012], [.28, height, .42], teal, [-.19, 0, lean]));
}
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .411, .284, .002], [.204, .283, .24], skin, [0, 0, side * -.2]),
    part('bevel', [side * .155, .399, .37], [.185, .157, .072], tooth, [0, side * .12, side * .16]),
    part('bevel', [side * .146, .394, .41], [.063, .101, .032], '#282436'),
    part('box', [side * .156, .502, .371], [.218, .049, .043], '#773f33', [0, side * .13, side * .43]),
  );
}

const grin = [
  part('grin', [0, .165, .395], [.455, .469, .092], '#672f38'),
  part('bevel', [0, .151, .451], [.295, .058, .046], tooth),
  part('horn', [-.135, .124, .456], [.081, .091, .056], tooth, [0, 0, Math.PI + .14]),
  part('horn', [.135, .124, .456], [.081, .091, .056], tooth, [0, 0, Math.PI - .14]),
];
const jaw = [
  part('bevel', [0, -.05, .076], [.581, .225, .553], skin),
  part('bevel', [0, -.018, .295], [.381, .068, .109], '#eaa66c'),
  part('bevel', [0, .028, .294], [.255, .059, .067], tooth),
];
const arm = [
  part('bombShell', [0, -.099, -.003], [.54, .54, .539], chest),
  part('bevel', [0, -.291, .01], [.439, .413, .435], skin),
  part('bombShell', [.008, -.248, .122], [.343, .393, .323], chest),
];
const forearm = [
  part('bevel', [0, -.175, .008], [.338, .396, .336], skin),
  part('bevel', [.002, -.397, .035], [.31, .229, .339], chest),
  part('bevel', [-.103, -.35, .132], [.141, .164, .121], skin, [0, 0, -.39]),
];
const leg = [
  part('bevel', [0, -.24, 0], [.478, .6, .483], blue),
  part('bevel', [0, -.534, .04], [.43, .394, .433], '#3965ad'),
  part('bevel', [0, -.748, .147], [.514, .253, .635], '#33599c'),
  part('plate', [0, -.843, .173], [.53, .108, .659], '#243d76'),
  part('bevel', [0, -.693, .323], [.339, .11, .248], '#6e9bdd'),
];
const bandTail = [
  part('leaf', [0, -.167, -.081], [.274, .433, .102], band, [Math.PI + .12, 0, .32]),
  part('leaf', [.174, -.158, -.155], [.224, .389, .093], '#bd3b56', [Math.PI + .18, 0, .68]),
];

export const portrait = { targetY: 1.73, fov: .52, heading: .19 };

export function drawNavelBeam(renderer, emitter, originX, attack, size) {
  const [x, y, z] = emitter;
  const { facing, from, until, age, range } = attack;
  if (age < from || age > until) {
    if (age >= from) return;
    const spark = (.085 + .24 * age / from) * size;
    renderer.object('gem', emitter, [spark, spark, spark], '#8dfff2', zero, .96);
    return;
  }
  const tip = originX + facing * range;
  const length = Math.abs(tip - x);
  const width = (.17 + .075 * pulse((age - from) / (until - from))) * size;
  const center = [(x + tip) * .5, y, z];
  const horizontal = [0, 0, Math.PI / 2];
  renderer.object('tube', center, [width * 2, length, width * 1.32], '#44eadc', horizontal, .9, .48);
  renderer.object('tube', center, [width * .95, length, width * .81], '#e1fffb', horizontal, .97);
  renderer.object('gem', emitter, [width * 2.11, width * 1.86, width * 1.52], '#a0fff1', horizontal, .99);
}

export function draw(renderer, fighter, position, time, options) {
  const { heading = .2, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const bite = type === 'dragonBallBite' ? pulse((age - .019) / .322) : 0;
  const laser = type === 'dragonBallNavelLaser' ? pulse(age / attack.duration) : 0;
  const summon = type === 'dragonBallClones' ? pulse(age / attack.duration) : 0;
  const throwing = type === 'dragonBallBacteria' ? pulse((age - .123) / .53) : 0;
  const rise = airborne ? jumpPose(verticalSpeed) : 0;
  const stride = Math.sin(time * 15.4) * running;
  const crouch = landing * 1.19 + (guarding ? .22 : charging ? .17 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (bite * .44 - laser * .33 + throwing * .38),
    wobble - facing * (.102 * running + .24 * bite + .17 * throwing - .06 * laser)], attack);
  const body = joint(root, [0, Math.abs(stride) * .081 + Math.sin(time * 4.3) * .021 - crouch, .16 * bite],
    [.26 * bite + .088 * running - .18 * laser + .14 * throwing, 0, pose ? .054 : .055 * stride]);
  renderer.parts(torso, body, flash);

  const skull = joint(body, [0, 2.026 - bite * .088, .072 + bite * .17], [-bite * .1, .1 * bite * facing, .057 * stride]);
  renderer.parts(head, skull, flash);
  const open = bite * (age < (attack?.from ?? 0) ? 1 : .18);
  if (open > .15) {
    renderer.mesh('bevel', multiply(skull, transform([0, .148 - open * .045, .405], [.403, .181 + open * .34, .097], zero)), '#542735');
    renderer.parts(jaw, joint(skull, [0, .125 - .218 * open, .071], [.63 * open, 0, 0]), flash);
  } else renderer.parts(grin, skull, flash);
  renderer.parts(bandTail, joint(skull, [.37, .666, -.313], [running * .81 + rise * .25, 0, .15 * Math.sin(time * 9) + bite * .25]), flash);

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legPitch = airborne ? side * .43 - rise * .42 : side * stride * .79;
    renderer.parts(leg, joint(root, [side * .256, .89 - crouch * .46, 0], [legPitch - throwing * (lead ? .28 : -.2), 0, side * .097]), flash);

    const shoulderPitch = (guarding ? -1.37 : -.24 - stride * side * .58 - rise * .31) - bite * .9 - summon * .62 - throwing * (lead ? 1.63 : -.13);
    const shoulderRoll = side * (.27 + .34 * (pose ? 1 : 0) + summon * 1.7 + laser * .67 + throwing * .22);
    const shoulder = joint(body, [side * .645, 1.741, -.025], [shoulderPitch, side * .15 * throwing, shoulderRoll]);
    renderer.parts(arm, shoulder, flash);
    renderer.parts(forearm, joint(shoulder, [0, -.453, .026], [-.29 - summon * .53 - bite * .47 - (guarding || charging ? .57 : 0), 0, side * .11]), flash);
  }

  if (type === 'dragonBallNavelLaser') {
    const emitter = joint(body, bellyButton);
    drawNavelBeam(renderer, [emitter[12], emitter[13], emitter[14]], position[0], attack, size);
  }
  if (type === 'dragonBallClones' && age < attack.from) {
    const [x, y, z] = position;
    const progress = age / attack.from;
    for (const side of [-1, 1]) {
      const light = (.125 + .19 * progress) * size;
      renderer.object('gem', [x + side * (.82 + .66 * progress) * size, y + (.81 + .46 * progress) * size, z + .61],
        [light, light * 1.75, light], side < 0 ? teal : band, [0, age * 13, side * age * 6], .91, .75);
    }
  }
}

function drawBacterium(renderer, projectile, time) {
  const { x, y, vx, vy, index, scale } = projectile;
  const flutter = Math.sin(time * 19 + index * 2.36);
  const root = transform([x, y, .58 + (index % 3 - 1) * .32], [scale, scale, scale],
    [flutter * .19, 0, Math.atan2(vy, vx) - Math.PI / 2 + flutter * .19]);
  renderer.mesh('bevel', multiply(root, transform(zero, [.407, .88, .365], zero)), '#9b5939', .22);
  renderer.mesh('bevel', multiply(root, transform([0, 0, .128], [.263, .565, .183], zero)), '#be8053', .23);
  renderer.mesh('fuse', multiply(root, transform([-.071, -.382, .057], [.68, .86, .54], [.1, .32 * flutter, 2.82 + .28 * flutter])), '#d7a06c', .24);
  renderer.mesh('fuse', multiply(root, transform([-.144, .104, .056], [.49, .48, .55], [0, 0, 1.17 + .21 * flutter])), '#c69061', .19);
  renderer.mesh('fuse', multiply(root, transform([.143, .23, .08], [.42, .48, .5], [0, 0, -1.25 + .24 * flutter])), '#c69061', .19);
}

export const projectiles = { dragonBallBacteria: drawBacterium };
