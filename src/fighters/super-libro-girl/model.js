import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const orange = '#ed9745';
const copper = '#ad5e46';
const paper = '#fff0c8';
const ink = '#593a4b';
const green = '#367857';
const pink = '#ef8eb2';
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const pages = [
  part('bevel', [0, 1.557, .003], [1.27, 1.94, .773], paper),
  part('bevel', [0, 1.553, -.384], [1.391, 2.027, .161], copper),
  part('bevel', [-.646, 1.556, .009], [.26, 2.04, .912], '#d17744'),
  part('bevel', [-.72, 1.554, .286], [.097, 1.829, .171], '#f7b55c'),
];
for (let i = 0; i < 5; i++) {
  const depth = -.25 + i * .132;
  pages.push(part('box', [.037, 2.494 - .012 * i, depth], [1.06, .025, .023], i % 2 ? '#d1ae91' : '#f8d8ab', [0, .055 * i, -.025]));
}
const cover = [
  part('bevel', [.004, 1.542, .399], [1.399, 1.973, .223], orange),
  part('bevel', [.02, 1.554, .523], [1.19, 1.78, .095], '#f7a852'),
  part('bevel', [0, .772, .573], [.97, .11, .054], '#e8bc71', [0, 0, -.013]),
  part('leaf', [.471, 2.279, .614], [.358, .342, .08], '#80ba55', [0, -.047, -.56]),
  part('leaf', [.467, 2.297, .667], [.221, .212, .044], '#b1d968', [0, -.047, -.56]),
  part('grin', [0, 1.51, .604], [.373, .288, .048], ink),
  part('box', [0, 1.478, .632], [.156, .038, .019], '#ffd29e', [0, 0, .06]),
];
for (const side of [-1, 1]) {
  cover.push(part('bevel', [side * .219, 1.907 + side * .027, .589], [.283, .283, .107], '#fff5dc', [0, side * .12, side * .121]),
    part('bevel', [side * .204, 1.905 + side * .033, .648], [.116, .174, .035], ink),
    part('gem', [side * .204 - .022, 1.952 + side * .033, .669], [.063, .063, .022], '#fff9dd', zero, .78),
    part('box', [side * .24, 2.095 + side * .02, .57], [.222, .049, .04], copper, [0, 0, side * .29]),
    part('bevel', [side * .392, 1.705, .599], [.14, .091, .038], '#e48864', [0, side * .19, side * -.22]));
}
const arm = [
  part('bevel', [0, -.18, .023], [.176, .447, .224], '#edc65e'),
  part('bevel', [0, -.449, .058], [.156, .362, .179], '#f4d577'),
  part('bevel', [.023, -.617, .098], [.228, .214, .229], '#ffe494'),
];
const legs = [
  part('tube', [0, -.17, .008], [.122, .437, .134], '#e6a0af'),
  part('bevel', [0, -.388, .095], [.259, .18, .374], '#4c72bd', [-.09, 0, 0]),
  part('box', [0, -.458, -.02], [.117, .18, .109], '#314e94', [0, 0, -.06]),
  part('bevel', [0, -.391, .243], [.235, .094, .171], '#e28db1'),
];
const sword = [
  part('bevel', [0, .571, .003], [.223, 1.186, .139], pink, [0, 0, .03], .27),
  part('horn', [-.022, 1.182, .002], [.223, .286, .134], '#ffd9e6', [0, 0, .036], .43),
  part('box', [.003, .545, .063], [.061, 1.136, .027], '#fbc4d7', [0, 0, .029], .44),
  part('bevel', [0, -.027, .004], [.516, .148, .212], '#fbc6a5', [0, .301, -.1]),
  part('tube', [0, -.166, .006], [.146, .269, .152], '#bd6c78'),
  part('gem', [0, -.305, .008], [.163, .204, .174], '#fad99a', zero, .19),
];
const shield = [
  part('gem', [0, 0, .018], [.78, 1.141, .42], '#285b49', [0, 0, .018]),
  part('bevel', [0, .092, .128], [.682, .666, .234], green),
  part('plate', [0, .392, .094], [.778, .121, .321], '#509665', [0, 0, .07]),
  part('gem', [0, -.03, .271], [.419, .537, .144], '#ed6caf', [0, 0, .07], .42),
  part('gem', [-.04, .057, .327], [.129, .183, .043], '#ffb9dc', [0, 0, .13], .56),
];

function drawSlash(renderer, [x, y, z], facing, attack, size, mighty) {
  if (attack.age < attack.from || attack.age > attack.until) return;
  const progress = (attack.age - attack.from) / (attack.until - attack.from);
  const radius = mighty ? 1.49 : 1.01;
  for (let i = 0; i < (mighty ? 7 : 4); i++) {
    const theta = .94 - progress * 1.68 + i * .19;
    renderer.object('leaf', [x + facing * (.88 + Math.cos(theta) * radius) * size, y + (1.32 + Math.sin(theta) * radius) * size, z + .75 + i * .031],
      [(mighty ? .43 : .24) * size, (mighty ? 1.17 : .76) * size, .13], i % 2 ? '#ffd7d8' : '#ff9cde',
      [0, 0, -facing * (1.43 + theta)], .97, (1 - progress) * .86);
  }
}

export function drawBorrowedSteelSword(renderer, position, facing, attack, size) {
  const age = attack.age;
  const swing = pulse((age - .051) / .39);
  if (swing > .029) {
    const [x, y, z] = position;
    renderer.parts(sword, transform([x + facing * (.58 + .36 * swing) * size, y + 1.38 * size, z + .72], [size, size, size],
      [0, facing * .28, facing * (.97 - age * 9.05)]), false);
  }
  drawSlash(renderer, position, facing, attack, size, false);
}

export const portrait = { heading: .14, targetY: 1.68, fov: .53 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const kick = type === 'libroHeel' ? pulse((age - .013) / .258) : 0;
  const mighty = type === 'libroMightySlash';
  const slashing = mighty || type === 'libroSword';
  const windup = slashing ? pulse(age / (attack.from + .048)) : 0;
  const swing = slashing ? pulse((age - attack.from + .064) / (mighty ? .344 : .272)) : 0;
  const casting = type === 'libroDazzle';
  const aperture = casting ? ease((age - .065) / .215) * ease((attack.duration - age) / .32) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.42) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.35, -1, 1) : 0;
  const crouch = landing * 1.34 + (guarding ? .22 : charging ? .17 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.24 * kick - .44 * windup + .45 * swing),
    wobble - facing * (.12 * running - .18 * kick + .16 * swing)], attack);
  const body = joint(root, [0, Math.abs(stride) * .082 + .027 * Math.sin(time * 4.6) - crouch, .103 * swing],
    [.13 * running - .32 * recover - .13 * kick - .19 * aperture, 0, -.09 * stride]);
  renderer.parts(pages, body, flash);
  const hinge = joint(body, [-.625, 1.54, .44], [0, -aperture * 1.91, 0]);
  renderer.parts(cover, joint(hinge, [.625, -1.54, -.44]), flash);
  if (aperture > .02) {
    renderer.mesh('bevel', multiply(body, transform([.082, 1.585, .464], [.921, 1.54, .101], zero)), '#fff4b0', .92, .79 * aperture);
  }
  for (const side of [-1, 1]) {
    const lead = side === facing;
    const legPitch = airborne ? side * .47 - .38 * rise : side * stride * .8;
    renderer.parts(legs, joint(root, [side * .302, .555 - .32 * crouch, -.042],
      [legPitch - (lead ? kick * 1.9 : 0) - .29 * recover, 0, side * (.125 + .18 * aperture) + facing * (lead ? .58 * kick : 0)]), flash);
    const swordHand = side > 0;
    const pitch = (guarding ? -1.48 : -.42 - side * stride * .53 - .26 * rise) - .81 * aperture - .95 * recover -
      (swordHand ? windup * 1.47 + swing * .72 : .46 * swing);
    const hand = joint(body, [side * .653, 1.388, -.019], [pitch, side * (.18 + .18 * windup), side * (.42 + .29 * (pose ? 1 : 0) + .44 * aperture)]);
    renderer.parts(arm, hand, flash);
    const grip = joint(hand, [0, -.641, .12], [-pitch - .2 - (swordHand ? .94 * swing : 0), .1 * side, swordHand ? -.29 + 1.11 * swing - .43 * windup : -.08]);
    if (swordHand) {
      const blade = mighty ? multiply(grip, transform(zero, [1 + .31 * swing, 1 + .27 * swing, 1], zero)) : grip;
      renderer.parts(sword, blade, flash);
    } else renderer.parts(shield, joint(grip, [0, -.055, .11], [.02, -.38, guarding ? -.08 : .22]), flash);
  }

  if (slashing) drawSlash(renderer, position, facing, attack, size, mighty);
  if (kick > .07 && age >= attack.from && age <= attack.until) {
    const [x, y, z] = position;
    renderer.object('leaf', [x + facing * 1.24 * size, y + 1.43 * size, z + .84], [.25, .76, .11], '#e9c7fa', [0, 0, -facing * 1.02], .89, kick * .75);
  }
}

export function drawDazzleBurst(renderer, { x, y, age, lifetime }) {
  const progress = age / lifetime;
  const fade = (1 - ease(progress)) * ease((age + .018) / .085);
  const spread = 1.79 + 12.2 * ease(progress);
  const centerY = y + .69;
  renderer.object('disk', [x, centerY, 3.3], [spread * 1.8, .12, spread * 1.15], '#fff1b1', [Math.PI / 2, 0, 0], 1, .24 * fade);
  renderer.object('star', [x, centerY, 3.45], [spread * 1.1, spread * 1.13, .18], '#fff4c6', [0, 0, progress * .45], 1, .55 * fade);
  for (let i = 0; i < 12; i++) {
    const angle = TAU * i / 12 + .17;
    renderer.object('leaf', [x + Math.cos(angle) * spread, centerY + Math.sin(angle) * spread * .68, 3.1],
      [.246, .79 + progress * 1.2, .127], i % 2 ? '#ffe190' : '#fff9dd', [0, 0, angle - Math.PI / 2], 1, .78 * fade);
  }
}
