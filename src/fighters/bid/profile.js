export const fighter = {
  id: 'bid', name: 'Bid', role: 'Goblin summoner', color: '#a3e276',
  description: 'A spiky green goblin with oversized claws and a pack of tiny allies.',
  special: 'Flying Kicks', specialDescription: 'Tap B or L to leap into a pair of kicks. Hold it to call up to two goblins.',
  speed: 7.7, jump: 13.1, weight: 1.03, power: 1.04, size: 1.06,
  moves: { light: 'bidClaws', tap: 'bidKicks', hold: 'bidPair', super: 'bidHorde' },
};

export const attacks = {
  bidClaws: { duration: .43, from: .1, until: .23, range: 1.94, vertical: 1.37, damage: 8, force: 7, y: .44, lift: 2.5 },
  bidKicks: {
    duration: .62, from: .13, until: .23, range: 1.88, vertical: 1.5, offset: -.25,
    damage: 4, force: 2.5, y: .18, lift: .6, takeoff: 6.7, lunge: 8.4,
    followUp: { from: .31, until: .45, range: 2.24, damage: 7, force: 8.2, y: .47, lift: 2.8, lunge: 8.8 },
  },
  bidPair: { duration: .66, from: .22, summonsClones: 2 },
  bidHorde: { duration: .84, from: .28, summonsClones: 5 },
};
