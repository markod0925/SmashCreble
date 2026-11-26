// Bundled at src/render/arena.js on Wii.
import { drawArenaPlatforms, drawBattleArena as drawLiveArena } from './arena.browser.js';
import { arenaDisplayLists } from '../../wii/arena-assets.mjs';

export { drawHero } from './arena.browser.js';

export function drawBattleArena(renderer, arena, time) {
  const prebuilt = arenaDisplayLists.get(arena.definition.id);
  if (!prebuilt) drawLiveArena(renderer, arena, time);
  else if (!prebuilt.platforms) drawArenaPlatforms(renderer, arena);
}
