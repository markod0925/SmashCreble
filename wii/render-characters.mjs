// Bundled at src/render/characters.js on Wii.
import { drawCharacter as drawLiveCharacter } from './characters.browser.js';
export * from './characters.browser.js';

export function drawCharacter(renderer, fighter, position, time, options = {}) {
  if (!renderer.drawClone?.(fighter, position, time, options)) {
    drawLiveCharacter(renderer, fighter, position, time, options);
  }
}
