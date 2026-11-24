export function createAdventureTrail(encounterCount) {
  const platforms = [
    { id: 'arrival', left: -10, right: 13, y: 0, main: true },
    { id: 'arrival-ledge', left: 5.5, right: 11, y: 2.15 },
  ];
  const spikes = [{ left: 6.5, right: 9.5, y: 0, height: .8 }];
  const encounters = [];
  let edge = 13;
  for (let index = 0; index < encounterCount; index++) {
    const variant = index % 4;
    const left = edge + (variant === 2 ? 6.5 : 5);
    const platform = `trail-${index}`;
    const ledge = { id: `${platform}-ledge`, left: left + 5 + variant, right: left + 11 + variant, y: 2.15 + variant * .15 };
    const raisedEnd = variant === 1 || variant === 3;
    const floorRight = left + (raisedEnd || variant === 0 ? 23 : 26);
    if (variant === 2) platforms.push({ id: `${platform}-crossing`, left: edge + 2.1, right: edge + 4.35, y: .7 });
    platforms.push({ id: platform, left, right: floorRight, y: 0, main: true }, ledge);
    if (variant === 0 || variant === 2) spikes.push({ left: left + 4, right: left + 6.5, y: 0, height: .8 });
    if (variant === 1 || variant === 3) spikes.push({ left: left + 18.5, right: left + 21, y: 0, height: .8 });
    edge = floorRight;
    if (raisedEnd && index < encounterCount - 1) {
      edge += 5;
      platforms.push({ id: `${platform}-rampart`, left: floorRight, right: edge, y: 2.1, main: true, wallBase: 0 });
    }
    const nextGap = variant === 1 ? 6.5 : 5;
    const gate = edge + (index === encounterCount - 1 ? 2.7 : nextGap - .6);
    encounters.push({ platform, trigger: left + 1, spawnX: left + 12, gate, star: { x: (ledge.left + ledge.right) / 2, y: ledge.y + 1.3 } });
  }
  return {
    id: 'rift-trail', name: 'Rift Trail', theme: 'adventure', platforms, spikes, encounters,
    bounds: { side: edge + 8, top: 23, bottom: -9 },
    spawns: [-6, -4, -2, 0].map((x) => ({ platform: 'arrival', x, facing: 1 })),
    respawnHeight: 3.2,
    superstar: encounters[0].star,
    camera: { height: 7.2, distance: 26, targetY: 1.8, fov: .62 },
  };
}
