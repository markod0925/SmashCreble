import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { fighterRoot } from '../../render/attack-animation.js';
import { part } from '../../render/parts.js';

function buildEidRig() {
  const aqua = '#55c9cb';
  const teal = '#338792';
  const blue = '#367ec8';
  const steel = '#324958';
  const mint = '#b3f497';
  const skin = '#ffd0a6';
  const hair = '#e8783e';
  const pink = '#ec91b6';
  const torso = [
    part('bevel', [0, 1.48, 0], [.67, .86, .52], aqua),
    part('bevel', [0, 1.57, .247], [.46, .5, .12], '#8de2dc'),
    part('box', [0, 1.51, .321], [.1, .24, .038], '#e0efda', zero, .44),
    part('tube', [0, 1.94, 0], [.27, .23, .26], steel),
    part('plate', [0, 1.1, 0], [.72, .15, .61], blue),
    part('box', [0, 1.1, .329], [.2, .13, .06], '#a8e8f0', zero, .4),
  ];
  const holster = part('bevel', [-.36, 1.04, .047], [.25, .33, .4], blue, [.31, 0, -.26]);
  const head = [
    part('bevel', [0, .36, 0], [.9, .91, .73], skin),
    part('bevel', [0, .68, -.027], [.96, .4, .83], hair),
    part('bevel', [.16, .589, .355], [.6, .17, .13], '#ffad60', [0, 0, .17]),
    part('bevel', [-.18, .628, .36], [.51, .14, .13], '#f68e46', [0, 0, -.18]),
    part('plate', [0, .44, .351], [.94, .218, .158], '#224953'),
    part('bevel', [0, .443, .438], [.735, .134, .035], '#86df67', zero, .46),
    part('box', [0, .235, .351], [.21, .037, .026], '#794838'),
  ];
  for (const side of [-1, 1]) {
    head.push(
      part('box', [side * .15, .439, .461], [.059, .084, .026], '#1f4147'),
      part('box', [side * .124, .464, .477], [.045, .035, .017], '#e2ffbe', zero, .8),
      part('box', [side * .125, .256, .345], [.087, .032, .036], '#794838', [0, side * .27, side * .44]),
      part('bevel', [side * .318, .325, .337], [.108, .055, .044], '#eea08e', [0, side * .56, 0]),
      part('disk', [side * .48, .523, -.036], [.265, .126, .287], '#d75b63', [0, 0, Math.PI / 2]),
      part('gem', [side * .605, .505, -.064], [.348, .369, .295], hair, [0, 0, side * .93]),
      part('leaf', [side * .745, .428, -.074], [.24, .32, .243], '#f99548', [0, 0, -side * 2.12]),
    );
  }
  const arm = [
    part('bevel', [0, -.055, 0], [.286, .334, .335], aqua),
    part('tube', [0, -.283, 0], [.207, .392, .232], teal),
    part('bevel', [0, -.446, .012], [.252, .275, .295], aqua),
    part('bevel', [0, -.631, .041], [.289, .253, .32], blue),
    part('box', [0, -.608, .201], [.166, .082, .025], '#b2eeec', zero, .36),
  ];
  const leg = [
    part('tube', [0, -.28, 0], [.245, .64, .285], teal),
    part('bevel', [0, -.501, .039], [.331, .45, .34], aqua),
    part('bevel', [0, -.721, .116], [.344, .309, .541], blue),
    part('box', [0, -.821, .128], [.32, .1, .5], steel),
  ];
  const blaster = [
    part('bevel', [.036, -.746, .14], [.31, .32, .442], steel),
    part('bevel', [.036, -.855, .275], [.34, .36, .4], pink),
    part('tube', [.036, -1.044, .278], [.218, .187, .215], mint, zero, .42),
    part('gem', [.24, -.842, .27], [.11, .185, .185], '#fddbab', [0, 0, .28], .37),
  ];
  const scythe = [
    part('tube', [0, -.05, 0], [.087, 1.55, .087], steel),
    part('tube', [0, .5, 0], [.13, .26, .128], blue),
    part('scythe', [.064, .618, .036], [1.03, .8, .85], mint, zero, .48),
    part('gem', [.076, .656, .089], [.192, .242, .18], '#e2ffbf', zero, .78),
  ];
  const armor = [
    part('plate', [0, 1.53, .015], [1.02, .87, .75], steel),
    part('bevel', [0, 1.64, .374], [.77, .375, .2], aqua),
    part('gem', [0, 1.59, .508], [.31, .36, .235], mint, zero, .74),
    part('disk', [0, 1.11, 0], [.98, .2, .75], blue),
  ];
  const robotHead = [
    part('bevel', [0, .41, 0], [1.02, .78, .82], steel),
    part('bevel', [0, .688, .019], [.87, .23, .76], aqua),
    part('plate', [0, .447, .419], [.87, .201, .135], '#182a3c'),
    part('box', [0, .448, .501], [.671, .073, .025], mint, zero, .75),
  ];
  for (const side of [-1, 1]) {
    armor.push(part('bevel', [side * .456, 1.786, .024], [.344, .35, .58], blue, [0, 0, side * .3]));
    robotHead.push(part('leaf', [side * .477, .648, -.042], [.262, .533, .385], hair, [0, 0, -side * .45]));
  }
  return { torso, holster, head, arm, leg, blaster, scythe, armor, robotHead };
}

const rig = buildEidRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const phase = attack ? attack.age / attack.duration : 0;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const isCombo = attack?.type === 'eidCombo';
  const punchStart = attack?.followUp?.from ?? attack?.from;
  const kick = isCombo ? pulse(attack.age / punchStart) : 0;
  const punch = isCombo ? pulse((attack.age - punchStart + .048) / (attack.duration - punchStart + .048)) : 0;
  const shooting = attack?.type === 'eidShot';
  const blinking = attack?.type === 'eidScythe';
  const spinning = attack?.type === 'eidSpin';
  const aim = shooting ? pulse(Math.pow(phase, .56)) : 0;
  const slash = blinking ? unit((attack.age - attack.from + .055) / .24) : 0;
  const spin = spinning ? unit((attack.age - attack.from) / (attack.until - attack.from)) : 0;
  const armored = spinning && attack.age >= attack.from * .48 && attack.age < attack.until + .12;
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const recoil = shooting && attack.fired ? Math.max(0, 1 - (attack.age - attack.from) * 12) : 0;
  const step = Math.sin(time * 18) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 9)) : 0;
  const crouch = (guarding ? .22 : charging ? .16 : 0) + landing * 1.2 + (armored ? .18 : 0);
  const bob = Math.abs(step) * .09 + Math.sin(time * 5) * .025 - crouch;
  const size = fighter.size;
  const turn = heading + facing * (spin * TAU * 3 - kick * .32 + punch * .48 + (blinking ? Math.sin(slash * TAU) * .58 : 0));
  const root = fighterRoot(position, size, [0, turn, wobble - running * .13 * facing], attack);
  const upper = multiply(root, transform([0, bob, 0], one, [running * .2 + (armored ? .21 : 0) - aim * .09, 0, kick * .17 - punch * .19]));
  renderer.parts(armored ? rig.armor : rig.torso, upper, flash);
  if (!armored && !shooting) renderer.parts([rig.holster], upper, flash);
  const head = multiply(upper, transform([0, 1.96, .025], one, [-recovery * .35 - running * .12, punch * -.2, pose ? -.09 : 0]));
  renderer.parts(armored ? rig.robotHead : rig.head, head, flash);

  for (const side of [-1, 1]) {
    const kicking = side > 0 ? kick : 0;
    const legAngle = airborne ? rise * -.35 + side * .41 : step * side * .93;
    const leg = multiply(root, transform([side * .196, .87 - crouch * .45, kicking * .21], one, [legAngle - kicking * 1.77 - recovery * .36, 0, side * .08]));
    renderer.parts(rig.leg, leg, flash);

    let armPitch = guarding ? -1.27 : -step * side * .82 - rise * .46 - recovery * 1.47;
    if (side < 0) armPitch -= punch * 1.68 + aim * 1.58 + recoil * .31;
    if (side > 0 && blinking) armPitch -= .4 + pulse(slash) * 1.25;
    if (pose || armored) armPitch = side < 0 ? -1.34 : -.94;
    const armSpread = armored ? .83 : pose ? .53 : .22;
    const armPose = transform([side * .392, 1.8, 0], one, [armPitch, side * .12, side * armSpread]);
    const arm = multiply(upper, armPose);
    renderer.parts(rig.arm, arm, flash);

    if (side < 0 && (pose || shooting || armored)) {
      renderer.parts(rig.blaster, arm, flash);
      const volleyFlash = armored && attack.age >= attack.from && attack.nextVolley - attack.age > attack.volleyEvery - .062;
      if (recoil > .49 || volleyFlash) renderer.mesh('star', multiply(arm, transform([.035, -1.22, .28], [.58, .57, .39], zero)), '#dcffad', 1);
    }
    if (side > 0 && (pose || blinking || armored)) {
      const gripPosition = [0, -.645, .074];
      const grip = pose
        ? multiply(upper, transform(multiply(armPose, transform(gripPosition, one, zero)).slice(12, 15), one, [0, Math.PI, -.29]))
        : multiply(arm, transform(gripPosition, one, [armored ? -.54 : -armPitch, .11, -.98 + slash * 2.13]));
      renderer.parts(rig.scythe, grip, flash);
    }
  }

  if (blinking && attack.age >= attack.from && attack.age < attack.until) {
    const sweep = (attack.age - attack.from) / (attack.until - attack.from);
    for (let i = 0; i < 6; i++) {
      const angle = (sweep - i * .085) * 3.6 - 1.03;
      renderer.object('leaf', [position[0] + facing * Math.sin(angle) * attack.range, position[1] + 1.46 + Math.cos(angle) * .72, position[2] + .87],
        [.31, .78, .11], '#c5fb9e', [0, 0, -facing * angle], 1, (1 - sweep) * (.8 - i * .095));
    }
  }
  if (armored && spin > 0 && spin < 1) {
    for (let i = 0; i < 9; i++) {
      const angle = turn - i * .34;
      renderer.object('bevel', [position[0] + Math.sin(angle) * attack.range * .74, position[1] + 1.25 + i * .017, position[2] + Math.cos(angle) * 1.1],
        [.67, .08, .16], i % 3 ? '#6ce3d8' : '#caff9c', [0, angle, .04], .92, .76 - i * .07);
    }
  }
}

export const projectiles = {
  pulse(renderer, { x, y, vx, vy }, time) {
    const angle = Math.atan2(vy, vx);
    renderer.object('gem', [x, y, .59], [.29, .82, .28], '#e7ffa9', [0, 0, angle - Math.PI / 2], .98);
    renderer.object('bevel', [x - Math.cos(angle) * .32, y - Math.sin(angle) * .32, .59], [.94, .2, .23], '#82e9cf', [0, 0, angle], .84, .59);
  },
};
