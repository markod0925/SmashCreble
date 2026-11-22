export const bandageBindSeconds = 5;

export const fighter = {
  id: 'huuuuu', name: 'Huuuuu!!', role: 'Mummy', color: '#b8eaf9',
  description: 'A white and sky-blue mummy with a crooked smile and bandages that unwind on command.',
  special: 'Choking Puff', specialDescription: 'Tap B or L to release a foul cloud. Hold it to bind a rival for five seconds.',
  speed: 7.1, jump: 12.9, weight: 1.14, power: 1.08, size: 1.08,
  moves: { light: 'mummySlap', tap: 'mummyPuff', hold: 'mummyBind', super: 'mummySarcophagus' },
};

export const attacks = {
  mummySlap: { duration: 0.36, from: 0.09, until: 0.21, range: 1.81, vertical: 1.28, damage: 7, force: 6, y: 0.46, lift: 2.8 },
  mummyPuff: { duration: 0.61, from: 0.17, until: 0.41, range: 2.58, vertical: 1.25, damage: 9, force: 7.9, x: 0.82, y: 0.53, lift: 3, all: true },
  mummyBind: { duration: 0.74, from: 0.18, projectile: 'bandage', range: 5.4 },
  mummySarcophagus: { duration: 1.13, from: 0.23, swallowAt: 0.56, biteAt: 0.86, range: 3.25, vertical: 1.69, damage: 24, force: 14, y: 0.84, lift: 4.1, sarcophagus: true },
};

function launchBandage(player, attack, match) {
  const { facing } = attack;
  match.projectiles.push({
    kind: attack.projectile, owner: player, x: player.x + facing * .6, y: player.y + 1.25,
    vx: facing * 17.2, vy: 0, remaining: (attack.range - .6) / 17.2,
    hit: { damage: 6, force: 4, x: facing, y: 0, lift: 0, bindDuration: bandageBindSeconds },
  });
}

export const projectiles = { bandage: launchBandage };
