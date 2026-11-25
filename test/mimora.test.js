import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rules } from '../src/combat/arena.js';
import { strike } from '../src/combat/hits.js';
import { knockOut } from '../src/combat/knockout.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { fighterIdentity, mirrorTime } from '../src/fighters/mimora/mirror.js';
import { mirrorSeconds } from '../src/fighters/mimora/profile.js';

function prepare(...rivals) {
  const match = createMatch(['mimora', ...rivals].map((id, slot) =>
    ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })));
  match.countdown = 0;
  match.superstar.cooldown = 60;
  match.fighters.forEach((player, i) => { player.x = i * 2.2; });
  match.fighters[0].facing = 1;
  return match;
}

function tick(match, frames, input = {}) {
  const controls = new Map([[0, { x: 0, y: 0, ...input }]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

function activate(match) {
  const [mimora] = match.fighters;
  match.superstar.holder = mimora;
  tick(match, 1, { superPressed: true });
  assert.equal(match.superstar.holder, null);
  const form = mimora.attack;
  while (form.age < form.from) tick(match, 1);
}

test('Kirbi headbutts and spits two bombs on hold', () => {
  const melee = prepare('rivet');
  melee.fighters[1].x = 1.95;
  tick(melee, 1, { lightPressed: true });
  tick(melee, 20);
  assert.equal(melee.fighters[1].damage, signatureAttacks.mimoraHeadbutt.damage);

  const ranged = prepare('rivet');
  ranged.fighters[1].x = 4.7;
  tick(ranged, 1, { specialPressed: true, special: true });
  tick(ranged, 88, { special: true });
  assert.equal(ranged.fighters[0].attack.type, 'mimoraBombs');
  tick(ranged, Math.ceil(signatureAttacks.mimoraBombs.from / rules.step));
  assert.equal(ranged.projectiles.length, 2);
  assert.ok(ranged.projectiles.every(bomb => bomb.kind === 'mimoraMouthBomb' && bomb.vx > 0));
});

test('Guard & Slash can block a frontal strike and swing its sword afterward', () => {
  const match = prepare('rivet');
  const [mimora, rival] = match.fighters;
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 10);
  assert.equal(mimora.attack.type, 'mimoraGuardSlash');
  assert.ok(strike(rival, mimora, { damage: 4, force: 2, x: -1, y: .4, lift: 1 }, match));
  assert.equal(mimora.damage, 0);
  assert.ok(mimora.shield < 1);
  assert.equal(mimora.attack.type, 'mimoraGuardSlash');
  tick(match, 24);
  assert.equal(rival.damage, signatureAttacks.mimoraGuardSlash.damage);
});

test('Mirror Form uses the nearest active rival’s three regular moves for ten seconds', () => {
  const match = prepare('rivet', 'dragon-boy');
  const [mimora, rivet, dragon] = match.fighters;
  const original = mimora.fighter;
  rivet.x = 6.9;
  dragon.x = -3.9;
  mimora.damage = 38;
  tick(match, 1, { superPressed: true });
  assert.equal(mimora.attack, null);
  activate(match);
  assert.equal(mimora.fighter.id, dragon.fighter.id);
  for (const key of ['light', 'tap', 'hold']) assert.equal(mimora.fighter.moves[key], dragon.fighter.moves[key]);
  assert.equal(fighterIdentity(mimora), original);
  const frames = Math.round(mirrorSeconds / rules.step);
  tick(match, frames - 1);
  assert.ok(mirrorTime(mimora, match) > 0);
  tick(match, 1);
  assert.equal(mimora.fighter, original);
  assert.equal(mimora.damage, 38);
  assert.equal(mimora.stocks, rules.stocks);
});

test('A copied classic fighter keeps Kirbi’s inputs and a knockout restores the original form', () => {
  const match = prepare('rivet');
  const [mimora] = match.fighters;
  const original = mimora.fighter;
  activate(match);
  assert.deepEqual(mimora.fighter.moves, { light: 'light', tap: 'bolt', hold: 'heavy', super: 'mimoraMirror' });
  tick(match, 20);
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 1);
  assert.equal(mimora.attack.type, 'bolt');
  tick(match, 61);
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  assert.equal(mimora.attack.type, 'heavy');
  knockOut(mimora, match);
  assert.equal(mimora.fighter, original);
  assert.equal(mimora.mirror, null);
});
