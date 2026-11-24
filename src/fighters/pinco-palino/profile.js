import { kickCenter, kickDuration, layoutKickTrace } from './path.js';

export const fighter = {
  id: 'pinco-palino', name: 'Pinco Palino', role: 'Flying kicker', color: '#a9dc68',
  description: 'A bald green fighter with pointed ears and a flying kick that paints the air.',
  special: 'Flying Tongue', specialDescription: 'Tap B or L to lash out with his tongue. Hold it to dazzle rivals with a flash from his bald head.',
  speed: 7.89, jump: 13.32, weight: 1.01, power: 1.06, size: 1.02,
  moves: { light: 'pincoHeadbutt', tap: 'pincoTongue', hold: 'pincoFlash', super: 'pincoFlying67' },
};

export const attacks = {
  pincoHeadbutt: { duration: .45, from: .121, until: .255, range: 1.94, vertical: 1.28, offset: .47, damage: 8, force: 7.6, y: .37, lift: 2.1, lunge: 5.4 },
  pincoTongue: { duration: .58, from: .162, until: .316, range: 4.25, vertical: 1.06, offset: .61, damage: 10, force: 8, y: .33, lift: 2.08 },
  pincoFlash: { duration: .72, from: .235, until: .419, range: 3.62, vertical: 1.65, offset: .53, damage: 8, force: 4.4, stagger: 1.65, all: true, cue: 'laser' },
  pincoFlying67: {
    duration: kickDuration, from: 0, untouchable: true,
    trace67: {
      center: kickCenter, layout: layoutKickTrace, afterglow: .79, cue: 'pincoTrace', colors: ['#34c963', '#8af065', '#e7ffc8'],
      radius: 1.14, hit: { damage: 24, force: 16, y: .46, lift: 3.1 },
    },
  },
};
