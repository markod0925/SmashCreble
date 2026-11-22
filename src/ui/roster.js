import { $, button, node } from './dom.js';
import { fighters } from '../fighters/index.js';

export function createRoster(portrait, onSelect) {
  const cards = fighters.map((fighter, i) => {
    const card = button('', () => onSelect(i), 'fighter-card');
    card.style.setProperty('--fighter', fighter.color);
    card.setAttribute('aria-label', `${fighter.name}, ${fighter.role}`);
    card.title = fighter.description;
    const image = node('span', 'portrait');
    image.append(portrait(fighter));
    const info = node('span', 'fighter-card-info');
    info.append(node('strong', '', fighter.name), node('small', '', fighter.role));
    card.append(image, node('span', 'selected-marker', 'SELECTED'), info);
    $('roster').append(card);
    return card;
  });

  return function showSelection(selection) {
    cards.forEach((card, i) => card.setAttribute('aria-pressed', String(i === selection)));
    const fighter = fighters[selection];
    $('hero-special-label').textContent = `${fighter.name.toUpperCase()}’S SPECIAL`;
    $('hero-special').textContent = fighter.special;
    $('hero-special-description').textContent = fighter.specialDescription;
  };
}
