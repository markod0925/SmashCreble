import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignLevels } from '../src/arenas/campaign.js';
import { encounterGate } from '../src/combat/adventure.js';
import { rules } from '../src/combat/arena.js';
import { campaignPrompt, createCampaignMatch } from '../src/combat/campaign.js';
import { tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

function start(level, slots = [0]) {
  const lineup = slots.map((slot) => ({ slot, fighter: fighters[slot], cpu: false }));
  const match = createCampaignMatch(lineup, level);
  match.countdown = 0;
  return match;
}

function tick(match, time, controls = new Map()) {
  for (let i = 0; i < Math.ceil(time / rules.step); i++) tickMatch(match, controls);
}

function swing(match, player) {
  tickMatch(match, new Map([[player.slot, { x: 0, y: 0, lightPressed: true }]]));
  tick(match, .45);
}

function walkTo(match, player, x) {
  const controls = new Map([[player.slot, { x: 1, y: 0 }]]);
  for (let i = 0; player.x < x && !match.result && i < 1200; i++) tickMatch(match, controls);
  assert.ok(player.x >= x, `P${player.slot + 1} stopped at ${player.x}, short of ${x}`);
  tick(match, .15);
}

test('the first level supports a grounded route and an attack from a second player', () => {
  const level = campaignLevels[0];
  const match = start(level, [0, 2]);
  const [first, ally] = match.fighters;
  walkTo(match, ally, level.objective.x - 2);
  assert.ok(ally.grounded);
  assert.ok(first.x > 0, 'the camera brings a faraway ally to safe ground');
  assert.equal(encounterGate(match), level.gate);
  swing(match, ally);
  assert.equal(encounterGate(match), undefined);
  walkTo(match, ally, level.exit);
  assert.deepEqual(match.result, { completed: true });
});

test('every fighter can activate a switch using the regular light attack', () => {
  const [level] = campaignLevels;
  for (const fighter of fighters) {
    const match = createCampaignMatch([{ slot: 0, fighter, cpu: false }], level);
    match.countdown = 0;
    const [player] = match.fighters;
    player.x = level.objective.x - 1;
    swing(match, player);
    assert.equal(encounterGate(match), undefined, fighter.name);
  }
});

test('individual attacks move the crate once and return a fallen party to the solved gate', () => {
  const level = campaignLevels[1];
  const match = start(level, [0, 2]);
  const [player, ally] = match.fighters;
  const { objective } = match.adventure.campaign;
  walkTo(match, player, objective.x - 2);
  const before = objective.x;
  swing(match, player);
  assert.equal(objective.x, before + level.objective.push);
  const remainingPushes = Math.ceil((objective.stop - objective.x) / level.objective.push);
  for (let push = 0; push < remainingPushes; push++) {
    walkTo(match, player, objective.x - 2);
    swing(match, player);
    assert.ok(player.x < level.gate);
  }
  assert.equal(objective.x, objective.stop);
  assert.equal(encounterGate(match), undefined);
  for (const human of [player, ally]) Object.assign(human, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  tick(match, 1);
  assert.equal(match.result, null);
  assert.deepEqual(match.fighters.map(({ stocks }) => stocks), [rules.stocks, rules.stocks]);
  assert.ok(match.fighters.every(({ x, grounded }) => x >= 23 && grounded));
  assert.equal(encounterGate(match), undefined);
  walkTo(match, player, level.exit);
  assert.ok(match.result.completed);
});

test('the keeper visibly warns before attacking and lowers a walkable bridge only during rest', () => {
  const level = campaignLevels[2];
  const match = start(level);
  const [player] = match.fighters;
  const { campaign } = match.adventure;
  walkTo(match, player, level.objective.x - 2);
  Object.assign(campaign.guard, { phase: 'warning', time: 0 });
  assert.equal(campaignPrompt(campaign), 'Wait for the keeper to rest');
  swing(match, player);
  assert.ok(!match.arena.platforms.some(({ id }) => id === level.bridge.id));
  for (let i = 0; i < 600 && campaign.guard.phase !== 'rest'; i++) tickMatch(match, new Map());
  assert.equal(campaign.guard.phase, 'rest');
  assert.equal(campaignPrompt(campaign), 'Hit the switch!');
  swing(match, player);
  assert.ok(match.arena.platforms.some(({ id }) => id === level.bridge.id));
  assert.equal(campaignPrompt(campaign), 'Cross the bridge!');
  walkTo(match, player, level.exit);
  assert.ok(match.result.completed);
});
