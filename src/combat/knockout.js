import { clamp } from '../math.js';
import { restoreOriginalForm } from '../fighters/mimora/mirror.js';

export function knockOut(player, match) {
  restoreOriginalForm(player);
  if (!(match.adventure?.campaign && player.team === 'party')) player.stocks -= 1;
  player.respawn = .87;
  player.attack = null;
  if (match.superstar?.holder === player) match.superstar.holder = null;
  match.events.push({
    type: 'ko', x: match.adventure ? player.x : clamp(player.x, -14, 14),
    y: clamp(player.y, -3, 9), color: player.fighter.color,
  });
}

export function checkDamageKnockout(player, match) {
  if (player.stocks && player.team === 'enemies' && player.damage >= match.adventure.damageLimit) knockOut(player, match);
}
