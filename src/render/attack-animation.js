import { clamp, smoothStep } from '../math.js';
import { signatureAttacks } from '../fighters/index.js';
import { TAU, transform } from './math.js';

const ease = (value) => smoothStep(clamp(value, 0, 1));

// Bends the silhouette above its feet while keeping the combat position and attack clock intact.
export function fighterRoot(position, size, rotation, attack) {
  if (!attack) return transform(position, [size, size, size], rotation);
  const { age, duration, facing = 1 } = attack;
  if (attack.type === 'packmanTrace') {
    const edge = ease(age / .12) * ease((duration - age) / .14);
    const chew = Math.sin(age * TAU * 10.6) * edge;
    return transform(position, [size * (1 - .11 * chew), size * (1 + .16 * chew), size], rotation);
  }
  if (attack.trace67) return transform(position, [size, size, size], rotation);

  const move = signatureAttacks[attack.type] ?? attack;
  const rising = attack.type === 'recovery' || attack.type === 'furnace' ||
    ((attack.type === 'light' || attack.type === 'heavy') && attack.offset > .8);
  const falling = attack.diveSpeed || ((attack.type === 'light' || attack.type === 'heavy') && attack.offset < 0);
  const radial = !rising && !falling && (attack.summonsClones || attack.deploysCompanions || attack.freezesRivals ||
    attack.summonsThunder || attack.startsDance || attack.rubberDance || attack.startsAcidRain || attack.refillReserve || attack.dazzlesRivals ||
    (attack.all && !attack.travel && attack.type !== 'dash'));
  const beam = attack.cue === 'laser' && !attack.projectile || attack.type === 'dragonBallNavelLaser';
  let windup = 0, release = 0, rebound = 0;
  let previous = 0;
  const addBeat = (start, next = duration) => {
    const prep = Math.min(.24, (start - previous) * .86);
    const tail = Math.min(.23, (next - start) * .82);
    const snap = Math.min(.045, tail * .42);
    if (prep <= 0 || age < start - prep || age >= start + tail) return;
    if (age < start) {
      const phase = (age - start + prep) / prep;
      windup += ease(phase / .62) * (1 - ease((phase - .76) / .24));
      release += ease((phase - .76) / .24);
    } else {
      const after = age - start;
      release += 1 - ease((after - snap) / (tail * .65));
      rebound += Math.sin(Math.PI * ease((after - tail * .39) / (tail * .61)));
    }
  };

  if (attack.summonsThunder) {
    for (let i = 0; i < attack.waves; i++) {
      const strike = attack.from + attack.warning + i * attack.waveDelay;
      addBeat(strike, Math.min(duration, strike + attack.waveDelay));
      previous = strike;
    }
  } else {
    // The combat engine replaces `from` at each combo hit. Read the full sequence for a continuous pose.
    for (let hit = move; hit; hit = hit.followUp) {
      addBeat(hit.from, hit.followUp?.from ?? attack.biteAt);
      previous = hit.from;
    }
    if (attack.biteAt) addBeat(attack.biteAt);
  }

  const directional = rising || falling || radial ? 0 : beam ? -.42 : 1;
  const amplitude = attack.type === 'heavy' || radial ? 1.15 : 1;
  const width = 1 + amplitude * (.27 * windup + (radial || falling ? .22 : -.12) * release + .07 * rebound);
  const height = 1 + amplitude * (-.23 * windup + (falling ? -.19 : beam ? .055 : .21) * release - .065 * rebound);
  const [pitch, heading, bank] = rotation;
  const twist = beam ? .014 : .19;
  const root = transform(position, [size * width, size * height, size * width],
    [pitch, heading + facing * directional * twist * (release - windup), bank]);
  root[4] += facing * size * amplitude * ((.31 * release - .075 * rebound) * directional - .21 * windup * (radial ? .14 : 1));
  return root;
}
