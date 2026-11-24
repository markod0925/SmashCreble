export const toothCount = 12;
const toothInterval = 1 / 12;
export const sitDazeSeconds = 3;

export const fighter = {
  id: 'cerbero', name: 'Cerbero', role: 'Three-headed hound', color: '#db9f66',
  description: 'A brown, three-headed dog with pointed ears and a very heavy sit.',
  special: 'Hairspray', specialDescription: 'Tap B or L to spray a cloud. Hold it to fire a rapid burst of teeth.',
  speed: 7.74, jump: 13.1, weight: 1.13, power: 1.05, size: 1.04, bodyHalfWidth: .77,
  moves: { light: 'cerberoBites', tap: 'cerberoSpray', hold: 'cerberoTeeth', super: 'cerberoGiantSit' },
};

export const attacks = {
  cerberoBites: {
    duration: .61, from: .105, until: .17, range: 1.95, vertical: 1.25, offset: .31,
    damage: 3, force: 2.5, y: .23, lift: 1, stagger: .16,
    followUp: {
      from: .272, until: .33, damage: 3, range: 2.12,
      followUp: { from: .439, until: .51, damage: 6, range: 2.24, force: 8.1, y: .48, lift: 2.5, stagger: 0 },
    },
  },
  cerberoSpray: { duration: .5, from: .156, range: 4.05, projectile: 'cerberoMist' },
  cerberoTeeth: {
    duration: 1.35, from: .215, range: 8.1, projectile: 'cerberoTooth',
    volleyEvery: toothInterval, volleyUntil: .215 + (toothCount - .5) * toothInterval,
  },
  cerberoGiantSit: { duration: 1.78, from: .62, dazzlesRivals: sitDazeSeconds, cue: 'cerberoSit' },
};

function spray(owner, { projectile: kind, facing, range, scale, victims }, match) {
  const speed = 12.2;
  match.projectiles.push({
    kind, owner, victims, scale: 1.52 * scale,
    x: owner.x + facing * .98 * scale, y: owner.y + 1.51 * scale,
    vx: facing * speed, vy: -.33, remaining: range / speed,
    hit: { damage: 9, force: 7.1, x: facing, y: .35, lift: 1.93 },
  });
}

function spitTooth(owner, attack, match) {
  const index = attack.teethFired ?? 0;
  const head = index % 3;
  const last = index === toothCount - 1;
  const { projectile: kind, facing, scale, range } = attack;
  const speed = last ? 21.6 : 18.4 + head * .42;
  const x = owner.x + facing * [1.19, .99, 1.41][head] * scale;
  const y = owner.y + [1.71, 1.47, 1.39][head] * scale;
  attack.teethFired = index + 1;
  match.projectiles.push({
    kind, owner, x, y, scale: (last ? 1.3 : .88) * scale, head, last,
    vx: speed * facing, vy: [-.88, -.24, .11][head], remaining: range / speed,
    hit: { damage: last ? 5 : 2.6, force: last ? 8.8 : 2.2, x: facing, y: .38, lift: 1.8, stagger: last ? 0 : .108 },
  });
  match.events.push({ type: 'toothShot', x, y, color: '#fff0d7' });
}

export const projectiles = { cerberoMist: spray, cerberoTooth: spitTooth };
