export const fighter = {
  id: 'dragonball', name: 'DragonBall', role: 'Muscle brawler', color: '#f06767',
  description: 'A bare-chested brawler with a red headband, a sharp bite, and a laser in his belly button.',
  special: 'Navel Beam', specialDescription: 'Tap B or L to fire a navel laser. Hold it to summon a pair of smaller clones.',
  speed: 7.4, jump: 13.15, weight: 1.12, power: 1.07, size: 1.03,
  moves: { light: 'dragonBallBite', tap: 'dragonBallNavelLaser', hold: 'dragonBallClones', super: 'dragonBallBacteria' },
};

export const attacks = {
  dragonBallBite: { duration: .44, from: .125, until: .244, range: 1.84, vertical: .96, offset: .58, damage: 8, force: 6.5, y: .34, lift: 1.55, lunge: 3.1 },
  dragonBallNavelLaser: { duration: .68, from: .236, until: .474, range: 6.25, vertical: 1, offset: .12, damage: 11, force: 8.7, y: .22, lift: 1.14 },
  dragonBallClones: { duration: .73, from: .27, summonsClones: 2 },
  dragonBallBacteria: { duration: .96, from: .33, range: 9.15, projectile: 'dragonBallBacteria' },
};

function launchBacteria(owner, attack, match) {
  const { facing, victims, range, scale } = attack;
  for (let row = 0; row < 3; row++) {
    for (const lane of [-1, 0, 1]) {
      const speed = 11.8 + row * 2.55;
      match.projectiles.push({
        kind: attack.projectile, owner, victims, index: row * 3 + lane + 1,
        x: owner.x + facing * (.75 + row * .2) * scale, y: owner.y + (1.28 + lane * .29) * scale,
        vx: facing * speed, vy: lane * (1.45 + row * .44), scale: .84 + row * .12, remaining: range / speed,
        hit: { damage: 23, force: 14, x: facing, y: .42, lift: 3.1 },
      });
    }
  }
}

export const projectiles = { dragonBallBacteria: launchBacteria };
