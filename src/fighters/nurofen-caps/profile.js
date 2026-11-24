export const fighter = {
  id: 'nurofen-caps', name: 'Nurofen Caps', role: 'Capsule caster', color: '#f26b59',
  description: 'A red capsule that shoots vitamin C, tosses bombs, and summons four smaller copies.',
  special: 'Mini Bomb', specialDescription: 'Tap B or L to toss a small bomb. Hold it for a larger bomb with a wider blast.',
  speed: 7.64, jump: 13.1, weight: 1.02, power: 1.04, size: 1.01,
  moves: { light: 'capsVitamin', tap: 'capsBomb', hold: 'capsBigBomb', super: 'capsCloneSquad' },
  cloneLight: 'capsCloneSlap',
};

export const attacks = {
  capsVitamin: { duration: .37, from: .104, range: 5.35, projectile: 'capsVitaminShot' },
  capsBomb: { duration: .49, from: .151, range: 6.2, projectile: 'capsMiniBomb' },
  capsBigBomb: { duration: .76, from: .292, range: 8.15, projectile: 'capsMegaBomb' },
  capsCloneSquad: { duration: .86, from: .305, summonsClones: 4 },
  capsCloneSlap: { duration: .4, from: .112, until: .233, range: 2.24, vertical: 1.56, offset: .23, damage: 4.5, force: 5.7, y: .31, lift: 1.2 },
};

export const capsBombs = {
  capsMiniBomb: { scale: .78, blast: 1.12, speed: 11.8, rise: 3.1, blastColor: '#ffa66d', hit: { damage: 8, force: 7.2, y: .38, lift: 2.25 } },
  capsMegaBomb: { scale: 1.61, blast: 2.95, speed: 10.6, rise: 4.25, blastColor: '#ff695c', hit: { damage: 18, force: 13.1, y: .51, lift: 3.55 } },
};

function shootVitamin(owner, { projectile: kind, facing, range, scale, victims }, match) {
  const speed = 17.6;
  match.projectiles.push({
    kind, owner, victims, x: owner.x + facing * .68 * scale, y: owner.y + 1.51 * scale,
    vx: facing * speed, vy: .14, scale, remaining: range / speed,
    hit: { damage: 5, force: 4.1, x: facing, y: .22, lift: .94 },
  });
}

function tossBomb(owner, { projectile: kind, facing, victims }, match) {
  const { scale, blast, speed, rise, blastColor, hit } = capsBombs[kind];
  match.projectiles.push({
    kind, owner, victims, scale, blast, blastColor, hit,
    x: owner.x + facing * (.56 + scale * .28), y: owner.y + 1.27 + scale * .17,
    vx: facing * speed, vy: rise, gravity: 18, remaining: .92,
  });
}

export const projectiles = { capsVitaminShot: shootVitamin, capsMiniBomb: tossBomb, capsMegaBomb: tossBomb };
