import { areRivals, bodyCenter, combatants } from '../../combat/state.js';
import { direction } from '../../math.js';

const firstFireShot = .34;
const fireInterval = .28;
const fireShotCount = 3;

export const fighter = {
  id: 'maradona', name: 'Maradona', role: 'Football striker', color: '#f36962',
  description: 'A curly-haired footballer in a red kit and yellow boots who brings his own goal.',
  special: 'Bear Hug', specialDescription: 'Tap B or L to squeeze a nearby rival. Hold it to kick a football. His Superstar summons a goal for three blazing shots.',
  speed: 8.1, jump: 13.1, weight: 1.06, power: 1.08, size: 1.01,
  moves: { light: 'maradonaPunches', tap: 'maradonaHug', hold: 'maradonaKick', super: 'maradonaFireShots' },
};

export const attacks = {
  maradonaPunches: {
    duration: .53, from: .105, until: .17, range: 1.9, vertical: 1.22, offset: .35,
    damage: 4.5, force: 3.2, y: .24, lift: 1, stagger: .16,
    followUp: { from: .26, until: .36, range: 2.16, damage: 6.5, force: 7.6, y: .5, lift: 2.7, stagger: 0 },
  },
  maradonaHug: {
    duration: .68, from: .16, swallowAt: .3, biteAt: .37, range: 2.18, vertical: 1.2,
    damage: 12, force: 8.6, y: .32, lift: 1.7, captureStyle: 'hug', mouth: { reach: .98, height: 0 },
  },
  maradonaKick: { duration: .63, from: .22, range: 8.1, projectile: 'maradonaBall' },
  maradonaFireShots: {
    duration: 1.28, from: firstFireShot, range: 28, projectile: 'maradonaFireball',
    volleyEvery: fireInterval, volleyUntil: firstFireShot + (fireShotCount - .5) * fireInterval,
    onStart(owner, attack) { attack.goal = { x: owner.x, y: owner.y }; },
  },
};

function kickBall(owner, { projectile: kind, facing, range, scale }, match) {
  const speed = 19.2;
  match.projectiles.push({
    kind, owner, scale, x: owner.x + .74 * facing * scale, y: owner.y + .77 * scale,
    vx: facing * speed, vy: 1.2, remaining: range / speed,
    hit: { damage: 13, force: 10.2, x: facing, y: .42, lift: 2.4 },
  });
}

function kickFireball(owner, attack, match) {
  const center = owner.y + bodyCenter(owner, match);
  let target;
  let nearest = Infinity;
  for (const rival of combatants(match)) {
    if (!areRivals(owner, rival) || !rival.stocks || rival.respawn || rival.owner?.stocks === 0) continue;
    const distance = Math.hypot(rival.x - owner.x, rival.y + bodyCenter(rival, match) - center);
    if (distance < nearest) {
      target = rival;
      nearest = distance;
    }
  }

  const { projectile: kind, range, scale } = attack;
  const gap = target ? target.x - owner.x : scale * attack.facing;
  const facing = direction(gap, attack.facing);
  owner.facing = attack.facing = facing;
  const x = owner.x + facing * Math.min(.82 * scale, Math.abs(gap) / 2);
  const y = owner.y + .77 * scale;
  const angle = target ? Math.atan2(target.y + bodyCenter(target, match) - y, target.x - x) : Math.atan2(0, facing);
  const speed = 27;
  match.projectiles.push({
    kind, owner, scale: 1.6 * scale, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    remaining: range / speed,
    hit: { damage: 19, force: 16, x: facing, y: .48, lift: 3.4 },
  });
  match.events.push({ type: 'fireKick', x, y, color: '#ff9749', xDir: facing });
}

export const projectiles = { maradonaBall: kickBall, maradonaFireball: kickFireball };
