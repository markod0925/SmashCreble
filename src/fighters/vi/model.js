import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';
import { rainbowHeight } from './profile.js';

function buildViRig() {
  const blue = '#53b8e2';
  const light = '#9addf0';
  const shade = '#3488bd';
  const pink = '#ec86bf';
  const mane = '#cf64a4';
  const hoof = '#24314b';
  const body = [
    part('bevel', [0, 1.436, -.079], [1.02, .99, 2.3], blue),
    part('bevel', [0, 1.596, -.19], [.954, .781, 1.65], '#65c4e5'),
    part('bevel', [0, 1.366, .648], [.93, .95, .77], blue),
    part('bevel', [0, 1.216, -.083], [.892, .43, 1.76], shade),
    part('bevel', [0, 1.313, -.717], [.949, .937, .817], blue),
  ];
  const neck = [
    part('bevel', [0, .252, .123], [.67, .86, .65], blue, [.41, 0, 0]),
    part('bevel', [0, .362, .349], [.579, .69, .3], light, [.47, 0, 0]),
    part('bevel', [0, .07, -.251], [.368, .404, .38], mane, [-.37, 0, .08]),
    part('bevel', [0, .258, -.232], [.375, .366, .39], pink, [-.34, 0, -.1]),
    part('bevel', [0, .445, -.154], [.377, .395, .37], mane, [-.39, 0, -.14]),
    part('bevel', [0, .626, -.071], [.361, .325, .372], pink, [-.43, 0, .09]),
  ];
  const head = [
    part('bevel', [0, .179, .137], [.702, .631, .809], blue, [-.13, 0, 0]),
    part('bevel', [0, .041, .463], [.613, .438, .583], light, [.13, 0, 0]),
    part('bevel', [0, -.04, .533], [.584, .205, .375], '#75c3df'),
    part('bevel', [0, .43, .034], [.505, .254, .548], pink, [0, .09, -.12]),
    part('horn', [0, .638, .461], [.258, .601, .239], '#f296ce', [.5, 0, 0], .2),
    part('tube', [0, .492, .394], [.268, .084, .261], '#fbc4df', [.49, 0, -.11], .26),
    part('tube', [0, .649, .479], [.179, .055, .153], '#fbd5e8', [.49, 0, -.14], .31),
  ];
  for (const side of [-1, 1]) {
    head.push(
      part('leaf', [side * .239, .473, -.098], [.219, .539, .267], shade, [-.13, 0, -side * .286]),
      part('leaf', [side * .262, .494, -.013], [.126, .331, .156], '#f391c5', [-.12, 0, -side * .286]),
      part('bevel', [side * .338, .249, .269], [.09, .169, .201], '#e8fafd', [-.06, side * .21, 0]),
      part('bevel', [side * .382, .241, .294], [.041, .125, .115], '#304d73'),
      part('box', [side * .408, .273, .324], [.022, .044, .043], '#ffffff', zero, .78),
      part('bevel', [side * .271, .071, .604], [.102, .077, .08], '#5784a2', [0, side * .34, 0]),
      part('box', [side * .292, -.083, .49], [.027, .023, .164], '#426182', [.18, 0, 0]),
    );
  }
  const upperLeg = [
    part('bevel', [0, -.195, .002], [.328, .561, .404], blue),
    part('bevel', [0, -.406, .004], [.268, .189, .286], light),
  ];
  const lowerLeg = [
    part('bevel', [0, -.222, .017], [.249, .534, .267], '#70c9e7'),
    part('bevel', [0, -.492, .054], [.32, .212, .38], hoof),
    part('box', [0, -.446, .226], [.238, .044, .045], '#6d809b', zero, .22),
  ];
  const tail = [
    part('leaf', [0, -.163, -.244], [.37, .719, .346], mane, [-2.09, 0, 0]),
    part('leaf', [.032, -.309, -.463], [.369, .67, .257], pink, [-2.44, .31, -.08]),
    part('leaf', [-.083, -.281, -.482], [.178, .576, .167], '#f4acd1', [-2.12, -.27, -.13]),
  ];
  return { body, neck, head, upperLeg, lowerLeg, tail };
}

const rig = buildViRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const phase = attack ? attack.age / attack.duration : 0;
  const thrust = attack?.type === 'viHorn' ? pulse((attack.age - attack.from + .079) / .23) : 0;
  const hoof = attack?.type === 'viHoof' ? pulse((attack.age - attack.from + .125) / .35) : 0;
  const coloring = attack?.type === 'viRainbow';
  const casting = coloring ? pulse(phase) : 0;
  const summoning = attack?.type === 'viClones' ? pulse(phase) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const gallop = Math.sin(time * 16) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 9)) : 0;
  const crouch = landing * 1.1 + (guarding ? .26 : charging ? .15 : 0);
  const bob = Math.sin(time * 5) * .032 + Math.abs(gallop) * .091 - crouch;
  const size = fighter.size;
  const turn = pose ? heading - 1.26 : heading * 1.37;
  const root = fighterRoot(position, size, [0, turn, wobble - running * facing * .075], attack);
  const balance = .042 * gallop - .48 * hoof - .34 * recovery + .113 * thrust - .14 * rise - summoning * .21;
  const pivot = multiply(root, transform([0, 1.12 + bob, 0], one, [balance, 0, 0]));
  const base = multiply(pivot, transform([0, -1.12, 0], one, zero));
  renderer.parts(rig.body, base, flash);
  const neck = multiply(base, transform([0, 1.57, .717 + thrust * .12], one, [.60 * thrust - .17 * hoof + .24 * casting - .34 * summoning, 0, 0]));
  renderer.parts(rig.neck, neck, flash);
  const head = multiply(neck, transform([0, .636, .289], one, [.48 * thrust - .09 * casting - .19 * recovery, pose ? .12 : 0, pose ? -.082 : 0]));
  renderer.parts(rig.head, head, flash);
  const tail = multiply(base, transform([0, 1.67, -1.043], one, [.22 * rise + .21 * hoof, Math.sin(time * (5 + 5 * running)) * (.25 + running * .26), 0]));
  renderer.parts(rig.tail, tail, flash);

  for (const front of [-1, 1]) {
    for (const side of [-1, 1]) {
      const leadingHoof = front === 1 && side === facing ? hoof : 0;
      const step = Math.sin(time * 16 + (front * side > 0 ? 0 : Math.PI) + front * .42) * running;
      const swing = airborne ? front * .33 - rise * .48 : step * .78 + (pose ? front * side * .084 : 0);
      const leg = multiply(base, transform([side * .321, 1.035, front * .736], one,
        [swing - leadingHoof * 1.46 + (front < 0 ? hoof * .23 : 0) - recovery * .29, 0, side * .045]));
      renderer.parts(rig.upperLeg, leg, flash);
      const shin = multiply(leg, transform([0, -.451, -.024], one,
        [Math.max(0, -step) * .51 + Math.max(0, rise) * .39 + leadingHoof * .26, 0, 0]));
      renderer.parts(rig.lowerLeg, shin, flash);
    }
  }

  const [x, y, z] = position;
  if (coloring && attack.age >= attack.from && attack.age <= attack.until) {
    const glow = 1 - (attack.age - attack.from) / (attack.until - attack.from);
    const colors = ['#ff7ca8', '#ffae73', '#ffe783', '#a9f59c', '#79ddff', '#c6a4ff'];
    for (const [i, color] of colors.entries()) {
      const strip = transform([x + facing * attack.arcStart, y + (.275 - i * .103) * attack.scale, z + .46],
        [facing * (attack.range - attack.arcStart), attack.scale, 1], zero);
      renderer.mesh('rainbow', strip, color, .89, .61 + glow * .29);
    }
    for (let i = 0; i < 4; i++) {
      const t = ((1 - glow) * 1.35 + i * .24) % 1;
      const height = rainbowHeight(attack, t);
      const sparkle = .22 * size;
      renderer.object('star', [x + facing * (attack.arcStart + t * (attack.range - attack.arcStart)), y + height + .12 * size, z + .58],
        [sparkle, sparkle, sparkle * .8], '#fff7cb', [0, time, time * 2], .98);
    }
  } else if ((attack?.type === 'viHorn' || attack?.type === 'viHoof') && attack.age >= attack.from && attack.age <= attack.until) {
    const kick = attack.type === 'viHoof';
    const streak = (attack.age - attack.from) / (attack.until - attack.from);
    renderer.object('leaf', [x + facing * (1.2 + streak * .69) * size, y + (kick ? 1.15 : 2.02) * size, z + .55],
      [.28 * size, .91 * size, .13], kick ? '#aaf0ff' : '#ffd2ef', [0, 0, -facing * 1.22], .91, .88 * (1 - streak));
  }
  if (summoning) {
    for (let i = 0; i < 4; i++) {
      const angle = i * TAU / 4 + phase * TAU;
      renderer.object('star', [x + Math.cos(angle) * 1.28, y + 1.26 + summoning * .93, z + Math.sin(angle) * .71],
        [.32, .33, .23], i % 2 ? '#ffc8f0' : '#a6f3ff', [0, angle, angle], .91, summoning * .85);
    }
  }
}
