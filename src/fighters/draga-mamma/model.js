import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, transform, transformPoint, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const purple = '#5944b5';
const indigo = '#34256e';
const lilac = '#a08ce9';
const skin = '#f3c59d';
const orange = '#ff832f';
const spark = '#fff0b0';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = (value) => smoothStep(clamp(value, 0, 1));
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));

const robe = [
  part('plate', [0, 1.14, 0], [.75, 1.45, .59], purple, [0, 0, Math.PI]),
  part('plate', [0, .49, .002], [.80, .14, .62], indigo),
  part('bevel', [0, 1.29, .279], [.105, 1.19, .096], '#7861cf'),
  part('leaf', [0, .76, .324], [.38, .53, .05], '#6e57c3'),
  part('tube', [0, 1.91, .019], [.27, .25, .29], skin),
  part('bevel', [0, 1.784, .035], [.66, .18, .58], indigo),
  part('gem', [0, 1.73, .337], [.14, .14, .047], '#ebb173', [0, 0, .61], .2),
];
const head = [
  part('bevel', [0, .407, 0], [.76, .93, .68], skin, [.14, 0, -.085]),
  part('bevel', [0, .51, -.252], [.76, .756, .32], '#3c2928', [0, 0, -.08]),
  part('bevel', [.053, .367, .352], [.17, .13, .17], '#fad0a5', [-.19, 0, -.17]),
  part('grin', [.025, .217, .324], [.49, .37, .073], '#743040', [.1, 0, -.1]),
  part('grin', [.033, .18, .363], [.28, .17, .038], '#f26d83', [.1, 0, -.1]),
  part('disk', [0, .844, -.019], [1.19, .105, .94], indigo, [0, 0, -.085]),
  part('horn', [-.059, 1.198, -.058], [.91, .779, .76], purple, [-.14, 0, .125]),
  part('plate', [-.01, .915, -.023], [.83, .113, .716], '#755fd1', [-.14, 0, .125]),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .166, .536, .301], [.089, .232, .07], '#382833', [.12, side * .15, -.12]),
    part('gem', [side * .159, .592, .334], [.034, .034, .025], '#fff4d8', zero, .47),
    part('bevel', [side * .262, .349, .298], [.148, .089, .06], '#eb978e', [0, side * .28, -.1]),
  );
}
const sleeve = [
  part('bevel', [0, -.172, 0], [.32, .45, .33], purple),
  part('plate', [0, -.34, .015], [.34, .137, .35], lilac),
];
const arm = [
  part('bevel', [0, -.122, 0], [.175, .293, .185], skin),
  part('bevel', [0, -.289, .025], [.219, .202, .211], skin),
];
const boot = [
  part('bevel', [0, -.201, 0], [.22, .49, .24], indigo),
  part('bevel', [0, -.435, .113], [.277, .18, .453], purple),
  part('bevel', [0, -.486, .113], [.285, .068, .457], indigo),
];
const wand = [
  part('bevel', [0, .078, 0], [.118, .272, .118], '#33252c'),
  part('horn', [0, .355, 0], [.092, .491, .09], '#503334'),
];
const cloth = [
  part('plate', [0, -.151, .105], [.36, .34, .061], '#f4e8ff', [.18, .08, -.1]),
  part('bevel', [.038, -.21, .136], [.22, .038, .03], lilac, [0, 0, -.15]),
];
const bottle = [
  part('bevel', [0, .038, 0], [.37, .389, .29], '#8150b4'),
  part('bevel', [.025, -.001, .101], [.256, .21, .118], '#d992ff', zero, .5),
  part('tube', [0, .233, 0], [.164, .137, .17], '#d2a7fa'),
  part('tube', [0, .315, 0], [.153, .074, .155], '#d59152'),
];

function castPose(age, release) {
  return ease((age - release + .075) / .075) * ease((release + .16 - age) / .12);
}

export const portrait = { heading: .23, targetY: 1.8, fov: .56 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .23, facing = 1, running = 0, airborne = false, verticalSpeed = 0, attack,
    landing = 0, guarding = false, charging = false, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const wipe = attack?.type === 'dragaFaceWipe' ? castPose(age, attack.from) : 0;
  const potion = attack?.type === 'dragaPotion';
  const offer = potion ? castPose(age, attack.from) : 0;
  const brew = potion ? pulse(age / attack.from) : 0;
  const casting = attack?.type === 'dragaSpell' || attack?.type === 'dragaDoubleSpell';
  const cast = casting ? Math.max(castPose(age, attack.from), attack.volleyEvery ? castPose(age, attack.from + attack.volleyEvery) : 0) : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.1 + (guarding ? .23 : charging ? .13 : 0);
  const root = fighterRoot(position, fighter.size, [0, heading + facing * (.3 * wipe + .15 * cast),
    wobble - facing * (.1 * running + .13 * offer)], attack);
  const body = joint(root, [0, Math.abs(stride) * .072 + Math.sin(time * 5) * .029 - crouch, .07 * offer],
    [.12 * running + .22 * brew + .17 * offer - .26 * recover, 0, stride * .07]);
  renderer.parts(robe, body, flash);
  renderer.parts(head, joint(body, [0, 1.91, .038], [.19 * brew - .18 * cast, .13 * wipe, -.09 * stride]), flash);

  for (const side of [-1, 1]) {
    const wandHand = side === -facing;
    const foot = joint(root, [side * .222, .515 - .54 * crouch, .028],
      [airborne ? side * .46 - rise * .43 : side * stride * .76, 0, side * .08]);
    renderer.parts(boot, foot, flash);
    const pitch = (guarding ? -1.19 : -.25) - side * stride * .75 - rise * .21 - recover * .81 -
      (wandHand ? 1.13 * cast + .64 * brew + .4 * Number(pose) : 1.1 * wipe + 1.23 * offer + .56 * brew);
    const spread = side * (.55 + (wandHand ? .18 * cast + .32 * Number(pose) : .48 * wipe - .23 * offer));
    const shoulder = joint(body, [side * .355, 1.646, .008], [pitch, side * .14, spread]);
    renderer.parts(sleeve, shoulder, flash);
    const wrist = joint(shoulder, [0, -.349, 0], [-.48 + .28 * (wipe + offer + cast) - .43 * brew, 0, -side * .08]);
    renderer.parts(arm, wrist, flash);
    if (wandHand) {
      const grip = joint(wrist, [0, -.28, .09], [.1 + .45 * cast, 0, Math.PI + side * (.35 - .27 * cast)]);
      renderer.parts(wand, grip, flash);
      const tip = transformPoint(grip, [0, .606, 0]);
      const light = fighter.size * (.1 + .08 * Math.abs(Math.sin(time * 19)) + .2 * cast + .12 * brew);
      renderer.object('gem', tip, [light, 1.8 * light, light], orange, [.2, time * 8, time * .8], .93);
    } else if (potion) {
      renderer.parts(bottle, joint(wrist, [0, -.278, .122], [-pitch - .1, 0, -side * .25]), flash);
    } else if (wipe > 0) {
      renderer.parts(cloth, joint(wrist, [0, -.28, .094], [.2, .15, .34 * side]), flash);
    }
  }
}

export const projectiles = {
  dragaSpark(renderer, { x, y, vx, scale }, time) {
    const dir = Math.sign(vx);
    renderer.object('gem', [x, y, .7], [.68 * scale, .36 * scale, .32 * scale], orange, [time * 12, 0, 0], .97);
    renderer.object('star', [x + .15 * dir * scale, y, .81], [.43 * scale, .43 * scale, .17 * scale], spark, [0, time * 9, time * 7], .96);
    for (let i = 1; i <= 3; i++) {
      const size = (.27 - i * .045) * scale;
      renderer.object('gem', [x - dir * i * .26 * scale, y + Math.sin(time * 26 + i) * .14 * scale, .7],
        [size * 1.7, size, size], i % 2 ? '#fac56c' : '#cf9aff', [0, time * 5, i], .89, 1 - i * .2);
    }
  },
};
