import { multiply, one, TAU, transform, zero } from '../../render/math.js';
import { part } from '../../render/parts.js';
import { captureProgress } from '../../combat/status.js';

function buildIncantusRig() {
  const skin = '#a8cd68';
  const light = '#daec9b';
  const shade = '#719749';
  const stitch = '#42603d';
  const claw = '#293634';
  const violet = '#4a2975';
  const spark = '#ffcf65';
  const torso = [
    part('bevel', [0, 1.45, -.015], [.99, 1.28, .78], skin),
    part('bevel', [0, 1.43, .27], [.83, 1.04, .4], light),
    part('bevel', [0, .95, -.06], [.74, .31, .61], shade),
    part('bevel', [0, 1.99, .008], [.56, .24, .48], skin),
    part('box', [0, 1.49, .469], [.019, .66, .019], stitch, [0, 0, .64]),
  ];
  for (const [x, y, angle] of [[-.18, 1.725, -.77], [-.063, 1.572, -.84], [.058, 1.399, -.89], [.174, 1.249, -.9], [-.235, 1.288, .38], [.245, 1.125, .35]]) {
    const z = .484 - Math.abs(x) * .09;
    torso.push(part('box', [x, y, z], [.023, .195, .027], stitch, [0, 0, angle]));
  }
  const head = [
    part('bevel', [0, .33, -.016], [1.13, .87, .88], skin),
    part('bevel', [0, .301, .31], [1, .59, .28], light),
    part('bevel', [0, .174, .396], [.64, .205, .173], '#809e54'),
  ];
  for (const side of [-1, 1]) {
    head.push(
      part('bevel', [side * .263, .448, .444], [.295, .349, .14], violet, [0, side * .2, side * -.14]),
      part('gem', [side * .259, .483, .526], [.133, .13, .038], '#d7a4ff', [0, 0, side * .3], .65),
      part('box', [side * .227, .535, .54], [.065, .061, .026], '#fae6ff', [0, 0, side * .32], .82),
      part('bevel', [side * .078, .273, .457], [.069, .083, .027], stitch, [0, 0, side * -.22]),
      part('disk', [side * .51, .319, .011], [.218, .15, .232], shade, [0, 0, Math.PI / 2]),
      part('gem', [side * .586, .32, .011], [.133, .153, .145], '#d3e375', zero, .18),
    );
  }
  const jaw = [
    part('bevel', [0, -.037, .281], [.75, .166, .49], skin),
    part('bevel', [0, .035, .35], [.628, .07, .343], '#392948'),
    part('bevel', [0, .054, .401], [.363, .037, .258], '#ac74b4'),
  ];
  const upperArm = [
    part('bevel', [0, -.19, 0], [.285, .55, .338], skin),
    part('bevel', [0, -.41, 0], [.234, .155, .263], shade),
  ];
  const forearm = [
    part('bevel', [0, -.166, .005], [.228, .462, .256], skin),
    part('box', [0, -.24, .128], [.171, .026, .03], stitch, [0, 0, -.21]),
    part('bevel', [0, -.393, .018], [.258, .177, .246], claw),
  ];
  for (const finger of [-1, 0, 1]) {
    forearm.push(part('leaf', [finger * .086, -.517, .025], [.095, .254 - Math.abs(finger) * .047, .084], claw, [Math.PI, 0, finger * .28]));
  }
  const leg = [
    part('bevel', [0, -.32, -.02], [.34, .649, .389], skin),
    part('bevel', [0, -.56, .025], [.287, .333, .32], shade),
    part('box', [0, -.527, .174], [.219, .019, .032], stitch, [0, 0, -.16]),
    part('bevel', [0, -.78, .135], [.399, .207, .621], skin),
    part('bevel', [0, -.785, .383], [.317, .169, .187], '#e6c477'),
  ];
  const antenna = [];
  const curve = [[0, 0], [.168, .169], [.364, .217], [.54, .092], [.604, -.153]];
  for (let i = 1; i < curve.length; i++) {
    const [x, y] = curve[i - 1];
    const [endX, endY] = curve[i];
    antenna.push(part('tube', [(x + endX) / 2, (y + endY) / 2, 0], [.059, Math.hypot(endX - x, endY - y) + .036, .061], claw, [0, 0, Math.atan2(x - endX, endY - y)]));
  }
  antenna.push(part('gem', [.604, -.153, 0], [.221, .215, .224], '#564a3d'),
    part('gem', [.61, -.152, .052], [.127, .132, .135], spark, zero, .66));
  return { torso, head, jaw, upperArm, forearm, leg, antenna };
}

const rig = buildIncantusRig();

export function draw(renderer, fighter, position, time, options) {
  const { heading = .42, facing = 1, running = 0, airborne = false, verticalSpeed = 0, landing = 0,
    guarding = false, charging = false, attack = null, flash = false, pose = false, wobble = 0 } = options;
  const unit = (value) => Math.max(0, Math.min(1, value));
  const pulse = (value) => Math.sin(Math.PI * unit(value));
  const phase = attack ? attack.age / attack.duration : 0;
  const bump = attack?.type === 'incantusBump' ? pulse((attack.age - attack.from + .075) / .24) : 0;
  const stench = attack?.type === 'incantusStench';
  const stagger = attack?.type === 'incantusStagger';
  const hypnosis = attack?.type === 'incantusChomp';
  const recovery = attack?.type === 'recovery' ? pulse(phase) : 0;
  const swelling = stench ? pulse(phase) : 0;
  const reaching = hypnosis || stagger ? pulse(phase) : 0;
  const gape = hypnosis
    ? unit((attack.age - attack.from) * 4.4) * (1 - unit((attack.age - attack.swallowAt + .08) * 12.5)) + .44 * pulse((attack.age - attack.biteAt + .06) / .13)
    : 0;
  const stride = Math.sin(time * 15) * running;
  const rise = airborne ? Math.max(-1, Math.min(1, verticalSpeed / 8)) : 0;
  const crouch = landing * 1.3 + (guarding ? .24 : charging ? .16 : 0);
  const bob = Math.sin(time * 4.5) * .041 + Math.abs(stride) * .084 - crouch;
  const size = fighter.size;
  const root = transform(position, [size, size, size], [0, heading + wobble * .41, wobble - facing * (running * .1 + bump * .09)]);
  const upper = multiply(root, transform([0, bob, bump * .19], one, [-bump * .34 + running * .13, 0, 0]));
  renderer.parts(rig.torso, multiply(upper, transform([0, 0, bump * .13], [1 + bump * .23, 1, 1 + bump * .4], zero)), flash);
  const head = multiply(upper, transform([0, 2.003, .04], [1 + swelling * .09, 1 + gape * .09, 1], [-recovery * .33 - gape * .18, 0, pose ? -.095 : wobble * .45]));
  renderer.parts(rig.head, head, flash);
  if (gape > .03) renderer.mesh('bevel', multiply(head, transform([0, .105 - gape * .1, .34], [.64, .14 + gape * .31, .36], zero)), '#31253d');
  renderer.parts(rig.jaw, multiply(head, transform([0, .113 - gape * .3, .04], one, [gape * .71, 0, 0])), flash);

  for (const side of [-1, 1]) {
    const antenna = multiply(head, transform([side * .423, .637, -.04], [side, 1, 1], [0, 0, side * (.035 + Math.sin(time * 7 + side) * .13 - running * .15)]));
    renderer.parts(rig.antenna, antenna, flash);
    if (pose || charging || stagger || hypnosis) {
      const flicker = Math.sin(time * 11 + side) * .096;
      renderer.mesh('leaf', multiply(antenna, transform([.68, -.239 + flicker, .048], [.105, .235 + Math.abs(flicker), .075], [0, .1, .74])), '#ffe194', .81);
    }
    const leg = multiply(root, transform([side * .22, .89 - crouch * .35, 0], one,
      [airborne ? side * .29 - rise * .35 : stride * side * .76 + side * bump * .39, 0, side * .09]));
    renderer.parts(rig.leg, leg, flash);
    const armPitch = guarding ? -1.12 : -stride * side * .58 - rise * .42 - reaching * .95 - recovery * 1.25 + bump * .5;
    const raised = (pose ? 1.1 : .43) + reaching * .5 + swelling * .21;
    const arm = multiply(upper, transform([side * .46, 1.75, .017], one, [armPitch, 0, side * raised]));
    renderer.parts(rig.upperArm, arm, flash);
    const wrist = multiply(arm, transform([0, -.4, 0], one, [-.2 - recovery * .22, 0, side * (pose ? 1.18 : .51 + reaching * .48)]));
    renderer.parts(rig.forearm, wrist, flash);
  }

  const [x, y, z] = position;
  if (stench && attack.age >= attack.from && attack.age < attack.until + .12) {
    stenchEffect(renderer, position, attack);
  }
  if (stagger && attack.age >= attack.from && attack.age < attack.until + .12) {
    const wave = unit((attack.age - attack.from) / (attack.until + .12 - attack.from));
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const distance = attack.range * (.21 + wave * .71) - i * .205;
        renderer.object('box', [x + side * distance, y + 1.55 + Math.sin(i * 1.58 + wave * 4) * .49, z + .8],
          [.47, .099, .11], i % 2 ? '#ffe39a' : '#caa1ff', [0, 0, side * (i % 2 ? .88 : -.66)], .96, (1 - wave) * .88);
      }
    }
  }
  if (hypnosis && attack.age >= attack.from && attack.age < attack.swallowAt) {
    const progress = captureProgress(attack);
    const reach = attack.capture ? Math.abs(attack.capture.target.x - x) : attack.range * .68;
    for (let i = 0; i < 12; i++) {
      const angle = progress * TAU * 2 + i * .77;
      const distance = reach * (i + 1) / 12;
      renderer.object('gem', [x + facing * (.37 + distance), y + 2.29 + Math.sin(angle) * (.16 + i * .034), z + .67 + Math.cos(angle) * .39],
        [.17 + i * .012, .12, .1], i % 3 ? '#d399ff' : '#f7dcff', [0, angle, angle], .9, .78);
    }
  }
}

export function stenchEffect(renderer, [x, y, z], attack, height = 2.45) {
  const cloud = (attack.age - attack.from) / (attack.until + .12 - attack.from);
  for (const side of [-1, 1]) {
    for (let puff = 0; puff < 4; puff++) {
      const spread = .5 + (.35 + cloud * (attack.range - .5)) * (.48 + puff * .16);
      const rise = height - cloud * (.37 + puff * .24) + Math.sin(cloud * 8 + puff) * .14;
      const width = .28 + cloud * .83 + puff * .061;
      renderer.object('bevel', [x + side * spread, y + rise, z + .39 + puff * .14], [width * 1.33, width, width * .83],
        puff % 2 ? '#bdd66b' : '#abc450', [.11, cloud + side * puff, side * .2], .68, (1 - cloud) * .58);
    }
  }
}
