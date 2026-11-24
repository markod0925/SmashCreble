import { strike } from '../../combat/hits.js';
import { areRivals, bodyCenter, combatants } from '../../combat/state.js';
import { direction } from '../../math.js';

export const boltTop = 16;
export const boltBottom = -1.3;

function thunderColumns(owner, match) {
  const columns = [];
  for (const rival of match.fighters) {
    if (!areRivals(owner, rival) || !rival.stocks || rival.respawn) continue;
    if (columns.every(x => Math.abs(x - rival.x) > 1.3)) columns.push(rival.x);
  }
  return columns.length ? columns : [owner.x + 2.25 * owner.facing];
}

export function advanceThunder(owner, attack, match) {
  const wave = attack.thunderWave ??= { index: 0, startsAt: attack.from, columns: null };
  if (wave.index >= attack.waves || attack.age < wave.startsAt) return;
  wave.columns ??= thunderColumns(owner, match);
  if (attack.age < wave.startsAt + attack.warning) return;

  attack.victims.clear();
  const first = wave.index === 0;
  const targets = combatants(match);
  for (const [i, x] of wave.columns.entries()) {
    match.events.push({ type: 'nuvolBolt', x, y: 0, seed: wave.index * 3 + i, color: '#b1e7ff' });
    for (const rival of targets) {
      if (!areRivals(owner, rival) || attack.victims.has(rival) || Math.abs(rival.x - x) > .97) continue;
      const centerY = rival.y + bodyCenter(rival, match);
      if (centerY < boltBottom || centerY > boltTop) continue;
      const hit = {
        damage: first ? 17 : 6, force: first ? 12.6 : 6.9, x: direction(rival.x - owner.x, owner.facing),
        y: .73, lift: 2.8, shockDuration: .56,
      };
      if (strike(owner, rival, hit, match)) attack.victims.add(rival);
    }
  }
  wave.index++;
  wave.startsAt += attack.waveDelay;
  wave.columns = null;
}
