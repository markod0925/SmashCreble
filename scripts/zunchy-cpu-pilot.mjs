import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { arenas } from '../src/arenas/index.js';
import { rules } from '../src/combat/arena.js';
import { cpuInput } from '../src/combat/cpu.js';
import { createMatch, tickMatch } from '../src/combat/match.js';
import { fighters } from '../src/fighters/index.js';
import { actions, featureNames, observeZunchy, zunchyActionInput, zunchyAttackPolicy } from '../src/fighters/zunchy/cpu-policy.js';
import { seededRandom, trainModel, validateModel } from './zunchy-cpu-model.mjs';

const quick = process.argv.includes('--quick');
const training = ['rivet', 'vesper', 'dragon-boy', 'cerbero', 'vidarr', 'incantus', 'packman', 'bid', 'nuvol', 'maestra', 'ho-ho-ho', 'beina'];
const validation = ['murena-man', 'vi', 'dragonball'];
const evaluation = ['zunchy', 'mimora', 'draga-mamma', 'pinco-palino', 'bramble', 'kiln', 'ii', 'olivar', 'super-libro-girl'];
assert.equal(new Set([...training, ...validation, ...evaluation]).size, training.length + validation.length + evaluation.length);

const roster = new Map(fighters.map(fighter => [fighter.id, fighter]));
const controls = new Map();
const horizonSeconds = 2.5;
const stockReward = 100;
const sampleLimit = quick ? 3 : 24;
const epochs = quick ? 2 : 24;
const repetitions = quick ? 1 : 5;

function fixtures(opponents, repeats, seedBase) {
  return opponents.flatMap((opponent, index) => arenas.flatMap((arena, arenaIndex) => {
    assert(roster.has(opponent), opponent);
    return Array.from({ length: repeats }, (_, round) => {
      const seed = seedBase + (index * arenas.length + arenaIndex) * repeats + round;
      return [0, 1].map(slot => ({ opponent, arena, slot, seed }));
    }).flat();
  }));
}

function newMatch({ opponent, arena, slot }) {
  return createMatch([0, 1].map(index => ({
    slot: index, fighter: roster.get(index === slot ? 'zunchy' : opponent), cpu: true,
  })), arena);
}

function reader(slot, choose) {
  return (player, match, dt) => cpuInput(player, match, dt, player.slot === slot && !player.owner ? choose : undefined);
}

function step(match, readCpu) {
  tickMatch(match, controls, rules.step, readCpu);
  match.events.length = 0;
}

// Snapshots keep combatant, platform, and attack references consistent across a rollout.
function copyState(value, seen = new Map()) {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    for (const entry of value) copy.add(copyState(entry, seen));
    return copy;
  }
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const [key, entry] of Object.entries(value)) copy[key] = copyState(entry, seen);
  return copy;
}

function rewardFor(snapshot, slot, random, initialState, observation, action) {
  const match = copyState(snapshot);
  const player = match.fighters[slot], rival = match.fighters[1 - slot];
  const initialStockGap = player.stocks - rival.stocks;
  random.state = initialState;
  let applied = false;
  const readCpu = reader(slot, (actor, target, current, context) => {
    assert.deepEqual(observeZunchy(actor, target, current, context), observation);
    applied = true;
    if (action) return zunchyActionInput(action, actor, context);
  });
  let damageExchange = 0;
  for (let frame = 0; frame < Math.ceil(horizonSeconds / rules.step) && !match.result; frame++) {
    const ownDamage = player.damage, rivalDamage = rival.damage;
    step(match, frame === 0 ? readCpu : undefined);
    damageExchange += Math.max(0, rival.damage - rivalDamage) - Math.max(0, player.damage - ownDamage);
  }
  assert(applied, 'Expected a decision on the first frame of the replay');
  const stockExchange = player.stocks - rival.stocks - initialStockGap;
  return stockExchange + damageExchange / stockReward;
}

function dataFor(fixture) {
  const { slot, seed } = fixture;
  const match = newMatch(fixture);
  const player = match.fighters[slot];
  const random = seededRandom(seed);
  Math.random = random;
  const samples = [];
  let observation;
  const observe = reader(slot, (actor, target, current, context) => {
    observation = observeZunchy(actor, target, current, context);
  });
  let nextProbe = 0;
  const maxFrames = Math.ceil((rules.duration + match.countdown) / rules.step) + 2000;
  for (let frame = 0; !match.result && samples.length < sampleLimit && frame < maxFrames; frame++) {
    const canProbe = frame >= nextProbe && !match.countdown && !match.dance && !player.respawn &&
      !player.attack && !player.charging && !player.hitstun && !player.stagger && !player.dodge && player.aiDelay <= rules.step;
    if (!canProbe) {
      step(match);
      continue;
    }
    const snapshot = copyState(match);
    const initialState = random.state;
    observation = undefined;
    step(match, observe);
    nextProbe = frame + Math.ceil(.1 / rules.step);
    if (!observation) continue;
    const continuedState = random.state;
    const rewards = actions.map(action => observation.legal.includes(action)
      ? rewardFor(snapshot, slot, random, initialState, observation, action) : null);
    const baseline = rewardFor(snapshot, slot, random, initialState, observation, undefined);
    samples.push({ ...observation, rewards, baseline });
    random.state = continuedState;
    nextProbe = frame + Math.ceil(.45 / rules.step);
  }
  assert(match.result || samples.length === sampleLimit, fixture);
  return samples;
}

function collect(label, opponents, seedBase) {
  const schedule = fixtures(opponents, 1, seedBase);
  const data = schedule.flatMap(dataFor);
  assert(data.length > 0);
  assert(data.every(sample => sample.features.length === featureNames.length && sample.features.every(Number.isFinite)));
  console.log(`${label}: ${data.length} decisions from ${schedule.length} matches.`);
  return data;
}

function evaluate(fixture, readCpu) {
  const match = newMatch(fixture);
  const player = match.fighters[fixture.slot], rival = match.fighters[1 - fixture.slot];
  const volleys = new Set(), contacts = new Set();
  match.onBlastHit = (projectile, target) => {
    if (projectile.owner !== player || projectile.kind !== 'zunchyBomb') return;
    volleys.add(projectile.victims);
    if (target === rival) contacts.add(projectile.victims);
  };
  Math.random = seededRandom(fixture.seed);

  let charges = 0, punishedCharges = 0, punished = false;
  let damageTaken = 0, damageDealt = 0;
  const maxFrames = Math.ceil((rules.duration + match.countdown) / rules.step) + 2000;
  for (let frame = 0; !match.result && frame < maxFrames; frame++) {
    const wasCharging = player.charging, damage = player.damage, stocks = player.stocks, rivalDamage = rival.damage;
    step(match, readCpu);
    const taken = Math.max(0, player.damage - damage);
    const dealt = Math.max(0, rival.damage - rivalDamage);
    damageTaken += taken;
    damageDealt += dealt;
    if (!wasCharging && player.charging) {
      charges++;
      punished = false;
    }
    if ((wasCharging || player.charging) && !punished && (taken > 0 || player.stocks < stocks)) {
      punishedCharges++;
      punished = true;
    }
    if (player.attack?.type === 'zunchyBombs' && player.attack.fired) volleys.add(player.attack.victims);
    for (const projectile of match.projectiles) {
      if (projectile.owner === player && projectile.kind === 'zunchyBomb') volleys.add(projectile.victims);
    }
  }
  assert(match.result, fixture);
  assert(contacts.size <= volleys.size && punishedCharges <= charges);
  const { winner } = match.result;
  return {
    result: winner === player ? 'W' : winner === rival ? 'L' : 'D',
    stockMargin: player.stocks - rival.stocks, charges, punishedCharges,
    bombVolleys: volleys.size, bombContacts: contacts.size, damageTaken, damageDealt,
  };
}

function summarize(bouts) {
  return {
    matches: bouts.length,
    wins: bouts.filter(bout => bout.result === 'W').length,
    losses: bouts.filter(bout => bout.result === 'L').length,
    draws: bouts.filter(bout => bout.result === 'D').length,
    ...Object.fromEntries(['stockMargin', 'charges', 'punishedCharges', 'bombVolleys', 'bombContacts',
      'damageTaken', 'damageDealt'].map(key => [key, bouts.reduce((sum, bout) => sum + bout[key], 0)])),
  };
}

function benchmark(models) {
  const subjects = quick ? ['zunchy', 'mimora'] : evaluation;
  const schedule = fixtures(subjects, repetitions, 2611264000);
  const comparisons = {};
  const records = {};
  for (const [name, model] of Object.entries({ baseline: null, ...models })) {
    const choose = model ? zunchyAttackPolicy(model) : undefined;
    const bouts = schedule.map(fixture => evaluate(fixture, choose ? reader(fixture.slot, choose) : undefined));
    records[name] = bouts;
    const headToHead = bouts.filter((_, i) => schedule[i].opponent === 'zunchy');
    const opponents = bouts.filter((_, i) => schedule[i].opponent !== 'zunchy');
    comparisons[name] = {
      mirror: summarize(headToHead),
      otherFighters: summarize(opponents),
      byOpponent: Object.fromEntries(subjects.map(id => [id, summarize(bouts.filter((_, i) => schedule[i].opponent === id))])),
    };
    if (model) {
      const points = { W: 1, D: .5, L: 0 };
      comparisons[name].paired = {
        better: bouts.filter((bout, i) => points[bout.result] > points[records.baseline[i].result]).length,
        worse: bouts.filter((bout, i) => points[bout.result] < points[records.baseline[i].result]).length,
      };
    }
    const { mirror, otherFighters } = comparisons[name];
    console.log(`${name}: ${mirror.wins}–${mirror.losses}–${mirror.draws} in mirrors, ${otherFighters.wins}–${otherFighters.losses}–${otherFighters.draws} against other fighters.`);
  }
  assert.equal(comparisons.baseline.mirror.wins, comparisons.baseline.mirror.losses);
  return {
    summary: comparisons,
    fixtures: schedule.map(({ arena, ...fixture }, i) => ({
      ...fixture, arena: arena.id, results: Object.fromEntries(Object.entries(records).map(([name, bouts]) => [name, bouts[i]])),
    })),
  };
}

const globalRandom = Math.random;
try {
  const train = collect('Training', quick ? training.slice(0, 2) : training, 2611262000);
  const check = collect('Validation', quick ? validation.slice(0, 1) : validation, 2611263000);
  const models = {
    linear: trainModel(train, 0, epochs, 2611265000),
    neural: trainModel(train, 12, epochs, 2611265001),
  };
  const validationResults = Object.fromEntries(Object.entries(models).map(([name, model]) => [name, validateModel(model, check)]));
  console.log(JSON.stringify(validationResults));
  const result = benchmark(models);
  const report = {
    settings: { actions, featureNames, horizonSeconds, stockReward, sampleLimit, epochs, repetitions, training, validation, evaluation },
    samples: { training: train.length, validation: check.length },
    validation: validationResults,
    models,
    evaluation: result.summary,
    fixtures: result.fixtures,
  };
  if (!quick) {
    const path = new URL('../output/zunchy-cpu-pilot.json', import.meta.url);
    writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
    console.log('Wrote output/zunchy-cpu-pilot.json');
  }
} finally {
  Math.random = globalRandom;
}
