import { traceAfterglow, traceCenter, traceDuration } from './path.js';

export const fighter = {
  id: 'packman', name: 'Packman', role: 'Armored chomper', color: '#f2bb56',
  description: 'A hovering amber crusher with a faceted shell and a broad jaw full of blue fangs.',
  special: 'Gas Cloud', specialDescription: 'Tap B or L for a gas cloud. Hold it to fire blue lasers from both eyes.',
  speed: 7.5, jump: 13, weight: 1.07, power: 1.07, size: 1.06,
  bodyHalfWidth: .9,
  moves: { light: 'packmanBite', tap: 'packmanGas', hold: 'packmanLaser', super: 'packmanTrace' },
};

export const attacks = {
  packmanBite: { duration: .39, from: .105, until: .23, range: 1.97, vertical: 1.34, damage: 8, force: 7.8, y: .46, lift: 2.5, lunge: 5.7 },
  packmanGas: { duration: .58, from: .15, until: .36, range: 2.48, vertical: 1.22, damage: 10, force: 8.1, x: .84, y: .46, lift: 2.6, all: true },
  packmanLaser: { duration: .65, from: .22, until: .41, range: 6.05, vertical: .99, offset: .67, damage: 15, force: 11, y: .49, lift: 2.9, cue: 'laser' },
  packmanTrace: {
    duration: traceDuration, untouchable: true,
    trace67: {
      center: traceCenter, afterglow: traceAfterglow, cue: 'packmanTrace', colors: ['#369aff', '#91dcff', '#e6fcff'],
      radius: 1.19, hit: { damage: 23, force: 15, y: .47, lift: 3.1 },
    },
  },
};
