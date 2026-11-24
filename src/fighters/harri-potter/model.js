import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const skin = '#f4beaa';
const jacket = '#252431';
const lining = '#424052';
const hair = '#3e2c2c';
const leather = '#835238';
const violet = '#ac80ff';
const light = '#f5e6ff';
const gold = '#ffdfa0';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));

const coat = [
  part('bevel', [0, 1.5, -.082], [.953, 1.16, .651], jacket),
  part('bevel', [0, 1.515, .244], [.624, 1.067, .323], '#ec9bac'),
  part('plate', [0, 1.018, -.031], [.77, .224, .661], leather),
  part('tube', [0, 2.093, .011], [.317, .362, .342], skin),
  part('bevel', [0, 1.987, .189], [.843, .176, .562], lining),
];
for (const side of [-1, 1]) {
  coat.push(
    part('bevel', [side * .361, 1.452, .228], [.353, 1.113, .39], jacket, [.025, side * .13, side * .079]),
    part('leaf', [side * .287, 1.765, .44], [.211, .49, .091], lining, [Math.PI, 0, side * .25]),
    part('bevel', [side * .369, 1.167, .395], [.178, .104, .064], '#3b394a', [0, side * .21, side * -.15]),
  );
}

const head = [
  part('bevel', [0, .353, .03], [.91, .844, .812], skin),
  part('bevel', [0, .687, -.051], [.971, .441, .846], hair, [0, 0, -.062]),
  part('bevel', [.237, .795, .024], [.494, .252, .693], '#54393a', [.19, -.16, -.13]),
  part('leaf', [-.194, .644, .346], [.385, .432, .209], '#573b3b', [Math.PI, .08, -.57]),
  part('leaf', [.108, .716, .351], [.371, .387, .17], hair, [Math.PI, -.16, -.64]),
  part('bevel', [0, .324, .442], [.171, .134, .156], '#f8c9b0', [.24, 0, -.05]),
  part('grin', [.015, .173, .404], [.372, .321, .049], '#7d3f49'),
  part('bevel', [0, .449, .456], [.213, .053, .07], '#303041', [0, 0, -.09]),
];
for (const side of [-1, 1]) {
  const rim = [Math.PI / 2, side * .14, -.04];
  head.push(
    part('bevel', [side * .467, .337, .006], [.176, .241, .264], skin, [0, 0, -side * .17]),
    part('bevel', [side * .49, .344, .13], [.11, .121, .058], '#df8f90'),
    part('bevel', [side * .317, .26, .389], [.21, .149, .1], '#e77f88', [0, side * .3, side * .18]),
    part('disk', [side * .219, .455, .416], [.357, .107, .351], '#303041', rim),
    part('disk', [side * .217, .455, .474], [.276, .035, .271], '#fff2dd', rim),
    part('bevel', [side * .213 + .019, .447, .505], [.133, .178, .047], '#3c2b3a'),
    part('gem', [side * .213 - .006, .49, .53], [.052, .056, .018], '#fff9ef', zero, .61),
    part('bevel', [side * .409, .45, .261], [.047, .059, .341], '#303041', [0, side * -.33, 0]),
  );
}

const sleeve = [
  part('bevel', [0, -.174, .006], [.493, .53, .495], jacket, [-.09, 0, .07]),
  part('bevel', [.013, -.008, .046], [.462, .322, .484], lining, [.13, 0, -.08]),
];
const wrist = [
  part('bevel', [0, -.144, .018], [.362, .427, .363], jacket),
  part('plate', [0, -.332, .046], [.354, .129, .371], lining),
  part('bevel', [.003, -.423, .056], [.263, .247, .265], skin),
  part('bevel', [.094, -.38, .145], [.117, .154, .137], '#eaa091', [0, .17, -.31]),
];
const pant = [part('bevel', [0, -.186, .002], [.355, .495, .406], leather, [.07, 0, 0])];
const boot = [
  part('bevel', [0, -.188, .011], [.33, .488, .363], '#774935'),
  part('bevel', [0, -.45, .126], [.414, .207, .533], '#438ad5'),
  part('bevel', [0, -.503, .132], [.426, .075, .548], '#273c66'),
  part('bevel', [0, -.407, .227], [.282, .092, .15], '#84bdf5', [.21, 0, -.12]),
];
const wand = [
  part('bevel', [0, .086, 0], [.137, .342, .138], '#635141'),
  part('tube', [0, .267, 0], [.143, .083, .145], '#cb9b69'),
  part('horn', [0, .505, 0], [.093, .61, .087], '#9a694b'),
];
const wandTip = [0, .802, 0];

function drawMagicBomb(renderer, [x, y, z], size, time, phase) {
  const pulseSize = size * (1 + .055 * Math.sin(time * 18 + phase));
  renderer.object('star', [x, y, z], [.49 * size, .49 * size, .32 * size], gold, [0, time * 6 + phase, time * 4], .93, .9);
  renderer.object('bombShell', [x, y, z], [pulseSize, pulseSize, pulseSize], '#a788ff', [0, time * 3, phase * .29], .89, .36);
  for (let i = 0; i < 7; i++) {
    const angle = TAU * i / 7 + time * 8 + phase;
    renderer.object('gem', [x + Math.cos(angle) * .53 * size, y + Math.sin(angle) * .26 * size, z + Math.sin(angle) * .53 * size],
      [.106 * size, .15 * size, .096 * size], i % 2 ? light : violet, [time, angle, .27], .91, .76);
  }
}

function drawArc(renderer, from, to, width, color, opacity) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  renderer.object('bevel', from.map((value, axis) => (value + to[axis]) / 2),
    [width, Math.hypot(dx, dy, dz) + .45 * width, width], color,
    [Math.atan2(dz, Math.hypot(dx, dy)), 0, Math.atan2(-dx, dy)], 1, opacity);
}

function drawLightning(renderer, start, attack) {
  const age = attack.age - attack.from;
  const fade = 1 - ease(age / .38);
  if (!attack.lightningEnds || fade <= 0) return;
  const flicker = Math.floor(age * 37);
  for (const [i, end] of attack.lightningEnds.entries()) {
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    const spacing = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const steps = clamp(Math.ceil(spacing / 1.22), 3, 16);
    let previous = start;
    for (let step = 1; step <= steps; step++) {
      const along = step / steps;
      const jag = Math.sin(step * 4.34 + i * 1.61 + flicker * 1.87) * Math.min(.71, spacing * .19) * Math.sin(Math.PI * along);
      const point = [start[0] + (end[0] - start[0]) * along - Math.sin(angle) * jag,
        start[1] + (end[1] - start[1]) * along + Math.cos(angle) * jag,
        start[2] + (end[2] - start[2]) * along + .27 * Math.sin(Math.PI * along)];
      drawArc(renderer, previous, point, .294, violet, .59 * fade);
      drawArc(renderer, previous, point, .113, '#f9f0ff', .96 * fade);
      if (step % 3 === 0 && step < steps) {
        const fork = step % 2 ? 1 : -1;
        drawArc(renderer, point, [point[0] - Math.sin(angle) * fork * .64, point[1] + Math.cos(angle) * fork * .72, point[2] + .07], .092, '#bdcbff', .62 * fade);
      }
      previous = point;
    }
    const flash = .58 + .93 * (1 - fade);
    renderer.object('star', end, [flash, flash, .21], gold, [0, 0, i + age * 8], .98, .81 * fade);
  }
}

export const portrait = { heading: .22, targetY: 1.63, fov: .50 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .28, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const combo = type === 'harriCombo';
  const jab = combo ? pulse((age - .028) / .232) : 0;
  const kick = combo ? pulse((age - .178) / .276) : 0;
  const bolt = type === 'harriBolt';
  const bombing = type === 'harriBombs';
  const lightning = type === 'harriLightning';
  const casting = bolt || bombing || lightning;
  const windup = casting ? pulse(age / attack.from) : 0;
  const snap = casting ? ease((age - attack.from + .075) / .075) * ease((attack.duration - age) / (lightning ? .24 : .33)) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.6) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) : 0;
  const crouch = landing * 1.36 + (guarding ? .25 : charging ? .22 : 0);
  const root = fighterRoot(position, fighter.size, [0, heading + facing * (.35 * jab - .23 * kick - .47 * windup + .24 * snap),
    wobble + facing * (.19 * kick - .11 * running + .21 * windup - .16 * snap)], attack);
  const body = joint(root, [0, Math.abs(stride) * .071 + Math.sin(time * 4.7) * .034 - crouch, .16 * jab + .17 * snap],
    [.14 * running + .29 * jab - .34 * windup + (lightning ? -.24 : .29) * snap - .25 * recover - .19 * kick, 0, -.08 * stride]);
  renderer.parts(coat, body, flash);
  renderer.parts(head, joint(body, [0, 2.13, .036], [-.14 * jab - .37 * snap * Number(lightning), .11 * stride, -.14 * (windup + Number(pose))]), flash);

  for (const side of [-1, 1]) {
    const wandHand = side === -facing;
    const foot = wandHand ? 0 : kick;
    const legPitch = airborne ? side * .54 - .48 * rise : side * stride * .89;
    const leg = joint(root, [side * .231, 1.002 - .63 * crouch, -.058],
      [legPitch - 1.97 * foot - .4 * recover + .39 * windup, 0, side * (.13 + .22 * snap + .47 * foot)]);
    renderer.parts(pant, leg, flash);
    renderer.parts(boot, joint(leg, [0, -.435, .025], [airborne ? .42 + side * .24 : .27 * Math.max(0, -side * stride), 0, 0]), flash);

    const pitch = (guarding ? -1.23 : -.27) - side * stride * .74 - .26 * rise - .83 * recover + .56 * foot +
      (wandHand ? -.4 * Number(pose) + 1.05 * windup - (lightning ? 1.87 : 1.28) * snap + .52 * jab : -1.56 * jab - .63 * windup - .73 * snap);
    const spread = side * (.51 + (pose ? .26 : 0) + (wandHand ? .38 * windup - .38 * snap : .46 * snap)) + facing * .28 * kick;
    const shoulder = joint(body, [side * .449, 1.874, .022], [pitch, side * .14, spread]);
    renderer.parts(sleeve, shoulder, flash);
    const elbow = joint(shoulder, [0, -.402, .025], [-(wandHand ? .46 + .6 * windup : .5 - .44 * jab), 0, side * .12]);
    renderer.parts(wrist, elbow, flash);
    if (!wandHand) continue;

    const grip = joint(elbow, [.018 * side, -.449, .068], [-.04 + .38 * windup, 0, Math.PI + side * (.3 - .29 * snap)]);
    renderer.parts(wand, grip, flash);
    if (!casting && !charging && !pose) continue;
    const tip = transformPoint(grip, wandTip);
    if (bombing && !attack.fired && age > .09) {
      drawMagicBomb(renderer, tip, fighter.size * (.3 + .65 * ease((age - .09) / .19)), time, 0);
    } else {
      const spark = fighter.size * (.17 + .11 * Math.abs(Math.sin(time * 23)) + .23 * windup + .37 * snap);
      renderer.object('star', tip, [spark, spark, .53 * spark], lightning ? '#cdbdff' : gold, [0, time * 5, time * 9], .97);
    }
    if (lightning) drawLightning(renderer, tip, attack);
  }
}

export const projectiles = {
  harriSpark(renderer, { x, y, vx, scale }, time) {
    const direction = Math.sign(vx);
    renderer.object('star', [x, y, .69], [.61 * scale, .57 * scale, .3 * scale], light, [0, time * 11, time * 9], .96);
    for (let i = 1; i <= 3; i++) {
      const t = i / 3;
      renderer.object('leaf', [x - direction * i * .27, y + Math.sin(time * 26 + i) * .13 * t, .69],
        [(.37 - .16 * t) * scale, .87 * scale, .21 * scale], i % 2 ? violet : '#84cdff',
        [0, 0, direction * (1.17 + .25 * t)], .94, .91 - .5 * t);
    }
  },
  harriMagicBomb(renderer, { x, y, vx, scale }, time) {
    drawMagicBomb(renderer, [x, y, .69], scale, time, vx * .27);
  },
};
