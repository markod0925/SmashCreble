import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';

const bananaParts = [
  part('banana', zero, one, '#f4c841'),
  part('bevel', [.723, .874, -.009], [.153, .227, .162], '#805039', [0, 0, .17]),
  part('bevel', [.709, .799, -.005], [.176, .09, .171], '#b89238', [0, 0, .17]),
  part('bevel', [-1.135, -.27, 0], [.133, .104, .085], '#88623b', [0, 0, -.48]),
];

function buildBeinaRig() {
  const wire = '#b8ad8a';
  const butter = '#ffe68d';
  const gold = '#edbb3d';
  const dark = '#513d32';
  const face = [
    part('bevel', [.58, .448, .158], [.109, .15, .115], '#fff3bf', [0, -.14, -.12]),
    part('bevel', [.739, .481, .158], [.104, .15, .101], '#fff3bf', [0, .1, -.2]),
    part('bevel', [.594, .462, .218], [.059, .084, .027], dark),
    part('bevel', [.749, .49, .213], [.056, .081, .029], dark),
    part('box', [.602, .487, .233], [.022, .026, .012], '#fff9e1', zero, .7),
    part('box', [.756, .516, .227], [.022, .025, .012], '#fff9e1', zero, .7),
    part('box', [.659, .299, .192], [.14, .026, .03], dark, [0, 0, .16]),
    part('box', [.732, .322, .19], [.07, .024, .037], dark, [0, 0, .59]),
  ];
  const upperArm = [
    part('tube', [0, -.198, 0], [.109, .449, .119], wire),
    part('bevel', [0, -.406, 0], [.138, .12, .147], '#928364'),
  ];
  const forearm = [
    part('tube', [0, -.168, .014], [.103, .365, .107], wire),
    part('bevel', [0, -.398, .041], [.32, .36, .321], butter),
    part('bevel', [.142, -.35, .065], [.126, .19, .194], '#ffeaa0', [0, 0, .29]),
    part('box', [0, -.376, .214], [.14, .055, .028], gold, [0, 0, -.1]),
  ];
  const leg = [
    part('tube', [0, -.345, -.012], [.122, .763, .131], wire),
    part('bevel', [0, -.525, -.01], [.148, .136, .157], '#a59977'),
    part('bevel', [0, -.792, .11], [.36, .28, .515], butter),
    part('bevel', [0, -.89, .118], [.347, .101, .501], '#ab7b3c'),
  ];
  return { face, upperArm, forearm, leg };
}

const rig = buildBeinaRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const combo = attack?.type === 'beinaCombo';
  const followUpAt = attack?.followUp?.from ?? attack?.from;
  const kick = combo ? pulse(attack.age / followUpAt) : 0;
  const punch = combo ? pulse((attack.age - followUpAt + .055) / (attack.duration - followUpAt + .055)) : 0;
  const flipping = attack?.type === 'beinaFlip';
  const flip = flipping ? unit((attack.age - .04) / (attack.duration - .07)) : 0;
  const peel = flipping ? pulse(flip) : 0;
  const throwing = attack?.type === 'beinaThrow';
  const barrage = attack?.type === 'beinaBarrage';
  const release = barrage ? attack.nextVolley - attack.volleyEvery : throwing ? attack.from : Infinity;
  const firing = (barrage || throwing) && attack.fired && attack.age >= release && attack.age < release + .092;
  const throwPose = throwing ? pulse(attack.age / attack.duration) : barrage ? .65 + (firing ? .3 : 0) : 0;
  const recover = attack?.type === 'recovery' ? pulse(attack.age / attack.duration) : 0;
  const stride = Math.sin(time * 18) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 8)) : 0;
  const crouch = landing * 1.25 + (guarding ? .21 : charging ? .13 : 0);
  const bob = Math.abs(stride) * .09 + Math.sin(time * 5.1) * .034 - crouch;
  const size = fighter.size;
  const base = transform(position, [size, size, size], [0, heading * .47 + punch * facing * .46, wobble - running * facing * .15]);
  const pivot = multiply(base, transform([0, 1.42 + bob, 0], one, [0, 0, -facing * (TAU * flip + kick * .16)]));
  const figure = multiply(pivot, transform([0, -1.42, 0], one, zero));
  const body = multiply(figure, transform([0, 1.72, .015], one, [running * .10 - recover * .21, 0, running * facing * -.08]));
  if (peel > .12) {
    renderer.mesh('banana', multiply(body, transform([.039, .024, .014], [.93, .92, .84], zero)), flash ? '#ffffff' : '#fff0bc', .27);
    for (const side of [-1, 0, 1]) {
      const strip = multiply(body, transform([-.21 + side * .13, -.51, side * .095],
        [.45 + peel * .68, .85, 1], [side * .91, -side * 1.02, side * (1.13 + peel * .65) - .35]));
      renderer.mesh('bananaPeel', strip, flash ? '#ffffff' : side ? '#f1bd3e' : '#ffe27d', .18);
    }
  } else {
    renderer.parts(bananaParts, body, flash);
  }
  renderer.parts(rig.face, body, flash);

  for (const side of [-1, 1]) {
    const front = side === facing;
    const legPitch = airborne ? side * .39 - rise * .31 : stride * side * .92;
    const leg = multiply(figure, transform([side * .29 - .1, .955, -.035], one,
      [legPitch - (front ? kick * 1.78 : 0) - peel * .56 - recover * .45, 0, side * (.13 + peel * .19)]));
    renderer.parts(rig.leg, leg, flash);
    const shoulder = [side * .46 - .03, 1.58 + side * .12, .031];
    const armPitch = guarding ? -1.24 : -stride * side * .86 - rise * .41 - recover * 1.4 - (front ? punch * 1.63 + throwPose * 1.21 : 0);
    const arm = multiply(figure, transform(shoulder, one, [armPitch, 0, side * ((pose ? .97 : .32) + peel * .58 + (front ? throwPose * .79 : 0))]));
    renderer.parts(rig.upperArm, arm, flash);
    const wrist = multiply(arm, transform([0, -.4, 0], one, [-.14 - (front ? throwPose * .28 : 0), 0, side * (pose ? 1.19 : .43 + throwPose * .25)]));
    renderer.parts(rig.forearm, wrist, flash);
    if (pose && side === -1) {
      const grip = multiply(wrist, transform([-.03, -.57, .115], [.39, .39, .39], [.23, .22, 1.83]));
      renderer.parts(bananaParts, grip, flash);
    } else if (front && (charging || (throwing && !attack.fired))) {
      const fruit = multiply(wrist, transform([.026, -.51, .18], [.39, .39, .39], [.15, .17, -.67 * facing]));
      renderer.parts(bananaParts, fruit, flash);
    } else if (front && firing) {
      const burst = multiply(wrist, transform([.02, -.61, .18], [.49, .46, .27], zero));
      renderer.mesh('star', burst, '#fff0a0', .93, .85);
    }
  }

  if (flipping && attack.age >= attack.from && attack.age <= attack.until) {
    for (let i = 0; i < 8; i++) {
      const angle = -facing * TAU * flip + facing * i * .29;
      const radius = 1.31 + .03 * i;
      renderer.object('box', [position[0] + Math.sin(angle) * radius, position[1] + 1.37 + Math.cos(angle) * radius, position[2] + .51],
        [.45, .095, .143], i % 2 ? '#ffe28b' : '#fff4bd', [0, 0, -angle], .95, .77 - i * .074);
    }
  }
}

export const projectiles = {
  banana(renderer, { x, y, vx, vy }, time) {
    const angle = Math.atan2(vy, vx);
    const fruit = transform([x, y, .69], [.38, .38, .38], [Math.sin(time * 9 + vx) * .6, .17, angle + time * 9]);
    renderer.parts(bananaParts, fruit, false);
  },
};
