export const fighter = {
  id: 'maestra', name: 'Maestra', role: 'Sonic teacher', color: '#78a7fd',
  description: 'A wide-eyed teacher with a wooden ruler, a piercing shout, and a mighty shove.',
  special: 'Ruler Strike', specialDescription: 'Tap B or L to swing a wooden ruler. Hold it to send a shout across the arena.',
  speed: 7.15, jump: 12.95, weight: 1.08, power: 1.07, size: 1.03,
  moves: { light: 'maestraHairPull', tap: 'maestraRuler', hold: 'maestraShout', super: 'maestraShove' },
};

export const attacks = {
  maestraHairPull: { duration: .42, from: .121, until: .226, range: 1.93, vertical: 1.29, offset: .52, damage: 6, force: 3.9, y: .12, lift: .83, pull: true },
  maestraRuler: { duration: .59, from: .177, until: .333, range: 2.56, vertical: 1.5, offset: .31, damage: 11, force: 8.6, y: .46, lift: 2.47, cue: 'swordSlash' },
  maestraShout: { duration: .87, from: .252, until: .673, range: 6.15, waveSpeed: 18.5, vertical: 1.05, offset: .61, damage: 16, force: 10.2, y: .26, lift: 1.6, cue: 'shout' },
  maestraShove: { duration: .91, from: .283, until: .476, range: 2.55, vertical: 1.36, offset: .14, damage: 21, force: 26.5, y: .17, lift: 2.45, lunge: 6.8, cue: 'shove' },
};
