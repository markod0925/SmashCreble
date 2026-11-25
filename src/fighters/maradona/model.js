import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { attacks } from './profile.js';

const red = '#ce3c48';
const trim = '#f46c64';
const darkRed = '#902a3b';
const hair = '#442b2a';
const skin = '#e8ae87';
const yellow = '#ffce48';
const joint = (parent, position, angles = zero) => multiply(parent, transform(position, one, angles));
const ease = t => smoothStep(clamp(t, 0, 1));

const shirt = [
  part('plate', [0, 1.505, 0], [.87, .93, .62], red),
  part('bevel', [0, 1.12, .005], [.88, .17, .65], darkRed),
  part('tube', [0, 2.02, .025], [.32, .26, .3], skin),
  part('bevel', [0, 1.915, .137], [.55, .131, .47], darkRed),
  part('box', [0, 1.67, .334], [.62, .062, .045], trim, [0, 0, -.095]),
];
const head = [
  part('bevel', [0, .4, .045], [.81, .856, .739], skin, [.06, 0, -.047]),
  part('bevel', [0, .518, -.161], [.91, .881, .656], hair),
  part('bevel', [0, .738, .19], [.78, .392, .514], hair, [0, 0, -.1]),
  part('bevel', [.017, .412, .431], [.167, .141, .146], '#efbb8e'),
  part('grin', [.018, .245, .403], [.45, .335, .056], '#79343d', [.11, 0, -.04]),
  part('bevel', [.018, .278, .432], [.29, .061, .048], '#ffedcf', [0, 0, -.04]),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .182, .529, .395], [.139, .177, .056], '#fff0da', [.09, side * .19, -.08]),
    part('bevel', [side * .173, .518, .432], [.074, .114, .035], '#322834'),
    part('bevel', [side * .185, .651, .407], [.194, .052, .054], hair, [0, 0, side * -.12]),
    part('bevel', [side * .327, .377, .346], [.136, .084, .054], '#df896f', [0, side * .32, 0]),
    part('rock', [side * .419, .58, .045], [.312, .454, .583], hair, [.28, .19, side * -.26]),
    part('rock', [side * .43, .287, -.04], [.313, .427, .52], '#50312b', [.14, -.14, side * -.17]),
    part('rock', [side * .239, .817, .092], [.414, .331, .546], '#55352c', [.1, .23, side * .28]),
  );
}

const sleeve = [part('bevel', [0, -.14, .002], [.34, .397, .37], red),
  part('plate', [0, -.274, .009], [.336, .127, .365], trim)];
const fist = [part('bevel', [0, -.148, .009], [.224, .388, .23], skin),
  part('bevel', [0, -.329, .035], [.35, .29, .327], '#f0ba8b'),
  part('bevel', [.092, -.258, .138], [.131, .158, .129], '#df9b78', [0, 0, -.29])];
const shorts = [part('plate', [0, -.19, 0], [.393, .579, .42], red),
  part('bevel', [0, -.422, .008], [.407, .123, .431], darkRed)];
const boot = [part('bevel', [0, -.185, 0], [.245, .468, .25], skin),
  part('bevel', [0, -.35, .026], [.258, .236, .26], '#f7ebd9'),
  part('bevel', [0, -.487, .133], [.348, .218, .551], yellow),
  part('box', [0, -.568, .142], [.329, .068, .532], '#604138'),
  part('bevel', [0, -.449, .273], [.185, .082, .166], '#ffe991', [.22, 0, 0])];

function drawGoal(renderer, { x, y }, size, attack) {
  const lift = ease(attack.age / .24);
  const alpha = ease((attack.duration - attack.age) / .24);
  if (!lift || !alpha) return;
  const width = 5.4 * size;
  const height = 3.9 * size * lift;
  const front = -.91;
  const back = front - 1.62 * size;
  const pole = .15 * size;
  for (const side of [-1, 1]) {
    const post = x + side * width / 2;
    renderer.object('box', [post, y + height / 2, front], [pole, height, pole], '#fff1d4', zero, .45, alpha);
    renderer.object('box', [post, y + height, (front + back) / 2], [pole * .63, pole * .63, front - back], '#d0deec', zero, .41, alpha);
    renderer.object('box', [post, y + height / 2, back], [pole * .56, height, pole * .56], '#b0c8dd', zero, .35, alpha);
  }
  renderer.object('box', [x, y + height, front], [width + pole, pole, pole], '#fff1d4', zero, .45, alpha);
  for (let i = 0; i <= 6; i++) {
    const level = y + height * i / 6;
    renderer.object('box', [x, level, back], [width, .036 * size, .036 * size], '#c2dcf0', zero, .52, .67 * alpha);
  }
  for (let i = 1; i < 10; i++) {
    const line = x + width * (i / 10 - .5);
    renderer.object('box', [line, y + height / 2, back], [.03 * size, height, .03 * size], '#c2dcf0', zero, .52, .67 * alpha);
    renderer.object('box', [line, y + height, (front + back) / 2], [.03 * size, .03 * size, front - back], '#c2dcf0', zero, .52, .67 * alpha);
  }
}

const swing = (age, hit) => ease((age - hit + .11) / .11) * ease((hit + .18 - age) / .16);
const pulse = t => Math.sin(Math.PI * clamp(t, 0, 1));

export const portrait = { heading: .21, targetY: 1.53, fov: .51 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .23, facing = 1, running = 0, airborne = false, verticalSpeed = 0, attack,
    landing = 0, guarding = false, charging = false, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const punching = attack?.type === 'maradonaPunches';
  const jab = punching ? swing(age, attacks.maradonaPunches.from) : 0;
  const cross = punching ? swing(age, attacks.maradonaPunches.followUp.from) : 0;
  const hugging = attack?.type === 'maradonaHug';
  const open = hugging ? pulse(age / attack.from) : 0;
  const squeeze = hugging ? ease((age - attack.from + .085) / .13) * ease((attack.biteAt + .18 - age) / .15) : 0;
  let kick = attack?.type === 'maradonaKick' ? swing(age, attack.from) : 0;
  if (attack?.goal) {
    drawGoal(renderer, attack.goal, fighter.size, attack);
    const last = attack.nextVolley - attack.volleyEvery;
    kick = Math.max(last >= attack.from - 1e-9 ? swing(age, last) : 0,
      attack.nextVolley <= attack.volleyUntil ? swing(age, attack.nextVolley) : 0);
  }
  const recovery = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 15.8) * running;
  const rise = airborne ? clamp(verticalSpeed / 8.4, -1, 1) : 0;
  const crouch = landing * 1.19 + (guarding ? .26 : charging ? .17 : 0);
  const root = fighterRoot(position, fighter.size, [0, heading + facing * (.33 * jab - .32 * cross + .31 * kick),
    wobble + facing * (.15 * kick - .11 * running)], attack);
  const body = joint(root, [0, Math.abs(stride) * .091 + Math.sin(time * 4.8) * .028 - crouch, .16 * squeeze],
    [.16 * running + .28 * (jab + cross) + .17 * squeeze - .32 * kick - .23 * recovery, 0, .11 * stride]);
  renderer.parts(shirt, body, flash);
  renderer.parts(head, joint(body, [0, 2.022, .026], [-.16 * squeeze + .18 * kick, .2 * (cross - jab), -.1 * stride]), flash);

  for (const side of [-1, 1]) {
    const leading = side === facing;
    const legKick = leading ? kick : 0;
    const legPitch = airborne ? side * .51 - .43 * rise : side * stride * .89;
    const leg = joint(root, [side * .224, 1.12 - .58 * crouch, 0],
      [legPitch - 1.85 * legKick - .37 * recovery, 0, side * (.12 + .35 * legKick)]);
    renderer.parts(shorts, leg, flash);
    renderer.parts(boot, joint(leg, [0, -.513, .025], [.31 * Math.max(0, -side * stride) + .2 * legKick, 0, 0]), flash);

    const punch = leading ? jab : cross;
    const pitch = (guarding ? -1.31 : -.25) - side * stride * .75 - .25 * rise - 1.55 * punch -
      1.02 * squeeze - .52 * recovery + (leading ? .84 : -.28) * kick;
    const spread = side * (.49 + .84 * open - .41 * squeeze + .43 * kick + .2 * Number(pose));
    const shoulder = joint(body, [side * .397, 1.818, .018], [pitch, side * (.11 + .39 * squeeze), spread]);
    renderer.parts(sleeve, shoulder, flash);
    const elbow = joint(shoulder, [0, -.327, .012], [-.64 + .58 * punch - .53 * squeeze, 0, -side * (.13 + .37 * squeeze)]);
    renderer.parts(fist, elbow, flash);
  }
}

const panels = Array.from({ length: 5 }, (_, i) => {
  const angle = i * TAU / 5;
  return part('gem', [Math.sin(angle) * .31, Math.cos(angle) * .31, .245], [.156, .17, .043], '#51333a',
    [-.69 * Math.cos(angle), .69 * Math.sin(angle), -angle]);
});

function drawBall(renderer, [x, y, z], size, time, burning) {
  renderer.object('bombShell', [x, y, z], [size, size, size], burning ? '#ffbc53' : '#ffd348', [0, 0, time], burning ? .79 : .22);
  const spin = transform([x, y, z], [size, size, size], [0, 0, time]);
  renderer.parts(panels, spin, false);
  renderer.object('gem', [x, y, z + .49 * size], [.28 * size, .28 * size, .056 * size], burning ? '#9b4237' : '#51333a', [0, 0, time], burning ? .57 : .1);
}

export const projectiles = {
  maradonaBall(renderer, { x, y, vx, scale }, time) {
    drawBall(renderer, [x, y, .73], .74 * scale, -Math.sign(vx) * time * 12, false);
  },
  maradonaFireball(renderer, { x, y, vx, vy, scale }, time) {
    const angle = Math.atan2(vy, vx);
    const colors = ['#fff0a2', '#ffb144', '#ff782f', '#e84738'];
    for (let i = colors.length - 1; i >= 0; i--) {
      const distance = (.31 + i * .31) * scale;
      const flicker = Math.sin(time * 33 + i * 1.37) * .14 * scale;
      renderer.object('leaf', [x - Math.cos(angle) * distance, y - Math.sin(angle) * distance + flicker, .66],
        [(.7 - .11 * i) * scale, (1.34 - .09 * i) * scale, .47 * scale], colors[i], [0, 0, angle + Math.PI / 2], .94, .87 - i * .1);
    }
    renderer.object('bevel', [x, y, .73], [.98 * scale, .98 * scale, .68 * scale], '#ff8540', [0, 0, time * 9], 1, .39);
    drawBall(renderer, [x, y, .74], .67 * scale, -time * 19, true);
  },
};
