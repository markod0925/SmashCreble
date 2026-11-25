export const fighter = {
  id: 'markok', name: 'Markok', role: 'Flame-cape fighter', color: '#f27c66',
  description: 'A purple-faced fighter with a tall red crest, blue fins, and a sweeping green cape.',
  special: 'Staff Strike', specialDescription: 'Tap B or L for a staff swing. Hold it to send a fire tornado across the stage.',
  speed: 7.83, jump: 13.2, weight: 1.06, power: 1.07, size: 1.04,
  moves: { light: 'markokCombo', tap: 'markokStaff', hold: 'markokTornado', super: 'markokCape' },
};

export const attacks = {
  markokCombo: {
    duration: .53, from: .107, until: .172, range: 1.89, vertical: 1.26, offset: .31,
    damage: 4, force: 3.3, y: .2, lift: .88, stagger: .16,
    followUp: { from: .269, until: .372, range: 2.13, offset: .17, damage: 7, force: 7.7, y: .45, lift: 2.52, stagger: 0 },
  },
  markokStaff: {
    duration: .6, from: .197, until: .338, range: 2.71, vertical: 1.46, offset: .32,
    damage: 11, force: 9.7, y: .45, lift: 2.9, cue: 'swordSlash',
  },
  markokTornado: { duration: .77, from: .264, range: 8.75, projectile: 'markokFireVortex' },
  markokCape: {
    duration: 1.27, from: .234, swallowAt: .471, biteAt: .954, range: 4.25, vertical: 1.92,
    captureStyle: 'cape', mouth: { reach: 1.37, height: .06 }, releaseMouth: { reach: 1.62, height: .13 },
    damage: 23, force: 13.1, y: .47, lift: 2.98, cue: 'capeSnare',
  },
};

function launchTornado(owner, { projectile: kind, range, facing, scale, victims }, match) {
  const speed = 9.8;
  match.projectiles.push({
    kind, owner, victims, scale, duration: range / speed, remaining: range / speed, piercing: true,
    x: owner.x + facing * 1.21 * scale, y: owner.y + 1.05 * scale, vx: facing * speed, vy: 0,
    hitbox: { halfWidth: .69 * scale, halfHeight: 1.19 * scale },
    hit: { damage: 16, force: 11.4, x: facing, y: .52, lift: 3.45 },
  });
}

export const projectiles = { markokFireVortex: launchTornado };
