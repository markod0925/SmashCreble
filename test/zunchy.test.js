import assert from 'node:assert/strict';
import { test } from 'node:test';
import { arenas } from '../src/arenas/index.js';
import { rules } from '../src/combat/arena.js';
import { summonClones } from '../src/combat/clones.js';
import { cpuInput } from '../src/combat/cpu.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { bodyCenter, bodySize } from '../src/combat/state.js';
import { captureProgress, capturingAttack } from '../src/combat/status.js';
import { fighters, signatureAttacks } from '../src/fighters/index.js';
import { actions, featureNames, zunchyAttackPolicy } from '../src/fighters/zunchy/cpu-policy.js';
import { shrinkSeconds, shrinkTime } from '../src/fighters/zunchy/profile.js';

function prepare(facing = 1, arena = arenas[0]) {
  const match = createMatch(['zunchy', 'rivet', 'vi'].map((id, slot) =>
    ({ slot, fighter: fighters.find(fighter => fighter.id === id), cpu: false })), arena);
  match.countdown = 0;
  match.superstar.cooldown = 60;
  const [caster, target, distant] = match.fighters;
  Object.assign(caster, { x: 0, facing });
  target.x = 1.7 * facing;
  distant.x = -9 * facing;
  return match;
}

function tick(match, frames, input = {}) {
  const controls = new Map([[0, { x: 0, y: 0, ...input }]]);
  for (let i = 0; i < frames; i++) tickMatch(match, controls);
}

function activate(match) {
  const [caster] = match.fighters;
  match.superstar.holder = caster;
  tick(match, 1, { superPressed: true });
  assert.equal(caster.attack.type, 'zunchyShrink');
  assert.equal(match.superstar.holder, null);
  tick(match, Math.ceil(signatureAttacks.zunchyShrink.from / rules.step) - 1);
}

test('Shrink & Gulp halves opponents and new enemy clones for five seconds', () => {
  const match = prepare();
  const [caster, target, vi] = match.fighters;
  const casterSize = bodySize(caster, match);
  const targetSize = bodySize(target, match);
  const targetCenter = bodyCenter(target, match);
  tick(match, 1, { superPressed: true });
  assert.equal(caster.attack, null);
  activate(match);
  assert.equal(bodySize(caster, match), casterSize);
  assert.equal(bodySize(target, match), targetSize / 2);
  assert.equal(bodyCenter(target, match), targetCenter / 2);
  assert.equal(bodySize(vi, match), vi.fighter.size / 2);
  summonClones(vi, match, 1);
  const [clone] = match.clones;
  assert.equal(bodySize(clone, match), vi.fighter.size / 4);
  const frames = Math.round(shrinkSeconds / rules.step);
  tick(match, frames - 1);
  assert.ok(shrinkTime(caster, match) > 0);
  assert.equal(bodySize(target, match), targetSize / 2);
  tick(match, 1);
  assert.equal(shrinkTime(caster, match), 0);
  assert.equal(bodySize(target, match), targetSize);
  assert.equal(bodySize(clone, match), vi.fighter.size / 2);
});

function swallowAndRelease(match) {
  const [caster, target] = match.fighters;
  const superMove = signatureAttacks.zunchyShrink;
  const gulp = signatureAttacks.zunchyGulp;
  tick(match, Math.ceil((superMove.duration - caster.attack.age) / rules.step) + 1);
  tick(match, 1, { lightPressed: true });
  for (let i = 0; i < Math.ceil(.3 / rules.step) && !capturingAttack(target, match); i++) tick(match, 1);
  assert.equal(caster.attack.type, 'zunchyGulp');
  assert.equal(capturingAttack(target, match), caster.attack);
  tick(match, Math.ceil(gulp.swallowAt / rules.step));
  assert.equal(captureProgress(caster.attack), 1);
  const releaseFrames = Math.ceil((gulp.biteAt - caster.attack.age) / rules.step) + 1;
  for (let i = 0; i < releaseFrames && capturingAttack(target, match); i++) tick(match, 1);
  assert.equal(capturingAttack(target, match), undefined);
  return target;
}

test('Spit always launches forward with capped knockback, even at very high damage', () => {
  const gulp = signatureAttacks.zunchyGulp;
  for (const facing of [-1, 1]) {
    const match = prepare(facing);
    const [, rival] = match.fighters;
    rival.damage = 460;
    activate(match);
    const target = swallowAndRelease(match);
    assert.equal(target.damage, 460 + gulp.damage);
    assert.equal(target.vx, facing * gulp.maxLaunch);
    tick(match, 125);
    assert.equal(target.grounded?.main, true);
    assert.equal(target.stocks, rules.stocks);
  }
});

test('A forward spit at the ledge can send a rival over it and leave them a chance to recover', () => {
  const match = prepare(1, arenas[1]);
  const [caster, target] = match.fighters;
  const deck = match.arena.platforms.find(platform => platform.main);
  caster.x = deck.right - 1.42;
  target.x = deck.right - .14;
  activate(match);
  swallowAndRelease(match);
  assert.ok(target.vx > 0);
  tick(match, 32);
  assert.ok(target.x > deck.right);
  assert.equal(target.stocks, rules.stocks);
  assert.equal(target.respawn, 0);
  tick(match, 240);
  assert.equal(target.stocks, rules.stocks - 1);
});

test('A bomb hit can trigger the gulp while the shrinking spell is active', () => {
  const match = prepare();
  const [caster, target] = match.fighters;
  const hits = [];
  match.onBlastHit = (projectile, victim) => hits.push({ projectile, victim });
  target.x = 6.3;
  activate(match);
  tick(match, 70);
  tick(match, 1, { specialPressed: true, special: true });
  tick(match, 88, { special: true });
  assert.equal(caster.attack.type, 'zunchyBombs');
  tick(match, Math.ceil(signatureAttacks.zunchyBombs.from / rules.step));
  assert.equal(match.projectiles.filter(projectile => projectile.kind === 'zunchyBomb').length, 2);
  for (let i = 0; i < 126 && !capturingAttack(target, match); i++) tick(match, 1);
  assert.equal(caster.attack?.type, 'zunchyGulp');
  assert.equal(capturingAttack(target, match), caster.attack);
  assert.ok(hits.some(({ projectile, victim }) => projectile.kind === 'zunchyBomb' && projectile.owner === caster && victim === target));
});

test('A CPU attack model can choose the Superstar only when it is held', () => {
  const model = {
    hidden: [],
    output: actions.map(action => [
      ...new Array(featureNames.length).fill(0), action === 'super' ? 2 : Number(action === 'hold'),
    ]),
  };
  const choose = zunchyAttackPolicy(model);
  const readCpu = (player, match, dt) => cpuInput(player, match, dt, choose);

  const withoutStar = prepare();
  const [charger] = withoutStar.fighters;
  charger.cpu = true;
  tickMatch(withoutStar, new Map(), rules.step, readCpu);
  assert.equal(charger.charging, true);

  const withStar = prepare();
  const [holder] = withStar.fighters;
  holder.cpu = true;
  withStar.superstar.holder = holder;
  tickMatch(withStar, new Map(), rules.step, readCpu);
  assert.equal(holder.attack?.type, 'zunchyShrink');
  assert.equal(withStar.superstar.holder, null);
});

test('The CPU recovers offstage before consulting an attack model', () => {
  const match = prepare();
  const [caster, rival] = match.fighters;
  const deck = caster.grounded;
  Object.assign(caster, { cpu: true, x: deck.right + .1, y: deck.y - 2, grounded: null, jumps: 0, vy: -3 });
  rival.x = deck.right - .2;
  const choose = () => assert.fail('Recovery should take priority over attack selection');
  tickMatch(match, new Map(), rules.step, (player, current, dt) => cpuInput(player, current, dt, choose));
  assert.equal(caster.attack?.type, 'recovery');
});
