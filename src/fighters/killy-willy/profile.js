export const fighter = {
  id: 'killy-willy', name: 'KillyWilly', role: 'Clawed ambusher', color: '#ef7886',
  description: 'A charcoal creature with a triangular head, coral claw tips, and a stretchy jaw.',
  special: 'Claw Slash', specialDescription: 'Tap B or L for a two-handed claw slash. Hold it to send three air blades forward.',
  speed: 8.03, jump: 13.34, weight: 1.04, power: 1.06, size: 1.05,
  moves: { light: 'killyScratch', tap: 'killyClaws', hold: 'killyAirBlades', super: 'killyGulp' },
};

export const attacks = {
  killyScratch: { duration: .41, from: .11, until: .23, range: 1.94, vertical: 1.29, offset: .27, damage: 8, force: 6.8, y: .39, lift: 1.95 },
  killyClaws: { duration: .61, from: .205, until: .355, range: 2.61, vertical: 1.57, offset: .21, damage: 12, force: 10.5, y: .45, lift: 3.05, cue: 'swordSlash' },
  killyAirBlades: { duration: .75, from: .239, range: 7.45, projectile: 'killyWindBlade', cue: 'bladeVolley' },
  killyGulp: {
    duration: 1.14, from: .22, swallowAt: .51, biteAt: .739, range: 6.5, vertical: 2.55, captureAll: true,
    mouth: { reach: .91, height: 1.71 }, releaseMouth: { reach: 1.7, height: 1.41 },
    gulpSpit: true, spitSpread: .76, damage: 24, force: 13.1, y: .39, lift: 1.53, maxLaunch: 14.4, cue: 'chomp',
  },
};

function launchWindBlades(owner, { projectile: kind, facing, range, scale, victims }, match) {
  for (const lane of [-1, 0, 1]) {
    const angle = lane * .24;
    const speed = lane === 0 ? 16.6 : 15.1;
    match.projectiles.push({
      kind, owner, victims, scale, lane,
      x: owner.x + facing * (1.02 + (lane === 0 ? .26 : 0)) * scale, y: owner.y + (1.27 + lane * .39) * scale,
      vx: facing * Math.cos(angle) * speed, vy: Math.sin(angle) * speed, remaining: range / speed,
      hitbox: { halfWidth: .3 * scale, halfHeight: .52 * scale },
      hit: { damage: 13, force: 10.6, x: facing, y: .4, lift: 2.5 },
    });
  }
}

export const projectiles = { killyWindBlade: launchWindBlades };
