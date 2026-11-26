// The exporter and renderer share these settings. Moving platforms are always drawn live.
export const arenaDisplayLists = new Map([
  ['cloudbreak-foundry', { platforms: true, translucent: true }],
  ['iui', { platforms: false, translucent: false }],
]);
