export const dazzleSeconds = 3;

export const fighter = {
  id: 'super-libro-girl', name: 'SuperLibroGirl', role: 'Spellbook knight', color: '#f4a64c',
  description: 'An orange spellbook knight with a pink sword, a green shield, and a flash of blinding light.',
  special: 'Steel Sword', specialDescription: 'Tap B or L to slash with the steel sword. Hold it for a much stronger swing.',
  speed: 7.48, jump: 13.08, weight: 1.08, power: 1.09, size: 1.02,
  moves: { light: 'libroHeel', tap: 'libroSword', hold: 'libroMightySlash', super: 'libroDazzle' },
};

export const attacks = {
  libroHeel: { duration: .45, from: .112, until: .236, range: 1.98, vertical: 1.28, offset: .48, damage: 8, force: 7.3, y: .42, lift: 2.3, lunge: 3.9 },
  libroSword: { duration: .57, from: .174, until: .332, range: 2.61, vertical: 1.4, offset: .22, damage: 11, force: 8.7, y: .43, lift: 2.3, cue: 'swordSlash' },
  libroMightySlash: { duration: .81, from: .29, until: .465, range: 3.37, vertical: 1.66, offset: .23, damage: 20, force: 16.2, y: .51, lift: 3.7, lunge: 4.9, cue: 'swordSlash' },
  libroDazzle: { duration: .89, from: .29, dazzlesRivals: dazzleSeconds, cue: 'dazzleBurst' },
};
