import assert from 'node:assert/strict';
import test from 'node:test';
import { glassLevels } from '../src/arenas/campaign-glass.js';
import { encounterGate } from '../src/combat/adventure.js';
import { platformHeight, rules } from '../src/combat/arena.js';
import { campaignObjectiveReady, createCampaignMatch } from '../src/combat/campaign.js';
import { tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

const idle = new Map();

function start(level, slots = [0]) {
  const match = createCampaignMatch(slots.map((slot) => ({ slot, fighter: fighters[slot], cpu: false })), level);
  match.countdown = 0;
  return match;
}

function tickFor(match, seconds, controls = idle) {
  for (let i = 0; i < Math.ceil(seconds / rules.step); i++) tickMatch(match, controls);
}

function tickUntil(match, condition, limit, controls = idle) {
  for (let i = 0; i < Math.ceil(limit / rules.step) && !condition(); i++) tickMatch(match, controls);
  assert.ok(condition());
}

function place(match, player, id, x) {
  const platform = match.arena.platforms.find((platform) => platform.id === id);
  Object.assign(player, { x, y: platformHeight(platform, x), grounded: platform, vx: 0, vy: 0, facing: 1 });
}

function swing(match, player) {
  tickMatch(match, new Map([[player.slot, { x: 0, y: 0, lightPressed: true }]]));
  tickFor(match, .45);
}

function moveToExit(match, player) {
  tickUntil(match, () => match.result?.completed, 9, new Map([[player.slot, { x: 1, y: 0 }]]));
}

test('a local teammate can break the first glass floor and land safely in the garden', () => {
  const [level] = glassLevels;
  const match = start(level, [0, 2]);
  const [, teammate] = match.fighters;
  const { state } = match.adventure.campaign;
  place(match, teammate, 'glass-panel', state.panel.x - .7);
  swing(match, teammate);
  assert.equal(state.panel.broken, true);
  assert.ok(match.arena.platforms.find(({ id }) => id === 'glass-panel').inactive);
  tickUntil(match, () => Boolean(teammate.grounded), 1);
  assert.equal(teammate.grounded?.id, 'garden-bed');
  assert.equal(teammate.damage, 0);
  moveToExit(match, teammate);
});

test('the garden ramp reaches the same safe lower path while the glass is intact', () => {
  const match = start(glassLevels[0]);
  const [player] = match.fighters;
  place(match, player, 'glass-panel', 17);
  tickUntil(match, () => player.grounded?.id === 'garden-ramp', 2, new Map([[0, { x: 1, y: 0 }]]));
  tickUntil(match, () => player.grounded?.id === 'garden-bed', 2, new Map([[0, { x: 1, y: 0 }]]));
  assert.equal(match.adventure.campaign.state.panel.broken, false);
  assert.equal(player.damage, 0);
});

test('the drone locks its warning lane while a teammate stays safe in the sheltered bed', () => {
  const level = glassLevels[1];
  const match = start(level, [0, 2]);
  const [bait, teammate] = match.fighters;
  const { state } = match.adventure.campaign;
  place(match, bait, 'greenhouse-perch', 20);
  place(match, teammate, 'sheltered-bed', state.panel.x - .7);
  tickUntil(match, () => state.drone.phase === 'warning', 2);
  assert.equal(state.drone.lane, 'upper');
  assert.equal(bait.damage, 0);

  swing(match, teammate);
  assert.equal(state.panel.broken, true);
  tickUntil(match, () => state.drone.phase === 'rest', 3);
  assert.ok(bait.damage > 0);
  assert.equal(teammate.damage, 0);
  moveToExit(match, teammate);
});

test('the Sluice Keeper must land before the solo player can break the glass and open the sluice', () => {
  const level = glassLevels[2];
  const match = start(level);
  const [player] = match.fighters;
  const { state } = match.adventure.campaign;
  place(match, player, 'arrival', 12.25);
  assert.equal(campaignObjectiveReady(match), false);
  swing(match, player);
  assert.equal(state.panel.broken, false);
  assert.equal(encounterGate(match), level.steps[0].gate);

  tickUntil(match, () => state.keeper.phase === 'rest', 5);
  assert.equal(campaignObjectiveReady(match), true);
  assert.ok(state.keeper.x > state.panel.left && state.keeper.x < state.panel.right);
  swing(match, player);
  assert.equal(state.panel.broken, true);
  assert.equal(encounterGate(match), level.gate);
  assert.equal(match.adventure.checkpoint[0].platform, 'sluice-bed');

  Object.assign(player, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  tickFor(match, 1.2);
  assert.equal(player.grounded?.id, 'sluice-bed');
  assert.equal(state.panel.broken, true);
  const lever = level.steps[1];
  tickUntil(match, () => player.x >= lever.x - 1.3, 3, new Map([[0, { x: 1, y: 0 }]]));
  swing(match, player);
  assert.equal(encounterGate(match), undefined);
  moveToExit(match, player);
});
