export const fighter = {
  id: 'inga-inga', name: 'Inga inga', role: 'Armored guard', color: '#92c4ef',
  description: 'A grinning guard in steel armor and blue trousers, armed with a lance and a sheathed sword.',
  special: 'Draw & Slash', specialDescription: 'Tap B or L to draw the sword and slash. Hold it to throw a lance.',
  speed: 7.2, jump: 12.6, weight: 1.18, power: 1.1, size: 1.05,
  moves: { light: 'ingaHeadbutt', tap: 'ingaSword', hold: 'ingaLance', super: 'ingaBladeStorm' },
};

export const attacks = {
  ingaHeadbutt: { duration: .37, from: .095, until: .21, range: 1.86, vertical: 1.34, damage: 8, force: 7, y: .41, lift: 2.5 },
  ingaLance: { duration: .74, from: .20, range: 8.4, projectile: 'ingaLanceTip', cue: 'lanceThrow' },
  ingaSword: { duration: .76, from: .28, until: .45, range: 2.98, vertical: 1.56, offset: .16, damage: 16, force: 13, y: .56, lift: 3.5, cue: 'swordSlash' },
  ingaBladeStorm: { duration: .89, from: .26, volleyEvery: .15, volleyUntil: .42, range: 7.1, projectile: 'ingaSpinningBlade', cue: 'bladeVolley' },
};

function launchLance(owner, attack, match) {
  const { facing, range, scale, victims } = attack;
  const speed = 18;
  match.projectiles.push({
    kind: attack.projectile, owner, victims, scale, x: owner.x + facing * 1.08 * scale, y: owner.y + 1.48 * scale,
    vx: facing * speed, vy: 0, remaining: range / speed,
    hit: { damage: 11, force: 9, x: facing, y: .46, lift: 2.6 },
  });
}

function launchBlades(owner, attack, match) {
  const secondVolley = attack.nextVolley > attack.from;
  const bladesPerVolley = 12;
  const angleStep = Math.PI * 2 / bladesPerVolley;
  const originY = owner.y + 1.24 * attack.scale;
  for (let i = 0; i < bladesPerVolley; i++) {
    const angle = (i + (secondVolley ? .5 : 0)) * angleStep;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const sword = (i % 2 === 0) !== secondVolley;
    const speed = sword ? 12.4 : 15;
    match.projectiles.push({
      kind: attack.projectile, owner, victims: attack.victims,
      x: owner.x + dx * .32, y: originY + dy * .32,
      vx: dx * speed, vy: dy * speed, remaining: attack.range / speed,
      sword, angle, spin: i % 2 === 0 ? 17 : -22,
      hit: { damage: sword ? 22 : 18, force: sword ? 16 : 13, x: dx, y: Math.max(.2, dy), lift: 3.1 },
    });
  }
  if (secondVolley) match.events.push({ type: 'bladeVolley', x: owner.x, y: originY, color: '#d7e9fc' });
}

export const projectiles = { ingaLanceTip: launchLance, ingaSpinningBlade: launchBlades };
