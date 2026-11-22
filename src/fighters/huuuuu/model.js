import { clamp } from '../../math.js';
import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { bandageBindSeconds } from './profile.js';

const cloth = '#eaf2e9';
const ice = '#bddfec';
const seam = '#739eb6';
const pulse = (value) => Math.sin(Math.PI * clamp(value, 0, 1));

const torso = [part('bevel', [0, 1.462, 0], [.93, 1.35, .72], '#8cb7cb')];
for (const [i, width] of [.75, .89, .96, .98, .92, .79].entries()) {
  torso.push(part('plate', [0, .96 + i * .192, .008], [width, .214, .75], i % 2 ? ice : cloth, [.08, 0, i % 2 ? -.108 : .094]));
}
torso.push(part('box', [-.252, 1.44, .401], [.146, .37, .029], '#d5e7e6', [0, .23, -.43]));

const head = [
  part('bevel', [0, .383, 0], [.84, .91, .735], ice),
  part('plate', [0, .677, -.014], [.84, .22, .77], cloth, [0, 0, -.125]),
  part('plate', [0, .514, .015], [.865, .155, .773], '#d2e9ee', [0, 0, .103]),
  part('plate', [0, .217, .009], [.858, .185, .777], cloth, [0, 0, -.11]),
  part('plate', [0, .082, 0], [.716, .166, .692], ice, [0, 0, .067]),
  part('bevel', [.143, .436, .392], [.259, .169, .099], '#254052', [0, .221, -.18]),
  part('gem', [.157, .452, .448], [.099, .077, .031], '#c7f6ff', [0, 0, -.09], .73),
  part('box', [-.122, .382, .387], [.21, .117, .038], '#eef6eb', [0, -.18, .15]),
  part('box', [.152, .295, .413], [.129, .032, .034], '#4e768b', [0, .26, -.27]),
  part('box', [.219, .312, .39], [.059, .031, .035], '#4e768b', [0, .34, .45]),
];

const arm = [
  part('bevel', [0, -.27, 0], [.32, .73, .342], seam),
  ...Array.from({ length: 4 }, (_, i) => part('plate', [0, -.113 - i * .146, .025], [.357 - i * .02, .156, .373 - i * .017], i % 2 ? cloth : ice, [0, 0, i % 2 ? .12 : -.11])),
  part('bevel', [0, -.649, .056], [.294, .207, .31], cloth),
  part('box', [.132, -.616, .115], [.093, .153, .139], ice, [0, 0, .39]),
];

const leg = [
  part('bevel', [0, -.357, .018], [.319, .783, .353], seam),
  ...Array.from({ length: 4 }, (_, i) => part('plate', [0, -.169 - i * .163, .024], [.36 - i * .015, .179, .391 - i * .018], i % 2 ? cloth : ice, [0, 0, i % 2 ? -.11 : .12])),
  part('bevel', [0, -.786, .115], [.348, .245, .534], cloth),
  part('plate', [0, -.86, .129], [.35, .116, .546], '#8ab7cb'),
];

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const phase = attack ? attack.age / attack.duration : 0;
  const slap = attack?.type === 'mummySlap' ? pulse((attack.age - .015) / .29) : 0;
  const puff = attack?.type === 'mummyPuff' ? pulse(phase) : 0;
  const casting = attack?.type === 'mummyBind' ? pulse(phase) : 0;
  const sealing = attack?.type === 'mummySarcophagus' ? pulse(phase) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const stride = Math.sin(time * 14) * running;
  const rise = airborne ? clamp(verticalSpeed / 8, -1, 1) : 0;
  const crouch = landing * 1.2 + (guarding ? .23 : charging ? .15 : 0);
  const bob = Math.abs(stride) * .083 + Math.sin(time * 4.3) * .029 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + facing * .5 * slap, wobble - facing * (.09 * running + .14 * slap)]);
  const body = multiply(root, transform([0, bob, 0], one, [.12 * running + .27 * puff - .23 * recovery, 0, .07 * slap]));
  renderer.parts(torso, body, flash);
  renderer.parts(head, multiply(body, transform([0, 2.075, .025], one, [puff * .31 - recovery * .24, -.18 * slap, pose ? -.14 : stride * .08])), flash);

  for (const side of [-1, 1]) {
    const armAngle = guarding ? -1.18 : -stride * side * .68 - rise * .38 - casting * 1.37 - sealing * .91 - recovery * 1.48;
    const palm = side === facing ? slap : 0;
    const armRoot = multiply(body, transform([side * .472, 1.78, 0], one,
      [armAngle - palm * 1.73, palm * .71, side * (.24 + (pose ? .93 : 0) + sealing * .79) - side * palm * .51]));
    renderer.parts(arm, armRoot, flash);
    const legAngle = airborne ? side * .33 - rise * .42 : stride * side * .75;
    const legRoot = multiply(root, transform([side * .238, .914 - crouch * .39, 0], one, [legAngle, side * .1, side * .075]));
    renderer.parts(leg, legRoot, flash);
  }
  const loose = multiply(body, transform([-.27, 1.1, -.32], one, [.54 + rise * .32, 0, Math.sin(time * (5.8 + running * 6)) * .23]));
  renderer.mesh('box', multiply(loose, transform([0, -.24, .03], [.134, .52, .04], [0, 0, -.13])), cloth);
  if (!attack || attack.age < attack.from || attack.age > (attack.until ?? attack.duration)) return;
  if (attack.type === 'mummySlap') {
    const [x, y, z] = position;
    renderer.object('leaf', [x + facing * 1.23, y + 1.58, z + .66], [.28, .81, .11], '#e4fbff', [0, 0, -facing * 1.19], .9, .77);
  } else if (attack.type === 'mummyPuff') drawChokingPuff(renderer, position, attack);
  else if (attack.type === 'mummySarcophagus' && attack.capture) {
    for (let i = 0; i < 4; i++) {
      const angle = phase * TAU + i * TAU / 4;
      renderer.object('gem', [position[0] + Math.cos(angle) * .91, position[1] + 1.67 + Math.sin(angle) * .72, position[2] + .63],
        [.19, .29, .18], '#b7f3ff', [0, angle, angle], .96, sealing);
    }
  }
}

export function drawChokingPuff(renderer, [x, y, z], attack) {
  const progress = clamp((attack.age - attack.from) / (attack.until - attack.from), 0, 1);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const distance = (.33 + progress * 1.28) * (.73 + i * .21);
      const puff = .26 + progress * .8 + i * .075;
      renderer.object('bevel', [x + side * distance, y + .9 + progress * .7 + Math.sin(i * 1.65 + progress * 5) * .25, z + .44 + i * .1],
        [puff * 1.32, puff * .81, puff], i % 2 ? '#b0be79' : '#bedab9', [.11, i, -.14 * side], .73, .73 * (1 - progress));
    }
  }
}

function drawBandage(renderer, projectile, time) {
  const { owner, x, y, vx } = projectile;
  const startX = owner.x + Math.sign(vx) * .32;
  const startY = owner.y + 1.52;
  const steps = 12;
  function point(t, side) {
    const wave = Math.sin(time * 27 - t * 8.5) * Math.sin(Math.PI * t);
    return [startX + (x - startX) * t, startY + (y - startY) * t + side * (.14 + wave * .19)];
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < steps; i++) {
      const [ax, ay] = point(i / steps, side);
      const [bx, by] = point((i + 1) / steps, side);
      renderer.object('box', [(ax + bx) * .5, (ay + by) * .5, .96 + side * .037],
        [Math.hypot(bx - ax, by - ay) + .046, .147, .07], i % 3 ? cloth : ice, [0, 0, Math.atan2(by - ay, bx - ax)], .62);
    }
  }
}

export const projectiles = { bandage: drawBandage };

export function drawBoundWrap(renderer, [x, y, depth], fighter, size, seconds) {
  const width = (fighter.id === 'vi' || fighter.id === 'beina') ? 2.16 : fighter.id === 'bomm' ? 1.94 : 1.55;
  const progress = clamp((bandageBindSeconds - seconds) * 4.6 + .29, 0, 1);
  const wrapping = Math.ceil(progress * 8);
  for (let i = 0; i < wrapping; i++) {
    const shoulder = i > 5 ? .83 : 1;
    renderer.object('plate', [x, y + (.37 + i * .329) * size, depth + .76 * size],
      [width * shoulder * size, .233 * size, .36 * size], i % 2 ? '#b9e0ef' : '#f2f3df', [0, 0, i % 2 ? -.123 : .095], .42);
  }
}

export function drawSarcophagus(renderer, victim, progress) {
  const { x, y } = victim;
  const size = victim.fighter.size;
  const centerY = y + 1.535 * size;
  renderer.object('coffin', [x, centerY, -.32], [1.73 * size, 2.97 * size, .62], '#385a76');
  const lidX = x + (1 - progress) * 1.32 * size;
  const turn = (1 - progress) * .75;
  renderer.object('coffin', [lidX, centerY, .99], [1.68 * size, 2.93 * size, .24], '#e4c17d', [0, turn, 0], .21);
  renderer.object('coffin', [lidX, centerY, 1.13], [1.43 * size, 2.68 * size, .105], '#4d899f', [0, turn, 0], .31);
  renderer.object('gem', [lidX, y + 2.38 * size, 1.27], [.36 * size, .43 * size, .102], '#d6faff', [0, turn, 0], .77);
  for (let i = 0; i < 4; i++) {
    renderer.object('box', [lidX, y + (.68 + i * .35) * size, 1.23], [(.64 + i * .088) * size, .07, .072], '#efce83', [0, turn, 0], .42);
  }
}
