export const fighter = {
  id: 'vesper', name: 'Vesper', role: 'Rift courier', color: '#c3a9ff',
  description: 'A masked courier who takes the shortest route through unstable airspace.',
  special: 'Phase Dash', secondary: 'dash', specialDescription: 'Dashes through the air and strikes on contact.',
  speed: 9.8, jump: 14.2, weight: 0.84, power: 0.9, size: 0.96,
};

export const attacks = {
  dash: { duration: 0.43, from: 0.035, until: 0.28, range: 1.6, vertical: 1.1, damage: 10, force: 10, y: 0.45, lift: 4, all: true },
};
