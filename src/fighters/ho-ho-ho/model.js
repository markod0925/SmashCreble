import { clamp, smoothStep } from '../../math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { multiply, one, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { attacks } from './profile.js';

const red = '#cf3045';
const deepRed = '#8e2439';
const wool = '#f8f1df';
const bootColor = '#332b3e';
const skin = '#f4bd9d';
const gold = '#ffc751';
const teal = '#32ac9e';
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));
const ease = value => smoothStep(clamp(value, 0, 1));
const pulse = value => Math.sin(Math.PI * clamp(value, 0, 1));

const coat = [
  part('bevel', [0, 1.37, -.025], [1.05, 1.22, .82], red),
  part('plate', [0, 1.02, .025], [1.02, .188, .816], bootColor),
  part('plate', [0, .816, -.007], [1.019, .174, .82], wool),
  part('bevel', [0, 1.807, .06], [.79, .189, .578], wool),
  part('bevel', [0, 1.423, .416], [.13, .62, .082], wool),
  part('bevel', [0, 1.044, .447], [.252, .213, .089], gold),
  part('bevel', [0, 1.044, .494], [.113, .092, .025], '#544052'),
];
const head = [
  part('bevel', [0, .381, .027], [.807, .776, .66], skin),
  part('bevel', [0, .168, .244], [.702, .489, .299], wool, [-.16, 0, 0]),
  part('gem', [0, -.049, .297], [.4, .343, .225], wool, [0, 0, Math.PI]),
  part('grin', [.018, .201, .417], [.317, .219, .064], '#7b3349', [.06, 0, -.04]),
  part('bevel', [0, .373, .395], [.18, .142, .185], '#efa589'),
  part('disk', [0, .703, .02], [.937, .157, .755], wool, [0, 0, -.099]),
  part('horn', [.036, 1.01, -.028], [.798, .744, .668], red, [-.16, 0, -.159]),
  part('bevel', [.222, 1.256, -.093], [.293, .27, .266], red, [-.28, 0, -.48]),
  part('bevel', [.337, 1.338, -.086], [.287, .294, .282], wool, [.07, .17, .2]),
];
for (const side of [-1, 1]) {
  head.push(
    part('bevel', [side * .154, .465, .354], [.083, .158, .059], '#402e38', [.12, side * .18, -.1]),
    part('bevel', [side * .265, .345, .343], [.168, .104, .064], '#e98780', [0, side * .31, 0]),
    part('leaf', [side * .144, .298, .417], [.302, .147, .088], wool, [0, 0, side * 1.25]),
  );
}
const sack = [
  part('bevel', [0, 0, 0], [1.02, 1.226, .765], '#e5a92f', [.116, .21, -.15]),
  part('bevel', [-.186, -.037, -.249], [.595, .935, .373], '#f7c856', [.12, -.18, .12]),
  part('plate', [.012, .56, .062], [.47, .29, .402], gold, [.2, .1, .22]),
  part('tube', [.01, .465, .023], [.491, .088, .451], '#936231', [.17, 0, .19]),
];
const sleeve = [part('bevel', [0, -.175, .005], [.41, .49, .453], red),
  part('plate', [0, -.375, .013], [.408, .15, .43], wool)];
const mitt = [part('bevel', [0, -.156, 0], [.332, .392, .345], deepRed),
  part('bevel', [.019, -.31, .06], [.339, .261, .31], '#d84655')];
const leg = [part('bevel', [0, -.183, 0], [.338, .458, .391], red),
  part('plate', [0, -.348, .012], [.333, .125, .357], wool)];
const boot = [part('bevel', [0, -.154, .019], [.319, .454, .359], bootColor),
  part('bevel', [0, -.333, .132], [.413, .182, .564], '#3b3245'),
  part('box', [0, -.412, .126], [.408, .065, .556], '#282432')];

const present = [
  part('box', [0, -.049, 0], [.593, .505, .578], teal),
  part('bevel', [0, .213, 0], [.655, .166, .649], '#57d6bc'),
  part('box', [0, -.049, 0], [.115, .53, .598], gold),
  part('box', [0, -.049, 0], [.611, .53, .111], gold),
  part('box', [0, .214, 0], [.119, .172, .658], gold),
  part('box', [0, .214, 0], [.662, .172, .119], gold),
  part('bevel', [-.117, .328, 0], [.236, .124, .16], '#ffe8a0', [0, 0, -.31]),
  part('bevel', [.117, .328, 0], [.236, .124, .16], '#ffe8a0', [0, 0, .31]),
];

const sleigh = [
  part('plate', [-.569, -.035, 0], [1.39, .401, .674], red, [0, 0, .064]),
  part('bevel', [-1.108, .21, 0], [.31, .613, .772], deepRed, [0, 0, .269]),
  part('bevel', [.033, .146, 0], [.317, .421, .7], red, [0, 0, -.35]),
  part('bevel', [-.68, .211, 0], [.61, .472, .517], gold, [0, 0, -.19]),
  part('box', [.403, -.019, 0], [.579, .06, .05], '#f6bf65', [0, 0, .23]),
  part('bevel', [.814, .029, 0], [.665, .362, .456], '#f4e8d8', [0, 0, .24]),
  part('bevel', [1.019, .212, .006], [.372, .271, .31], '#f4e8d8', [0, 0, -.25]),
  part('bevel', [1.214, .196, .003], [.313, .219, .266], '#f4e8d8', [0, 0, -.24]),
  part('bevel', [1.369, .188, .003], [.117, .118, .166], '#ff6470', zero, .5),
  part('disk', [1.01, .12, 0], [.317, .099, .34], '#65adf0', [0, 0, -.32]),
];
for (const side of [-1, 1]) {
  const rail = side * .348;
  sleigh.push(
    part('box', [-.61, -.355, rail], [1.395, .094, .081], gold),
    part('bevel', [.093, -.291, rail], [.319, .105, .094], gold, [0, 0, .55]),
    part('gem', [.23, -.187, rail], [.131, .203, .106], gold, [0, 0, -.34]),
    part('box', [-.33, -.228, rail], [.075, .253, .064], gold),
    part('box', [-.885, -.232, rail], [.076, .253, .064], gold),
    part('bevel', [-.575, .1, rail], [1.186, .075, .084], '#ffda7a', [0, 0, .047]),
    part('bevel', [1.14, .263, .145 * side], [.051, .063, .028], '#413444'),
    part('bevel', [1.018, .433, side * .116], [.059, .35, .062], '#a7734b', [side * .34, 0, .22]),
    part('bevel', [.904, .452, side * .166], [.182, .047, .061], '#a7734b', [0, 0, -.5]),
  );
  for (const x of [.667, .961]) {
    sleigh.push(part('bevel', [x, -.196, side * .143], [.105, .319, .109], '#f4e8d8', [.08, 0, .5]),
      part('bevel', [x - .071, -.324, side * .143], [.13, .092, .117], '#75536a', [0, 0, .39]));
  }
}

const swing = (age, hit) => ease((age - hit + .105) / .105) * ease((hit + .19 - age) / .17);

export const portrait = { heading: .27, targetY: 1.71, fov: .59 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .23, facing = 1, running = 0, airborne = false, verticalSpeed = 0, attack,
    landing = 0, guarding = false, charging = false, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const combo = attack?.type === 'hoHoHoCombo';
  const punch = combo ? swing(age, attacks.hoHoHoCombo.from) : 0;
  const kick = combo ? swing(age, attacks.hoHoHoCombo.followUp.from) : 0;
  const throwing = attack?.type === 'hoHoHoGift';
  const throwWindup = throwing ? pulse(age / attack.from) : 0;
  const toss = throwing ? swing(age, attack.from) : 0;
  const summoning = attack?.type === 'hoHoHoSleighRide' || attack?.type === 'hoHoHoSleighStorm';
  const call = summoning ? pulse(age / attack.duration) : charging ? .36 : 0;
  const recover = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 14.7) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.24 + (guarding ? .25 : charging ? .15 : 0);
  const root = fighterRoot(position, fighter.size, [0, heading + facing * (.22 * punch - .22 * kick + .47 * (toss - throwWindup)),
    wobble + facing * (.18 * kick - .11 * running)], attack);
  const body = joint(root, [0, Math.abs(stride) * .069 + Math.sin(time * 4.5) * .027 - crouch, .14 * (toss + punch)],
    [.15 * running + .25 * punch + .23 * toss - .23 * call - .21 * kick - .24 * recover, 0, -.1 * stride]);
  renderer.parts(sack, joint(body, [-facing * .45, 1.52, -.471], [0, facing * .29, facing * (.15 - .08 * stride)]), flash);
  renderer.parts(coat, body, flash);
  renderer.parts(head, joint(body, [0, 1.87, .038], [.16 * punch - .19 * call, .12 * toss, -.08 * stride]), flash);

  for (const side of [-1, 1]) {
    const throwingHand = side === facing;
    const kickLeg = throwingHand ? 0 : kick;
    const step = joint(root, [side * .238, .91 - .59 * crouch, .003],
      [(airborne ? side * .52 - .38 * rise : side * stride * .85) - 1.87 * kickLeg - .35 * recover, 0, side * (.14 + .38 * kickLeg)]);
    renderer.parts(leg, step, flash);
    renderer.parts(boot, joint(step, [0, -.433, .021], [.28 * Math.max(0, -side * stride), 0, 0]), flash);

    const pitch = (guarding ? -1.22 : -.28) - side * stride * .66 - rise * .25 - call * 1.37 - recover * .67 +
      (throwingHand ? .86 * throwWindup - 1.6 * toss - 1.51 * punch : -.21 * punch + .35 * kick);
    const shoulder = joint(body, [side * .471, 1.645, .01], [pitch, side * .14, side * (.52 + .72 * call + .25 * Number(pose))]);
    renderer.parts(sleeve, shoulder, flash);
    const wrist = joint(shoulder, [0, -.411, .021], [-.51 + .43 * (throwingHand ? toss + punch : 0) - .57 * call, 0, -side * .126]);
    renderer.parts(mitt, wrist, flash);
    if (throwingHand && throwing && !attack.fired) renderer.parts(present, joint(wrist, [0, -.45, .12], [.27, -.14, .25 * side]), false);
  }
}

export const projectiles = {
  hoHoHoPresent(renderer, { x, y, scale, vx }, time) {
    const spin = time * 7 * Math.sign(vx);
    renderer.parts(present, transform([x, y, .72], [scale, scale, scale], [time * 4, time * 4.6, spin]), false);
  },
  hoHoHoSleigh(renderer, { x, y, vx, vy, facing, scale }, time) {
    const side = Math.sign(vx) || facing;
    const angle = Math.atan2(vy, Math.abs(vx));
    const speed = Math.hypot(vx, vy);
    for (let i = 0; i < 4; i++) {
      const phase = (time * 6.9 + i / 4) % 1;
      const trail = (1.32 + 1.12 * phase) * scale;
      const width = (.16 + .09 * (1 - phase)) * scale;
      renderer.object('star', [x - trail * vx / speed, y - trail * vy / speed - .28 * scale + .23 * Math.sin(i * 2), .7],
        [width, width, .11 * scale], i % 2 ? '#ffe19b' : '#c4f3ff', [0, time * 3, time * 8 + i], .9, 1 - phase);
    }
    renderer.parts(sleigh, transform([x, y, .72], [scale, scale, scale], [0, side < 0 ? Math.PI : 0, side * angle]), false);
  },
};
