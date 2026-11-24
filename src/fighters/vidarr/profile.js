export const frostSeconds = 5;

export const fighter = {
  id: 'vidarr', name: 'Vidarr', role: 'Frost gorgon', color: '#6bd5aa',
  description: 'A hovering gorgon in a purple gown, with black hair and six green serpents.',
  special: 'Flying Fangs', specialDescription: 'Tap B or L to launch snake heads. Hold it to send out serpents that bite and knock back a rival.',
  speed: 7.1, jump: 12.8, weight: 1.09, power: 1.08, size: 1.04,
  moves: { light: 'vidarrBites', tap: 'vidarrHeads', hold: 'vidarrCoils', super: 'vidarrFrost' },
};

export const attacks = {
  vidarrBites: { duration: .42, from: .105, until: .231, range: 2.13, vertical: 1.42, damage: 8, force: 7, y: .43, lift: 2.6 },
  vidarrHeads: { duration: .62, from: .17, range: 6.05, projectile: 'vidarrHeads' },
  vidarrCoils: { duration: .76, from: .25, range: 6.8, projectile: 'vidarrCoils' },
  vidarrFrost: { duration: 2.25, from: .27, extendsAt: .48, biteAt: 1.23, biteUntil: 1.85, freezesRivals: true },
};

function launchHeads(owner, attack, match) {
  const { facing, victims, range } = attack;
  for (const [i, vy] of [-1.45, .2, 2.65].entries()) {
    match.projectiles.push({
      kind: attack.projectile, owner, victims, index: i,
      x: owner.x + facing * .72, y: owner.y + 1.5 + i * .225, vx: facing * (17 - i), vy,
      remaining: range / (17 - i),
      hit: { damage: 10, force: 8.7, x: facing, y: .42, lift: 2.5 },
    });
  }
}

function launchCoils(owner, attack, match) {
  const { facing, victims, range } = attack;
  match.projectiles.push({
    kind: attack.projectile, owner, victims, scale: 1.3,
    x: owner.x + facing * .65, y: owner.y + 1.3, vx: facing * 15.8, vy: .13,
    remaining: range / 15.8,
    hit: { damage: 15, force: 7.2, x: facing, y: 0, lift: 0 },
  });
}

export const projectiles = { vidarrHeads: launchHeads, vidarrCoils: launchCoils };
