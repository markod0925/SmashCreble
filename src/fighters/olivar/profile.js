export const companionCount = 3;
export const assaultSeconds = 5;
export const returnSeconds = .42;

export const fighter = {
  id: 'olivar', name: 'Olivar', role: 'Space explorer', color: '#ffac72',
  description: 'An orange-suited explorer with three colorful space sprouts orbiting his helmet.',
  special: 'Sprout Blade', specialDescription: 'Tap B or L to form a blade from three sprouts. Hold it to send them after a rival for five seconds.',
  speed: 7.6, jump: 13.1, weight: 1.03, power: 1.04, size: 1.02,
  moves: { light: 'olivarCombo', tap: 'olivarBlade', hold: 'olivarAssault', super: 'olivarLaser' },
};

export const attacks = {
  olivarCombo: {
    duration: .51, from: .08, until: .15, range: 1.84, vertical: 1.28, damage: 4, force: 2.4, y: .19, lift: .62,
    followUp: { from: .25, until: .38, range: 2.16, damage: 7, force: 7.8, y: .51, lift: 2.9 },
  },
  olivarBlade: {
    duration: .67, from: .16, until: .25, range: 2.78, vertical: 1.48, damage: 5, force: 3.3, y: .22, lift: .72, cue: 'swordSlash',
    followUp: { from: .34, until: .49, range: 2.99, damage: 7, force: 8.8, y: .55, lift: 3.1 },
  },
  olivarAssault: { duration: .57, from: .22, deploysCompanions: true },
  olivarLaser: { duration: .94, from: .30, range: 7.7, projectile: 'olivarBeam', cue: 'laser' },
};

export function companionOrbit(index, time) {
  const angle = index * Math.PI * 2 / companionCount + time * 2.55;
  return [Math.cos(angle) * 1.58, 1.99 + Math.sin(angle) * .81, .95 + Math.sin(angle) * .35];
}

function fireLaser(owner, attack, match) {
  const speed = 22;
  const rays = 32;
  for (let i = 0; i < rays; i++) {
    const angle = i * Math.PI * 2 / rays;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    match.projectiles.push({
      kind: attack.projectile, owner, victims: attack.victims,
      x: owner.x + dx * .31, y: owner.y + 1.74 + dy * .31,
      vx: dx * speed, vy: dy * speed, angle, remaining: attack.range / speed,
      hit: { damage: 23, force: 16, x: dx, y: Math.max(.23, dy), lift: 3.7 },
    });
  }
}

export const projectiles = { olivarBeam: fireLaser };
