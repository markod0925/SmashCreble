import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const scarlet = '#ed514b';
const scarletShade = '#af3c49';
const purple = '#9874c3';
const lavender = '#c49be6';
const cyan = '#52bfe2';
const mint = '#a9f29a';
const green = '#37965d';
const darkGreen = '#24674b';
const gold = '#ffce82';
const cream = '#fff2cf';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = value => smoothStep(clamp(value, 0, 1));
const pulse = value => Math.sin(Math.PI * clamp(value, 0, 1));

const coat = [
  part('bevel', [0, 1.455, -.025], [.897, 1.1, .669], scarletShade, [.15, 0, .048]),
  part('bevel', [0, 1.462, .231], [.742, .952, .341], scarlet, [.15, 0, .048]),
  part('plate', [0, 1.006, -.013], [1.018, .228, .766], '#c3434d', [0, 0, .049]),
  part('plate', [0, 1.904, .02], [.774, .168, .666], '#f3755b', [.12, 0, .034]),
  part('gem', [.015, 1.691, .42], [.196, .266, .107], gold, [0, 0, .13], .22),
];
const face = [
  part('bombShell', [0, .204, 0], [.989, .933, .819], purple, [.13, 0, .022]),
  part('bevel', [-.029, .184, .31], [.782, .626, .218], lavender, [.07, .08, .028]),
  part('grin', [.025, .043, .439], [.389, .369, .062], '#603a68', [.07, 0, .092]),
  part('bevel', [.034, .089, .473], [.176, .051, .032], cream, [0, 0, .16]),
];
for (const side of [-1, 1]) {
  face.push(
    part('bevel', [side * .196, .268, .431], [.173, .207, .063], '#f9e3bd', [0, side * .094, side * -.23]),
    part('bevel', [side * .178, .267, .475], [.075, .121, .034], '#483753', [0, side * .10, side * -.17]),
    part('bevel', [side * .199, .401, .43], [.226, .075, .052], '#694777', [0, side * .12, side * .31]),
  );
}
const crest = [
  part('bevel', [.017, .601, -.125], [.747, .285, .591], scarletShade, [.21, 0, -.11]),
  part('horn', [-.266, .861, -.151], [.311, .672, .358], scarlet, [-.32, -.12, .49]),
  part('horn', [-.095, 1.022, -.172], [.356, .949, .439], '#ff6650', [-.34, .12, .206]),
  part('horn', [.185, .915, -.197], [.377, .833, .437], scarlet, [-.42, -.19, -.26]),
  part('horn', [.357, .951, -.239], [.322, .964, .359], '#ee4b49', [-.51, -.22, -.57]),
  part('leaf', [.076, .861, .038], [.181, .556, .102], '#ff8d62', [-.24, .28, -.13]),
];
const fin = [
  part('horn', [0, .286, -.045], [.34, .671, .229], '#3b9fcd', [-.22, 0, .035]),
  part('leaf', [0, .285, .037], [.211, .396, .099], '#8bd9ef', [-.21, 0, .061]),
];
const arm = [
  part('bevel', [0, -.107, -.021], [.309, .446, .352], scarlet),
  part('bevel', [0, -.321, .048], [.245, .394, .295], scarletShade),
  part('bevel', [0, -.544, .098], [.259, .226, .242], '#d2a0dd'),
  part('bevel', [.067, -.57, .173], [.142, .149, .11], lavender, [.09, .12, .24]),
];
const leg = [
  part('bevel', [0, -.207, -.004], [.307, .487, .345], '#654f71'),
  part('bevel', [0, -.372, .054], [.289, .313, .346], '#736585'),
  part('bevel', [0, -.656, .132], [.369, .225, .485], '#565e76', [.08, 0, .011]),
  part('bevel', [0, -.642, .318], [.323, .123, .217], '#a7a7b8', [.06, 0, .035]),
];
const staff = [
  part('tube', [0, .147, .014], [.138, 1.833, .142], '#8f6146', [0, 0, -.025]),
  part('bevel', [-.037, 1.019, .016], [.262, .362, .249], '#b67b55', [0, 0, -.061]),
  part('plate', [-.019, .852, .014], [.24, .091, .244], '#bdac8f'),
  part('plate', [.024, -.711, .01], [.196, .102, .181], '#aa9c91'),
  part('tube', [0, -.235, .016], [.185, .349, .19], '#5c4650'),
];

const capePanels = [
  [part('bevel', [0, -.214, 0], [.739, .54, .107], green), part('bevel', [.23, -.205, -.042], [.099, .411, .07], '#64bd78', [0, 0, .052])],
  [part('bevel', [0, -.226, -.015], [1.061, .575, .102], green), part('bevel', [.387, -.215, -.055], [.097, .479, .05], '#5db070', [0, 0, .089])],
  [part('bevel', [0, -.206, -.012], [1.222, .523, .102], darkGreen), part('plate', [0, -.419, -.028], [1.102, .107, .088], '#62b67a', [0, 0, -.084])],
];

function drawCapeReach(renderer, start, [endX, endY, endZ], size, extension, time) {
  if (extension <= .03) return;
  let previous = start;
  for (let i = 1; i <= 8; i++) {
    const along = i / 8;
    const bend = Math.sin(Math.PI * along);
    const next = [start[0] + (endX - start[0]) * along, start[1] + (endY - start[1]) * along + bend * (.64 + Math.sin(time * 18 + along * 4) * .21) * size,
      start[2] + (endZ - start[2]) * along + .6 * bend];
    const dx = next[0] - previous[0];
    const dy = next[1] - previous[1];
    renderer.object('bevel', [(previous[0] + next[0]) / 2, (previous[1] + next[1]) / 2, (previous[2] + next[2]) / 2],
      [Math.hypot(dx, dy) + .105, (.33 - along * .11) * size, .17 * size], i % 2 ? green : '#56ba72', [0, 0, Math.atan2(dy, dx)], .28, extension);
    previous = next;
  }
}

export function drawCapeWrap(renderer, [x, y, z], size, progress, time) {
  const amount = ease(progress * 1.83);
  if (amount <= 0) return;
  for (let i = 0; i < 4; i++) {
    const width = (1.43 - .115 * i) * size * amount;
    const twist = (i - 1.7) * .123 + Math.sin(time * 24 + i * 1.6) * .053;
    renderer.object('bevel', [x, y + (1.07 + i * .275) * size, z + (.66 + i * .028) * size],
      [width, .286 * size, .48 * size], i % 2 ? green : '#51af71', [0, twist, -.137 + i * .075], .32);
    renderer.object('leaf', [x + width * .438, y + (1.18 + i * .255) * size, z + .88 * size],
      [.21 * size * amount, .46 * size, .09], mint, [0, 0, -.81 + twist], .36);
  }
}

export function drawStaffArc(renderer, [x, y, z], facing, attack, size) {
  const progress = (attack.age - attack.from) / (attack.until - attack.from);
  if (progress < 0 || progress >= 1) return;
  for (let i = 0; i < 5; i++) {
    const angle = .92 - progress * 1.46 + i * .16;
    renderer.object('leaf', [x + facing * (.97 + Math.cos(angle) * 1.08) * size, y + (1.26 + Math.sin(angle) * 1.15) * size, z + .72 + i * .028],
      [(.2 + i * .041) * size, .86 * size, .137], i % 2 ? '#ff9d62' : gold, [0, 0, -facing * (angle + 1.33)], .95, (1 - progress) * .92);
  }
}

export const portrait = { heading: .16, targetY: 1.77, fov: .56 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .28, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const combo = type === 'markokCombo';
  const punch = combo ? pulse((age - .019) / .215) : 0;
  const kick = combo ? pulse((age - .155) / .262) : 0;
  const striking = type === 'markokStaff';
  const windup = striking ? pulse(age / attack.from) : 0;
  const swing = striking ? pulse((age - attack.from + .059) / .305) : 0;
  const casting = type === 'markokTornado';
  const fire = casting ? pulse((age - .03) / .346) : 0;
  const snaring = type === 'markokCape';
  const reach = snaring ? ease((age - .055) / .205) * ease((attack.duration - age) / .22) : 0;
  const snap = snaring ? pulse((age - attack.biteAt + .066) / .283) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.8) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.7, -1, 1) : 0;
  const crouch = landing * 1.31 + (guarding ? .25 : charging ? .18 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.34 * punch - .28 * kick - .46 * windup + .6 * swing - .33 * reach + .52 * snap),
    wobble - facing * (.12 * running + .15 * punch - .21 * kick + .18 * swing)], attack);
  const body = joint(root, [0, Math.abs(stride) * .086 + Math.sin(time * 5) * .033 - crouch, .16 * punch + .16 * swing],
    [.19 * running + .32 * punch - .22 * kick - .18 * windup + .22 * swing - .27 * recover - .2 * fire, 0, .083 * stride]);

  let cape = joint(body, [0, 1.911, -.329], [.27 + .74 * running + .37 * rise + .64 * reach + .44 * snap,
    .23 * stride + .37 * swing, .16 * Math.sin(time * 6.1) - facing * .42 * reach]);
  for (const [i, panel] of capePanels.entries()) {
    renderer.parts(panel, cape, flash);
    cape = joint(cape, [0, -.415, .012], [.146 * Math.sin(time * 8.3 + i) + .12 * running + .13 * reach, 0, .14 * stride]);
  }
  renderer.parts(coat, body, flash);
  const head = joint(body, [0, 2.158 - .08 * punch, .043 + .11 * punch], [-.16 * fire + .18 * punch - .21 * reach, .12 * swing + .085 * stride, .123 * snap]);
  renderer.parts(face, head, flash);
  renderer.parts(crest, joint(head, [0, 0, 0], [.17 * stride - .26 * fire, 0, -.115 * swing + .075 * Math.sin(time * 5)]), flash);

  for (const side of [-1, 1]) {
    renderer.parts(fin, joint(head, [side * .42, .294, -.019], [.19 + .27 * rise, side * -.24, -side * (1.11 + .24 * running + .19 * punch)]), flash);
    const lead = side === facing;
    const foot = lead ? kick : 0;
    const pitch = airborne ? side * .47 - .61 * rise : side * stride * .87;
    renderer.parts(leg, joint(root, [side * .264, .822 - .63 * crouch, -.052],
      [pitch - 1.94 * foot - .37 * recover, 0, side * (.126 + .44 * foot + .18 * fire)]), flash);

    const strikeArm = lead ? 1.7 * punch + 1.85 * swing - 1.09 * windup : .36 * punch + .59 * swing;
    const armPitch = (guarding ? -1.29 : -.34) - side * stride * .66 - .29 * rise - strikeArm - .83 * recover - .94 * fire - 1.22 * reach + .47 * snap;
    const hand = joint(body, [side * .445, 1.743, -.014], [armPitch, side * (.16 + .36 * windup),
      side * (.48 + (pose ? .39 : 0) + .46 * fire + .42 * reach + .48 * windup)]);
    renderer.parts(arm, hand, flash);
    if (lead && striking) renderer.parts(staff, joint(hand, [0, -.568, .117], [-armPitch - .2, side * .16, side * (.73 + 1.7 * swing - 1.3 * windup)]), flash);
    if (lead && casting && age < attack.from && fire > .08) {
      const tip = transformPoint(hand, [0, -.612, .174]);
      const spark = (.29 + .38 * fire) * size;
      renderer.object('gem', tip, [spark, spark, .83 * spark], '#ff9860', [time * 4, time * 6, time * 8], .94, fire);
    }
  }
  if (striking) drawStaffArc(renderer, position, facing, attack, size);
  if (snaring) {
    const [x, y, z] = position;
    const target = attack.capture?.target;
    const end = target ? [target.x, target.y + 1.67, z + .64] : [x + facing * (1.05 + 2.5 * Math.max(0, reach - snap)) * size, y + 1.49 * size, z + .61];
    drawCapeReach(renderer, transformPoint(body, [0, 1.913, -.332]), end, size, reach, time);
  }
}

export const projectiles = {
  markokFireVortex(renderer, { x, y, scale, duration, remaining }, time) {
    const fade = ease((duration - remaining + .04) / .13) * ease(remaining / .16);
    for (let i = 0; i < 21; i++) {
      const level = i / 20;
      const angle = i * .78 + time * 22;
      const radius = (.26 + .72 * level) * scale;
      const height = (level * 2.73 - .91) * scale;
      const flame = (.43 + .14 * Math.sin(time * 28 + i)) * scale;
      renderer.object('leaf', [x + radius * Math.cos(angle), y + height, .66 + radius * Math.sin(angle) * .76],
        [flame + .1 * scale, (.59 + .25 * level) * scale, .38 * scale], i % 3 === 0 ? cream : i % 2 ? '#ff8351' : '#ffc566',
        [.3 * Math.sin(angle), angle, .67 * Math.cos(angle)], .97, .94 * fade);
    }
    renderer.object('gem', [x, y + .24 * scale, .68], [.73 * scale, 2.09 * scale, .63 * scale], '#ffbd59', [0, time * 17, -.067], .95, .63 * fade);
  },
};
