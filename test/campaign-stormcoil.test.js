import assert from 'node:assert/strict';
import test from 'node:test';
import { stormcoilLevels } from '../src/arenas/campaign-stormcoil.js';
import { rules } from '../src/combat/arena.js';
import { createCampaignMatch } from '../src/combat/campaign.js';
import { tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';

const idle = new Map();

function start(level, players = 1, options) {
  const lineup = fighters.slice(0, players).map((fighter, slot) => ({ slot, fighter, cpu: false }));
  const match = createCampaignMatch(lineup, level, options);
  match.countdown = 0;
  return match;
}

function until(match, condition, controls = () => idle) {
  for (let tick = 0; tick < 14 / rules.step && !condition(); tick++) tickMatch(match, controls());
  assert.ok(condition());
}

function walkTo(match, player, targetX) {
  until(match, () => Math.abs(player.x - targetX) < .21 || Boolean(match.result),
    () => new Map([[player.slot, { x: Math.sign(targetX - player.x), y: 0 }]]));
}

function rest(match, time) {
  for (let tick = 0; tick < time / rules.step; tick++) tickMatch(match, idle);
}

function swing(match, player) {
  tickMatch(match, new Map([[player.slot, { x: 0, y: 0, lightPressed: true }]]));
  rest(match, .45);
}

test('windsocks forecast the breeze and the first lift carries a solo player from the sheltered floor', () => {
  const [level] = stormcoilLevels;
  const match = start(level);
  const [player] = match.fighters;
  const wind = level.environment(2.5);
  const reverseWind = level.environment(8.5);
  assert.ok(level.environment(1).warning);
  assert.equal(level.airDrift({ x: 13, y: 2.8 }, wind), 0);
  assert.equal(level.airDrift({ x: 19, y: .2 }, wind), 0);
  assert.ok(level.airDrift({ x: 19, y: 2.8 }, wind) > 0);
  assert.ok(level.airDrift({ x: 19, y: 2.8 }, reverseWind) < 0);
  const stabilized = start(level, 1, { module: 'wind-stabilizer' });
  const exposed = { x: 19, y: 2.8 };
  assert.ok(stabilized.arena.definition.airDrift(exposed, wind, stabilized.arena, stabilized.fighters[0]) < level.airDrift(exposed, wind));

  walkTo(match, player, 17.4);
  assert.equal(player.grounded.id, 'lower-walk');
  assert.ok(match.adventure.campaign.state.callPressed);
  assert.equal(level.prompt(match), 'Step onto the lift');
  walkTo(match, player, 22.7);
  assert.equal(level.prompt(match), 'Stay on the lift until it stops');
  until(match, () => player.grounded?.id === 'flags-lift' && player.y > 4.35);
  walkTo(match, player, 41.5);
  assert.deepEqual(match.result, { completed: true });
});

test('the side passage rescue grants the fighter and stabilizer and the two lifts lead to the exit', () => {
  const level = stormcoilLevels[1];
  const match = start(level);
  const [player] = match.fighters;
  const { rewards } = match.adventure.campaign;
  walkTo(match, player, 17.5);
  until(match, () => player.grounded?.id === 'rescue-lift' && player.y > 3.6);
  walkTo(match, player, 10.75);
  assert.equal(player.grounded.id, 'rescue-alcove');
  assert.deepEqual([...rewards], ['stormcoil-rescue', 'wind-stabilizer']);
  walkTo(match, player, 17.5);
  until(match, () => player.grounded?.id === 'rescue-lift' && player.y > 3.6);
  walkTo(match, player, 31);
  until(match, () => player.grounded?.id === 'sky-lift' && player.y > 6.6);
  walkTo(match, player, 41.5);
  assert.deepEqual(match.result, { completed: true });

  const replay = start(level, 1, { rewards: [...rewards] });
  assert.ok(replay.adventure.campaign.state.rescued);
  assert.deepEqual([...replay.adventure.campaign.rewards], [...rewards]);
});

test('one teammate can hold the winch lift while the other repairs the winch in its safe window', () => {
  const level = stormcoilLevels[2];
  const match = start(level, 2);
  const [helper, rider] = match.fighters;
  walkTo(match, helper, 12.6);
  walkTo(match, rider, 19.1);
  const { state } = match.adventure.campaign;
  until(match, () => rider.grounded?.id === 'winch-lift' && rider.y > 4.9);
  rest(match, 3.5);
  assert.ok(state.holdPressed);
  assert.equal(state.lifts['winch-lift'].phase, 'top');
  assert.ok(rider.y > 4.9);

  walkTo(match, rider, 27.75);
  until(match, () => state.winch.phase === 'warning');
  swing(match, rider);
  assert.equal(match.adventure.campaign.opened, false);
  until(match, () => state.winch.phase === 'repair');
  swing(match, rider);
  assert.equal(state.winch.phase, 'repaired');
  walkTo(match, rider, 38.5);
  assert.deepEqual(match.result, { completed: true });
});
