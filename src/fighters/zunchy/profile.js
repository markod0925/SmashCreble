import { areRivals } from '../../combat/state.js';

export const shrinkSeconds = 5;

export const fighter = {
  id: 'zunchy', name: 'Zunchy', role: 'Spiral chomper', color: '#b99af4',
  description: 'A turquoise and violet creature with pink leg bands, a green spiral, and a very big mouth.',
  special: 'Crack Stomp', specialDescription: 'Tap B or L for a ground-cracking stomp. Hold it to throw two bombs.',
  speed: 7.76, jump: 13.25, weight: 1.07, power: 1.04, size: 1.06,
  moves: { light: 'zunchyHypnosis', tap: 'zunchyStomp', hold: 'zunchyBombs', super: 'zunchyShrink' },
};

export const attacks = {
  zunchyHypnosis: {
    duration: .52, from: .122, until: .334, range: 3.07, waveSpeed: 29, vertical: 1.38, offset: .24,
    damage: 4.5, force: 3.2, y: 0, lift: 0, stagger: .37,
  },
  zunchyStomp: {
    duration: .63, from: .223, until: .37, range: 2.29, vertical: 1.29, offset: -.24,
    damage: 11, force: 9.2, x: .88, y: .47, lift: 2.75, all: true,
  },
  zunchyBombs: { duration: .78, from: .275, range: 8.5, projectile: 'zunchyBomb' },
  zunchyShrink: { duration: .78, from: .263, shrinksRivals: shrinkSeconds, cue: 'zunchyShrink' },
  zunchyGulp: {
    duration: .77, from: 0, swallowAt: .23, biteAt: .50,
    mouth: { reach: .89, height: 1.92 }, releaseMouth: { reach: 1.83, height: 1.62 },
    damage: 16, force: 9.8, y: .38, lift: 1.45, maxLaunch: 10.5, gulpSpit: true,
  },
};

function throwBombs(owner, { projectile: kind, facing, scale, victims }, match) {
  for (const [speed, rise, size] of [[8.1, 3.8, .95], [11.9, 6, 1.11]]) {
    match.projectiles.push({
      kind, owner, victims, scale: scale * size, blast: 2.1 * scale, blastColor: '#a4c9ff',
      x: owner.x + facing * 1.04 * scale, y: owner.y + 1.63 * scale,
      vx: facing * speed, vy: rise, gravity: 18, remaining: .94,
      hit: { damage: 16, force: 11.6, y: .49, lift: 3.1 },
    });
  }
}

export const projectiles = { zunchyBomb: throwBombs };

export function shrinkTime(caster, match) {
  return Math.max(0, match.time - (caster.shrinkRivalsUntil ?? match.time) - 1e-9);
}

export function shrinkScale(target, match) {
  return match.fighters.some(caster => areRivals(caster, target) && shrinkTime(caster, match) > 0) ? .5 : 1;
}
