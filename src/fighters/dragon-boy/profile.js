import { direction } from '../../math.js';

export const fighter = {
  id: 'dragon-boy', name: 'Dragon Boy', role: 'Scaled striker', color: '#80de8d',
  description: 'A grinning dragon with green scales, orange back spines, and a pointed tail.',
  special: 'Flame Breath', specialDescription: 'Tap B or L to breathe fire. Hold it to launch back spines.',
  speed: 8.2, jump: 13.4, weight: 1, power: 1, size: 1,
  moves: { light: 'dragonClaw', tap: 'dragonFlame', hold: 'dragonSpines', super: 'dragonScales' },
};

export const attacks = {
  dragonClaw: {
    duration: 0.52, from: 0.08, until: 0.15, range: 1.68, vertical: 1.22, damage: 4, force: 3, y: 0.22, lift: 1,
    followUp: { from: 0.26, until: 0.38, range: 2.15, damage: 6.5, force: 7.5, y: 0.54, lift: 3 },
  },
  dragonFlame: { duration: 0.54, from: 0.16, until: 0.36, range: 3.15, vertical: 1.2, offset: 0.4, damage: 9, force: 8.5, y: 0.5, lift: 3.5 },
  dragonSpines: { duration: 0.58, from: 0.16, projectile: 'spine' },
  dragonScales: { duration: 0.8, from: 0.26, projectile: 'scale', range: 4 },
};

function launchScalesOrSpines(player, attack, match) {
  const { projectile: kind, facing, victims } = attack;
  const scales = kind === 'scale';
  for (let i = 0; i < (scales ? 24 : 3); i++) {
    const angle = scales ? (i + 0.5) * Math.PI / 12 : (i - 1) * 0.17;
    const speed = scales ? 10 + (i % 3) * 2 : 17;
    const vx = (scales ? 1 : facing) * Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    match.projectiles.push({
      kind, owner: player, victims, x: player.x + (scales ? 0 : facing * 0.42), y: player.y + (scales ? 1.2 : 1.56),
      vx, vy, remaining: scales ? 0.62 : 0.55,
      hit: { damage: scales ? 21 : 15, force: scales ? 16 : 12, x: direction(vx), y: scales ? Math.max(0.18, vy / speed) : 0.46, lift: scales ? 4 : 3 },
    });
  }
}

export const projectiles = { spine: launchScalesOrSpines, scale: launchScalesOrSpines };
