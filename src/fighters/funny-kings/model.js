import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const soot = '#30323e';
const coal = '#44414d';
const plum = '#59485d';
const lilac = '#b699dc';
const brass = '#d5a568';
const orange = '#e7a054';
const pink = '#e9abac';
const rose = '#d48eaa';
const cream = '#fff0cc';
const cord = '#71434c';
const pulse = phase => Math.sin(Math.PI * clamp(phase, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const coat = [
  part('bevel', [0, 1.438, -.017], [1.12, 1.187, .766], soot),
  part('bevel', [-.263, 1.465, .253], [.546, 1.123, .361], plum, [0, -.12, -.07]),
  part('bevel', [.263, 1.465, .26], [.536, 1.123, .349], coal, [0, .11, .059]),
  part('box', [0, 1.424, .478], [.065, .871, .051], '#262731', [0, .05, -.033]),
  part('plate', [0, 1.955, .008], [1.18, .183, .765], '#5c4657'),
  part('plate', [0, 1.185, -.023], [1.13, .114, .772], '#777082', [0, 0, -.038]),
  part('leaf', [-.361, .944, -.118], [.362, .65, .39], plum, [Math.PI - .43, 0, -.15]),
  part('leaf', [.362, .947, -.118], [.362, .65, .39], coal, [Math.PI - .43, 0, .17]),
];
for (const side of [-1, 1]) {
  for (const [i, y] of [1.923, 1.809, 1.695].entries()) {
    coat.push(part('plate', [side * (.488 + i * .063), y, .122], [.312, .14, .395],
      i % 2 ? '#f3ca78' : orange, [0, .07 * side, .34 * side]));
  }
  coat.push(
    part('leaf', [side * .229, 1.703, .449], [.229, .503, .057], side < 0 ? '#8e7197' : '#b67c61',
      [Math.PI, side * .23, side * .42]),
    part('gem', [side * .128, 1.34, .48], [.091, .098, .047], brass, zero, .26),
  );
}

function makeFace(color, side) {
  const face = [
    part('bevel', [0, .278, -.01], [.712, .751, .677], color),
    part('bevel', [side * .131, .18, .145], [.538, .389, .494], color, [0, side * .09, -.055]),
    part('bevel', [0, .26, .397], [.133, .114, .136], '#f3b7a2', [0, .16 * side, -.04]),
    part('grin', [.018 * side, .145, .411], [.451, side < 0 ? .364 : .413, .119], '#512c43', [0, 0, side * .09]),
  ];
  for (const x of [-.143, .143]) {
    const squint = side < 0 && x < 0;
    face.push(
      part('bevel', [x, .344, .343], [.146, squint ? .058 : .144, .061], '#fff0de', [0, x * 1.21, side * .17]),
      part('box', [x + .006, .343, .385], [.048, squint ? .05 : .083, .029], soot, [0, x * 1.01, side * .13]),
      part('box', [x, .408, .342], [.148, .034, .033], cord, [0, x * .94, side * .28]),
    );
  }
  for (const [i, x] of [-.121, -.037, .051, .137].entries()) {
    face.push(part('box', [x, .12 - (i % 3) * .012, .437], [.066, .075, .035], cream, [0, x * .55, side * .1 + x * .53]));
  }
  return face;
}
const faces = [makeFace(pink, -1), makeFace(rose, 1)];
const crown = [
  part('bevel', [0, .581, -.041], [1.479, .341, .701], soot),
  part('plate', [0, .447, .015], [1.46, .105, .745], '#272733'),
  part('plate', [0, .515, .298], [1.333, .072, .168], brass, [0, 0, -.044]),
  part('bevel', [-.359, .772, -.044], [.392, .63, .55], coal, [0, .2, .234]),
  part('bevel', [.332, .792, -.092], [.403, .77, .556], plum, [0, -.078, -.225]),
  part('leaf', [-.548, .765, -.091], [.286, .495, .378], coal, [0, .19, .48]),
  part('leaf', [.566, .688, -.085], [.341, .46, .369], plum, [0, -.16, -.616]),
  part('gem', [-.4, .653, .265], [.191, .154, .073], '#c0abd7', [0, .14, .26], .41),
  part('gem', [.392, .653, .264], [.203, .159, .083], '#df987d', [0, -.12, -.16], .41),
];

const sleeve = [
  part('bevel', [0, -.17, .015], [.293, .534, .327], coal, [.027, 0, -.06]),
  part('bevel', [0, -.458, .037], [.277, .475, .303], soot, [.138, 0, -.077]),
  part('plate', [0, -.63, .074], [.333, .121, .329], '#ac819a', [.13, 0, -.141]),
];
const holdingHand = [
  part('bevel', [0, -.726, .067], [.276, .215, .303], rose),
  part('bevel', [.098, -.754, .167], [.122, .15, .147], pink, [0, -.17, -.18]),
];
const leg = [
  part('bevel', [0, -.236, .008], [.285, .569, .337], '#595865', [0, 0, -.056]),
  part('bevel', [0, -.524, .037], [.251, .42, .289], coal, [.14, 0, .054]),
  part('bevel', [0, -.732, .158], [.359, .215, .499], soot),
  part('leaf', [0, -.688, .354], [.359, .334, .236], '#545264', [Math.PI / 2 - .56, 0, -.076]),
  part('gem', [0, -.693, .408], [.142, .077, .097], brass),
];

const blade = [
  part('plate', [0, .013, 0], [.343, .151, .293], '#694e79', [0, 0, -.137]),
  part('bevel', [-.091, .293, 0], [.369, .577, .168], '#8c72c4', [0, 0, .239]),
  part('leaf', [-.185, .585, .011], [.39, .726, .154], lilac, [0, 0, .515], .31),
  part('leaf', [-.275, .635, .06], [.113, .575, .083], '#e7dcf9', [0, 0, .515], .51),
  part('gem', [-.066, .159, .099], [.129, .148, .061], '#ead6f5', [0, .081, .162], .46),
];
const bomb = [
  part('bombShell', [0, 0, 0], [.557, .579, .542], '#ce646e', [0, 0, -.082]),
  part('plate', [0, .195, .006], [.349, .148, .323], cord),
  part('box', [-.076, -.065, .264], [.152, .067, .026], '#faac97', [0, .12, -.323]),
  part('gem', [.112, -.099, .247], [.127, .118, .064], '#f2a075', [0, .27, .44], .35),
];
const glove = [
  part('bevel', [0, .014, .012], [.399, .302, .282], cream),
  part('plate', [0, -.19, .01], [.322, .116, .274], '#b47a83'),
  part('bevel', [-.166, .063, .032], [.162, .262, .184], '#e7be9e', [0, -.05, .69]),
];
for (const [i, x] of [-.097, .018, .121].entries()) {
  glove.push(part('bevel', [x, .19 + (i === 1 ? .064 : .015), .025], [.128, .303 - i * .013, .19],
    i === 1 ? '#fff4d8' : cream, [0, 0, -x * 1.69]));
}

const tomato = [
  part('bombShell', [0, 0, 0], [.56, .484, .53], '#e64641', [0, 0, -.32], .29),
  part('bevel', [-.105, .087, .193], [.167, .078, .069], '#f98165', [0, -.44, .55], .43),
  part('tube', [-.018, .235, .018], [.068, .192, .073], '#4f8c53', [0, 0, -.29]),
  part('leaf', [.083, .252, .044], [.12, .211, .059], '#85ba64', [0, .12, -1.02]),
  part('leaf', [-.106, .22, .043], [.109, .224, .058], '#69a456', [0, -.22, .91]),
];

function drawTomato(renderer, position, size, spin) {
  renderer.parts(tomato, transform(position, [size, size, size], [0, spin * .42, spin]), false);
}

function drawHandBomb(renderer, root, extension, flash) {
  renderer.parts(bomb, root, flash);
  renderer.parts(glove, joint(root, [.028, .38 + extension * .25, .017], [-extension * .61, 0, extension * -.41]), flash);
}

export const portrait = { targetY: 1.77, fov: .476, heading: .095 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .3, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const slap = attack?.type === 'kingsSlaps' ? Math.max(pulse((age - .017) / .195), pulse((age - .202) / .241)) : 0;
  const toss = attack?.type === 'kingsTomato' ? pulse(age / attack.duration) : 0;
  const bladeCast = attack?.type === 'kingsBlades' ? pulse(age / attack.duration) : 0;
  const finale = attack?.type === 'kingsFinale' ? pulse(age / attack.duration) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.14 + (guarding ? .23 : charging ? .16 : 0);
  const bob = Math.abs(stride) * .09 + Math.sin(time * 5.3) * .028 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading * .77 + facing * (.26 * slap + bladeCast * .17),
    wobble - facing * (running * .142 + slap * .155 - bladeCast * .11)]);
  const body = joint(root, [0, bob, .105 * slap], [.13 * running + slap * .18 - recovery * .27, 0, finale * .095]);
  renderer.parts(coat, body, flash);
  const heads = joint(body, [0, 2.042, .017], [-.23 * recovery + .11 * slap, bladeCast * .15, pose ? -.077 : stride * .061]);
  for (const [i, side] of [-1, 1].entries()) {
    renderer.parts(faces[i], joint(heads, [side * .33, side * .024, .006], [0, side * .17 + .037 * slap, side * .09]), flash);
  }
  renderer.parts(crown, heads, flash);

  for (const side of [-1, 1]) {
    const feet = joint(root, [side * .247, .823 - crouch * .39, 0],
      [airborne ? side * .431 - rise * .443 : stride * side * .8, 0, side * .092]);
    renderer.parts(leg, feet, flash);
    const bladeArm = side < 0;
    const motion = bladeArm ? bladeCast * 1.77 : slap * 1.4 + toss * 1.19;
    const pitch = guarding ? -1.25 : -.31 - side * stride * .61 - rise * .428 - recovery * 1.31 - finale * 1.27 - motion;
    const sweep = side * (.33 + (pose ? .41 : 0) + finale * .99 + (bladeArm ? bladeCast * .64 : slap * .38));
    const armRoot = joint(body, [side * .497, 1.773, .014], [pitch, side * motion * .21, sweep]);
    renderer.parts(sleeve, armRoot, flash);
    if (bladeArm) {
      renderer.parts(blade, joint(armRoot, [-.055, -.713, .081], [-pitch + .23 - bladeCast * 1.47, 0, .46 + bladeCast * .51]), flash);
    } else {
      renderer.parts(holdingHand, armRoot, flash);
      drawHandBomb(renderer, joint(armRoot, [.049, -.727, .243], [-pitch + .31 - slap * 1.11, 0, -.4 + slap * .72]),
        Math.max(slap, finale * .63), flash);
    }
  }
  const [x, y, z] = position;
  if (toss && age >= .038 && age < attack.from) {
    drawTomato(renderer, [x + facing * (.61 + toss * .31) * size, y + (1.51 + toss * .47) * size, z + .44], size, age * 7);
  }
  if (slap && attack.age >= attack.from && attack.age <= attack.until) {
    renderer.object('leaf', [x + facing * 1.42 * size, y + 1.51 * size, z + .69],
      [.23, .84, .134], '#ffd6b6', [0, 0, -facing * 1.19], .8, slap * .71);
  }
  if (finale) {
    for (let i = 0; i < 5; i++) {
      const angle = age * 4.2 + i * TAU / 5;
      renderer.object('gem', [x + Math.cos(angle) * 1.05, y + 1.57 + Math.sin(angle) * .74, z + .83],
        [.23, .205, .128], i % 2 ? '#ec9eac' : '#d5b4f0', [0, angle, angle], .88, finale * .91);
    }
  }
}

function flyingTomato(renderer, { x, y, vx, remaining }) {
  drawTomato(renderer, [x, y, .94], 1.02, Math.sign(vx) * remaining * 9.1);
}

function flyingBlade(renderer, { x, y, angle, remaining }) {
  const turn = angle - Math.PI / 2 + Math.sin(remaining * 32) * .28;
  renderer.parts(blade, transform([x, y, 1.0], [1, 1, 1], [0, remaining * 6.9, turn]), false);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  renderer.object('leaf', [x - dx * .66, y - dy * .66, .92], [.156, 1.05, .063], '#c29fed',
    [0, 0, angle - Math.PI / 2], .95, .51);
}

function flyingHandBomb(renderer, { x, y, angle, remaining }) {
  const turn = angle - Math.PI / 2 + Math.sin(remaining * 22) * .35;
  const root = transform([x, y, .94], [.8, .8, .8], [0, remaining * 7.3, turn]);
  drawHandBomb(renderer, root, .51, false);
  renderer.object('gem', [x, y, 1.26], [.156, .155, .099], '#ffc1af', [0, remaining * 8.6, turn], .97, .71);
}

export const projectiles = { kingsTomato: flyingTomato, kingsBlade: flyingBlade, kingsHandBomb: flyingHandBomb };

export function drawTomatoSplat(renderer, effect) {
  const { target, age, lifetime } = effect;
  const t = age / lifetime;
  const stuck = target?.stocks && !target.respawn;
  const x = stuck ? target.x - effect.xDir * .19 : effect.x;
  const y = stuck ? target.y + effect.offsetY : effect.y;
  const spread = .62 + clamp(t * 4.2, 0, 1) * .3;
  const fade = Math.min(1, (1 - t) * 3.4);
  renderer.object('bevel', [x, y, 1.34], [.7 * spread, .57 * spread, .115], '#ef5b40',
    [0, .08, -.31], .88, fade * .87);
  for (let i = 0; i < 7; i++) {
    const angle = i * TAU / 7 - .23;
    const size = (.155 + (i % 3) * .037) * spread;
    const radius = (.34 + i % 3 * .08) * spread;
    const sx = x + Math.cos(angle) * radius;
    const sy = y + Math.sin(angle) * radius - t * .13;
    renderer.object('bevel', [sx, sy, 1.4], [size * 1.53, size, .066], i % 2 ? '#fb8258' : '#df4d3c',
      [0, 0, angle], .85, fade);
    if (i % 2 === 0) renderer.object('leaf', [sx, sy, 1.45], [.053, .097, .025], '#ffdc8b', [0, 0, angle - .14], .94, fade);
  }
  renderer.object('leaf', [x + .075, y + .272, 1.45], [.115, .237, .061], '#7ab95b', [0, 0, -.63], .89, fade);
}
