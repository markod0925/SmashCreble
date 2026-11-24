import { strike } from '../../combat/hits.js';
import { bodyCenter, combatants } from '../../combat/state.js';
import { clamp, direction } from '../../math.js';
import { acidRainSeconds } from './profile.js';

export function startAcidRain(owner, attack, match) {
  const { platforms, definition: { bounds } } = match.arena;
  const radius = attack.range;
  match.acidRain.push({
    owner, radius, time: match.time, until: match.time - acidRainSeconds, nextPulse: match.time - .65,
    x: clamp(owner.x, -bounds.side + radius, bounds.side - radius),
    bottom: Math.min(...platforms.map(({ y }) => y)) - .12,
    top: Math.max(...platforms.map(({ y }) => y)) + 3.63,
  });
}

export function advanceAcidRain(match) {
  if (!match.acidRain.length) return;
  const targets = combatants(match);
  match.acidRain = match.acidRain.filter(rain => match.time - rain.until > 1e-9);
  for (const rain of match.acidRain) {
    if (match.time - rain.nextPulse > 1e-9) continue;
    rain.nextPulse -= 1;
    for (const target of targets) {
      const height = target.y + bodyCenter(target, match);
      if (Math.abs(target.x - rain.x) > rain.radius || height < rain.bottom || height > rain.top) continue;
      const x = direction(target.x - rain.x, rain.owner.facing);
      strike(rain.owner, target, { damage: 4, force: 2.9, x, stationary: true }, match);
    }
  }
}
