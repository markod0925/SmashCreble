import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signatureAttacks } from '../src/fighters/index.js';
import { fighterRoot } from '../src/render/attack-animation.js';
import { transform, zero } from '../src/render/math.js';

test('attacks wind up and release in either direction around planted feet', () => {
  const move = signatureAttacks.dragonBallBite;
  const position = [2, 3, .4];
  const rotation = zero;
  const idle = transform(position, [1, 1, 1], rotation);
  const pose = (age, facing) => fighterRoot(position, 1, rotation, { ...move, age, facing, type: 'dragonBallBite' });

  assert.deepEqual(pose(0, 1), idle);
  assert.deepEqual(pose(move.duration, 1), idle);
  const anticipation = pose(move.from * .8, 1);
  const release = pose(move.from, 1);
  const mirrored = pose(move.from, -1);
  assert.ok(anticipation[5] < idle[5] && idle[5] < release[5]);
  assert.ok(anticipation[4] < 0 && release[4] > 0);
  assert.equal(release[4], -mirrored[4]);
  assert.deepEqual(release.slice(12, 15), position);
});

test('a combo pose stays continuous when combat advances to the next hit', () => {
  const move = signatureAttacks.iiCombo;
  const second = move.followUp;
  const firstHit = { ...move, age: second.from, facing: 1, type: 'iiCombo' };
  const secondHit = { ...firstHit, ...second };

  const before = fighterRoot(zero, 1, zero, firstHit);
  const after = fighterRoot(zero, 1, zero, secondHit);
  assert.deepEqual(after, before);
  assert.ok(after[4] > 0);
  assert.ok(fighterRoot(zero, 1, zero, { ...secondHit, ...second.followUp, age: second.followUp.from })[4] > 0);
});
