export const fighter = {
  id: 'bomm', name: 'Bomm', role: 'Walking bomb', color: '#ffc174',
  description: 'A round, cheerful bomb with a sparking fuse and two quick feet.',
  special: 'Quick Bomb', specialDescription: 'Tap B or L to lob a bomb. Hold it to borrow a rival’s secondary attack for ten seconds.',
  speed: 7.1, jump: 12.9, weight: 1.14, power: 1.08, size: 1.08,
  moves: { light: 'bommHeadbutts', tap: 'bommQuickBomb', hold: 'bommSteal', super: 'bommBurst' },
};

export const attacks = {
  bommHeadbutts: {
    duration: 0.49, from: 0.1, until: 0.17, range: 1.72, vertical: 1.22, damage: 4.5, force: 2.5, y: 0.18, lift: 0.7, lunge: 5.2,
    followUp: { from: 0.29, until: 0.37, range: 2.02, damage: 6.5, force: 7, y: 0.5, lift: 2.9, lunge: 6.4 },
  },
  bommQuickBomb: { duration: 0.37, from: 0.08, projectile: 'bomb' },
  bommSteal: { duration: 0.66, from: 0.22, stealsPower: true },
  bommBurst: { duration: 0.89, from: 0.26, until: 0.46, range: 3.65, vertical: 2.3, offset: 0.22, damage: 24, force: 16, x: 0.94, y: 0.69, lift: 4.2, all: true, cue: 'explosion' },
};

function launchBomb(player, attack, match) {
  const { projectile: kind, facing, victims } = attack;
  match.projectiles.push({
    kind, owner: player, victims, x: player.x + facing * .74, y: player.y + 1.12,
    vx: facing * 11.4, vy: 2.6, gravity: 18, remaining: .83, blast: .91,
    hit: { damage: 6.5, force: 6.2, y: .48, lift: 2.7 },
  });
}

export const projectiles = { bomb: launchBomb };

export const stolenPowerTime = 10;
export const powerStealTravelTime = 0.72;
export const bommBurstRecovery = { peakAt: 0.22, smallAt: 0.55, duration: 5, returnTime: 0.22, speed: 0.65 };

export function borrowedPower(player, match) {
  const power = player.borrowed;
  return power && match.time - power.expiresAt > 1e-9 ? power : null;
}

export function bommBurstAge(player, match) {
  return player.bommBurstAt == null ? -Infinity : player.bommBurstAt - match.time;
}
