export const fighter = {
  id: 'gangar', name: 'Gangar', role: 'Fanged brute', color: '#c6a0fa',
  description: 'A purple creature with tall ears, glowing red eyes, and an oversized pair of jaws.',
  special: 'Lunge Bite', specialDescription: 'Tap B or L to lunge and bite. Hold it to fire twin eye beams.',
  speed: 6.6, jump: 12.1, weight: 1.25, power: 1.2, size: 1.13,
  moves: { light: 'gangarCombo', tap: 'gangarBite', hold: 'gangarLasers', super: 'gangarGulp' },
};

export const attacks = {
  gangarCombo: {
    duration: 0.49, from: 0.085, until: 0.155, range: 1.82, vertical: 1.22, damage: 4.5, force: 3.2, y: 0.24, lift: 1,
    followUp: { from: 0.25, until: 0.37, range: 2.18, damage: 6.5, force: 7.6, y: 0.53, lift: 3.2 },
  },
  gangarLasers: { duration: 0.57, from: 0.18, until: 0.33, range: 5.1, vertical: 0.94, offset: 0.72, damage: 9, force: 7.4, y: 0.38, lift: 2.8, cue: 'laser' },
  gangarBite: { duration: 0.64, from: 0.21, until: 0.36, range: 2.21, vertical: 1.35, offset: 0.26, damage: 15, force: 12, y: 0.53, lift: 3.2, lunge: 7.4 },
  gangarGulp: { duration: 1.07, from: 0.18, swallowAt: 0.42, biteAt: 0.67, range: 2.68, vertical: 1.4, damage: 25, force: 17, y: 0.61, lift: 4.5, lunge: 8.2, mouth: { reach: 0.85, height: 2.16 } },
};
