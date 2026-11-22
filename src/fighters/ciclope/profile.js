import { approach } from '../../math.js';

export const fighter = {
  id: 'ciclope', name: 'Ciclope', role: 'One-eyed giant', color: '#e4ab64',
  description: 'A grinning giant in a rough brown tunic, with a red eye, a wooden club, and a coiled lasso.',
  special: 'Club Smash', specialDescription: 'Tap B or L for an overhead club strike. Hold it to release a gas cloud.',
  speed: 6.8, jump: 12.3, weight: 1.23, power: 1.13, size: 1.09,
  moves: { light: 'ciclopeLasso', tap: 'ciclopeClub', hold: 'ciclopeGas', super: 'ciclopeLaser' },
};

export const attacks = {
  ciclopeLasso: { duration: .84, from: .14, range: 5.75, projectile: 'ciclopeRope' },
  ciclopeClub: { duration: .58, from: .18, until: .33, range: 2.35, vertical: 1.39, offset: .31, damage: 10, force: 9, y: .42, lift: 2.5 },
  ciclopeGas: { duration: .72, from: .21, until: .5, range: 2.95, vertical: 1.44, damage: 14, force: 11.6, x: .86, y: .55, lift: 3.2, all: true },
  ciclopeLaser: { duration: 1.06, from: .29, until: .72, range: 9.6, vertical: 1.22, offset: 1.12, damage: 25, force: 16.9, y: .55, lift: 3.9, cue: 'laser' },
};

export function lassoGrip(owner, facing) {
  const size = owner.fighter.size;
  return [owner.x + facing * .55 * size, owner.y + 1.37 * size];
}

function advanceLasso(rope, dt) {
  const { owner, facing, range, recalling } = rope;
  rope.reach = approach(rope.reach, recalling ? 0 : range, dt * (recalling ? 23 : 21));
  const [x, y] = lassoGrip(owner, facing);
  rope.x = x + facing * rope.reach;
  rope.y = y + .28 * Math.sin(Math.PI * rope.reach / range);
  if (recalling && !rope.reach) rope.remaining = 0;
  if (rope.reach === range) rope.recalling = true;
}

function launchLasso(owner, attack, match) {
  if (match.projectiles.some(({ kind, owner: thrower }) => kind === attack.projectile && thrower === owner)) return;
  const { facing, range, victims } = attack;
  const [x, y] = lassoGrip(owner, facing);
  match.projectiles.push({
    kind: attack.projectile, owner, facing, range, victims, x, y,
    reach: .19, scale: 1.25, remaining: .68, advance: advanceLasso, recallOnHit: true,
    hit: { damage: 6, force: 5.1, x: -facing, y: .15, lift: .76 },
  });
}

export const projectiles = { ciclopeRope: launchLasso };
