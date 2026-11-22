export const fighter = {
  id: 'ii', name: 'ii!', role: 'Three-sword duelist', color: '#b0b8d0',
  description: 'A quick duelist in a black cap and coat with three sheathed swords.',
  special: 'Sword Thrust', specialDescription: 'Tap B or L for a one-sword thrust. Hold it to draw two blades and slash twice.',
  speed: 8.2, jump: 13.35, weight: .98, power: 1.06, size: 1.03,
  moves: { light: 'iiCombo', tap: 'iiThrust', hold: 'iiTwinSlash', super: 'iiTripleDive' },
};

export const attacks = {
  iiCombo: {
    duration: .61, from: .083, until: .155, range: 1.74, vertical: 1.29, damage: 3, force: 2.1, y: .15, lift: .6,
    followUp: {
      from: .235, until: .312, range: 1.97, damage: 3, force: 2.8, y: .23, lift: .7,
      followUp: { from: .397, until: .493, range: 2.62, damage: 5, force: 7.3, y: .51, lift: 2.6, lunge: 4.8 },
    },
  },
  iiThrust: { duration: .57, from: .17, until: .329, range: 2.66, vertical: 1.29, offset: .15, damage: 11, force: 9, y: .42, lift: 2.65, lunge: 6.1, cue: 'swordSlash' },
  iiTwinSlash: {
    duration: .77, from: .224, until: .341, range: 2.49, vertical: 1.48, offset: .13, damage: 6, force: 3.5, y: .23, lift: .75, cue: 'swordSlash',
    followUp: { from: .411, until: .526, range: 3.12, damage: 10, force: 11.1, y: .58, lift: 3.05, lunge: 4.2 },
  },
  iiTripleDive: {
    duration: .94, from: .39, until: .689, range: 2.78, vertical: 1.56, offset: -1.07, damage: 24, force: 15.3, y: .53, lift: 3.52,
    takeoff: 11.8, aerialTakeoff: true, diveSpeed: 15.2, lunge: 10.2, cue: 'bladeVolley',
  },
};
