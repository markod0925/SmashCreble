export const fighter = {
  id: 'rivet', name: 'Rivet', role: 'Scrap engineer', color: '#51e2cf',
  description: 'A scrapyard mechanic with a rebuilt power glove and a habit of overcharging it.',
  special: 'Arc Bolt', secondary: 'bolt', specialDescription: 'Fires an electric bolt straight ahead.',
  speed: 8.2, jump: 13.4, weight: 1, power: 1, size: 1,
};

export const attacks = {
  bolt: { duration: 0.48, from: 0.17, projectile: 'bolt' },
};

function launchBolt(player, attack, match) {
  const { projectile: kind, facing } = attack;
  match.projectiles.push({ kind, owner: player, x: player.x + facing * 0.8, y: player.y + 1.05, vx: facing * 17, vy: 0, remaining: 0.85,
    hit: { damage: 9, force: 8.5, x: facing, y: 0.5, lift: 3.5 } });
}

export const projectiles = { bolt: launchBolt };
