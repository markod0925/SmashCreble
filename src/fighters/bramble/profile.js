export const fighter = {
  id: 'bramble', name: 'Bramble', role: 'Root guardian', color: '#badd77',
  description: 'A stubborn seed keeper who carries a patch of the old forest on its back.',
  special: 'Thorn Bloom', secondary: 'thorn', specialDescription: 'Sends out a burst of thorns on both sides.',
  speed: 7.1, jump: 12.9, weight: 1.14, power: 1.08, size: 1.08,
};

export const attacks = {
  thorn: { duration: 0.61, from: 0.23, until: 0.36, range: 2.7, vertical: 1.65, damage: 13, force: 11, x: 0.8, y: 0.65, lift: 4, all: true },
};
