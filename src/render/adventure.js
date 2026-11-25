import { zero } from './math.js';

export function adventureCamera(match) {
  const { camera } = match.arena.definition;
  const party = match.adventure.party.filter(({ stocks, respawn }) => stocks && !respawn);
  const visibleParty = party.length ? party : match.adventure.party;
  const positions = visibleParty.map(({ x }) => x);
  const lead = Math.max(...positions);
  const spread = Math.min(20, lead - Math.min(...positions));
  const highest = Math.max(...visibleParty.map(({ y }) => y));
  const verticalFollow = match.adventure.campaign
    ? highest < 0 ? Math.max(-2.3, highest) : Math.max(0, highest - 1.8) : 0;
  return {
    ...camera, x: lead + 4.5 - spread * .42, distance: camera.distance + spread * .55,
    height: camera.height + verticalFollow, targetY: camera.targetY + verticalFollow,
  };
}

const campaignColors = {
  cloudbreak: ['#3a455a', '#708091', '#879aab'],
  stormcoil: ['#405272', '#839bba', '#b3c9e1'],
  glass: ['#325e57', '#6ea693', '#b5e1c9'],
  gdmr: ['#625052', '#aa887e', '#dfb296'],
  regulator: ['#41475c', '#7c829e', '#bac2dd'],
};

export function drawAdventureTerrain(renderer, arena, { x, radius, gate, gateY = 0 }, time) {
  const [rockColor, floorColor, ledgeColor] = campaignColors[arena.campaign?.level.act] ?? ['#35525b', '#72977b', '#9fb696'];
  const leftEdge = x - radius;
  const rightEdge = x + radius;
  const visible = (left, right) => right >= leftEdge && left <= rightEdge;
  for (let i = Math.floor(leftEdge / 8); i <= Math.ceil(rightEdge / 8); i++) {
    const x = i * 8 + Math.sin(i * 5) * 2;
    const height = 7 + Math.cos(i * 137) * 4;
    renderer.object('rock', [x, -6, -12 - Math.cos(i * 3) * 6], [8, height, 5], rockColor, [0, i, 0], .57);
    renderer.object('bevel', [x + 3, -4 + Math.sin(i * 13) * 2, -9 - Math.sin(i * 3) * 3], [9, .42, 3], '#b4d4c7', zero, .8, .18);
  }
  for (const { left, right, y, main, width, angle, inactive, moving, visual } of arena.platforms) {
    if (inactive || visual === false || !visible(left, right)) continue;
    const center = (left + right) / 2;
    const depth = main ? 4.8 : 2.8;
    const deckZ = arena.campaign && !main ? -1.1 : 0;
    const rotation = [0, 0, angle];
    const below = (depth, z) => [center + Math.sin(angle) * depth, y - Math.cos(angle) * depth, deckZ + z];
    renderer.object('box', below(.16, 0), [width, .32, depth], main ? floorColor : ledgeColor, rotation);
    renderer.object('bevel', below(.48, 0), [width, .49, depth], '#354e51', rotation);
    renderer.object('box', below(.09, depth / 2), [width, .13, .09], '#bee4a0', rotation, .32);
    if (!main || moving) continue;
    const aboveWalkway = arena.campaign && arena.platforms.some((other) => !other.inactive &&
      other.main && other.y <= y - 1.25 && other.right > left && other.left < right);
    for (let section = 0; section < Math.ceil(width / 3.5); section++) {
      const column = left + (section + .5) * width / Math.ceil(width / 3.5);
      if (!visible(column - 2, column + 2)) continue;
      const height = 4.3 + Math.cos(column * 2.4) * 1.6;
      renderer.object('rock', [column, y - height / 2 - .42, aboveWalkway ? -3.8 : -.15],
        [4.35, height, aboveWalkway ? 1.8 : 4.45], '#30444b', [.04, column, .05]);
      renderer.object('box', [column, y - .39, depth / 2 - .13], [.44, .13, .14], '#7ad5b7', zero, .66);
    }
  }
  for (const { left, right, y, height } of arena.definition.spikes) {
    if (!visible(left, right)) continue;
    const count = Math.ceil((right - left) / .55);
    const width = (right - left) / count;
    renderer.object('box', [(left + right) / 2, y + .045, 0], [right - left, .09, 1.85], '#7f4135');
    for (let i = 0; i < count; i++) {
      renderer.object('horn', [left + (i + .5) * width, y + height / 2, 0], [width * .95, height, .94], '#ff9d71', zero, .31);
    }
  }
  if (!visible(gate, gate)) return;
  const glow = .7 + Math.sin(time * 5) * .15;
  for (const z of [-1.6, 1.6]) {
    renderer.object('bevel', [gate, gateY + .59, z], [.63, 1.18, .6], '#455653');
    renderer.object('gem', [gate, gateY + 1.31, z], [.46, .59, .46], '#ffac72', zero, glow);
  }
  renderer.object('box', [gate, gateY + 2.6, 0], [.13, 5.2, 3.2], '#ffac72', zero, glow, .32);
  renderer.object('box', [gate, gateY + 2.6, .02], [.14, 5.2, .09], '#ffdb9d', zero, glow, .75);
}
