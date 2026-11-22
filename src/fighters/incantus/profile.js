export const fighter = {
  id: 'incantus', name: 'Incantus', role: 'Hypnotist', color: '#b5e581',
  description: 'A green hypnotist with stitched skin, violet eyes, and a pair of sparking antennae.',
  special: 'Ear Stench', specialDescription: 'Tap B or L to vent stench from his ears. Hold it to make rivals stagger.',
  speed: 7.1, jump: 12.9, weight: 1.14, power: 1.08, size: 1.08,
  moves: { light: 'incantusBump', tap: 'incantusStench', hold: 'incantusStagger', super: 'incantusChomp' },
};

export const attacks = {
  incantusBump: { duration: 0.4, from: 0.11, until: 0.23, range: 1.85, vertical: 1.2, damage: 8, force: 7, y: 0.45, lift: 2.8, lunge: 6 },
  incantusStench: { duration: 0.64, from: 0.17, until: 0.44, range: 2.7, vertical: 1.45, offset: 0.45, damage: 9, force: 8, x: 0.8, y: 0.54, lift: 3.1, all: true },
  incantusStagger: { duration: 0.7, from: 0.21, until: 0.38, range: 3.25, vertical: 1.7, damage: 7, force: 4, x: 0.8, all: true, stagger: 1.8 },
  incantusChomp: { duration: 1.23, from: 0.24, swallowAt: 0.78, biteAt: 0.9, range: 4.6, vertical: 1.85, damage: 24, force: 17, y: 0.54, lift: 4.8 },
};
