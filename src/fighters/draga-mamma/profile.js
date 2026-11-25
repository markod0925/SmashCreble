import { bodyCenter } from '../../combat/state.js';
import { interruptAttack } from '../../combat/status.js';

const potionSeconds = 5;
const potionDamage = 16;
const potionOutcomes = [
  ['damage', '#ff846b'], ['heal', '#83eca6'], ['sleep', '#a8d6ff'],
  ['shrink', '#8ef0e2'], ['grow', '#e4a6ff'], ['slow', '#ffdc88'],
];

export const fighter = {
  id: 'draga-mamma', name: 'Draga Mamma', role: 'Potion witch', color: '#a592f1',
  description: 'A cheerful witch in a tall purple hat, with a sparking wand and a bottle of unpredictable potion.',
  special: 'Wand Spell', specialDescription: 'Tap B or L to cast one spell. Hold it to cast two. Her Superstar potion has six random effects.',
  speed: 7.83, jump: 13.26, weight: .97, power: 1.04, size: .99,
  moves: { light: 'dragaFaceWipe', tap: 'dragaSpell', hold: 'dragaDoubleSpell', super: 'dragaPotion' },
};

function drinkPotion(target, match) {
  const [outcome, color] = potionOutcomes[Math.floor(Math.random() * potionOutcomes.length)];
  match.events.push({ type: 'potion', x: target.x, y: target.y + bodyCenter(target, match), color });
  const until = match.time - potionSeconds;
  switch (outcome) {
    case 'heal':
      target.damage = Math.max(0, target.damage - potionDamage);
      break;
    case 'sleep':
      if (!interruptAttack(target)) break;
      target.sleepUntil = until;
      target.guarding = false;
      target.vx = 0;
      break;
    case 'shrink':
    case 'grow':
      target.resizeUntil = until;
      target.resizeScale = outcome === 'shrink' ? .5 : 1.5;
      break;
    case 'slow':
      target.slowUntil = until;
      break;
  }
  return outcome !== 'damage';
}

export const attacks = {
  dragaFaceWipe: {
    duration: .42, from: .121, until: .226, range: 1.93, vertical: 1.29, offset: .52,
    damage: 6, force: 3.9, y: .26, lift: 1.2,
  },
  dragaSpell: { duration: .5, from: .152, range: 6.4, projectile: 'dragaSpark' },
  dragaDoubleSpell: { duration: .79, from: .26, volleyEvery: .22, volleyUntil: .58, range: 7.2, projectile: 'dragaSpark' },
  dragaPotion: {
    duration: .91, from: .34, until: .48, range: 2.55, vertical: 1.36, offset: .14,
    damage: potionDamage, force: 11.4, y: .48, lift: 2.8, singleTarget: true, applyEffect: drinkPotion,
  },
};

function castSpell(owner, { projectile: kind, facing, range, scale }, match) {
  const speed = 18.2;
  match.projectiles.push({
    kind, owner, scale, x: owner.x + facing * 1.12 * scale, y: owner.y + 1.39 * scale,
    vx: facing * speed, vy: 0, remaining: range / speed,
    hit: { damage: 9, force: 5.2, x: facing, y: .24, lift: 1 },
  });
}

export const projectiles = { dragaSpark: castSpell };
