import { landOnSurface } from './movement.js';
import { capturingAttack, interruptAttack, releaseCapture } from './status.js';

export function crushDeckRiders(match, actors) {
  const { arena } = match;
  const { damage, clearance, duration } = arena.definition.deckCrush;
  const deck = arena.platforms[0];
  for (const player of actors) {
    const { x, y } = player;
    if (!player.stocks || player.respawn || player.owner?.stocks === 0 ||
        x < deck.left || x > deck.right || y < deck.y || y >= deck.y + clearance) continue;
    const capture = capturingAttack(player, match);
    if (capture) releaseCapture(capture, player);
    interruptAttack(player);
    landOnSurface(player, deck);
    player.vx = 0;
    player.guarding = false;
    player.dodge = 0;
    player.hitstun = Math.max(player.hitstun, duration);
    player.crushedUntil = match.time - duration;
    player.damage += damage;
    match.events.push({ type: 'hit', x, y: deck.y + .45, color: '#ffc183', strength: damage });
  }
}
