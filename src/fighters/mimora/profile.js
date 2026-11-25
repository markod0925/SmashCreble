export const mirrorSeconds = 10;

export const fighter = {
  id: 'mimora', name: 'Kirbi', role: 'Mirror guardian', color: '#73e2bc',
  description: 'An angular jade guardian with a folding visor, a bronze sword, and a kite shield.',
  special: 'Guard & Slash', specialDescription: 'Tap B or L to raise the shield and follow with a slash. Hold it to spit two bombs.',
  speed: 7.69, jump: 13.1, weight: 1.1, power: 1.05, size: 1.02,
  moves: { light: 'mimoraHeadbutt', tap: 'mimoraGuardSlash', hold: 'mimoraBombs', super: 'mimoraMirror' },
};

export const attacks = {
  mimoraHeadbutt: { duration: .427, from: .131, until: .249, range: 2.12, vertical: 1.33, offset: .45, damage: 8, force: 7.4, y: .38, lift: 2.1, lunge: 5.1 },
  mimoraGuardSlash: {
    duration: .58, from: .244, until: .365, range: 2.46, vertical: 1.36, offset: .29,
    guardWindow: { from: .044, until: .225 }, damage: 11, force: 8.7, y: .43, lift: 2.49, cue: 'swordSlash',
  },
  mimoraBombs: { duration: .74, from: .267, range: 8.2, projectile: 'mimoraMouthBomb' },
  mimoraMirror: { duration: .56, from: .417, mirrorsRival: true, cue: 'blink' },
};

function spitBombs(owner, { projectile: kind, facing, scale, victims }, match) {
  for (const [speed, rise, size] of [[8.4, 3.4, .91], [12.1, 5.8, 1.14]]) {
    match.projectiles.push({
      kind, owner, victims, scale: scale * size, blast: 2.05 * scale, blastColor: '#a5efbe',
      x: owner.x + facing * 1.16 * scale, y: owner.y + 1.87 * scale,
      vx: facing * speed, vy: rise, gravity: 18, remaining: .91,
      hit: { damage: 16, force: 11.7, y: .45, lift: 3.3 },
    });
  }
}

export const projectiles = { mimoraMouthBomb: spitBombs };
