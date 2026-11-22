export const danceSeconds = 7;
export const danceSnakeCount = 6;
export const briefcaseFlight = .68;

export const fighter = {
  id: 'shark-67', name: '67', role: 'Radio shark', color: '#75bfff',
  description: 'A blue shark with a retro boombox and a red briefcase full of snakes.',
  special: 'Briefcase Swing', specialDescription: 'Tap B or L to throw the tethered briefcase. Hold it to unleash 67 venomous snakes.',
  speed: 7, jump: 12.7, weight: 1.16, power: 1.09, size: 1.08,
  moves: { light: 'sharkCombo', tap: 'sharkBriefcase', hold: 'sharkVenom', super: 'sharkDance' },
};

export const attacks = {
  sharkCombo: {
    duration: .62, from: .085, until: .145, range: 1.91, vertical: 1.22, damage: 4, force: 2.7, y: .18, lift: .7,
    followUp: { from: .29, until: .4, range: 2.13, damage: 6, force: 6.8, y: .49, lift: 2.4 },
  },
  sharkBriefcase: { duration: .85, from: .13, range: 5.1, projectile: 'tetheredBriefcase' },
  sharkVenom: { duration: .93, from: .25, range: 6.9, projectile: 'venomSnake' },
  sharkDance: { duration: .66, from: .22, startsDance: true },
};

export function briefcaseGrip(owner, facing = owner.facing) {
  const size = owner.fighter.size;
  return [owner.x + facing * .69 * size, owner.y + .98 * size];
}

function launchBriefcase(owner, attack, match) {
  const { projectile: kind, facing, range, victims } = attack;
  if (match.projectiles.some((projectile) => projectile.owner === owner && projectile.kind === kind)) return;
  const [x, y] = briefcaseGrip(owner, facing);
  match.projectiles.push({
    kind, owner, facing, range, victims, x, y, remaining: briefcaseFlight, advance: advanceBriefcase,
    hit: { damage: 11, force: 8.2, x: facing, y: .46, lift: 2.5 },
  });
}

function advanceBriefcase(briefcase) {
  const { owner, facing, range, remaining } = briefcase;
  const [gripX, gripY] = briefcaseGrip(owner, facing);
  const reach = Math.sin(Math.PI * Math.max(0, remaining) / briefcaseFlight);
  briefcase.x = gripX + facing * range * reach * .87;
  briefcase.y = gripY + .49 * reach;
  briefcase.hit.x = facing * (remaining > briefcaseFlight / 2 ? 1 : -1);
}

function launchVenom(owner, attack, match) {
  const { projectile: kind, facing, range, victims } = attack;
  const [x, y] = briefcaseGrip(owner, facing);
  for (let i = 0; i < 67; i++) {
    const lane = i % 9 - 4;
    const row = Math.floor(i / 9);
    const speed = 7.4 + row * .93 + (i % 3) * .37;
    match.projectiles.push({
      kind, owner, victims, x: x + facing * row * .032, y: y + lane * .027,
      vx: facing * speed, vy: 2.35 + lane * .91 + row * .2, gravity: 7.3,
      remaining: range / speed, scale: .55,
      hit: { damage: 5, force: 4.1, x: facing, y: .3, lift: 1.35, poisonDuration: 4 },
    });
  }
}

export const projectiles = { tetheredBriefcase: launchBriefcase, venomSnake: launchVenom };
