export const acidRainSeconds = 5;
export const barrageTimes = Array.from({ length: 6 }, (_, i) => .153 + i * .163);

export const fighter = {
  id: 'che-addominali', name: 'Che Addominali!', role: 'Heavyweight boxer', color: '#f07556',
  description: 'A grinning boxer with red gloves, yellow trousers, and an acid rainstorm up his sleeve.',
  special: 'Triple Punch', specialDescription: 'Tap B or L for three punches at once. Hold it to unleash six punches in succession.',
  speed: 7.2, jump: 12.85, weight: 1.13, power: 1.065, size: 1.04,
  moves: { light: 'absJabs', tap: 'absTriple', hold: 'absBarrage', super: 'absAcidRain' },
};

const barrage = barrageTimes.reduceRight((followUp, from, index) => ({
  from, until: from + .092, range: index < 5 ? 2.18 : 2.46,
  damage: index < 5 ? 3 : 7, force: index < 5 ? 2.7 : 10.8,
  stagger: index < 5 ? .15 : 0, y: .43, lift: 2.85, followUp,
}), null);

export const attacks = {
  absJabs: {
    duration: .402, from: .085, until: .149, range: 1.78, vertical: 1.29, damage: 3.5, force: 2.9, y: .18, lift: .62,
    followUp: { from: .225, until: .314, range: 2.06, damage: 5, force: 6.2, y: .38, lift: 2.1 },
  },
  absTriple: { duration: .59, from: .19, until: .296, range: 2.61, vertical: 1.49, offset: .17, damage: 13.5, force: 10.1, y: .37, lift: 2.35 },
  absBarrage: { duration: 1.23, vertical: 1.34, offset: .11, ...barrage },
  absAcidRain: { duration: .84, from: .32, range: 5.55, startsAcidRain: true },
};
