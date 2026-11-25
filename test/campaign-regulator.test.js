import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignActs, campaignLevels } from '../src/arenas/campaign.js';
import { regulatorLevels } from '../src/arenas/campaign-regulator.js';
import { encounterGate } from '../src/combat/adventure.js';
import { rules } from '../src/combat/arena.js';
import { campaignPrompt, createCampaignMatch } from '../src/combat/campaign.js';
import { tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

const idle = new Map();

function start(level, slots = [0]) {
  const match = createCampaignMatch(slots.map((slot) => ({ slot, fighter: fighters[slot], cpu: false })), level);
  match.countdown = 0;
  return match;
}

function tick(match, seconds) {
  for (let i = 0; i < Math.ceil(seconds / rules.step); i++) tickMatch(match, idle);
}

function until(match, condition, controls = idle, label = 'expected state') {
  for (let i = 0; i < 12 / rules.step && !condition(); i++) tickMatch(match, controls);
  const positions = match.fighters.map(({ x, y, grounded }) => `${x.toFixed(1)}, ${y.toFixed(1)} (${grounded?.id})`).join('; ');
  assert.ok(condition(), `${label} at ${positions}`);
}

function walk(match, player, x) {
  until(match, () => player.x >= x || match.result, new Map([[player.slot, { x: 1, y: 0 }]]), `reach x=${x}`);
  tick(match, .14);
}

function swing(match, player) {
  tickMatch(match, new Map([[player.slot, { x: 0, y: 0, lightPressed: true }]]));
  tick(match, .46);
}

function jumpRight(match, player) {
  tickMatch(match, new Map([[player.slot, { x: 1, y: 0, jumpPressed: true }]]));
}

test('the campaign catalog keeps Cloudbreak first and exposes five complete acts with stable, unique IDs', () => {
  assert.deepEqual(campaignActs.map(({ levels }) => levels.length), [3, 3, 3, 3, 3]);
  assert.equal(campaignLevels[2].id, 'cloudbreak-bridge');
  assert.equal(campaignLevels[3].act, 'stormcoil');
  assert.equal(campaignLevels.at(-1).id, 'regulator-core');
  assert.equal(new Set(campaignLevels.map(({ id }) => id)).size, campaignLevels.length);
});

test('one human can restore all relays and a broken panel and checkpoint survive a party fall', () => {
  const match = start(regulatorLevels[0], [0, 2]);
  const [player, ally] = match.fighters;
  const { campaign } = match.adventure;
  walk(match, player, 8.4);
  swing(match, player);
  assert.equal(campaign.step, 1);
  assert.equal(encounterGate(match), 31);
  walk(match, player, 21);
  swing(match, player);
  assert.equal(campaign.step, 2);
  const panel = match.arena.platforms.find(({ id }) => id === 'relay-glass');
  assert.ok(panel.inactive);
  for (const human of [player, ally]) Object.assign(human, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  tick(match, 1);
  assert.equal(campaign.step, 2);
  assert.ok(panel.inactive);
  assert.ok(match.fighters.every(({ grounded }) => grounded?.id === 'lower-garden'));
  walk(match, player, 33);
  jumpRight(match, player);
  walk(match, player, 39.5);
  swing(match, player);
  walk(match, player, 42.4);
  swing(match, player);
  assert.equal(campaign.opened, true);
  walk(match, player, 56);
  assert.deepEqual(match.result, { completed: true });
});

test('the three lifts can be boarded on foot and open shared shelters and shortcuts', () => {
  const match = start(regulatorLevels[1], [0, 2]);
  const player = match.fighters[1];
  const { campaign } = match.adventure;
  for (const [i, [waiting, platform, height, landing]] of [
    [7, 'core-lift-a', 2.65, 14.5], [25, 'core-lift-b', 5.2, 33.5], [42, 'core-lift-c', 7.75, 54],
  ].entries()) {
    walk(match, player, waiting);
    until(match, () => player.grounded?.id === platform && player.y >= height, idle, platform);
    assert.equal(campaignPrompt(campaign, match), 'Walk off the lift to the right');
    walk(match, player, landing);
    if (i < 2) assert.equal(campaign.step, i + 1);
  }
  assert.ok(match.arena.platforms.some(({ id }) => id === 'first-shortcut'));
  assert.ok(match.arena.platforms.some(({ id }) => id === 'second-shortcut'));
  assert.deepEqual(match.result, { completed: true });
});

test('the Regulator requires recovery windows and preserves finished phases through a team wipe', () => {
  const match = start(regulatorLevels[2], [0, 2]);
  const [player, ally] = match.fighters;
  const { campaign } = match.adventure;
  assert.equal(campaignPrompt(campaign, match), 'Follow the lights to the control');
  walk(match, player, 7.2);
  until(match, () => campaign.state.pulse.phase === 'warning');
  swing(match, player);
  assert.equal(campaign.step, 0);
  until(match, () => campaign.state.pulse.phase === 'rest');
  swing(match, player);
  assert.equal(campaign.step, 1);
  walk(match, player, 14.75);
  jumpRight(match, player);
  walk(match, player, 21.55);
  until(match, () => campaign.state.pulse.phase === 'rest');
  swing(match, player);
  assert.equal(campaign.step, 2);
  for (const human of [player, ally]) Object.assign(human, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  tick(match, 1);
  assert.equal(campaign.step, 2);
  assert.ok(match.fighters.every(({ grounded }) => grounded?.id === 'raised-control'));
  walk(match, player, 33.9);
  until(match, () => campaign.state.pulse.phase === 'rest');
  swing(match, player);
  walk(match, player, 36.3);
  until(match, () => campaign.state.pulse.phase === 'rest');
  swing(match, player);
  assert.equal(campaign.step, 3);
  walk(match, player, 47.7);
  until(match, () => campaign.state.pulse.phase === 'rest');
  swing(match, player);
  assert.equal(campaign.opened, true);
  walk(match, player, 56);
  assert.deepEqual(match.result, { completed: true });
});
