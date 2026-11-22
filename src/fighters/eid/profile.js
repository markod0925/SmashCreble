import { direction } from '../../math.js';

export const fighter = {
  id: 'eid', name: 'Eid', role: 'Robot girl', color: '#79e5de',
  description: 'A robot girl with orange pigtails, a green visor, and a scythe that folds away between swings.',
  special: 'Pulse Shot', specialDescription: 'Tap B or L to fire her blaster. Hold it to teleport and swing her scythe.',
  speed: 9.8, jump: 14.2, weight: 0.84, power: 0.9, size: 0.96,
  moves: { light: 'eidCombo', tap: 'eidShot', hold: 'eidScythe', super: 'eidSpin' },
};

export const attacks = {
  eidCombo: {
    duration: 0.48, from: 0.075, until: 0.15, range: 1.72, vertical: 1.15, damage: 4.5, force: 3, y: 0.24, lift: 1,
    followUp: { from: 0.25, until: 0.34, range: 1.95, damage: 6, force: 7, y: 0.48, lift: 3 },
  },
  eidShot: { duration: 0.46, from: 0.14, projectile: 'pulse' },
  eidScythe: { duration: 0.64, from: 0.18, until: 0.34, range: 2.1, vertical: 1.55, damage: 15, force: 13, x: 0.94, y: 0.51, lift: 3.2, all: true, travel: 3.4 },
  eidSpin: { duration: 1.06, from: 0.24, until: 0.82, range: 2.65, vertical: 1.65, damage: 18, force: 13, x: 0.92, y: 0.64, lift: 4, all: true, projectile: 'pulse', volleyEvery: 0.22 },
};

function launchPulse(player, attack, match) {
  const { projectile: kind, facing } = attack;
  const spinning = Boolean(attack.volleyEvery);
  if (spinning) attack.shotVictims ??= new Set();
  const angles = spinning ? [0, 0.48, Math.PI, Math.PI - 0.48] : [facing > 0 ? 0 : Math.PI];
  for (const angle of angles) {
    const vx = Math.cos(angle) * 19;
    match.projectiles.push({
      kind, owner: player, victims: attack.shotVictims, x: player.x + direction(vx) * 0.76, y: player.y + 1.42,
      vx, vy: Math.sin(angle) * 19, remaining: spinning ? 0.48 : 0.72,
      hit: { damage: 8, force: 8, x: direction(vx), y: 0.4, lift: 3.2 },
    });
  }
}

export const projectiles = { pulse: launchPulse };
