export const fighter = {
  id: 'murena-man', name: 'Murena Man', role: 'Moray blades', color: '#adc4cd',
  description: 'A gray moray with orange legs, snapping jaws, and serrated blades for arms.',
  special: 'Flame Jet', specialDescription: 'Tap B or L to breathe fire. Hold it to whirl both arm blades around you.',
  speed: 7.78, jump: 13.2, weight: 1.05, power: 1.07, size: 1.03,
  moves: { light: 'murenaBite', tap: 'murenaFlame', hold: 'murenaWhirl', super: 'murenaBombSalvo' },
};

export const attacks = {
  murenaBite: {
    duration: .43, from: .133, until: .236, range: 2.1, vertical: 1.29, offset: .54,
    damage: 8, force: 7.4, y: .4, lift: 1.95, lunge: 4.8,
  },
  murenaFlame: {
    duration: .65, from: .176, until: .448, range: 4.75, waveSpeed: 32, vertical: 1.1, offset: .51,
    damage: 10, force: 8.6, y: .39, lift: 2.1,
  },
  murenaWhirl: {
    duration: .92, from: .18, until: .275, range: 2.83, vertical: 1.32, all: true,
    damage: 4, force: 2.9, x: .89, y: .23, lift: 0, stagger: .16, cue: 'swordSlash',
    followUp: {
      from: .356, until: .453, damage: 5,
      followUp: { from: .532, until: .686, damage: 11, force: 14.8, y: .49, lift: 3.4, stagger: 0 },
    },
  },
  murenaBombSalvo: { duration: .88, from: .31, range: 9, projectile: 'murenaBomb' },
};

function throwBombs(owner, { projectile: kind, facing, scale, victims }, match) {
  for (const [speed, rise, size] of [[-8.8, 6.1, .98], [5.65, 4.65, 1.09], [11.3, 5.7, 1.18]]) {
    const direction = Math.sign(speed) * facing;
    match.projectiles.push({
      kind, owner, victims, scale: scale * size, blast: 3.18 * scale, blastColor: '#f3b1ff',
      x: owner.x + direction * .76 * scale, y: owner.y + 1.86 * scale,
      vx: facing * speed, vy: rise, gravity: 18, remaining: .95,
      hit: { damage: 24, force: 15.3, y: .48, lift: 3.9 },
    });
  }
}

export const projectiles = { murenaBomb: throwBombs };
