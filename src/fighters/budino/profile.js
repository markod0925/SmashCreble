export const reserveRounds = 800;

export const fighter = {
  id: 'budino', name: 'Budino', role: 'Jelly blaster', color: '#e7bd94',
  description: 'A wobbly pudding with a red bow tie, two energy blasters, and a deep reserve of shots.',
  special: '5K Blaster', specialDescription: 'Tap B or L for the quick 5K. Hold it for the stronger 20K. The Superstar loads 800 rounds for wider bursts.',
  speed: 7.6, jump: 13.1, weight: 1.035, power: 1.04, size: 1.02,
  moves: { light: 'budinoCombo', tap: 'budinoFiveK', hold: 'budinoTwentyK', super: 'budinoReserve' },
};

export const attacks = {
  budinoCombo: {
    duration: .49, from: .084, until: .154, range: 1.77, vertical: 1.24, damage: 4, force: 2.65, y: .23, lift: .93,
    followUp: { from: .249, until: .362, range: 2.12, damage: 6, force: 7.3, y: .44, lift: 2.75 },
  },
  budinoFiveK: { duration: .43, from: .137, range: 6.75, projectile: 'budinoPulse' },
  budinoTwentyK: { duration: .69, from: .247, range: 9.25, projectile: 'budinoBurst' },
  budinoReserve: { duration: .86, from: .265, refillReserve: reserveRounds },
};

const roundsPerWing = 40;
const blasters = {
  budinoPulse: { spent: roundsPerWing, speed: 17.9, scale: .88, damage: 8, boost: 4, force: 6.4, spread: .069 },
  budinoBurst: { spent: roundsPerWing * 2, speed: 13.3, scale: 1.44, damage: 15, boost: 5, force: 10.4, spread: .085 },
};

function fireBlaster(owner, { projectile: kind, facing, victims, range }, match) {
  const { spent, speed, scale, damage, boost, force, spread } = blasters[kind];
  const ammo = Math.min(owner.reserveAmmo ?? 0, spent);
  if (ammo) owner.reserveAmmo -= ammo;
  const wings = Math.ceil(ammo / roundsPerWing);
  for (let lane = -wings; lane <= wings; lane++) {
    const angle = lane * spread;
    const vx = Math.cos(angle) * speed * facing;
    match.projectiles.push({
      kind, owner, victims, scale, boosted: ammo > 0, x: owner.x + .79 * facing, y: owner.y + 1.42 + .112 * lane,
      vx, vy: Math.sin(angle) * speed, remaining: range / Math.abs(vx),
      hit: { damage: damage + (ammo ? boost : 0), force, x: facing, y: .41, lift: 1.86 },
    });
  }
}

export const projectiles = { budinoPulse: fireBlaster, budinoBurst: fireBlaster };
