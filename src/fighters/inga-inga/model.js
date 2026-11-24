import { clamp } from '../../math.js';
import { multiply, one, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';

const iron = '#566776';
const shadow = '#324452';
const steel = '#8c9aa3';
const edge = '#ccdce2';
const blue = '#4a9bd1';
const darkBlue = '#2e6297';
const hide = '#684b40';
const brass = '#d3a972';
const skin = '#f2bb94';
const pulse = (phase) => Math.sin(Math.PI * clamp(phase, 0, 1));
const joint = (parent, position, rotation = zero) => multiply(parent, transform(position, one, rotation));

const torso = [
  part('bevel', [0, 1.487, -.033], [1.02, 1.235, .79], iron),
  part('bevel', [0, 1.615, .234], [.89, .82, .36], steel),
  part('plate', [0, 1.874, .164], [.785, .209, .59], edge, [-.09, 0, 0]),
  part('bevel', [0, 1.196, .184], [.766, .52, .4], iron),
  part('box', [0, 1.62, .417], [.043, .656, .03], '#a9bac2', [.135, 0, 0]),
  part('tube', [0, 2.043, -.013], [.436, .18, .416], shadow),
  part('plate', [0, 1.052, .016], [.865, .171, .747], hide),
  part('box', [0, 1.048, .409], [.232, .141, .079], brass),
  part('box', [0, 1.049, .451], [.117, .078, .018], shadow),
  part('leaf', [0, 1.728, .461], [.184, .237, .039], '#a4ccdf', [Math.PI, 0, 0], .15),
];
for (const side of [-1, 1]) {
  for (const y of [1.31, 1.45]) {
    torso.push(part('plate', [side * .264, y, -.032], [.39, .155, .728], y === 1.31 ? '#708490' : iron, [0, 0, side * .15]));
  }
  torso.push(
    part('gem', [side * .259, 1.848, .424], [.06, .066, .039], brass),
    part('gem', [side * .343, 1.399, .34], [.068, .066, .042], edge),
  );
}

const head = [
  part('bevel', [0, .319, 0], [.825, .831, .775], skin),
  part('bevel', [0, .662, -.055], [.967, .683, .878], steel),
  part('disk', [0, .527, .025], [1.055, .12, .99], iron, [0, 0, -.065]),
  part('plate', [0, .548, .224], [.87, .091, .632], edge, [.03, 0, -.065]),
  part('box', [0, .804, .33], [.103, .279, .042], '#a9bbc4', [.3, 0, -.075]),
  part('grin', [0, .211, .401], [.394, .336, .118], '#753c44'),
  part('box', [0, .218, .415], [.189, .029, .024], '#fff3dc', [0, 0, .035]),
  part('bevel', [0, .319, .401], [.139, .138, .14], '#ffc7a0', [0, 0, .08]),
];
for (const side of [-1, 1]) {
  head.push(
    part('box', [side * .179, .387, .361], [.104, .115, .055], '#f2e2c9', [0, side * .19, 0]),
    part('box', [side * .166, .377, .399], [.05, .095, .024], shadow, [0, side * .21, 0]),
    part('bevel', [side * .408, .347, -.042], [.228, .343, .618], iron, [0, side * .086, side * .16]),
    part('gem', [side * .444, .504, .297], [.093, .088, .064], brass, [0, side * .39, 0]),
  );
}

const arm = [
  part('bevel', [0, -.047, -.027], [.458, .355, .5], steel, [0, 0, .06]),
  part('plate', [0, -.197, .013], [.397, .176, .418], iron),
  part('bevel', [0, -.333, .024], [.276, .381, .331], darkBlue),
  part('bevel', [0, -.517, .055], [.348, .315, .374], steel),
  part('plate', [0, -.647, .057], [.334, .125, .353], edge),
  part('bevel', [0, -.727, .069], [.273, .22, .287], hide),
];
const leg = [
  part('bevel', [0, -.32, -.02], [.355, .844, .39], blue),
  part('bevel', [0, -.386, .129], [.283, .253, .2], steel, [.17, 0, 0]),
  part('box', [0, -.481, .181], [.134, .181, .071], edge),
  part('bevel', [0, -.645, .036], [.341, .29, .368], darkBlue),
  part('bevel', [0, -.765, .127], [.375, .224, .536], shadow),
  part('plate', [0, -.814, .204], [.358, .092, .402], iron),
];

const spear = [
  part('tube', [0, .006, 0], [.084, 2.04, .084], '#8b6547'),
  part('plate', [0, -.941, 0], [.126, .156, .126], iron),
  part('tube', [0, -.223, 0], [.106, .453, .106], shadow),
  part('tube', [0, 1.011, 0], [.135, .238, .131], brass),
  part('leaf', [0, 1.274, 0], [.264, .569, .102], edge, zero, .18),
  part('leaf', [0, 1.279, .041], [.081, .47, .038], '#edf5f4', zero, .24),
];

const sword = [
  part('bevel', [0, -.207, 0], [.131, .367, .126], shadow),
  part('gem', [0, -.386, 0], [.176, .153, .147], brass, [Math.PI, 0, 0]),
  part('box', [0, -.009, 0], [.432, .081, .148], brass, [0, 0, -.055]),
  part('box', [0, .398, 0], [.208, .766, .087], edge, zero, .23),
  part('leaf', [0, .813, 0], [.219, .37, .09], edge, zero, .24),
  part('box', [.047, .408, .048], [.036, .721, .012], '#7597af', zero, .15),
];
const dagger = [
  part('bevel', [0, -.132, 0], [.118, .252, .104], darkBlue),
  part('gem', [0, -.264, 0], [.147, .111, .119], brass),
  part('plate', [0, -.009, 0], [.299, .078, .122], brass),
  part('leaf', [0, .234, 0], [.255, .65, .086], '#e0edf2', zero, .29),
  part('leaf', [.024, .196, .038], [.082, .45, .034], '#7a9bb3', zero, .19),
];
const sheath = [
  part('bevel', [0, -.498, 0], [.208, .959, .158], shadow),
  part('box', [0, -.048, 0], [.251, .12, .178], steel),
  part('box', [0, -.891, 0], [.221, .112, .175], brass),
];

export const portrait = { targetY: 1.74, fov: .475, heading: .11 };

export function draw(renderer, fighter, position, time, options) {
  const { heading = .38, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const age = attack?.age ?? 0;
  const headbutt = attack?.type === 'ingaHeadbutt' ? pulse((age - .01) / .32) : 0;
  const throwing = attack?.type === 'ingaLance';
  const throwSwing = throwing ? pulse((age - .04) / .39) : 0;
  const swordDrawn = attack?.type === 'ingaSword' && age >= .11;
  const sweep = swordDrawn ? clamp((age - .15) / .36, 0, 1) : 0;
  const storm = attack?.type === 'ingaBladeStorm';
  const casting = storm ? pulse((age - .065) / .71) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(age / attack.duration) : 0;
  const stride = Math.sin(time * 14) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.2 + (guarding ? .205 : charging ? .17 : 0);
  const bob = Math.abs(stride) * .102 + Math.sin(time * 4.1) * .021 - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * (headbutt * .16 + Math.sin(sweep * Math.PI) * .52), wobble - facing * (running * .091 + headbutt * .15)], attack);
  const body = joint(root, [0, bob, headbutt * .21], [.11 * running + headbutt * .26 - recovery * .22, 0, -casting * .08]);
  renderer.parts(torso, body, flash);
  renderer.parts(head, joint(body, [0, 2.053, headbutt * .235], [headbutt * .43 - recovery * .185, 0, pose ? -.09 : stride * .061]), flash);
  const hip = joint(body, [.419, .973, .077], [-.113, -.24, .44]);
  renderer.parts(sheath, hip, flash);
  if (!swordDrawn && !storm) {
    renderer.mesh('tube', multiply(hip, transform([0, .145, 0], [.112, .29, .115], zero)), hide);
    renderer.mesh('box', multiply(hip, transform([0, .038, 0], [.309, .07, .126], zero)), brass);
  }

  for (const side of [-1, 1]) {
    const kick = airborne ? side * .37 - rise * .47 : stride * side * .78;
    renderer.parts(leg, joint(root, [side * .25, .852 - crouch * .39, 0], [kick, 0, side * .075]), flash);
    const weaponSide = side > 0;
    const pitch = guarding ? -1.42 : -stride * side * .48 - rise * .46 - recovery * 1.22 - casting * 1.33
      - (weaponSide ? pulse(sweep) * 1.45 : .42 + throwSwing * 1.19);
    const splay = side * (.28 + .14 * Number(pose) + casting * 1.1 + (weaponSide ? pulse(sweep) * .67 : 0));
    const nearHand = joint(body, [side * .462, 1.864, 0], [pitch, 0, splay]);
    renderer.parts(arm, nearHand, flash);
    if (weaponSide && (swordDrawn || (storm && !attack.fired))) {
      const blade = joint(nearHand, [.028, -.746, .133], [-pitch + .14 - pulse(sweep) * 1.35, -.1, -.23 - sweep * 2.6]);
      renderer.parts(sword, blade, flash);
    } else if (!weaponSide && storm && !attack.fired) {
      renderer.parts(dagger, joint(nearHand, [-.074, -.754, .116], [-pitch + .42, .15, .44]), flash);
    } else if (!weaponSide && !storm && (!throwing || !attack.fired)) {
      const lanceAngle = .23 - throwSwing * 1.38;
      renderer.parts(spear, joint(nearHand, [-.074, -.725, .098], [-pitch + lanceAngle, 0, .36 - throwSwing * .75]), flash);
    }
  }
  if (!attack?.until || age < attack.from || age > attack.until) return;
  const [x, y, z] = position;
  if (attack.type === 'ingaHeadbutt') {
    renderer.object('gem', [x + facing * 1.16 * size, y + 2.16 * size, z + .63], [.17, .34, .14],
      '#e5e8ce', [.2, 0, facing * 1.1], .89, headbutt);
  } else if (swordDrawn) {
    const progress = clamp((age - attack.from) / (attack.until - attack.from), 0, 1);
    for (let i = 0; i < 5; i++) {
      const angle = 1.02 - progress * 1.48 + i * .212;
      renderer.object('leaf', [x + facing * (1.13 + Math.cos(angle) * 1.03) * size, y + (1.39 + Math.sin(angle) * 1.04) * size, z + .64],
        [.27 * size, .8 * size, .11], i % 2 ? '#bccff1' : '#f1f3ec', [0, 0, facing * -angle], .82, (1 - progress) * .76);
    }
  }
}

function drawLance(renderer, { x, y, vx, scale }) {
  const facing = Math.sign(vx);
  const root = transform([x - facing * 1.56 * scale, y, .77], [scale, scale, scale], [0, 0, -facing * Math.PI / 2]);
  renderer.parts(spear, root, false);
  renderer.object('box', [x - facing * 2.85 * scale, y, .72], [.77 * scale, .057, .057], '#c9dcff', zero, .9, .49);
}

function drawSpinningBlade(renderer, { x, y, sword: longBlade, angle, spin, remaining }) {
  const depth = .96 + (longBlade ? .19 : 0);
  const rotation = angle - remaining * spin;
  const root = transform([x, y, depth], one, [0, Math.sin(rotation) * .31, rotation]);
  renderer.parts(longBlade ? sword : dagger, root, false);
  renderer.object('leaf', [x - Math.cos(angle) * .49, y - Math.sin(angle) * .49, depth - .085],
    [longBlade ? .16 : .105, .83, .071], longBlade ? '#b1d7f5' : '#f4d79b', [0, 0, angle - Math.PI / 2], .88, .53);
}

export const projectiles = { ingaLanceTip: drawLance, ingaSpinningBlade: drawSpinningBlade };
