import { actions, affine, bestZunchyAction, featureNames } from '../src/fighters/zunchy/cpu-policy.js';

export function seededRandom(seed) {
  const next = () => {
    next.state = (next.state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(next.state ^ (next.state >>> 15), next.state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  next.state = seed;
  return next;
}

function layer(rows, inputs, random) {
  return Array.from({ length: rows }, () => [
    ...Array.from({ length: inputs }, () => (2 * random() - 1) / Math.sqrt(inputs)), 0,
  ]);
}

function updateRow(row, inputs, gradient) {
  for (let i = 0; i < inputs.length; i++) row[i] -= gradient * inputs[i];
  row[inputs.length] -= gradient;
}

function trainSample(model, { features, legal, rewards }, rate) {
  const hidden = model.hidden;
  const inputs = hidden.length ? hidden.map(row => Math.tanh(affine(row, features))) : features;
  const indexes = legal.map(action => actions.indexOf(action));
  const mean = indexes.reduce((sum, index) => sum + rewards[index], 0) / indexes.length;
  const hiddenGradient = new Array(hidden.length).fill(0);
  for (const index of indexes) {
    const row = model.output[index];
    const error = (affine(row, inputs) - (rewards[index] - mean)) / indexes.length;
    for (let i = 0; i < hidden.length; i++) hiddenGradient[i] += error * row[i];
    updateRow(row, inputs, rate * error);
  }
  for (let i = 0; i < hidden.length; i++) {
    updateRow(hidden[i], features, rate * hiddenGradient[i] * (1 - inputs[i] ** 2));
  }
}

export function trainModel(samples, hiddenSize, epochs, seed) {
  const random = seededRandom(seed);
  const model = {
    hidden: layer(hiddenSize, featureNames.length, random),
    output: layer(actions.length, hiddenSize || featureNames.length, random),
  };
  const order = samples.map((_, index) => index);
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const rate = .035 / (1 + epoch / 10);
    for (const index of order) trainSample(model, samples[index], rate);
  }
  return model;
}

export function validateModel(model, samples) {
  const chosen = Object.fromEntries(actions.map(action => [action, 0]));
  let regret = 0;
  let benefit = 0;
  for (const sample of samples) {
    const action = bestZunchyAction(model, sample);
    const reward = sample.rewards[actions.indexOf(action)];
    regret += Math.max(...sample.legal.map(value => sample.rewards[actions.indexOf(value)])) - reward;
    benefit += reward - sample.baseline;
    chosen[action]++;
  }
  return { meanRegret: regret / samples.length, meanGainOverBaseline: benefit / samples.length, chosen };
}
