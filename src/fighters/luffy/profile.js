export const rubberDanceSeconds = 3;
export const rubberDanceBeat = .49;
export const rubberDanceImpact = .22;
const transformationTime = .225;

export const fighter = {
  id: 'luffy', name: 'Luffy', role: 'Rubber brawler', color: '#ed6055',
  description: 'A straw-hatted fighter who stretches his limbs to land hits across the arena.',
  special: 'Headbutt', specialDescription: 'Tap B or L for a headbutt. Hold it for a long-range Gum-Gum Punch.',
  speed: 8.05, jump: 13.5, weight: 1.01, power: 1.04, size: 1.02,
  moves: { light: 'luffyCombo', tap: 'luffyHeadbutt', hold: 'luffyGumGum', super: 'luffyRubberDance' },
};

export const attacks = {
  luffyCombo: {
    duration: .54, from: .09, until: .17, range: 1.88, vertical: 1.24, offset: .07, damage: 4.5, force: 3.1, y: .24, lift: 1.1,
    followUp: { from: .265, until: .385, range: 2.16, offset: .25, damage: 6, force: 7.4, y: .51, lift: 2.7 },
  },
  luffyHeadbutt: { duration: .48, from: .138, until: .253, range: 2.08, vertical: 1.31, offset: .48, damage: 10, force: 8.1, y: .42, lift: 2.55, lunge: 5.2 },
  luffyGumGum: { duration: .77, from: .245, until: .426, range: 6.6, vertical: .96, offset: .31, damage: 16, force: 11.4, y: .46, lift: 2.8 },
  luffyRubberDance: { duration: transformationTime + rubberDanceSeconds, from: transformationTime, rubberDance: true },
};
