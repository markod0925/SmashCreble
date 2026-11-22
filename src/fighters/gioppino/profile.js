export const fighter = {
  id: 'gioppino', name: 'Gioppino', role: 'Zombie brawler', color: '#a9db76',
  description: 'A green, stitched zombie with a crooked haircut and a pocketful of cartoon brains.',
  special: 'Zombie Bite', specialDescription: 'Tap B or L to turn a rival into a zombie for five seconds. Hold it to throw brains.',
  speed: 7.1, jump: 12.9, weight: 1.14, power: 1.08, size: 1.08,
  moves: { light: 'gioppinoCombo', tap: 'gioppinoBite', hold: 'gioppinoBrains', super: 'gioppinoClones' },
};

export const attacks = {
  gioppinoCombo: {
    duration: 0.61, from: 0.085, until: 0.14, range: 1.74, vertical: 1.22, damage: 3.5, force: 2.5, y: 0.18, lift: 0.75,
    followUp: {
      from: 0.24, until: 0.32, range: 1.99, damage: 3.5, force: 3.4, y: 0.26, lift: 0.95,
      followUp: { from: 0.41, until: 0.5, range: 2.3, damage: 5, force: 7.1, y: 0.55, lift: 3 },
    },
  },
  gioppinoBite: { duration: 0.55, from: 0.16, until: 0.3, range: 1.93, vertical: 1.4, damage: 9, force: 6.1, y: 0.39, lift: 2.4, lunge: 4.8, zombieDuration: 5 },
  gioppinoBrains: { duration: 0.64, from: 0.18, projectile: 'brain', range: 4.8 },
  gioppinoClones: { duration: 0.82, from: 0.25, summonsClones: 6 },
};

function launchBrains(player, attack, match) {
  const { projectile: kind, facing, victims } = attack;
  const scale = attack.scale;
  for (const [vx, vy] of [[14, 2.6], [11.5, 5.25], [9.4, 7.1]]) {
    match.projectiles.push({
      kind, owner: player, victims, x: player.x + facing * .76 * scale, y: player.y + 1.23 * scale,
      vx: facing * vx, vy, scale, gravity: 17, remaining: .85,
      hit: { damage: 14, force: 11, x: facing, y: .49, lift: 3.3 },
    });
  }
}

export const projectiles = { brain: launchBrains };
