export const fighter = {
  id: 'harri-potter', name: 'HarriPotter', role: 'Wand caster', color: '#b397ee',
  description: 'A wizard with round glasses, an oversized black jacket, and blue shoes.',
  special: 'Magic Bolt', specialDescription: 'Tap B or L to cast a bolt. Hold it to hurl three translucent magic bombs.',
  speed: 7.83, jump: 13.26, weight: .97, power: 1.04, size: .99,
  moves: { light: 'harriCombo', tap: 'harriBolt', hold: 'harriBombs', super: 'harriLightning' },
};

export const attacks = {
  harriCombo: {
    duration: .55, from: .108, until: .187, range: 1.88, vertical: 1.24, offset: .28,
    damage: 4, force: 3, y: .23, lift: 1.2, stagger: .16,
    followUp: { from: .284, until: .394, range: 2.25, offset: .17, damage: 7, force: 7.5, y: .46, lift: 2.5, stagger: 0 },
  },
  harriBolt: { duration: .5, from: .152, range: 6.4, projectile: 'harriSpark' },
  harriBombs: { duration: .79, from: .298, range: 9.2, projectile: 'harriMagicBomb' },
  harriLightning: {
    duration: .96, from: .37, all: true, wandLightning: true, cue: 'wandLightning',
    damage: 23, force: 13.6, y: .57, lift: 3.3,
  },
};

function flingSpark(owner, { projectile: kind, facing, range, scale, victims }, match) {
  const speed = 18.2;
  match.projectiles.push({
    kind, owner, victims, scale, x: owner.x + facing * 1.12 * scale, y: owner.y + 1.56 * scale,
    vx: facing * speed, vy: .18, remaining: range / speed,
    hit: { damage: 9, force: 7.2, x: facing, y: .35, lift: 1.8 },
  });
}

function flingBombs(owner, { projectile: kind, facing, scale, victims }, match) {
  for (const [speed, rise] of [[7.8, 2.9], [10, 4.35], [12.3, 6.25]]) {
    match.projectiles.push({
      kind, owner, victims, scale: scale * .94, blast: 1.74 * scale, blastColor: '#bc9bff',
      x: owner.x + facing * 1.24 * scale, y: owner.y + 1.76 * scale,
      vx: facing * speed, vy: rise, gravity: 18, remaining: .96,
      hit: { damage: 16, force: 11.4, y: .48, lift: 2.8 },
    });
  }
}

export const projectiles = { harriSpark: flingSpark, harriMagicBomb: flingBombs };
