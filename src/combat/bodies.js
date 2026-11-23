import { leavePlatform } from './arena.js';
import { landOnPlatform } from './movement.js';
import { bodyHalfWidth, bodySize } from './state.js';
import { capturingAttack } from './status.js';

export function separateBodies(actors, match, movement) {
  const bodies = [];
  for (const player of actors) {
    if (!player.stocks || player.respawn || player.owner?.stocks === 0 ||
        player.attack?.trace67 || capturingAttack(player, match)) continue;
    const size = bodySize(player, match);
    const { x, y } = player;
    // Use the body core, leaving room for attack poses and for clearing a rival in a jump.
    bodies.push({
      player, x, y, top: y + 2.1 * size, halfWidth: bodyHalfWidth(player, size),
      startX: movement?.get(player)?.x ?? x, left: x, right: x,
    });
  }

  // Keep the order from before movement so a fast dash cannot swap sides through a body.
  // Teleports and summons use their destination order instead.
  bodies.sort((a, b) => a.startX - b.startX || a.x - b.x);
  const contacts = [];
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (a.y >= b.top || b.y >= a.top) continue;
      const gap = a.halfWidth + b.halfWidth;
      contacts.push({ a, b, gap });
      b.right = Math.max(b.right, a.right + gap);
    }
  }
  // Pack in both directions, then split the correction. Both layouts satisfy
  // every contact, so averaging them also works when several fighters pile up.
  for (let i = contacts.length - 1; i >= 0; i--) {
    const { a, b, gap } = contacts[i];
    a.left = Math.min(a.left, b.left - gap);
  }
  for (const { player, x, left, right } of bodies) {
    const position = (left + right) * .5;
    if (position === x) continue;
    player.x = position;
    leavePlatform(player);
    const landingFrom = movement?.get(player)?.landingFrom;
    if (landingFrom) landOnPlatform(player, landingFrom, match.arena);
  }
  for (const { a, b, gap } of contacts) {
    if (b.player.x - a.player.x > gap + 1e-9 || a.player.vx <= b.player.vx) continue;
    a.player.vx = Math.min(0, a.player.vx);
    b.player.vx = Math.max(0, b.player.vx);
  }
}
