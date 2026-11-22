export const freezeSeconds = 5;

export const fighter = {
  id: 'nuvol', name: 'Nuvol', role: 'Storm cloud', color: '#a5b8d9',
  description: 'A hovering slate-gray cloud that brings rain, hail, ice, and lightning.',
  special: 'Hail Shower', specialDescription: `Tap B or L to drop hail below Nuvol. Hold it to freeze a rival for ${freezeSeconds} seconds.`,
  speed: 7.3, jump: 13.35, airJumps: 3, weight: .96, power: 1.06, size: 1.06,
  moves: { light: 'nuvolRain', tap: 'nuvolHail', hold: 'nuvolFreeze', super: 'nuvolStorm' },
};

export const attacks = {
  nuvolRain: { duration: .48, from: .105, until: .312, range: 2.19, vertical: 1.8, offset: -.52, damage: 7, force: 6.1, x: .83, y: .4, lift: 2.55, all: true },
  nuvolHail: { duration: .62, from: .17, range: 1.3, projectile: 'nuvolHail' },
  nuvolFreeze: { duration: .73, from: .235, range: 6.8, projectile: 'nuvolIce' },
  nuvolStorm: { duration: 1.92, from: .22, warning: .29, waveDelay: .54, waves: 3, summonsThunder: true },
};

function launchHail(owner, attack, match) {
  const { facing, victims, range } = attack;
  for (const [i, side] of [-1, 0, 1].entries()) {
    match.projectiles.push({
      kind: attack.projectile, owner, victims, index: i,
      x: owner.x + side * range / 2, y: owner.y + 1.56 + i * .16,
      vx: 0, vy: -8 - i * 1.18, gravity: 15, remaining: .8,
      hit: { damage: 10, force: 8.4, x: side || facing, y: .41, lift: 2.45 },
    });
  }
}

function launchIce(owner, attack, match) {
  const { facing, victims, range } = attack;
  const speed = 16.3;
  match.projectiles.push({
    kind: attack.projectile, owner, victims, scale: 1.32,
    x: owner.x + facing * .69, y: owner.y + 1.43,
    vx: facing * speed, vy: 0, remaining: range / speed,
    hit: { damage: 8, force: 4.5, x: facing, freezeDuration: freezeSeconds },
  });
}

export const projectiles = { nuvolHail: launchHail, nuvolIce: launchIce };
