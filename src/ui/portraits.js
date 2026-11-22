import { node } from './dom.js';
import { fighters } from '../fighters/index.js';

export function createPortraits(graphics) {
  const portraits = new Map();
  for (const fighter of fighters) portraits.set(fighter.id, graphics.portrait(fighter));

  return function portrait(fighter, className) {
    const img = node('img', className);
    img.src = portraits.get(fighter.id);
    img.alt = '';
    img.draggable = false;
    return img;
  };
}
