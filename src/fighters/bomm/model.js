import { multiply, one, smoothStep, TAU, transform, transformPoint, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';
import { drawFlyingKickTrail } from '../bid/model.js';
import { drawBorrowedTriple } from '../che-addominali/model.js';
import { drawClubImpact } from '../ciclope/model.js';
import { bommBurstScale } from './profile.js';
import { flameEffect } from '../dragon-boy/model.js';
import { drawNavelBeam } from '../dragonball/model.js';
import { biteEffect } from '../gangar/model.js';
import { zombieSnap } from '../gioppino/model.js';
import { drawChokingPuff } from '../huuuuu/model.js';
import { drawBorrowedThrust } from '../ii/model.js';
import { drawBorrowedRuler } from '../maestra/model.js';
import { drawCapsBomb } from '../nurofen-caps/model.js';
import { stenchEffect } from '../incantus/model.js';
import { drawBorrowedBlade } from '../olivar/model.js';
import { drawGasCloud } from '../packman/model.js';
import { drawFlyingTongue } from '../pinco-palino/model.js';

const bombParts = [
  part('bombShell', zero, one, '#333a47'),
  part('plate', [0, .441, 0], [.361, .128, .349], '#77717a'),
  part('fuse', [0, .484, .024], [.52, .61, .55], '#b8966c'),
  part('star', [.18, .701, .053], [.25, .25, .18], '#ffc37a', zero, .94),
];

function buildBommRig() {
  const shell = [
    part('bombShell', zero, [1.98, 2.02, 1.79], '#343b49'),
    part('plate', [0, .958, .025], [.635, .186, .605], '#6d6e7b'),
    part('tube', [0, 1.079, .025], [.335, .115, .343], '#a8876c'),
    part('bevel', [-.449, .568, .639], [.192, .337, .04], '#798090', [.38, -.48, -.56], .19),
    part('bevel', [-.653, .41, .551], [.113, .174, .037], '#646f82', [.3, -.62, -.56], .24),
  ];
  const face = [];
  for (const side of [-1, 1]) {
    face.push(
      part('bevel', [side * .306, .252 + side * .036, .83], [.178, .202, .079], '#1a202b', [0, side * .3, side * .11]),
      part('bevel', [side * .3, .264 + side * .036, .874], [.107, .141, .037], '#eee4d4', [0, side * .3, side * .11], .42),
      part('box', [side * .291, .289 + side * .036, .897], [.04, .039, .014], '#ffffff', zero, .7),
    );
  }
  for (const [x, y, angle] of [[-.21, -.217, -.57], [-.111, -.266, -.32], [0, -.28, 0], [.11, -.264, .31], [.212, -.208, .63]]) {
    face.push(part('bevel', [x, y, .867 - Math.abs(x) * .125], [.143, .052, .046], '#d19679', [0, 0, angle], .28));
  }
  const leg = [
    part('tube', [0, -.202, 0], [.112, .57, .127], '#707586'),
    part('bevel', [0, -.5, .131], [.41, .275, .491], '#424c61'),
    part('bevel', [0, -.618, .144], [.377, .106, .447], '#282e3e'),
    part('box', [0, -.471, .366], [.202, .062, .033], '#747b8c', zero, .19),
  ];
  return { shell, face, leg };
}

const rig = buildBommRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0, fuseColor = null } = options;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const phase = attack ? attack.age / attack.duration : 0;
  const headbutting = attack?.type === 'bommHeadbutts' || attack?.type === 'luffyHeadbutt';
  const headbutt = headbutting ? Math.max(
    pulse((attack.age - attack.from + .08) / .19),
    pulse((attack.age - (attack.followUp?.from ?? attack.from) + .08) / .19),
  ) : 0;
  const arming = attack?.type === 'bommBurst';
  const stealing = attack?.type === 'bommSteal';
  const capsBomb = attack?.projectile === 'capsMiniBomb';
  const tossing = attack?.projectile === 'bomb' || capsBomb;
  const kicking = attack?.type === 'viHoof' || attack?.type === 'bidKicks';
  const kick = kicking ? pulse((attack.age - attack.from + .125) / .35) : 0;
  const flip = attack?.type === 'beinaFlip' ? unit((attack.age - .04) / (attack.duration - .07)) : 0;
  const dash = attack?.type === 'dash' || attack?.type === 'gangarBite' ? pulse(phase) : 0;
  const puff = arming && !attack.fired ? unit(attack.age / attack.from) : 0;
  const inhale = stealing ? pulse(phase) : 0;
  const throwPose = tossing ? pulse(phase) : 0;
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const stride = Math.sin(time * 16) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 8)) : 0;
  const crouch = landing * 1.25 + (guarding ? .2 : charging ? .14 : 0);
  const bob = Math.abs(stride) * .075 + Math.sin(time * 5.3) * .035 - crouch;
  const size = fighter.size;
  const root = fighterRoot(position, size, [0, heading + facing * headbutt * .27,
    wobble - facing * (running * .12 + dash * .27 + headbutt * .14)], attack);
  const pivot = multiply(root, transform([0, 1.48, 0], one, [0, 0, -facing * TAU * flip]));
  const base = multiply(pivot, transform([0, -1.48, 0], one, zero));
  const squash = 1 + .12 * puff + .13 * inhale + .12 * crouch;
  const body = multiply(base, transform([0, 1.583 + bob - headbutt * .19, throwPose * .18 + headbutt * .48],
    [squash, 1 + .12 * puff - inhale * .075 - crouch * .16, squash],
    [running * .14 + inhale * .14 - kick * .24 - recovery * .29 + headbutt * .58, 0, pose ? -.058 : 0]));
  const ignition = arming && attack.age >= attack.from && attack.age - attack.from < .067;
  renderer.parts(rig.shell, body, flash || ignition);
  renderer.parts(rig.face, body, flash);
  const fuse = multiply(body, transform([0, 1.096, .025], one, [stride * .28 + rise * .15, Math.sin(time * 7) * .21, Math.sin(time * 5.7) * .18]));
  renderer.mesh('fuse', fuse, fuseColor ?? '#bf9b70', fuseColor ? .82 : 0);
  const spark = .19 + Math.abs(Math.sin(time * 10)) * .11 + .17 * puff + .09 * inhale + (fuseColor ? .08 : 0);
  const sparkRoot = multiply(fuse, transform([.341, .354, .042], [spark, spark, spark * .7], [0, time * 5, time * 5]));
  renderer.mesh('star', sparkRoot, fuseColor ?? '#ffbc69', .93);

  for (const side of [-1, 1]) {
    const pitch = airborne ? side * .36 - rise * .38 : stride * side * .82;
    const foot = side === facing ? kick : 0;
    const leg = multiply(base, transform([side * .304, .642 - crouch * .25, .026], one, [pitch - foot * 1.65 - recovery * .25, 0, side * .15]));
    renderer.parts(rig.leg, leg, flash);
  }

  if (!attack) return;
  const [x, y, z] = position;
  if (tossing && attack.age >= attack.from - .06 && attack.age < attack.from) {
    const bomb = transform([x + facing * .76, y + 1.12, z + .31], [.55, .55, .55], [0, time, -.19 * facing]);
    if (capsBomb) drawCapsBomb(renderer, bomb, false, time);
    else renderer.parts(bombParts, bomb, false);
  }
  if (attack.borrowed && attack.type === 'olivarBlade') drawBorrowedBlade(renderer, position, facing, attack, size);
  if (attack.borrowed && attack.type === 'iiThrust') drawBorrowedThrust(renderer, position, facing, attack, size);
  if (attack.borrowed && attack.type === 'maestraRuler') drawBorrowedRuler(renderer, position, facing, attack, size);
  if (attack.borrowed && attack.type === 'absTriple') drawBorrowedTriple(renderer, position, facing, attack, size);
  if (attack.borrowed && attack.type === 'pincoTongue') drawFlyingTongue(renderer, transformPoint(body, [0, -.19, .93]), position, attack, size);
  if (attack.borrowed && attack.type === 'dragonBallNavelLaser') {
    drawNavelBeam(renderer, transformPoint(body, [0, -.41, .84]), x, attack, size);
  }
  if (!attack.borrowed || attack.age < attack.from || attack.age > (attack.until ?? attack.from + .12)) return;
  if (attack.type === 'dragonFlame') flameEffect(renderer, position, facing, attack);
  else if (attack.type === 'incantusStench') stenchEffect(renderer, position, attack, 1.92);
  else if (attack.type === 'gangarBite') biteEffect(renderer, position, facing, attack);
  else if (attack.type === 'gioppinoBite') zombieSnap(renderer, position, facing, attack);
  else if (attack.type === 'mummyPuff') drawChokingPuff(renderer, position, attack);
  else if (attack.type === 'bidKicks') drawFlyingKickTrail(renderer, position, facing, attack, size);
  else if (attack.type === 'packmanGas') drawGasCloud(renderer, position, facing, attack, size);
  else if (attack.type === 'ciclopeClub') drawClubImpact(renderer, position, facing, attack, size);
  else if (attack.type === 'viHoof') {
    renderer.object('leaf', [x + facing * 1.45, y + .97, z + .58], [.24, .94, .15], '#aaf0ff', [0, 0, -facing * 1.2], .91, .77);
  } else if (attack.type === 'thorn') {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        renderer.object('leaf', [x + side * (.94 + i * .54), y + .52 + i * .11, z + .46], [.38, 1.23 - i * .16, .33], '#badd77', [0, 0, -side * .54], .63, .84);
      }
    }
  } else if (attack.type === 'furnace' || attack.type === 'dash' || attack.type === 'beinaFlip') {
    const color = attack.borrowed.color;
    for (let i = 0; i < 6; i++) {
      const angle = i * TAU / 6 + phase * TAU;
      renderer.object('gem', [x + Math.sin(angle) * 1.21 - facing * dash * .53, y + .88 + Math.cos(angle) * .66, z + .46],
        [.6, .21, .23], color, [0, 0, angle], .91, .65);
    }
  }
}

export function powerStealCloud(renderer, effect, match, time) {
  const { target, color } = effect;
  const size = target.fighter.size * bommBurstScale(target, match);
  const endX = target.x + target.facing * .28 * size;
  const endY = target.y + 3.02 * size;
  const progress = effect.age / effect.lifetime;
  for (let i = 4; i >= 0; i--) {
    const t = progress - i * .085;
    if (t < 0) continue;
    const travel = smoothStep(t);
    const x = effect.x + (endX - effect.x) * travel;
    const y = effect.y + (endY - effect.y) * travel + Math.sin(Math.PI * travel) * 1.25;
    const puff = (.72 + .46 * Math.sin(Math.PI * t)) * Math.min(1, (1 - t) * 7);
    if (i > 0) {
      const tail = puff * (1 - i * .15);
      renderer.object('bevel', [x, y, 2.05], [tail * 1.25, tail, tail * .6], color, [0, 0, i * .6], .93,
        (1 - i * .16) * Math.min(1, (1 - progress) * 8));
      continue;
    }
    renderer.object('bevel', [x, y, 2.19], [puff * 1.7, puff * 1.25, puff * .7], '#524361', [0, 0, .18], .55, .83);
    for (let lobe = 0; lobe < 5; lobe++) {
      const angle = lobe * TAU / 5 + t * 2;
      renderer.object('bevel', [x + Math.cos(angle) * puff * .47, y + Math.sin(angle) * puff * .34, 2.62],
        [puff * .94, puff * .77, puff * .59], lobe % 2 ? '#fff4ff' : color, [0, angle, .23], .97, .94);
    }
    renderer.object('gem', [x, y, 2.92], [puff * .55, puff * .66, puff * .42], color, [0, time * 7, .26], 1);
  }
}

export const projectiles = {
  bomb(renderer, { x, y, vx, remaining }, time) {
    const bomb = transform([x, y, .69], [.64, .64, .64], [0, time * 4, time * 5 * Math.sign(vx)]);
    renderer.parts(bombParts, bomb, remaining < .25 && Math.sin(time * 35) > 0);
  },
};
