export const arena = {
  name: 'Cloudbreak Foundry',
  platforms: [
    { left: -11.5, right: 11.5, y: 0, main: true },
    { left: -10.1, right: -4.1, y: 3.25 },
    { left: 3.6, right: 10.2, y: 2.5 },
    { left: -2.7, right: 2.7, y: 5.5 },
  ],
  bounds: { side: 19, top: 15, bottom: -9 },
};

export const rules = { stocks: 3, duration: 180, gravity: 31, step: 1 / 120 };

export function leavePlatform(player) {
  if (player.grounded && (player.x < player.grounded.left || player.x > player.grounded.right)) {
    player.grounded = null;
    player.jumps = Math.min(player.jumps, 1);
  }
}
