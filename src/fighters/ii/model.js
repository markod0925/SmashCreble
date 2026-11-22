import { clamp } from '../../math.js';
import { multiply, one, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const ink = '#30323f';
const slate = '#484955';
const charcoal = '#242833';
const trim = '#6d6e7d';
const silver = '#ccd8e5';
const steel = '#849dbd';
const brass = '#d7aa69';
const red = '#bb4f5f';
const skin = '#e9b897';
const pulse = value => Math.sin(Math.PI * clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.393, -.02], [.846, 1.224, .663], ink),
  part('bevel', [0, 1.436, .239], [.724, .994, .244], '#3b3c4a', [-.079, .03, .033]),
  part('box', [-.038, 1.401, .378], [.052, .851, .037], trim, [.092, 0, -.084]),
  part('plate', [0, 1.044, .002], [.867, .173, .707], charcoal, [0, 0, .085]),
  part('box', [.075, 1.042, .386], [.224, .121, .072], brass, [0, -.06, .08]),
  part('box', [.073, 1.044, .429], [.117, .061, .02], '#594d50', [0, -.06, .08]),
  part('plate', [0, 1.897, .064], [.692, .178, .623], red, [0, 0, -.182]),
  part('gem', [.33, 1.913, .196], [.195, .159, .16], '#d96b6d', [0, .23, -.15], .18),
];
for (const side of [-1, 1]) {
  torso.push(
    part('leaf', [side * .329, .994, -.025], [.374, .526, .378], slate, [Math.PI + .31, 0, side * -.24]),
    part('box', [side * .248, 1.562, .346], [.076, .55, .043], charcoal, [0, .16 * side, -.48 * side]),
  );
}

const head = [
  part('bevel', [0, .322, -.009], [.834, .735, .702], skin),
  part('bevel', [0, .696, -.032], [.956, .591, .843], charcoal, [.06, 0, -.081]),
  part('plate', [0, .597, .001], [.963, .109, .887], '#363641', [0, 0, -.079]),
  part('plate', [0, .74, -.009], [.869, .069, .802], slate, [0, 0, -.083]),
  part('plate', [0, .829, -.024], [.76, .062, .728], '#545764', [0, 0, -.081]),
  part('bevel', [0, .172, .075], [.811, .277, .616], '#3a3242', [0, 0, .06]),
  part('grin', [.009, .171, .393], [.341, .345, .069], '#d46c73', [0, 0, .135]),
  part('box', [.087, .187, .419], [.128, .041, .018], '#f4dac7', [0, 0, .253]),
  part('bevel', [-.018, .345, .352], [.149, .126, .144], '#efc5a6', [0, 0, .1]),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .162, .417, .338], [.199, .123, .062], '#f4debc', [0, side * .13, side * .12]),
    part('box', [side * .15, .409, .375], [.058, .101, .031], charcoal, [0, side * .14, side * .1]),
  );
}

const sleeve = [
  part('bevel', [0, -.216, -.012], [.326, .547, .34], slate),
  part('bevel', [0, -.496, .036], [.258, .429, .289], charcoal),
  part('plate', [0, -.604, .049], [.316, .128, .34], trim),
  part('bevel', [0, -.717, .067], [.289, .231, .322], '#696577'),
];
const leg = [
  part('bevel', [0, -.242, -.009], [.299, .587, .343], ink),
  part('bevel', [0, -.538, .047], [.262, .393, .346], slate),
  part('bevel', [0, -.748, .132], [.379, .234, .551], charcoal),
  part('plate', [0, -.802, .159], [.369, .101, .551], '#60616b'),
  part('box', [0, -.723, .372], [.201, .066, .036], '#b2a28f', [0, 0, -.045]),
];
const scarf = [
  part('leaf', [.146, -.183, -.143], [.259, .549, .087], red, [Math.PI -.27, .12, -.31]),
  part('leaf', [.011, -.158, -.272], [.172, .476, .083], '#9e425c', [Math.PI -.29, 0, -.11]),
];
const scabbard = [
  part('bevel', [0, -.504, -.005], [.199, 1.059, .176], charcoal),
  part('box', [0, -.938, .006], [.202, .102, .193], brass),
  part('box', [0, -.03, .008], [.224, .104, .198], trim),
];
const hilts = [brass, '#b48a96', '#b8c1db'];
const swordRigs = hilts.map((hilt, index) => [
  part('box', [0, -.164, 0], [.142, .299, .142], slate, [0, .14, -.12]),
  part('gem', [0, -.325, 0], [.171, .129, .134], hilt, [Math.PI, 0, 0]),
  part('plate', [0, .004, 0], [.361, .08, .192], hilt, [0, 0, .08]),
  part('box', [0, .382, 0], [.156 + index * .015, .756, .08], silver, zero, .28),
  part('leaf', [0, .797, 0], [.168 + index * .019, .315, .076], '#e6eff5', zero, .34),
  part('box', [-.039, .363, .043], [.039, .689, .017], steel, zero, .25),
]);
const scabbardOffsets = [[-.37, 1.98, -.423, -.44], [.4, 1.983, -.41, .523], [.033, 1.789, -.574, .083]];

export const portrait = { targetY: 1.69, fov: .457, heading: .17 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .3, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const combo = attack?.type === 'iiCombo';
  const punch = combo ? pulse(age / .192) : 0;
  const kick = combo ? pulse((age - .148) / .205) : 0;
  const finish = combo ? pulse((age - .315) / .271) : 0;
  const thrust = attack?.type === 'iiThrust';
  const twin = attack?.type === 'iiTwinSlash';
  const diving = attack?.type === 'iiTripleDive';
  const plunge = diving ? pulse((age - attack.from + .08) / .46) : 0;
  const reach = thrust ? pulse((age - .057) / .398) : 0;
  const cross = twin ? pulse((age - .11) / .32) : 0;
  const uncross = twin ? pulse((age - .318) / .363) : 0;
  const drawCount = diving && age > .105 && age < .847 ? 3 : twin && age > .115 && age < .705 ? 2 : thrust && age > .091 && age < .497 ? 1 : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.7) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.5, -1, 1) : 0;
  const crouch = landing * 1.14 + (guarding ? .21 : charging ? .18 : 0);
  const bob = Math.abs(stride) * .082 + Math.sin(time * 4.5) * .024 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * (.34 * reach + .25 * punch + .19 * (cross - uncross)),
    wobble - facing * (running * .145 + reach * .165 + plunge * .32)]);
  const body = joint(root, [0, bob, .12 * reach + .102 * plunge], [.11 * running + plunge * .48 + .21 * punch - recover * .24, 0, .086 * uncross]);
  renderer.parts(torso, body, flash);
  renderer.parts(head, joint(body, [0, 2.009, .041], [plunge * .16 - recover * .29, punch * .14, pose ? -.11 : stride * .074]), flash);
  renderer.parts(scarf, joint(body, [.3, 1.91, .031], [.18 + running * .56 + plunge * .57, 0, .28 + Math.sin(time * 7.3) * .18]), flash);
  for (const [i, [x, y, z, angle]] of scabbardOffsets.entries()) {
    const back = joint(body, [x, y, z], [-.14, -.13, angle]);
    renderer.parts(scabbard, back, flash);
    if (i >= drawCount) {
      renderer.mesh('tube', multiply(back, transform([0, .145, 0], [.131, .265, .127], zero)), slate);
      renderer.mesh('box', multiply(back, transform([0, .065, .015], [.28, .067, .145], zero)), hilts[i], .21);
    }
  }

  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legBend = airborne ? side * .42 - rise * .39 : stride * side * .81;
    renderer.parts(leg, joint(root, [side * .213, .837 - crouch * .415, 0],
      [legBend - (lead ? kick * 1.66 : finish * 1.87) - recover * .38 - plunge * .25, 0, side * .075]), flash);
    const wielding = drawCount >= 2 || drawCount && lead;
    const strike = lead ? punch * 1.6 + reach * 1.44 : .15 * reach;
    const sweep = lead ? cross * 1.34 + uncross * .4 : cross * .41 + uncross * 1.48;
    const pitch = guarding ? -1.36 : -.27 - stride * side * .61 - rise * .32 - recover * 1.26 - strike - sweep - plunge * 1.25;
    const splay = side * (.27 + (pose ? .39 : 0) + uncross * 1.09 - cross * .31 + plunge * .33);
    const hand = joint(body, [side * .406, 1.758, 0], [pitch, side * (reach * .12 + cross * .29), splay]);
    renderer.parts(sleeve, hand, flash);
    if (!wielding) continue;
    const slashAngle = diving ? .99 + plunge * .97 : thrust ? .68 + reach * .88 : 1.06 + cross * .47 - uncross * .39;
    const swordRoot = joint(hand, [side * .038, -.727, .143], [-pitch + slashAngle, side * .09, side * (.51 * uncross - cross * .23)]);
    renderer.parts(swordRigs[lead ? 0 : 1], swordRoot, flash);
  }
  if (drawCount === 3) {
    const [x, y, z] = position;
    const angle = -.43 - plunge * .44;
    renderer.parts(swordRigs[2], transform([x + facing * (.56 + plunge * .21) * size, y + (1.39 - plunge * .26) * size, z + .81],
      [size, size, size], [0, .15 * facing, facing * (angle - Math.PI / 2)]), flash);
  }

  if (!attack?.until || age < attack.from || age > attack.until) return;
  if (thrust) drawThrustTrail(renderer, position, facing, attack, size);
  if (twin || diving) drawBladeTrails(renderer, position, facing, attack, size, diving ? 3 : 2);
}

function drawThrustTrail(renderer, [x, y, z], facing, attack, size) {
  const phase = clamp((attack.age - attack.from) / (attack.until - attack.from), 0, 1);
  renderer.object('leaf', [x + facing * (1.67 + .59 * phase) * size, y + 1.51 * size, z + .7],
    [.183 * size, (1.33 - phase * .59) * size, .091], '#daf2ff', [0, 0, -facing * 1.54], .92, (1 - phase) * .79);
}

function drawBladeTrails(renderer, [x, y, z], facing, attack, size, count) {
  const phase = clamp((attack.age - attack.from) / (attack.until - attack.from), 0, 1);
  const dive = count === 3;
  for (let i = 0; i < count; i++) {
    const angle = dive ? -.77 + i * .21 : (.74 - phase * 1.4) * (attack.followUp ? 1 : -1) - i * .29;
    const reach = (dive ? 1.12 + i * .27 : 1.42 + i * .22 + phase * .18) * size;
    renderer.object('leaf', [x + facing * (reach + Math.cos(angle) * .61 * size), y + ((dive ? .88 : 1.48) + Math.sin(angle) * .61) * size, z + .68 + .08 * i],
      [.19 * size, .88 * size, .102], i % 2 ? '#b9c7f3' : '#e1f2ff', [0, 0, facing * (angle - Math.PI / 2)], .92, .82 * (1 - phase));
  }
}

export function drawBorrowedThrust(renderer, position, facing, attack, size) {
  if (attack.age < .091 || attack.age > .477) return;
  const [x, y, z] = position;
  const reach = pulse((attack.age - .057) / .398);
  renderer.parts(swordRigs[0], transform([x + facing * (.45 + reach * .6) * size, y + 1.41 * size, z + .81],
    [size, size, size], [0, .14, -facing * (1.21 + reach * .34)]), false);
  if (attack.age >= attack.from && attack.age <= attack.until) drawThrustTrail(renderer, position, facing, attack, size);
}
