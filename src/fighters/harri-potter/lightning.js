import { strike } from '../../combat/hits.js';
import { areRivals, bodyCenter, combatants } from '../../combat/state.js';
import { direction } from '../../math.js';

export function castWandLightning(caster, attack, match) {
  attack.lightningEnds = [];
  for (const rival of combatants(match)) {
    if (!areRivals(caster, rival) || !rival.stocks || rival.respawn) continue;
    attack.lightningEnds.push([rival.x, rival.y + bodyCenter(rival, match), (rival.depth ?? .21) + .45]);
    strike(caster, rival, { ...attack, x: direction(rival.x - caster.x, attack.facing) }, match);
  }
}
