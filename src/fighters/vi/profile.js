export const fighter = {
  id: 'vi', name: 'Vi', role: 'Unicorn', color: '#7ae6ff',
  description: 'A blue unicorn with a pink mane, dark hooves, and a talent for making copies of herself.',
  special: 'Hoof Kick', specialDescription: 'Tap B or L to strike with a hoof. Hold it to cast a rainbow.',
  speed: 8.2, jump: 13.4, weight: 1, power: 1, size: 1,
  moves: { light: 'viHorn', tap: 'viHoof', hold: 'viRainbow', super: 'viClones' },
};

export const attacks = {
  viHorn: { duration: 0.39, from: 0.09, until: 0.22, range: 2.16, vertical: 1.34, damage: 7.5, force: 7, y: 0.42, lift: 2.8, lunge: 5.4 },
  viHoof: { duration: 0.54, from: 0.15, until: 0.32, range: 2.2, vertical: 1.45, damage: 10, force: 9, y: 0.61, lift: 3.2 },
  viRainbow: { duration: 0.83, from: 0.22, until: 0.58, range: 5.4, arcStart: 0.8, vertical: 1.72, damage: 15, force: 12, y: 0.58, lift: 4.2 },
  viClones: { duration: 0.82, from: 0.25, summonsClones: 6 },
};

export function rainbowHeight(attack, progress) {
  return attack.scale * (1.9 - 1.49 * progress + 2.08 * Math.sin(Math.PI * progress));
}
