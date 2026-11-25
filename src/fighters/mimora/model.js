import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const jade = '#369a89';
const mint = '#a5eed0';
const dark = '#244e55';
const navy = '#273f57';
const bronze = '#d7944d';
const gold = '#ffdc89';
const ink = '#233748';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));
const ease = (value) => smoothStep(clamp(value, 0, 1));

const torso = [
  part('bevel', [0, 1.475, -.037], [.892, 1.089, .742], dark),
  part('plate', [0, 1.72, .064], [.964, .411, .827], jade, [0, 0, .063]),
  part('gem', [0, 1.504, .367], [.483, .596, .218], bronze, [0, 0, Math.PI / 4]),
  part('leaf', [.011, 1.506, .487], [.231, .38, .097], mint, [0, 0, .32], .47),
  part('plate', [0, 1.093, .012], [.684, .193, .637], bronze, [0, 0, -.09]),
  part('bevel', [0, 1.712, -.289], [1.068, .967, .354], '#297668'),
];
const helmet = [
  part('bevel', [0, .24, -.052], [1.139, .724, .842], jade, [.037, 0, -.058]),
  part('plate', [0, .514, -.018], [1.159, .209, .902], '#72cbb0', [.09, 0, -.054]),
  part('horn', [0, .39, .051], [.419, .845, .514], bronze, [.43, 0, -.092]),
  part('bevel', [0, .235, .32], [.917, .381, .243], ink, [-.056, 0, .029]),
  part('bevel', [0, .107, .39], [.698, .17, .127], '#202e40'),
];
for (const side of [-1, 1]) {
  helmet.push(
    part('bevel', [side * .532, .305, .02], [.219, .586, .509], dark, [0, side * .29, side * -.29]),
    part('leaf', [side * .23, .305, .449], [.116, .248, .044], '#e3ffae', [0, side * .11, side * 1.19], .72),
    part('bevel', [side * .469, .43, .307], [.155, .164, .243], mint, [.09, side * .4, -.21 * side]),
  );
}
const chin = [
  part('bevel', [0, -.052, .266], [.741, .245, .42], jade, [-.115, 0, -.049]),
  part('plate', [0, -.086, .401], [.43, .136, .176], bronze, [-.11, 0, 0]),
];
const arm = [
  part('bevel', [0, -.111, .003], [.357, .436, .367], jade),
  part('bevel', [0, -.362, .036], [.263, .372, .264], dark),
  part('bevel', [0, -.525, .07], [.264, .178, .298], bronze),
];
const leg = [
  part('bevel', [0, -.267, -.037], [.332, .611, .358], dark),
  part('plate', [0, -.474, .023], [.339, .197, .391], jade),
  part('bevel', [0, -.723, .145], [.351, .224, .512], navy, [-.085, 0, 0]),
  part('bevel', [0, -.713, .336], [.291, .148, .195], bronze),
];
const sword = [
  part('bevel', [0, .446, .003], [.267, .923, .136], '#ffe5a6', [0, 0, .079], .26),
  part('horn', [-.038, .912, .005], [.267, .336, .126], '#fff4cf', [0, 0, .071], .31),
  part('plate', [0, .035, .003], [.462, .132, .182], bronze, [0, 0, -.13]),
  part('tube', [0, -.107, .002], [.144, .281, .153], navy),
];
const shield = [
  part('gem', [0, -.084, .054], [.811, 1.127, .385], bronze, [Math.PI, 0, -.11]),
  part('gem', [0, -.063, .153], [.679, .942, .341], '#499e94', [Math.PI, 0, -.11]),
  part('bevel', [0, .182, .245], [.573, .363, .214], jade, [.096, 0, -.11]),
  part('leaf', [0, -.039, .34], [.245, .376, .089], mint, [0, 0, -.11], .46),
];
const bomb = [
  part('bombShell', zero, one, '#294850'),
  part('plate', [0, .077, 0], [.995, .118, .991], '#65d4b3'),
  part('plate', [0, .466, 0], [.361, .147, .348], bronze),
  part('fuse', [0, .507, 0], [.512, .476, .472], '#c1bb86'),
  part('gem', [.011, .025, .514], [.315, .337, .092], mint, [0, 0, .26], .53),
];

function drawBomb(renderer, matrix, time) {
  renderer.parts(bomb, matrix, false);
  const spark = .23 + .11 * Math.abs(Math.sin(time * 28));
  renderer.mesh('star', multiply(matrix, transform([.179, .686, 0], [spark, spark, .55 * spark], [time * 5, 0, time * 7])), gold, .94);
}

export function drawGuardSlash(renderer, [x, y, z], facing, attack, size) {
  const progress = (attack.age - attack.from) / (attack.until - attack.from);
  if (progress < 0 || progress > 1) return;
  for (let i = 0; i < 5; i++) {
    const angle = .94 - progress * 1.53 - i * .21;
    renderer.object('leaf', [x + facing * (.91 + Math.cos(angle) * 1.13) * size, y + (1.59 + Math.sin(angle) * 1.03) * size, z + .69 + i * .029],
      [(.23 + i * .037) * size, .94 * size, .124], i % 2 ? mint : gold, [0, 0, -facing * (1.53 + angle)], .94, (1 - progress) * .84);
  }
}

export const portrait = { heading: .14, targetY: 1.66, fov: .53 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .29, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const type = attack?.type;
  const age = attack?.age ?? 0;
  const nod = type === 'mimoraHeadbutt' ? pulse((age - .024) / .255) : 0;
  const slashing = type === 'mimoraGuardSlash';
  const block = slashing ? ease((age - .018) / .09) * ease((attack.from - age) / .075) : Number(guarding);
  const slash = slashing ? pulse((age - attack.from + .068) / .282) : 0;
  const bombing = type === 'mimoraBombs';
  const open = bombing ? ease((age - .06) / .131) * ease((attack.duration - age) / .32) : 0;
  const cough = bombing ? pulse((age - attack.from + .026) / .232) : 0;
  const fold = type === 'mimoraMirror' ? ease(age / attack.from) : 0;
  const recover = type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.4) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.8, -1, 1) : 0;
  const crouch = landing * 1.3 + (guarding ? .24 : charging ? .17 : 0);
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (.23 * nod - .39 * block + .37 * slash) + fold * TAU * .75,
    wobble - facing * (.12 * running + .15 * nod + .22 * slash)], attack);
  const body = joint(root, [0, Math.abs(stride) * .083 + .022 * Math.sin(time * 4.8) - crouch, .19 * nod + .19 * cough],
    [.16 * running + .42 * nod - .22 * open + .39 * cough - .28 * recover, 0, -.081 * stride]);
  renderer.parts(torso, body, flash);
  const mask = joint(body, [0, 2.04 - .17 * block, .34 * nod + .09 * cough], [.48 * nod - .33 * open + .24 * cough - .27 * recover, .09 * stride, .14 * fold]);
  renderer.parts(helmet, mask, flash);
  renderer.parts(chin, joint(mask, [0, -.099, -.024], [.08 + 1.05 * open, 0, 0]), flash);

  for (const side of [-1, 1]) {
    const legPitch = airborne ? .52 * side - .52 * rise : side * stride * .76;
    renderer.parts(leg, joint(root, [side * .266, .893 - .43 * crouch, -.044],
      [legPitch - .23 * recover + .25 * block, 0, side * (.13 + .32 * fold)]), flash);
    const shieldHand = side === -facing;
    const pitch = -.35 - side * stride * .62 - .33 * rise - .73 * recover + .25 * cough -
      (shieldHand ? 1.23 * block + .29 * slash : .71 * block + 1.74 * slash) - .56 * fold;
    const spread = side * (.49 + .29 * Number(pose) + .42 * fold + (shieldHand ? -.33 * block : .43 * slash));
    const hand = joint(body, [side * .478, 1.73, -.013], [pitch, side * .22, spread]);
    renderer.parts(arm, hand, flash);
    const grip = joint(hand, [0, -.536, .089], [-pitch - .27, .19 * side, side * (.27 + .53 * slash - .48 * block)]);
    if (shieldHand) renderer.parts(shield, joint(grip, [0, -.111, .15], [.27, side * (.4 - .64 * block), .19 * side]), flash);
    else renderer.parts(sword, joint(grip, [0, -.02, .081], [.12, .14 * side, side * (-.46 - 1.56 * slash)]), flash);
  }
  if (slashing) drawGuardSlash(renderer, position, facing, attack, size);
  if (bombing && !attack.fired && age > .114) {
    const mouth = transformPoint(mask, [0, .018, .58]);
    const growth = (.23 + .6 * ease((age - .114) / .148)) * size;
    drawBomb(renderer, transform(mouth, [growth, growth, growth], [-.09, time * 4, age * 5]), time);
  }
  if (fold > .025) {
    const [x, y, z] = position;
    for (let i = 0; i < 8; i++) {
      const angle = i * TAU / 8 + fold * 4.1;
      const orbit = size * (1.58 - .84 * fold);
      renderer.object('gem', [x + Math.sin(angle) * orbit, y + (1.45 + Math.cos(angle + .65) * 1.18) * size, z + Math.cos(angle) * orbit],
        [.22 * size, (.29 + .38 * fold) * size, .16 * size], i % 2 ? mint : gold, [0, angle, angle + fold], .94, .72 * fold);
    }
  }
}

export const projectiles = {
  mimoraMouthBomb(renderer, { x, y, vx, scale, remaining }, time) {
    drawBomb(renderer, transform([x, y, .68], [scale, scale, scale], [0, time * 4.3, Math.sign(vx) * remaining * 7.8]), time);
  },
};
