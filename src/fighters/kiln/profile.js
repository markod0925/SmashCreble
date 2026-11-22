export const fighter = {
  id: 'kiln', name: 'Kiln', role: 'Furnace brawler', color: '#ffab67',
  description: 'An old ceramic loading rig with a furnace heart and heavyweight fists.',
  special: 'Furnace Lift', secondary: 'furnace', specialDescription: 'Rises in a blast that launches nearby rivals.',
  speed: 6.6, jump: 12.1, weight: 1.25, power: 1.2, size: 1.13,
};

export const attacks = {
  furnace: { duration: 0.65, from: 0.12, until: 0.32, range: 2.25, vertical: 1.9, damage: 15, force: 12, x: 0.6, y: 0.95, lift: 5, all: true },
};
