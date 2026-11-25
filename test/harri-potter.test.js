import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { summonClones } from '../src/combat/clones.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { drawProjectiles } from '../src/render/characters.js';

function prepare(...positions) {
  const match = createMatch(['harri-potter', 'rivet', 'vi', 'kiln'].slice(0, positions.length + 1)
    .map((id, slot) => ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  match.fighters.forEach((player, i) => { player.x = i ? positions[i - 1] : 0; });
  match.fighters[0].facing = 1;
  return match;
}

function tick(match, frames, input = {}) {
  const controls = new Map([[0, { x: 0, y: 0, ...input }]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

test('HarriPotter jabs and kicks up close and taps to fire a ranged spell', () => {
  const melee = prepare(1.55);
  const [, rival] = melee.fighters;
  const combo = signatureAttacks.harriCombo;
  tick(melee, 1, { lightPressed: true });
  tick(melee, Math.ceil(combo.from / rules.step));
  assert.equal(rival.damage, combo.damage);
  tick(melee, Math.ceil((combo.followUp.from - combo.from) / rules.step));
  assert.equal(rival.damage, combo.damage + combo.followUp.damage);

  const ranged = prepare(4.5);
  tick(ranged, 1, { specialPressed: true, special: true });
  tick(ranged, 1);
  tick(ranged, Math.ceil(signatureAttacks.harriBolt.from / rules.step));
  const [bolt] = ranged.projectiles;
  assert.equal(bolt.kind, 'harriSpark');
  tick(ranged, 32);
  assert.equal(ranged.fighters[1].damage, bolt.hit.damage);
});

test('Magic Bombs throws three translucent projectiles that explode without stacking damage', () => {
  const match = prepare(5.4);
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  const [harri, rival] = match.fighters;
  assert.equal(harri.attack.type, 'harriBombs');
  tick(match, Math.ceil(signatureAttacks.harriBombs.from / rules.step));
  assert.equal(match.projectiles.length, 3);
  assert.ok(match.projectiles.every(bomb => bomb.kind === 'harriMagicBomb' && bomb.owner === harri));
  const shells = [];
  drawProjectiles({ object(shape, position, size, color, rotation, glow, alpha) {
    if (shape === 'bombShell') shells.push(alpha);
  } }, match.projectiles, .7);
  assert.equal(shells.length, 3);
  assert.ok(shells.every(alpha => alpha > 0 && alpha < 1));
  const [{ hit: { damage } }] = match.projectiles;
  tick(match, Math.ceil(1 / rules.step));
  assert.equal(rival.damage, damage);
  assert.equal(match.events.filter(({ type }) => type === 'explosion').length, 3);
});

test('Wand Lightning spends the Superstar and reaches each rival across the arena in a single strike', () => {
  const match = prepare(-10.75, 8.8, 11.1);
  const [harri, rear, cloneOwner, airborne] = match.fighters;
  const lightning = signatureAttacks.harriLightning;
  summonClones(cloneOwner, match, 1);
  const [clone] = match.clones;
  Object.assign(airborne, { y: 10, grounded: null, vy: 1 });
  tick(match, 1, { superPressed: true });
  assert.equal(harri.attack, null);
  match.superstar.holder = harri;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  const windup = Math.ceil(lightning.from / rules.step);
  tick(match, windup - 2);
  assert.ok(match.fighters.every(player => player.damage === 0));
  tick(match, 2);

  assert.equal(harri.attack.lightningEnds.length, 4);
  assert.ok(harri.attack.lightningEnds.some(end => end[0] < -10));
  assert.ok(harri.attack.lightningEnds.some(end => end[1] > 8));
  assert.equal(clone.stocks, 0);
  assert.ok(rear.vx < 0 && airborne.vx > 0);
  tick(match, 30);
  assert.ok([rear, cloneOwner, airborne].every(player => player.damage === lightning.damage));
  assert.equal(harri.damage, 0);
});

test('A light hit damages HarriPotter without interrupting Wand Lightning', () => {
  const match = prepare(1.55);
  const [harri, rival] = match.fighters;
  const lightning = signatureAttacks.harriLightning;
  const rivalLight = new Map([[rival.slot, { x: 0, y: 0, lightPressed: true }]]);
  match.superstar.holder = harri;
  tick(match, 1, { superPressed: true });
  tickMatch(match, rivalLight);

  const windup = Math.ceil(lightning.from / rules.step);
  tick(match, windup - 3);
  assert.ok(harri.damage > 0);
  assert.equal(harri.hitstun, 0);
  assert.equal(harri.attack?.type, 'harriLightning');
  assert.equal(harri.attack.fired, false);

  tick(match, 2);
  assert.equal(rival.damage, lightning.damage);
  tick(match, Math.ceil((lightning.duration - lightning.from) / rules.step));
  assert.equal(harri.attack, null);
});
