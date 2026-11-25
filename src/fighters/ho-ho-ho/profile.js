export const fighter = {
  id: 'ho-ho-ho', name: 'Ho-Ho-Ho', role: 'Sleigh rider', color: '#fa625f',
  description: 'A red-capped gift thrower with a golden sack and a team of flying sleighs.',
  special: 'Gift Toss', specialDescription: 'Tap B or L to throw a gift. Hold it to send one sleigh ahead. His Superstar sends three sleighs, one to each side and one straight up.',
  speed: 7.18, jump: 12.7, weight: 1.16, power: 1.08, size: 1.05,
  moves: { light: 'hoHoHoCombo', tap: 'hoHoHoGift', hold: 'hoHoHoSleighRide', super: 'hoHoHoSleighStorm' },
};

export const attacks = {
  hoHoHoCombo: {
    duration: .56, from: .11, until: .182, range: 1.88, vertical: 1.27, offset: .24,
    damage: 4, force: 3.1, y: .22, lift: .81, stagger: .16,
    followUp: { from: .278, until: .384, range: 2.18, offset: .13, damage: 7, force: 7.8, y: .48, lift: 2.62, stagger: 0 },
  },
  hoHoHoGift: { duration: .56, from: .174, range: 7.5, projectile: 'hoHoHoPresent' },
  hoHoHoSleighRide: { duration: .89, from: .27, range: 9, projectile: 'hoHoHoSleighRide', cue: 'sleighBells' },
  hoHoHoSleighStorm: { duration: 1.07, from: .33, range: 12.2, projectile: 'hoHoHoSleighStorm', cue: 'sleighBells' },
};

function scatterRibbon({ x, y, vx }, match) {
  match.events.push({ type: 'giftPop', x, y, color: '#ffd679', xDir: Math.sign(vx) });
}

function tossPresent(owner, { projectile: kind, facing, range, scale }, match) {
  const speed = 13.2;
  match.projectiles.push({
    kind, owner, scale, x: owner.x + .83 * facing * scale, y: owner.y + 1.51 * scale,
    vx: speed * facing, vy: 2.65, gravity: 14, remaining: range / speed, onImpact: scatterRibbon,
    hit: { damage: 9, force: 7.1, x: facing, y: .42, lift: 2.5 },
  });
}

function sendSleigh(owner, { scale, range, facing }, match, dx, dy, height, storm) {
  const speed = storm ? 17.4 : 15.8;
  const length = 1.22 * scale;
  const hullHeight = .52 * scale;
  match.projectiles.push({
    kind: 'hoHoHoSleigh', owner, scale, facing, piercing: true, victims: new Set(),
    x: owner.x + 1.32 * dx * scale, y: owner.y + (height + .84 * dy) * scale,
    vx: dx * speed, vy: dy * speed, remaining: range / speed,
    hitbox: { halfWidth: Math.abs(dx) * length + dy * hullHeight, halfHeight: dy * length + Math.abs(dx) * hullHeight },
    hit: { damage: storm ? 17 : 12, force: storm ? 15.5 : 10.5, x: dx, y: .4 + dy * .52, lift: storm ? 3.2 : 2.6 },
  });
}

function sendForwardSleigh(owner, attack, match) {
  sendSleigh(owner, attack, match, attack.facing, 0, .95, false);
}

function sendStorm(owner, attack, match) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1]]) {
    sendSleigh(owner, attack, match, dx, dy, .98, true);
  }
}

export const projectiles = {
  hoHoHoPresent: tossPresent,
  hoHoHoSleighRide: sendForwardSleigh,
  hoHoHoSleighStorm: sendStorm,
};
