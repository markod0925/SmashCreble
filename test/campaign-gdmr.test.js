import assert from 'node:assert/strict';
import test from 'node:test';
import { gdmrLevels } from '../src/arenas/campaign-gdmr.js';
import { platformHeight, rules } from '../src/combat/arena.js';
import { createCampaignMatch } from '../src/combat/campaign.js';
import { tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

function start(level, party = [fighters[0]]) {
  const lineup = party.map((fighter, slot) => ({ slot, fighter, cpu: false }));
  const match = createCampaignMatch(lineup, level);
  match.countdown = 0;
  return { match, campaign: match.adventure.campaign, players: match.fighters };
}

const noInput = new Map();
const control = (player, state) => new Map([[player.slot, { x: 0, y: 0, ...state }]]);

function tick(match, seconds, inputs = noInput) {
  for (let i = 0; i < Math.ceil(seconds / rules.step); i++) tickMatch(match, inputs);
}

function place(player, match, id, x) {
  const deck = match.arena.platforms.find((platform) => platform.id === id);
  Object.assign(player, { x, y: platformHeight(deck, x), grounded: deck, vx: 0, vy: 0, facing: 1 });
}

function attack(match, player) {
  tickMatch(match, control(player, { lightPressed: true }));
  tick(match, .65);
}

function walkTo(match, player, x) {
  const inputs = control(player, { x: 1 });
  for (let i = 0; i < 1500 && player.x < x && !match.result; i++) tickMatch(match, inputs);
  assert.ok(player.x >= x, `Player reached ${player.x} instead of ${x}`);
}

function jumpOntoBalance(match, player) {
  walkTo(match, player, 2);
  tickMatch(match, control(player, { x: 1, jumpPressed: true }));
  tick(match, .53, control(player, { x: 1 }));
  tick(match, .6);
}

test('a solo player can jump onto the Giant Balance and use their own weight to open it', () => {
  const [level] = gdmrLevels;
  const { match, campaign, players: [player] } = start(level);
  jumpOntoBalance(match, player);
  assert.equal(player.grounded, campaign.state.deck);
  assert.ok(campaign.state.deck.angle > 0, 'left-side weight lowers the left end');

  walkTo(match, player, 22);
  tick(match, .4);
  assert.ok(campaign.state.deck.angle < 0, 'right-side weight lowers the right end');
  assert.equal(campaign.opened, true);
  walkTo(match, player, level.exit);
  assert.equal(match.result.completed, true);
});

test('the Sliding Load follows its rail and keeps its stop after the party falls', () => {
  const level = gdmrLevels[1];
  const { match, campaign, players: [first, second] } = start(level, fighters.slice(0, 2));
  const { objective } = campaign;
  const initialHeight = objective.y;
  walkTo(match, second, objective.x - 1.4);
  tick(match, .2);

  for (let push = 0; push < 3; push++) {
    attack(match, second);
    if (!campaign.opened) walkTo(match, second, objective.x - 1.4);
    tick(match, .2);
  }
  assert.equal(objective.x, objective.stop);
  assert.ok(objective.y < initialHeight, 'the weight descends with the rail');
  assert.equal(campaign.opened, true);

  for (const player of [first, second]) Object.assign(player, { grounded: null, y: match.arena.definition.bounds.bottom - 1 });
  tick(match, 1.2);
  assert.equal(campaign.opened, true);
  assert.equal(objective.x, objective.stop);
  assert.ok(match.fighters.every(({ grounded }) => grounded));
  walkTo(match, second, level.exit);
  assert.equal(match.result.completed, true);
});

test('a teammate can set the Bridge Keeper deck and another can hit the lock in a rest window', () => {
  const level = gdmrLevels[2];
  const { match, campaign, players: [first, second] } = start(level, fighters.slice(0, 2));
  const { weight } = campaign.state;
  for (let push = 0; push < 2; push++) {
    place(first, match, 'balance', weight.x - 1.2);
    attack(match, first);
  }
  place(first, match, 'arrival', 20);
  place(second, match, 'balance', level.objective.x - 1);
  Object.assign(campaign.guard, { phase: 'warning', time: 0 });
  attack(match, second);
  assert.equal(campaign.opened, false);
  assert.ok(campaign.state.deck.angle < 0);

  Object.assign(campaign.guard, { phase: 'rest', time: 0 });
  attack(match, second);
  assert.equal(campaign.opened, true);
  assert.ok(match.arena.platforms.some(({ id }) => id === 'bridge'));
  walkTo(match, second, level.exit);
  assert.equal(match.result.completed, true);
});

test('a lightweight fighter can reach the Keeper lock with regular solo controls', () => {
  const level = gdmrLevels[2];
  const vesper = fighters.find(({ id }) => id === 'vesper');
  const { match, campaign, players: [player] } = start(level, [vesper]);
  jumpOntoBalance(match, player);
  walkTo(match, player, level.objective.x - 1.8);
  for (let attempt = 0; attempt < 15 && !campaign.opened; attempt++) attack(match, player);
  assert.equal(campaign.opened, true);
  walkTo(match, player, level.exit);
  assert.equal(match.result.completed, true);
});
