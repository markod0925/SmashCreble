import { briefcaseGrip, danceSeconds, danceSnakeCount } from '../fighters/shark-67/profile.js';
import { strike } from './hits.js';
import { bodyCenter, combatants } from './state.js';
import { interruptAttack } from './status.js';

export function startDance(owner, match) {
  const actors = combatants(match);
  const rivals = actors.filter((actor) => actor.slot !== owner.slot && actor.stocks && !actor.respawn);
  const [x, y] = briefcaseGrip(owner);
  const snakes = Array.from({ length: danceSnakeCount }, (_, i) => ({
    x, y, angle: owner.facing < 0 ? Math.PI : 0, index: i, delay: i * .076,
    target: rivals.length ? rivals[i % rivals.length] : null,
    depth: .82 + i * .18, cooldown: 0,
  }));
  for (const actor of actors) {
    interruptAttack(actor);
    actor.vx = 0;
    actor.vy = 0;
    actor.guarding = false;
    actor.dodge = 0;
  }
  match.projectiles = match.projectiles.filter((projectile) => projectile.kind !== 'tetheredBriefcase' || projectile.owner !== owner);
  match.dance = { owner, elapsed: 0, snakes };
}

function advanceSnake(snake, dance, match, dt) {
  if (dance.elapsed < snake.delay) return;
  const { owner } = dance;
  if (!snake.target?.stocks || snake.target.respawn) {
    snake.target = combatants(match).find((actor) => actor.slot !== owner.slot && actor.stocks && !actor.respawn);
  }
  const target = snake.target;
  if (!target) return;
  snake.cooldown = Math.max(0, snake.cooldown - dt);
  const orbit = dance.elapsed * 4.3 + snake.index * 1.25;
  const spread = snake.cooldown > 0 ? 1.35 : Math.max(0, 1 - (dance.elapsed - snake.delay) * 1.55) * 2.2;
  const dx = target.x - snake.x + Math.cos(orbit) * spread;
  const dy = target.y + bodyCenter(target, match) - snake.y + Math.sin(orbit) * spread * .64;
  const distance = Math.hypot(dx, dy);
  if (distance > .01) {
    const speed = Math.min(distance, (7.4 + snake.index * .49) * dt);
    snake.angle = Math.atan2(dy, dx);
    snake.x += (dx / distance) * speed;
    snake.y += (dy / distance) * speed;
  }
  if (!snake.cooldown && distance < .52 &&
      strike(owner, target, { damage: 3, force: 0, x: Math.sign(dx), stationary: true }, match)) {
    snake.cooldown = 1.55;
  }
}

export function advanceDance(match, dt) {
  const { dance } = match;
  dance.elapsed += dt;
  if (dance.elapsed >= danceSeconds - 1e-9) {
    match.dance = null;
    return;
  }
  for (const actor of combatants(match)) {
    actor.invulnerable = Math.max(0, actor.invulnerable - dt);
    actor.hitstun = Math.max(0, actor.hitstun - dt);
    actor.stagger = Math.max(0, actor.stagger - dt);
  }
  for (const snake of dance.snakes) advanceSnake(snake, dance, match, dt);
  match.clones = match.clones.filter(({ stocks }) => stocks > 0);
}
