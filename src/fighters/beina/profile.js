export const fighter = {
  id: 'beina', name: 'Beina', role: 'Banana acrobat', color: '#ffda68',
  description: 'A walking banana with quick feet and a spare banana ready to throw.',
  special: 'Peel Flip', specialDescription: 'Tap B or L to peel and flip. Hold it to throw bananas.',
  speed: 9.8, jump: 14.2, weight: 0.84, power: 0.9, size: 0.96,
  moves: { light: 'beinaCombo', tap: 'beinaFlip', hold: 'beinaThrow', super: 'beinaBarrage' },
};

export const attacks = {
  beinaCombo: {
    duration: 0.48, from: 0.075, until: 0.15, range: 1.78, vertical: 1.13, damage: 4.5, force: 3, y: 0.24, lift: 1,
    followUp: { from: 0.25, until: 0.36, range: 1.97, damage: 6, force: 7, y: 0.48, lift: 3 },
  },
  beinaFlip: { duration: 0.64, from: 0.15, until: 0.47, range: 1.95, vertical: 1.55, damage: 10, force: 8.5, x: 0.79, y: 0.76, lift: 3.5, all: true, takeoff: 6.4 },
  beinaThrow: { duration: 0.62, from: 0.16, projectile: 'banana' },
  beinaBarrage: { duration: 0.94, from: 0.17, projectile: 'banana', volleyEvery: 0.13, volleyUntil: 0.57, takeoff: 13.6, aerialTakeoff: true },
};

function launchBananas(player, attack, match) {
  const { projectile: kind, facing, victims } = attack;
  const barrage = Boolean(attack.volleyEvery);
  const angles = barrage ? [-1.12, -0.59, -0.16] : [-0.02, 0.21, 0.48];
  for (const angle of angles) {
    const speed = barrage ? 17 : 15;
    match.projectiles.push({
      kind, owner: player, victims, x: player.x + facing * 0.7, y: player.y + 1.15,
      vx: facing * Math.cos(angle) * speed, vy: Math.sin(angle) * speed, gravity: 11, remaining: 0.72,
      hit: { damage: barrage ? 21 : 13, force: barrage ? 16 : 11, x: facing, y: 0.52, lift: 3.8 },
    });
  }
}

export const projectiles = { banana: launchBananas };
